"""Compatibility shim. The implementation lives in `heatstress.live`.

This module used to hold its own copy of the live physics, and that copy drifted
from `scripts/07_live.py`: it substituted a simple-WBGT approximation for
Liljegren, so the Forecast tab and the hindcast tab computed different indices.
Both copies now call one implementation, which is what stops that happening
again. Kept as a shim so `from api.services.engine import run_live_forecast`
continues to work.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from heatstress.live import DEFAULT_CONFIG, refresh_once  # noqa: E402

__all__ = ["run_live_forecast"]


def run_live_forecast(config_path: str = DEFAULT_CONFIG) -> dict:
    """Refresh the live forecast and return the seven payloads."""
    return refresh_once(config_path).payload
