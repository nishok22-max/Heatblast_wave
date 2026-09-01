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
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd
import requests

__all__ = ["fetch_hourly", "ARCHIVE_URL", "HOURLY_VARIABLES"]

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

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
