"""Keep the live forecast fresh: recompute and republish on an interval.

    python scripts/08_live_scheduler.py config/ahmedabad.yaml --interval 300

WHAT THIS IS FOR, given `api/main.py` already refreshes itself on the same
interval: running uvicorn alone is enough for the API to stay current, but this
script covers the cases uvicorn does not -- refreshing `web/data/live/` with the
API down (the static and Pages build path), a controllable interval and --once
for testing without restarting the server, and being the thing you would point
Task Scheduler or systemd at in a real deployment.

RUNNING IT ALONGSIDE UVICORN IS SAFE. Both call the same `refresh_once`, which
takes a lock: whoever gets it computes and writes, and the other reads what the
winner wrote. Two refreshers therefore cost one compute per interval, not two,
and neither needs to know the other exists.

WHY EVERY TICK RECOMPUTES even though Open-Meteo only publishes hourly: the
focus hour is "the peak stress hour *ahead*", so it moves with the wall clock,
and a page labelled live with a frozen timestamp is a credibility problem. The
physics costs well under a second; the writer skips files whose bytes did not
change, so an unchanged tick touches only meta.json.
"""
import argparse
import logging
import signal
import sys
import threading
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from heatstress import live  # noqa: E402

log = logging.getLogger("live-scheduler")
_stop = threading.Event()


def _install_signal_handlers() -> None:
    def handle(signum, _frame):
        log.info("signal %s — finishing the current cycle and exiting", signum)
        _stop.set()

    for name in ("SIGINT", "SIGTERM", "SIGBREAK"):     # SIGBREAK is Windows-only
        sig = getattr(signal, name, None)
        if sig is not None:
            signal.signal(sig, handle)


def run_once(args, settings, n: int) -> live.RefreshResult:
    result = live.refresh_once(
        args.config,
        out_dir=args.out,
        write=not args.no_write,
        max_age_minutes=settings.max_age_minutes,
        lock=not args.no_lock,
        lock_port=args.lock_port,
        # Half the interval, capped at a minute: long enough that the process
        # which loses the lock does not immediately recompute what just landed,
        # short enough that it never serves something the user would call stale.
        freshness_floor=min(settings.interval_seconds / 2, 60.0),
    )
    meta = result.payload["meta"]
    if result.status == "computed":
        idx = live.focus_index(result.payload)
        city = result.payload["summary"]
        wrote = sum(1 for changed in (result.written or {}).values() if changed)
        log.info("refresh #%d  computed in %.1fs · focus %s %02d:30 IST · "
                 "WBGT %.1f · forecast age %sm · wrote %d/%d files",
                 n, result.duration_s, meta["focus"]["date"],
                 meta["focus"]["hour_ist"], city["wbgt"][idx],
                 meta["forecast_age_minutes"], wrote, len(live.PAYLOAD_FILES))
    else:
        log.info("refresh #%d  read_from_disk in %.1fs (another refresher is "
                 "current) · generated %s", n, result.duration_s,
                 meta["generated_at_ist"])
    return result


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("config", nargs="?", default=live.DEFAULT_CONFIG)
    ap.add_argument("--interval", type=int, default=None,
                    help=f"seconds between refreshes (default {live.LIVE_REFRESH_SECONDS})")
    ap.add_argument("--max-age", type=int, default=None,
                    help=f"minutes before a cached forecast is refetched "
                         f"(default {live.LIVE_MAX_AGE_MINUTES})")
    ap.add_argument("--once", action="store_true", help="refresh once and exit")
    ap.add_argument("--out", default=None, help="output dir (default web/data/live)")
    ap.add_argument("--no-write", action="store_true",
                    help="compute and report, write nothing")
    ap.add_argument("--lock-port", type=int, default=live.LOCK_PORT)
    ap.add_argument("--no-lock", action="store_true",
                    help="skip the single-instance lock")
    ap.add_argument("-q", "--quiet", action="store_true")
    args = ap.parse_args(argv)

    logging.basicConfig(
        level=logging.WARNING if args.quiet else logging.INFO,
        format="%(asctime)s  %(levelname)-7s  %(message)s",
        datefmt="%H:%M:%S",
    )
    settings = live.load_settings(args.config, interval=args.interval,
                                  max_age=args.max_age)

    if args.once:
        try:
            run_once(args, settings, 1)
            return 0
        except Exception as exc:
            log.error("refresh failed: %r", exc)
            return 1

    _install_signal_handlers()
    log.info("refreshing %s every %ds (forecast TTL %dm) — Ctrl-C to stop",
             args.config, settings.interval_seconds, settings.max_age_minutes)

    n, failures = 0, 0
    # time.monotonic, not time.time: a clock adjustment or a DST change must not
    # make this sleep for an hour or spin.
    next_at = time.monotonic()
    while not _stop.is_set():
        n += 1
        try:
            run_once(args, settings, n)
            failures = 0
            delay_base = settings.interval_seconds
        except Exception as exc:
            failures += 1
            # Cap at an hour: even fully degraded, that still catches every
            # Open-Meteo release. The last good files stay on disk untouched.
            delay_base = min(settings.interval_seconds * 2 ** failures, 3600)
            log.warning("refresh #%d failed: %r · serving last good · "
                        "retry in %ds (failure %d)", n, exc, delay_base, failures)

        next_at += delay_base
        delay = next_at - time.monotonic()
        if delay <= 0:                      # a slow cycle overran the interval
            next_at = time.monotonic() + delay_base
            delay = delay_base
        log.debug("next refresh at %s",
                  datetime.now().strftime("%H:%M:%S"))
        if _stop.wait(delay):               # never time.sleep: Ctrl-C exits now
            break

    log.info("stopped after %d refreshes", n)
    return 0


if __name__ == "__main__":
    sys.exit(main())
