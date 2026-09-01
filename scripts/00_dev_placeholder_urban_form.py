"""Generate a DEVELOPMENT PLACEHOLDER urban-form file.

PURPOSE: unblock downstream pipeline work while the real Overpass fetch runs.
This is the "build the frontend against a dummy GeoJSON" pattern from the plan,
applied one layer earlier.

THIS IS NOT DATA. The output filename and an in-file flag both say so. Nothing
produced from it may appear in the demo. Delete once the real fetch lands.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

import h3
import numpy as np
import yaml

from heatstress import spatial as sp

ROOT = Path(__file__).resolve().parents[1]


def main(config_path: str) -> None:
    config = yaml.safe_load(Path(config_path).read_text(encoding="utf-8"))
    city, grid_cfg, uhi = config["city"], config["grid"], config["urban_heat"]

    cells = sp.build_grid(city["bbox"], grid_cfg["h3_resolution"])
    centres = np.array([h3.cell_to_latlng(c) for c in cells])
    mid_lat = (city["bbox"]["min_lat"] + city["bbox"]["max_lat"]) / 2
    mid_lon = (city["bbox"]["min_lon"] + city["bbox"]["max_lon"]) / 2

    # A radially decaying core with a river-like cool corridor. Plausible shape,
    # entirely invented values.
    dist = np.hypot((centres[:, 0] - mid_lat) / 0.075,
                    (centres[:, 1] - mid_lon) / 0.08)
    core = np.exp(-1.2 * dist**2)
    river = np.exp(-((centres[:, 1] - (mid_lon - 0.01)) / 0.008) ** 2)
    intensity = sp._minmax(core - 0.45 * river)
    offset = sp.urban_heat_offset(intensity, uhi["uhi_amplitude_c"])

    out = {
        "SYNTHETIC_PLACEHOLDER": True,
        "warning": "INVENTED VALUES. Pipeline development only. Never demo this.",
        "city": city["name"],
        "h3_resolution": grid_cfg["h3_resolution"],
        "uhi_amplitude_c": uhi["uhi_amplitude_c"],
        "cells": {
            cell: {"intensity": round(float(intensity[i]), 4),
                   "d_ta_c": round(float(offset[i]), 3),
                   "built": 0.0, "roads": 0.0, "green": 0.0, "water": 0.0}
            for i, cell in enumerate(cells)
        },
    }
    dest = ROOT / "data" / "processed" / "urban_form_PLACEHOLDER.json"
    dest.write_text(json.dumps(out), encoding="utf-8")
    print(f"PLACEHOLDER written -> {dest.relative_to(ROOT)}  ({len(cells)} cells)")
    print(f"  dTa range {offset.min():+.2f} .. {offset.max():+.2f} C")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "config/ahmedabad.yaml")
