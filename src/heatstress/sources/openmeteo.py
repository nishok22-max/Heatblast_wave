"""Open-Meteo historical weather archive client.

Why Open-Meteo rather than Copernicus CDS: it serves ERA5 reanalysis with no API
key, no registration, and no multi-day approval wait. For a 3-day build that
removes an entire class of blocker, and the underlying data is the same
reanalysis we would otherwise pull from CDS ourselves.

EVERY RESPONSE IS CACHED TO DISK. The demo must run with the wifi off (NFR-1),
so the network is used once during the build and never on stage.
"""

from __future__ import annotations

import hashlib
import json
import time
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd
import requests

__all__ = [
    "fetch_hourly",
    "fetch_forecast",
    "ARCHIVE_URL",
    "FORECAST_URL",
    "HOURLY_VARIABLES",
]

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
# Same variable names, same units, same response shape as the archive -- so
# everything downstream of this module is identical for past and future.
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

# The exact set the Liljegren WBGT model and UTCI need. Requesting the direct and
# diffuse components separately means we can compute the direct-beam fraction
# exactly, instead of falling back to the empirical Erbs model.
HOURLY_VARIABLES = [
    "temperature_2m",
    "relative_humidity_2m",
    "wind_speed_10m",
    "shortwave_radiation",     # global horizontal irradiance
    "direct_radiation",
    "diffuse_radiation",
    "surface_pressure",
]

DEFAULT_CACHE_DIR = Path(__file__).resolve().parents[3] / "data" / "raw"


def _cache_key(lat, lon, start, end, variables):
    payload = json.dumps(
        {"lat": round(lat, 4), "lon": round(lon, 4),
         "start": str(start), "end": str(end), "vars": sorted(variables)},
        sort_keys=True,
    )
    digest = hashlib.sha1(payload.encode()).hexdigest()[:12]
    return f"openmeteo_{start}_{end}_{digest}.json"


def fetch_hourly(
    latitude: float,
    longitude: float,
    start_date: str | date,
    end_date: str | date,
    variables: list[str] | None = None,
    cache_dir: Path | None = None,
    timeout: int = 60,
    force_refresh: bool = False,
) -> pd.DataFrame:
    """Fetch hourly ERA5 weather for one point and return a tidy DataFrame.

    Args:
        latitude, longitude: decimal degrees, north/east positive.
        start_date, end_date: 'YYYY-MM-DD' inclusive.
        variables: Open-Meteo hourly variable names; defaults to HOURLY_VARIABLES.
        cache_dir: where to persist the raw JSON. Defaults to ``data/raw``.
        force_refresh: ignore any cached copy and re-request.

    Returns a DataFrame indexed by UTC timestamp with these columns:

        temperature_2m        degC
        relative_humidity_2m  %
        wind_speed_10m        m/s      (explicitly requested in m/s -- see below)
        shortwave_radiation   W/m2     (global horizontal)
        direct_radiation      W/m2
        diffuse_radiation     W/m2
        surface_pressure      hPa
        day_of_year           1-366
        hour_utc              fractional hours

    UNIT TRAP, deliberately pinned: Open-Meteo defaults wind speed to **km/h**.
    Every thermal index in this project expects m/s, and a silent 3.6x error in
    wind would quietly bias every WBGT and UTCI value. ``windspeed_unit=ms`` is
    sent explicitly and the returned unit is asserted below.
    """
    variables = list(variables or HOURLY_VARIABLES)
    cache_dir = Path(cache_dir or DEFAULT_CACHE_DIR)
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_path = cache_dir / _cache_key(latitude, longitude, start_date, end_date,
                                        variables)

    if cache_path.exists() and not force_refresh:
        payload = json.loads(cache_path.read_text(encoding="utf-8"))
    else:
        response = requests.get(
            ARCHIVE_URL,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "start_date": str(start_date),
                "end_date": str(end_date),
                "hourly": ",".join(variables),
                "windspeed_unit": "ms",   # see UNIT TRAP above
                "timezone": "UTC",
            },
            timeout=timeout,
        )
        response.raise_for_status()
        payload = response.json()
        cache_path.write_text(json.dumps(payload), encoding="utf-8")

    units = payload.get("hourly_units", {})
    if "wind_speed_10m" in units and units["wind_speed_10m"] not in ("ms", "m/s"):
        raise ValueError(
            f"Open-Meteo returned wind in {units['wind_speed_10m']!r}, expected m/s. "
            "Every thermal index downstream assumes m/s."
        )

    hourly = payload["hourly"]
    frame = pd.DataFrame(hourly)
    frame["time"] = pd.to_datetime(frame["time"], utc=True)
    frame = frame.set_index("time").sort_index()

    frame["day_of_year"] = frame.index.dayofyear
    frame["hour_utc"] = frame.index.hour + frame.index.minute / 60.0

    return frame


def fetch_forecast(
    latitude: float,
    longitude: float,
    forecast_days: int = 6,
    past_days: int = 1,
    variables: list[str] | None = None,
    cache_dir: Path | None = None,
    timeout: int = 60,
    max_age_minutes: int = 180,
) -> pd.DataFrame:
    """Fetch the LIVE forecast for one point: recent past plus days ahead.

    Returns the same frame shape as ``fetch_hourly``, so the entire pipeline --
    solar geometry, Liljegren WBGT, UTCI, personas, risk -- runs unchanged on a
    forecast. That is the whole reason live data is cheap to add: nothing
    downstream knows or cares whether the weather is from 2010 or tomorrow.

    Args:
        forecast_days: days ahead. 6 covers the 3-5 day lead time the problem
            statement asks for, with a margin.
        past_days: days of recent history to include, so the chart has context
            before "now" rather than starting at a cliff edge.
        max_age_minutes: a cached forecast older than this is refetched. Unlike
            the archive -- where 2010 is 2010 forever -- a forecast goes stale,
            so the cache here is a *staleness-bounded* cache rather than a
            permanent one. It still means an offline machine gets the last known
            forecast instead of an exception.

    NOTE ON HONESTY: a live forecast is more *current*, not more *accurate*. The
    per-neighbourhood downscaling still uses the assumed urban-heat amplitude, so
    the provenance flags must stay exactly as they are.
    """
    variables = list(variables or HOURLY_VARIABLES)
    cache_dir = Path(cache_dir or DEFAULT_CACHE_DIR)
    cache_dir.mkdir(parents=True, exist_ok=True)

    key = _cache_key(latitude, longitude, f"fc{past_days}", f"fc{forecast_days}",
                     variables)
    cache_path = cache_dir / key

    payload = None
    if cache_path.exists():
        age_minutes = (time.time() - cache_path.stat().st_mtime) / 60.0
        if age_minutes <= max_age_minutes:
            payload = json.loads(cache_path.read_text(encoding="utf-8"))

    if payload is None:
        try:
            response = requests.get(
                FORECAST_URL,
                params={
                    "latitude": latitude,
                    "longitude": longitude,
                    "hourly": ",".join(variables),
                    "windspeed_unit": "ms",   # see UNIT TRAP in fetch_hourly
                    "timezone": "UTC",
                    "forecast_days": forecast_days,
                    "past_days": past_days,
                },
                timeout=timeout,
            )
            response.raise_for_status()
            payload = response.json()
            cache_path.write_text(json.dumps(payload), encoding="utf-8")
        except Exception:
            # Offline or the API is down. A stale forecast beats no forecast:
            # the UI states how old it is, so nothing is misrepresented.
            if cache_path.exists():
                payload = json.loads(cache_path.read_text(encoding="utf-8"))
            else:
                raise

    units = payload.get("hourly_units", {})
    if "wind_speed_10m" in units and units["wind_speed_10m"] not in ("ms", "m/s"):
        raise ValueError(
            f"Open-Meteo returned wind in {units['wind_speed_10m']!r}, expected m/s."
        )

    frame = pd.DataFrame(payload["hourly"])
    frame["time"] = pd.to_datetime(frame["time"], utc=True)
    frame = frame.set_index("time").sort_index()
    frame["day_of_year"] = frame.index.dayofyear
    frame["hour_utc"] = frame.index.hour + frame.index.minute / 60.0

    # Trailing hours can be null at the far edge of some models; drop them so
    # the physics never sees a NaN it would silently propagate.
    return frame.dropna(subset=["temperature_2m", "relative_humidity_2m"])


def forecast_age_minutes(latitude: float, longitude: float,
                         forecast_days: int = 6, past_days: int = 1,
                         variables: list[str] | None = None,
                         cache_dir: Path | None = None) -> float | None:
    """Age of the cached forecast in minutes, or None if there is none."""
    variables = list(variables or HOURLY_VARIABLES)
    cache_dir = Path(cache_dir or DEFAULT_CACHE_DIR)
    path = cache_dir / _cache_key(latitude, longitude, f"fc{past_days}",
                                  f"fc{forecast_days}", variables)
    if not path.exists():
        return None
    return (time.time() - path.stat().st_mtime) / 60.0


def summarise(frame: pd.DataFrame) -> str:
    """One-line-per-variable summary, for eyeballing a fetch before trusting it."""
    lines = [f"rows: {len(frame)}   {frame.index[0]} -> {frame.index[-1]}"]
    for col in frame.columns:
        if col in ("day_of_year", "hour_utc"):
            continue
        series = frame[col]
        n_missing = int(series.isna().sum())
        lines.append(
            f"  {col:24s} min={np.nanmin(series):8.2f}  "
            f"max={np.nanmax(series):8.2f}  mean={np.nanmean(series):8.2f}  "
            f"missing={n_missing}"
        )
    return "\n".join(lines)
