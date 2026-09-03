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

This file is now a one-shot CLI over `heatstress.live.refresh_once`. The
plumbing moved there so the API and `scripts/08_live_scheduler.py` run the same
code -- when it lived here in duplicate, the two copies drifted and served
different physics. To refresh continuously instead of once, use script 08.
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from heatstress import live  # noqa: E402
from heatstress import thermal as th  # noqa: E402


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("config", nargs="?", default=live.DEFAULT_CONFIG)
    ap.add_argument("--out", default=None, help="output dir (default web/data/live)")
    ap.add_argument("--max-age", type=int, default=None,
                    help="max age in minutes of a cached forecast before refetch")
    ap.add_argument("--no-lock", action="store_true",
                    help="skip the single-instance lock")
    args = ap.parse_args(argv)

    settings = live.load_settings(args.config, max_age=args.max_age)
    result = live.refresh_once(args.config, out_dir=args.out,
                               max_age_minutes=settings.max_age_minutes,
                               lock=not args.no_lock,
                               freshness_floor=0.0)   # an explicit run always recomputes

    meta = result.payload["meta"]
    out = Path(args.out) if args.out else live.LIVE_DIR
    total = sum(p.stat().st_size for p in out.glob("*.json"))
    total += sum(p.stat().st_size for p in out.glob("*.geojson"))
    city = result.payload["summary"]
    idx = live.focus_index(result.payload)
    focus = f"{meta['focus']['date']} {meta['focus']['hour_ist']:02d}:30 IST"

    print(f"{meta['city']} LIVE: {meta['n_cells']} cells")
    print(f"  baked -> {out}  ({total / 1024:.0f} KB)")
    print(f"  focus {focus} · WBGT {city['wbgt'][idx]:.1f} · "
          f"UTCI {city['utci'][idx]:.1f} "
          f"[{th.utci_category(city['utci'][idx])}]")
    print(f"  forecast age {meta['forecast_age_minutes']} min · {result.status} "
          f"in {result.duration_s:.1f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
