"""Give every H3 zone a human-readable name.

    python scripts/03_place_names.py config/ahmedabad.yaml

H3 identifies a cell as "8842cc6821fffff". Nobody can act on that, discuss it in
a meeting, or find it on the ground. This fetches OpenStreetMap's named place
nodes for the city and labels each zone with its nearest one, so the UI can say
"Naranpura" instead of a hex code.

The name is a NEAREST-PLACE label, not an administrative boundary. A zone
labelled "Maninagar" is the zone closest to the point OSM calls Maninagar -- it
is not the Maninagar ward. The distance is stored alongside so the UI can say
"near X" when the match is loose, and so nobody mistakes this for a ward map.
"""
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

import h3
import yaml

from heatstress import spatial as sp
from heatstress.sources.osm import OSMUrbanForm

ROOT = Path(__file__).resolve().parents[1]

# Beyond this, a place name is more misleading than helpful and the UI should
# say "near" rather than assert the zone *is* that place.
NEAR_THRESHOLD_KM = 1.2


def haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def main(config_path: str) -> None:
    config = yaml.safe_load(Path(config_path).read_text(encoding="utf-8"))
    city, grid = config["city"], config["grid"]
    slug = city["name"].lower().replace(" ", "_")

    cells = sp.build_grid(city["bbox"], grid["h3_resolution"])
    places = OSMUrbanForm().fetch_places(city["bbox"], verbose=True)
    print(f"{city['name']}: {len(places)} named places for {len(cells)} zones")

    if not places:
        print("  no named places found -- zones will keep their H3 codes")
        return

    # Prefer finer-grained place types when distances are comparable: being told
    # you are in "Navrangpura" is more useful than being told "Ahmedabad".
    rank = {"neighbourhood": 0, "quarter": 0, "suburb": 1, "city_district": 1,
            "hamlet": 2, "village": 2, "town": 3, "city": 4}

    out = {}
    for cell in cells:
        lat, lon = h3.cell_to_latlng(cell)
        best = min(
            places,
            key=lambda pl: (
                haversine_km(lat, lon, pl["lat"], pl["lon"])
                + 0.35 * rank.get(pl["kind"], 3)   # gentle nudge toward specificity
            ),
        )
        distance = haversine_km(lat, lon, best["lat"], best["lon"])
        out[cell] = {
            "name": best["name"],
            "kind": best["kind"],
            "km": round(distance, 2),
            "exact": distance <= NEAR_THRESHOLD_KM,
        }

    dest = ROOT / "data" / "processed" / f"place_names_{slug}.json"
    dest.write_text(json.dumps({"city": city["name"], "cells": out},
                               ensure_ascii=False), encoding="utf-8")

    named = sum(1 for v in out.values() if v["exact"])
    distinct = len({v["name"] for v in out.values()})
    print(f"  {distinct} distinct names · {named}/{len(cells)} zones within "
          f"{NEAR_THRESHOLD_KM} km of their place")
    print(f"  written -> {dest.relative_to(ROOT)}")

    sample = sorted({v["name"] for v in out.values()})[:14]
    print("  sample:", ", ".join(sample))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "config/ahmedabad.yaml")
