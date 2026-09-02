"""Live mode: fetch the forecast, run the same physics, bake a second dataset.

    python scripts/07_live.py config/ahmedabad.yaml

Produces `web/data/live/` alongside the historical `web/data/`. The frontend
offers both and lets the viewer switch.

WHY THIS IS A SEPARATE SCRIPT rather than a --live flag threaded through 04 and
06: the hindcast is anchored to a fixed date and hour from config, whereas a
forecast has to discover its own focus (the peak stress hour ahead). Those are
genuinely different control flows, and a flag would have made both harder to
read. The *physics* is shared — it all comes from the heatstress package, so
there is no duplicated science here, only duplicated plumbing.

WHAT LIVE MODE DOES AND DOES NOT BUY YOU
  + current conditions and a 3-5 day outlook, which is what the problem
    statement actually asks for
  + urban form and weather from the same era, unlike the 2010 hindcast
  - NOT more accuracy. The per-neighbourhood downscaling still rests on the
    assumed urban-heat amplitude, so every provenance flag stays as it is.
"""
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

import numpy as np
import pandas as pd
import yaml

from heatstress import advisory as ad
from heatstress import physiology as ph
from heatstress import psychro as ps
from heatstress import risk as rk
from heatstress import solar as so
from heatstress import spatial as sp
from heatstress import thermal as th
from heatstress import vulnerability as vu
from heatstress.sources import openmeteo as om

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "web" / "data" / "live"
PERSONA_ORDER = ["construction", "delivery", "child", "elderly"]


def r1(v):
    return [round(float(x), 1) for x in v]


def write(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, separators=(",", ":"), ensure_ascii=False),
                    encoding="utf-8")


def main(config_path: str) -> None:
    config = yaml.safe_load(Path(config_path).read_text(encoding="utf-8"))
    city, uhi = config["city"], config["urban_heat"]
    slug = city["name"].lower().replace(" ", "_")
    tz = city["timezone_offset_hours"]
    lat, lon = city["centre"]["lat"], city["centre"]["lon"]

    form = json.loads(
        (ROOT / "data" / "processed" / f"urban_form_{slug}.json").read_text("utf-8"))
    cells = sorted(form["cells"])
    d_ta = np.array([form["cells"][c]["d_ta_c"] for c in cells])
    intensity = np.array([form["cells"][c]["intensity"] for c in cells])

    # Human-readable zone names. Without these the UI can only show an H3 code
    # like "8842cc6821fffff", which nobody can act on or discuss.
    names_path = ROOT / "data" / "processed" / f"place_names_{slug}.json"
    place_names = (json.loads(names_path.read_text("utf-8"))["cells"]
                   if names_path.exists() else {})

    weather = om.fetch_forecast(lat, lon)
    age = om.forecast_age_minutes(lat, lon)
    print(f"{city['name']} LIVE: {len(cells)} cells x {len(weather)} hours "
          f"({weather.index[0]} -> {weather.index[-1]} UTC)")

    # ---- identical physics to the hindcast path --------------------------
    ta_city = weather["temperature_2m"].to_numpy()[:, None]
    rh_city = weather["relative_humidity_2m"].to_numpy()[:, None]
    wind = weather["wind_speed_10m"].to_numpy()[:, None]
    ghi = weather["shortwave_radiation"].to_numpy()[:, None]
    direct = weather["direct_radiation"].to_numpy()[:, None]
    diffuse = weather["diffuse_radiation"].to_numpy()[:, None]
    press = weather["surface_pressure"].to_numpy()[:, None]

    ta = ta_city + d_ta[None, :]
    # Vapour pressure carries across cells; RH is recomputed per cell. Same
    # reasoning as 04_compute_indices.py -- holding RH fixed would invent
    # moisture in exactly the hottest cells.
    e_city = ps.vapour_pressure(ta_city, rh_city)
    rh = np.clip(100.0 * e_city / ps.saturation_vapour_pressure(ta), 1.0, 100.0)

    shape = ta.shape
    wind_b = np.broadcast_to(wind, shape)
    ghi_b = np.broadcast_to(ghi, shape)
    press_b = np.broadcast_to(press, shape)
    mu = np.broadcast_to(
        so.cos_solar_zenith_angle(lat, lon, weather["day_of_year"].to_numpy(),
                                  weather["hour_utc"].to_numpy())[:, None], shape)
    fdir = np.broadcast_to(
        so.direct_fraction_from_components(direct, diffuse), shape)

    print("  computing WBGT, UTCI, Heat Index, risk...")
    wbgt = th.tf_wbgt_liljegren(ta, rh, wind_b, ghi_b, fdir, mu, press_b)
    tg = th.globe_temperature_regression(ta, rh, ghi_b)
    utci = th.tf_utci(ta, rh, wind_b, th.tf_mrt_from_globe(ta, tg, wind_b))
    heat_index = th.heat_index(ta, rh)

    hazard = rk.normalise_hazard(wbgt)
    surface = vu.PlaceholderVulnerability().build(cells, intensity=intensity)
    risk = vu.combine_risk(hazard,
                           np.broadcast_to(surface.exposure[None, :], shape),
                           np.broadcast_to(surface.vulnerability[None, :], shape))

    stamps = (weather.index + pd.Timedelta(hours=tz)).strftime("%Y-%m-%d %H:%M")
    stamps = list(stamps)

    # ---- focus = the peak stress hour AHEAD, not a fixed date ------------
    now_ist = datetime.now(timezone(timedelta(hours=tz)))
    now_key = now_ist.strftime("%Y-%m-%d %H:%M")
    future = [i for i, s in enumerate(stamps) if s >= now_key] or list(range(len(stamps)))
    focus_idx = future[int(np.argmax(wbgt[future].mean(axis=1)))]
    focus_day = stamps[focus_idx][:10]
    day_idx = [i for i, s in enumerate(stamps) if s.startswith(focus_day)]
    print(f"  peak stress ahead: {stamps[focus_idx]} IST")

    # ---- bake -------------------------------------------------------------
    peak_hour = [int(stamps[day_idx[int(np.argmax(wbgt[day_idx, j]))]][11:13])
                 for j in range(len(cells))]
    props = {}
    for j, cell in enumerate(cells):
        raw = form["cells"].get(cell, {})
        props[cell] = {
            "d_ta_c": round(float(d_ta[j]), 2),
            "intensity": round(float(intensity[j]), 3),
            "roads": round(float(raw.get("roads", 0.0)), 3),
            "green": round(float(raw.get("green", 0.0)), 3),
            "water": round(float(raw.get("water", 0.0)), 3),
            "exposure": round(float(surface.exposure[j]), 3),
            "vulnerability": round(float(surface.vulnerability[j]), 3),
            "place": place_names.get(cell, {}).get("name"),
            "place_exact": place_names.get(cell, {}).get("exact", False),
            "peak_hour": peak_hour[j],
            "wbgt_focus": round(float(wbgt[focus_idx, j]), 1),
            "utci_focus": round(float(utci[focus_idx, j]), 1),
            "risk_focus": round(float(risk[focus_idx, j]), 3),
        }
    write(OUT / "hexes.geojson", sp.grid_geojson(cells, props))

    write(OUT / "hourly.json", {
        "meta": {
            "city": city["name"], "date": focus_day,
            "hours_ist": [int(stamps[i][11:13]) for i in day_idx],
            "labels_ist": [stamps[i][11:16] for i in day_idx],
            "uhi_amplitude_c": uhi["uhi_amplitude_c"],
        },
        "hexes": {
            cell: {
                "air_temp": r1(ta[day_idx, j]), "wbgt": r1(wbgt[day_idx, j]),
                "utci": r1(utci[day_idx, j]), "heat_index": r1(heat_index[day_idx, j]),
                "risk": [round(float(v), 3) for v in risk[day_idx, j]],
            }
            for j, cell in enumerate(cells)
        },
    })

    means = {n: a.mean(axis=1) for n, a in
             (("air_temp", ta), ("wbgt", wbgt), ("utci", utci),
              ("heat_index", heat_index))}
    write(OUT / "city.json", {
        "city": city["name"], "timestamps_ist": stamps,
        **{k: r1(v) for k, v in means.items()},
        "night_recovery": night_recovery(stamps, means["air_temp"]),
    })

    persona_out = {}
    series = wbgt[day_idx].mean(axis=1)
    for key in PERSONA_ORDER:
        persona = ph.PERSONAS[key]
        minutes = [float(ph.safe_work_minutes_per_hour(w, persona)) for w in series]
        persona_out[key] = {
            "label": persona.label, "notes": persona.notes,
            "metabolic": persona.metabolic.name,
            "limit_c": round(persona.limit_c(), 1),
            "vulnerability_offset_c": persona.vulnerability_offset_c,
            "basis": ph.assess(float(series[0]), persona)["basis"],
            "safe_minutes_by_hour": minutes,
            "total_safe_hours": round(sum(minutes) / 60.0, 1),
            "full_capacity_hours": [int(stamps[i][11:13]) for i, m
                                    in zip(day_idx, minutes) if m >= 60],
            "assessment_at_focus": ph.assess(
                float(series[day_idx.index(focus_idx)]), persona),
        }
    write(OUT / "personas.json", {"date": focus_day, "personas": persona_out,
                                  "order": PERSONA_ORDER})

    worst = int(np.argmax(utci[focus_idx]))
    adv = ad.build_advisory(
        cells[worst], city["name"], f"{stamps[focus_idx].replace(' ', 'T')}:00+05:30",
        float(utci[focus_idx, worst]), float(wbgt[focus_idx, worst]),
        ph.safe_work_minutes_per_hour(float(wbgt[focus_idx, worst]),
                                      ph.PERSONAS["construction"]))
    write(OUT / "advisory.json", {
        "zone_id": adv.zone_id, "headline": adv.headline, "severity": adv.severity,
        "colour": adv.colour, "utci_c": adv.utci_c, "wbgt_c": adv.wbgt_c,
        "safe_work_note": adv.safe_work_note, "text": adv.text,
        "languages_verified": ad.LANGUAGES_VERIFIED,
        "cap_xml": ad.cap_alert(adv, polygon=sp.cell_polygon(cells[worst])),
    })

    # Colour domains derived from THIS dataset. The hindcast domains are tuned
    # to a 45 degC dry event; reusing them on a 33 degC humid week would render
    # the whole city at the pale end of the ramp and show nothing.
    def dom(arr, pad=0.04):
        lo, hi = float(np.min(arr)), float(np.max(arr))
        p = (hi - lo) * pad
        return [round(lo - p, 2), round(hi + p, 2)]

    write(OUT / "meta.json", {
        "city": city["name"], "centre": city["centre"], "bbox": city["bbox"],
        "h3_resolution": config["grid"]["h3_resolution"], "n_cells": len(cells),
        "focus": {"date": focus_day, "hour_ist": int(stamps[focus_idx][11:13])},
        "mode": "live",
        "generated_at_ist": now_ist.strftime("%Y-%m-%d %H:%M"),
        "forecast_age_minutes": round(age, 1) if age is not None else None,
        "window_ist": [stamps[0], stamps[-1]],
        "event": (f"Live forecast for {city['name']}. Conditions from now to "
                  f"{stamps[-1][:10]}, updated when the pipeline is re-run."),
        "domains": {"air_temp": dom(ta), "wbgt": dom(wbgt), "utci": dom(utci),
                    "risk": dom(risk)},
        "kill_gate": {
            "air_temp_spread_c": round(float(np.ptp(ta[focus_idx])), 2),
            "wbgt_spread_c": round(float(np.ptp(wbgt[focus_idx])), 2),
            "utci_spread_c": round(float(np.ptp(utci[focus_idx])), 2),
            "wbgt_damping_ratio": round(float(np.ptp(wbgt[focus_idx]) /
                                              max(np.ptp(ta[focus_idx]), 1e-6)), 2),
            "utci_amplification": round(float(np.ptp(utci[focus_idx]) /
                                              max(np.ptp(ta[focus_idx]), 1e-6)), 2),
            "verdict": "LIVE",
        },
        "provenance": [
            {"layer": "weather", "plain": "Weather forecast",
             "source": "Open-Meteo forecast API", "resolution": "~11 km, hourly",
             "status": "measured"},
            {"layer": "urban form", "plain": "How built-up each area is",
             "source": "OpenStreetMap via Overpass",
             "resolution": f"H3 res {config['grid']['h3_resolution']}",
             "status": "measured"},
            {"layer": "UHI amplitude", "plain": "How much hotter cities get",
             "source": "literature value",
             "resolution": f"{uhi['uhi_amplitude_c']} degC city-wide",
             "status": "ASSUMED -- not fitted locally"},
            {"layer": "thermal indices", "plain": "Heat-stress calculations",
             "source": "thermofeel (ECMWF); WBGT by Liljegren, UTCI polynomial",
             "resolution": "per cell-hour", "status": "measured"},
            {"layer": "physiology", "plain": "Safe limits for the human body",
             "source": "ISO 7243 limits + ACGIH work-rest",
             "resolution": "per persona", "status": "published standards"},
            {"layer": "vulnerability", "plain": "Who lives there and how they cope",
             "source": "PLACEHOLDER", "resolution": "city-wide constant",
             "status": "NOT FITTED -- exposure proxied by urban intensity"},
            {"layer": "health risk", "plain": "Expected health impact",
             "source": "literature-shaped exposure-response",
             "resolution": "relative risk only",
             "status": "NOT CALIBRATED to local health records"},
        ],
        "caveats": [
            {"plain": "This is a forecast, so the days ahead are predictions and "
                      "will change. It was last updated at the time shown above.",
             "technical": "Open-Meteo forecast, refreshed when the pipeline runs; "
                          "no ensemble spread or prediction intervals are shown."},
            {"plain": "Being live does not make it more accurate. How much hotter "
                      "each neighbourhood gets is still a published average, not "
                      "something measured here.",
             "technical": "UHI amplitude remains assumed; live input changes "
                          "currency, not validation."},
            {"plain": "We could not get neighbourhood-level data on who lives "
                      "where, so the risk map reflects how hot a place is, not "
                      "how vulnerable its residents are.",
             "technical": "Vulnerability is a declared placeholder and does not "
                          "vary between neighbourhoods."},
            {"plain": "The health-risk numbers are not based on real hospital or "
                      "death records from this city.",
             "technical": "Exposure-response coefficients are not fitted to local "
                          "health data."},
            {"plain": "The Hindi and Gujarati warning text has not been checked by "
                      "a native speaker.",
             "technical": "Advisory copy is machine-composed and unverified."},
        ],
        "is_placeholder_urban": False,
        "exposure_response": {
            "metric": rk.DEFAULT_WBGT_RESPONSE.metric,
            "mmt_c": rk.DEFAULT_WBGT_RESPONSE.mmt,
            "beta": rk.DEFAULT_WBGT_RESPONSE.beta,
            "beta_ci": [rk.DEFAULT_WBGT_RESPONSE.beta_low,
                        rk.DEFAULT_WBGT_RESPONSE.beta_high],
            "is_calibrated": rk.DEFAULT_WBGT_RESPONSE.is_calibrated,
            "source": rk.DEFAULT_WBGT_RESPONSE.source,
        },
    })

    # Focus-hour inputs for the sensitivity and scenario analysis.
    ta_focus = ta[focus_idx]
    rh_focus = rh[focus_idx]
    wind_focus = np.full_like(ta_focus, float(weather["wind_speed_10m"].iloc[focus_idx]))
    ghi_focus = np.full_like(ta_focus, float(weather["shortwave_radiation"].iloc[focus_idx]))
    intensity_arr = intensity


    # ---- 7. insights.json : drivers, scenarios, recommended actions -------
    # Everything here is computed from the same physics as the map. Nothing is
    # illustrative. Interventions that cannot be modelled with the data we have
    # (hydration, water stations) are omitted rather than faked.
    from heatstress import insight as ins

    focus_ta = ta_focus
    focus_rh = rh_focus
    focus_wind = wind_focus
    focus_ghi = ghi_focus
    day_series = [float(v) for v in wbgt[day_idx].mean(axis=1)]
    day_labels = [stamps[i][11:16] for i in day_idx]

    write(OUT / "insights.json", {
        "date": focus_day,
        "drivers": ins.driver_attribution(focus_ta, focus_rh, focus_wind, focus_ghi),
        "scenarios": [
            ins.scenario_shift_hours(day_series),
            ins.scenario_shade(focus_ta, focus_rh, focus_wind, focus_ghi),
            ins.scenario_greening(focus_ta, focus_rh, focus_wind, focus_ghi,
                                  intensity_arr, uhi["uhi_amplitude_c"]),
        ],
        "actions": ins.recommended_actions(day_series, day_labels),
        "omitted": [
            {"item": "Water stations / hydration measures",
             "why": "Hydration is not a thermal quantity. Our model cannot "
                    "estimate its effect, so it is not offered as though it could."},
            {"item": "People-at-risk headcount",
             "why": "We have no population data and vulnerability is a declared "
                    "placeholder. A precise headcount would be fabricated."},
        ],
    })

    total = sum(p.stat().st_size for p in OUT.glob("*"))
    print(f"\n  baked -> {OUT.relative_to(ROOT)}  ({total / 1024:.0f} KB)")
    print(f"  focus {stamps[focus_idx]} IST · "
          f"WBGT {wbgt[focus_idx].mean():.1f} · UTCI {utci[focus_idx].mean():.1f} "
          f"[{th.utci_category(utci[focus_idx].mean())}]")
    print(f"  spreads -- air {np.ptp(ta[focus_idx]):.2f}  "
          f"WBGT {np.ptp(wbgt[focus_idx]):.2f}  UTCI {np.ptp(utci[focus_idx]):.2f} degC")


def night_recovery(stamps, air_temp):
    from collections import defaultdict
    buckets = defaultdict(list)
    for stamp, value in zip(stamps, air_temp):
        hour = int(stamp[11:13])
        if hour >= 22 or hour <= 6:
            buckets[stamp[:10]].append(float(value))
    return [{"date": d, "min_c": round(min(v), 1), "max_c": round(max(v), 1)}
            for d, v in sorted(buckets.items()) if len(v) >= 6]


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "config/ahmedabad.yaml")
