"""Psychrometrics: the moist-air foundations every thermal index depends on.

All functions are numpy-friendly: pass scalars or arrays interchangeably.
Temperatures are degrees Celsius, relative humidity is percent (0-100),
vapour pressures are hectopascals (hPa == millibar) unless stated otherwise.

Provenance of each formula is recorded in its docstring. Where an approximation
is used instead of an exact model, that is stated explicitly -- naming our own
approximations is a deliberate project policy (see plan, Part B.2).
"""

from __future__ import annotations

import numpy as np

__all__ = [
    "saturation_vapour_pressure",
    "vapour_pressure",
    "dew_point",
    "wet_bulb_stull",
    "specific_humidity",
]

# Standard sea-level pressure, hPa. Stull's wet-bulb approximation is fitted at
# this pressure; Ahmedabad sits ~53 m above sea level, so the error is negligible.
P_SEA_LEVEL_HPA = 1013.25


def saturation_vapour_pressure(t_air_c):
    """Saturation vapour pressure over liquid water, hPa.

    Arden Buck (1996) equation -- accurate to better than 0.1% across the range
    we care about. Preferred over Tetens/Magnus because the extra cost is nil
    and it removes a source of avoidable error at high temperature, which is
    exactly where this project operates.

        es = 6.1121 * exp((18.678 - T/234.5) * (T / (257.14 + T)))
    """
    t = np.asarray(t_air_c, dtype=float)
    return 6.1121 * np.exp((18.678 - t / 234.5) * (t / (257.14 + t)))


def vapour_pressure(t_air_c, rh_pct):
    """Actual (partial) water-vapour pressure, hPa.

    UTCI takes vapour pressure rather than relative humidity, so this is the
    bridge between what Open-Meteo gives us and what the index wants.
    """
    rh = np.asarray(rh_pct, dtype=float)
    return saturation_vapour_pressure(t_air_c) * rh / 100.0


def dew_point(t_air_c, rh_pct):
    """Dew-point temperature, degC. Inverted Magnus form, WMO coefficients.

    a = 17.62, b = 243.12 degC, valid -45..+60 degC over water.
    """
    a, b = 17.62, 243.12
    t = np.asarray(t_air_c, dtype=float)
    rh = np.clip(np.asarray(rh_pct, dtype=float), 1e-6, 100.0)
    gamma = np.log(rh / 100.0) + (a * t) / (b + t)
    return (b * gamma) / (a - gamma)


def wet_bulb_stull(t_air_c, rh_pct):
    """Psychrometric (adiabatic) wet-bulb temperature, degC.

    Stull (2011), "Wet-Bulb Temperature from Relative Humidity and Air
    Temperature", J. Appl. Meteor. Climatol. An empirical fit to the exact
    psychrometric solution, accurate to about +/-0.3 degC over its fitted range
    and far cheaper than iterating the psychrometric equation.

    Fitted range: T in [-20, +50] degC, RH in [5, 99] %, at sea-level pressure.
    Inputs outside that range are computed anyway but flagged by
    ``stull_in_range`` so callers can decide what to do.

    NOTE -- IMPORTANT APPROXIMATION: WBGT strictly requires the *natural* wet-bulb
    temperature Tnw (a wetted sensor exposed to sun and wind), not the
    psychrometric Tw returned here. Tnw exceeds Tw under solar load. We use Tw as
    a stand-in for the prototype and say so on stage; the production build
    replaces this with the Liljegren model. See plan assumption A2.
    """
    t = np.asarray(t_air_c, dtype=float)
    rh = np.asarray(rh_pct, dtype=float)
    return (
        t * np.arctan(0.151977 * np.sqrt(rh + 8.313659))
        + np.arctan(t + rh)
        - np.arctan(rh - 1.676331)
        + 0.00391838 * np.power(rh, 1.5) * np.arctan(0.023101 * rh)
        - 4.686035
    )


def stull_in_range(t_air_c, rh_pct):
    """True where inputs fall inside Stull's fitted validity envelope."""
    t = np.asarray(t_air_c, dtype=float)
    rh = np.asarray(rh_pct, dtype=float)
    return (t >= -20.0) & (t <= 50.0) & (rh >= 5.0) & (rh <= 99.0)


def specific_humidity(t_air_c, rh_pct, pressure_hpa=P_SEA_LEVEL_HPA):
    """Specific humidity, kg water vapour per kg moist air.

    Ratio of molar masses water/dry-air = 0.622.
    """
    e = vapour_pressure(t_air_c, rh_pct)
    p = np.asarray(pressure_hpa, dtype=float)
    return (0.622 * e) / (p - 0.378 * e)
