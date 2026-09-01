"""Human thermal stress indices: Heat Index, WBGT, UTCI.

This module is the technical core of the project -- the difference between
"what the weather will be" and "what the weather will do".

TWO INDEPENDENT IMPLEMENTATIONS, ON PURPOSE
-------------------------------------------
Every headline index is computed two ways:

  * ``tf_*`` functions delegate to **thermofeel**, ECMWF's own operational
    library. These are the numbers we report.
  * The plain functions are our own from-scratch implementations.

They are cross-checked against each other in ``tests/test_thermal.py``. Two
independent implementations agreeing is much stronger evidence of correctness
than one implementation agreeing with itself, and it is a far better answer to
"how do we know your numbers are right?" than an accuracy percentage.

UNITS
-----
This module works in **degrees Celsius** at its public surface. thermofeel works
in **Kelvin**; conversion happens at the boundary so the rest of the codebase
never has to think about it.

Relative humidity %, wind m/s at 10 m, irradiance W/m2, pressure hPa.
"""

from __future__ import annotations

import numpy as np

from .psychro import dew_point, vapour_pressure, wet_bulb_stull

__all__ = [
    # our own implementations
    "heat_index",
    "globe_temperature_regression",
    "mean_radiant_temperature",
    "wbgt_outdoor_simple",
    "wbgt_indoor",
    "wind_10m_to_1m",
    # thermofeel-backed (these are what we report)
    "tf_wbgt_liljegren",
    "tf_utci",
    "tf_globe_temperature",
    "tf_mrt_from_globe",
    "tf_heat_index",
    # categorisation
    "wbgt_category",
    "utci_category",
]

# Standard 150 mm black-globe thermometer, ISO 7726.
GLOBE_DIAMETER_M = 0.15
GLOBE_EMISSIVITY = 0.95
P_SEA_LEVEL_HPA = 1013.25
K0 = 273.15


def _c2k(t_c):
    return np.asarray(t_c, dtype=float) + K0


def _k2c(t_k):
    out = np.asarray(t_k, dtype=float) - K0
    return float(out) if out.ndim == 0 else out


def _tf_call(fn, *args, **kwargs):
    """Call a thermofeel function with scalar-safe, broadcast inputs.

    thermofeel assigns into its outputs through boolean masks
    (``hi[warm_mask] = ...``), which raises TypeError on 0-d or scalar input,
    and it does not broadcast mixed shapes itself. So: promote everything to a
    common 1-D-or-better shape, call, then collapse back to a float if the
    caller passed only scalars.

    Without this, every thermofeel entry point in this module breaks on the
    single-value calls that the tests and the persona panel both make.
    """
    named = list(kwargs.items())
    values = list(args) + [v for _, v in named]
    scalar = all(np.ndim(v) == 0 for v in values if v is not None)

    arrays = [None if v is None else np.atleast_1d(np.asarray(v, dtype=float))
              for v in values]
    shape = np.broadcast_shapes(*[a.shape for a in arrays if a is not None])
    arrays = [None if a is None else np.ascontiguousarray(np.broadcast_to(a, shape),
                                                          dtype=float)
              for a in arrays]

    n_pos = len(args)
    out = fn(*arrays[:n_pos],
             **{k: a for (k, _), a in zip(named, arrays[n_pos:])})
    out = np.asarray(out, dtype=float)
    return float(out.reshape(-1)[0]) if scalar else out


# ===========================================================================
# Our own implementations
# ===========================================================================

def heat_index(t_air_c, rh_pct):
    """NOAA Heat Index ("apparent temperature"), degC in and degC out.

    Rothfusz (1990) regression as operationally implemented by the US National
    Weather Service, including both documented adjustments:

      * low-humidity correction  (RH < 13%, 80 <= T <= 112 degF)
      * high-humidity correction (RH > 85%, 80 <= T <=  87 degF)

    Below an 80 degF effective value the NWS substitutes a simpler linear form;
    that branch is reproduced so results match the published HI chart across its
    whole domain.

    Heat Index assumes shade and light wind, and ignores radiation entirely. It
    is the weakest of the three indices we compute -- included because it is what
    the public and the press already recognise, not because it is the best
    physics. Compare against WBGT/UTCI on the same cell to show the gap.
    """
    t_c = np.asarray(t_air_c, dtype=float)
    rh = np.asarray(rh_pct, dtype=float)
    t_f = t_c * 9.0 / 5.0 + 32.0

    simple = 0.5 * (t_f + 61.0 + ((t_f - 68.0) * 1.2) + (rh * 0.094))

    full = (
        -42.379
        + 2.04901523 * t_f
        + 10.14333127 * rh
        - 0.22475541 * t_f * rh
        - 6.83783e-3 * t_f**2
        - 5.481717e-2 * rh**2
        + 1.22874e-3 * t_f**2 * rh
        + 8.5282e-4 * t_f * rh**2
        - 1.99e-6 * t_f**2 * rh**2
    )

    low_adj = ((13.0 - rh) / 4.0) * np.sqrt(
        np.clip((17.0 - np.abs(t_f - 95.0)) / 17.0, 0.0, None)
    )
    full = np.where((rh < 13.0) & (t_f >= 80.0) & (t_f <= 112.0), full - low_adj, full)

    high_adj = ((rh - 85.0) / 10.0) * ((87.0 - t_f) / 5.0)
    full = np.where((rh > 85.0) & (t_f >= 80.0) & (t_f <= 87.0), full + high_adj, full)

    hi_f = np.where(((simple + t_f) / 2.0) < 80.0, simple, full)
    return (hi_f - 32.0) * 5.0 / 9.0


def globe_temperature_regression(t_air_c, rh_pct, solar_wm2):
    """Black-globe temperature Tg, degC -- empirical regression fallback.

    Hunter & Minyard (1999):  Tg = 0.01498*SR + 1.184*Ta - 0.0789*RH - 2.739

    APPROXIMATION, and we no longer rely on it: this is a regression, blind to
    wind, albedo and sky-view factor, and fitted in a different climate. Prefer
    ``tf_globe_temperature``, which solves the globe energy balance. Retained
    as a cheap sanity check and as a fallback if thermofeel is unavailable.

    Sanity behaviour: at night (SR = 0) it sits slightly below air temperature,
    correct for a globe radiating to a cold sky; under strong sun it lands
    10-15 degC above air temperature.
    """
    ta = np.asarray(t_air_c, dtype=float)
    rh = np.asarray(rh_pct, dtype=float)
    sr = np.clip(np.asarray(solar_wm2, dtype=float), 0.0, None)
    return 0.01498 * sr + 1.184 * ta - 0.0789 * rh - 2.739


def mean_radiant_temperature(t_globe_c, t_air_c, wind_ms,
                             diameter_m=GLOBE_DIAMETER_M,
                             emissivity=GLOBE_EMISSIVITY):
    """Mean radiant temperature Tmrt, degC, from globe temperature. ISO 7726.

        Tmrt = [ (Tg+273.15)^4
                 + (1.10e8 * v^0.6)/(eps * D^0.4) * (Tg - Ta) ]^0.25 - 273.15

    ``wind_ms`` must be the speed at globe height, not the 10 m meteorological
    value -- pass it through ``wind_10m_to_1m`` first.
    """
    tg = np.asarray(t_globe_c, dtype=float)
    ta = np.asarray(t_air_c, dtype=float)
    # The ISO relation is undefined at zero air velocity.
    v = np.clip(np.asarray(wind_ms, dtype=float), 0.1, None)

    term = (1.10e8 * np.power(v, 0.6)) / (emissivity * np.power(diameter_m, 0.4))
    quartic = np.power(tg + K0, 4) + term * (tg - ta)
    # Clip before the fourth root: strong nocturnal cooling can push the bracket
    # slightly negative, which is a numerical artefact rather than physics.
    return np.power(np.clip(quartic, 1.0, None), 0.25) - K0


def wind_10m_to_1m(wind_10m_ms):
    """Convert 10 m wind to ~1.1 m (human / globe height), m/s.

    Logarithmic profile over open terrain with roughness length 0.01 m. Open-Meteo
    reports wind at 10 m, so skipping this systematically overestimates
    convective cooling and biases every index optimistic.
    """
    v10 = np.asarray(wind_10m_ms, dtype=float)
    return v10 * (np.log(1.1 / 0.01) / np.log(10.0 / 0.01))


def wbgt_outdoor_simple(t_air_c, rh_pct, solar_wm2):
    """WBGT outdoors in sun, degC -- ISO 7243 weighting, simple inputs.

        WBGT = 0.7*Tnw + 0.2*Tg + 0.1*Ta

    The 0.2*Tg term is precisely why land-surface temperature belongs in this
    pipeline: Tg is genuinely driven by radiant load from hot surfaces, so hot
    asphalt raises WBGT through real physics, not correlation.

    APPROXIMATION: Tnw (natural wet bulb -- a wetted sensor exposed to sun and
    wind) is substituted by the psychrometric wet bulb, which biases WBGT low
    under strong sun. ``tf_wbgt_liljegren`` does not make this substitution and
    is what we report; this function exists for cross-checking and as a fallback.
    """
    tnw = wet_bulb_stull(t_air_c, rh_pct)
    tg = globe_temperature_regression(t_air_c, rh_pct, solar_wm2)
    ta = np.asarray(t_air_c, dtype=float)
    return 0.7 * tnw + 0.2 * tg + 0.1 * ta


def wbgt_indoor(t_air_c, rh_pct):
    """WBGT indoors or fully shaded (no direct solar load), degC. ISO 7243.

        WBGT = 0.7*Tnw + 0.3*Tg
    """
    tnw = wet_bulb_stull(t_air_c, rh_pct)
    tg = globe_temperature_regression(t_air_c, rh_pct, 0.0)
    return 0.7 * tnw + 0.3 * tg


# ===========================================================================
# thermofeel-backed -- the numbers we report
# ===========================================================================

def tf_wbgt_liljegren(t_air_c, rh_pct, wind_10m_ms, ghi_wm2, fdir, cos_sza,
                      pressure_hpa=P_SEA_LEVEL_HPA):
    """WBGT by the **Liljegren** model, degC. The headline WBGT.

    Liljegren et al. (2008) solves the coupled energy balances of the black
    globe and the natural wet bulb explicitly, rather than approximating Tnw by
    the psychrometric wet bulb. It is the reference method for outdoor WBGT and
    is what removes the largest single approximation from this pipeline.

    Args:
        t_air_c:      air temperature, degC
        rh_pct:       relative humidity, %
        wind_10m_ms:  wind speed at 10 m, m/s
        ghi_wm2:      global horizontal irradiance, W/m2
        fdir:         fraction of GHI arriving as direct beam, 0-1
        cos_sza:      cosine of the solar zenith angle, 0-1 (see solar.py)
        pressure_hpa: surface pressure, hPa

    Returns degC.
    """
    import thermofeel as tf

    return _k2c(_tf_call(
        tf.calculate_wbgt_liljegren,
        _c2k(t_air_c),
        rh_pct,
        pressure_hpa,
        wind_10m_ms,
        np.clip(np.asarray(ghi_wm2, dtype=float), 0.0, None),
        np.clip(np.asarray(fdir, dtype=float), 0.0, 1.0),
        np.clip(np.asarray(cos_sza, dtype=float), 0.0, 1.0),
    ))


def tf_globe_temperature(t_air_c, t_mrt_c, wind_10m_ms):
    """Black-globe temperature, degC, from a proper energy balance.

    thermofeel solves the globe budget with a closed-form quartic root, rather
    than the Hunter-Minyard regression. Prefer this.
    """
    import thermofeel as tf

    return _k2c(_tf_call(
        tf.calculate_bgt, _c2k(t_air_c), _c2k(t_mrt_c), wind_10m_ms
    ))


def tf_mrt_from_globe(t_air_c, t_globe_c, wind_10m_ms):
    """Mean radiant temperature, degC, from globe temperature.

    Brimicombe et al. (2023). Independent of our ISO 7726 implementation above,
    so the two are cross-checked in the test suite.
    """
    import thermofeel as tf

    return _k2c(_tf_call(
        tf.calculate_mrt_from_bgt, _c2k(t_air_c), _c2k(t_globe_c), wind_10m_ms
    ))


def tf_utci(t_air_c, rh_pct, wind_10m_ms, t_mrt_c):
    """Universal Thermal Climate Index, degC. The headline whole-body index.

    UTCI is the equivalent temperature of a reference environment that would
    produce the same physiological strain, derived from a multi-node human
    thermoregulation model. It is the closest thing here to "what the weather
    will do to a body".

    Delegated to thermofeel rather than hand-coding the 6th-order polynomial:
    typing 200+ coefficients is a pointless source of silent error.

    Validity envelope: wind 0.5-17 m/s at 10 m, and Tmrt from 30 degC below to
    70 degC above air temperature. Outside it the reference implementation
    returns NaN, which we deliberately let through rather than inventing a value.
    """
    import thermofeel as tf

    e_hpa = vapour_pressure(t_air_c, rh_pct)
    return _k2c(_tf_call(
        tf.calculate_utci,
        _c2k(t_air_c),
        np.clip(np.asarray(wind_10m_ms, dtype=float), 0.5, 17.0),
        _c2k(t_mrt_c),
        ehPa=e_hpa,
    ))


def tf_heat_index(t_air_c, rh_pct):
    """NOAA Heat Index via thermofeel, degC. Cross-check for ``heat_index``."""
    import thermofeel as tf

    td_c = dew_point(t_air_c, rh_pct)
    return _k2c(_tf_call(tf.calculate_heat_index_adjusted,
                         _c2k(t_air_c), _c2k(td_c)))


# ===========================================================================
# Categorisation -- drives the map colour ramp
# ===========================================================================

# Official UTCI thermal-stress bands (UTCI documentation).
#
# Read as (inclusive lower bound, label): the label applies from that bound up to
# the next one. The first entry is the open-ended cold tail.
_UTCI_BANDS = [
    (-np.inf, "extreme cold stress"),
    (-40.0, "very strong cold stress"),
    (-27.0, "strong cold stress"),
    (-13.0, "moderate cold stress"),
    (0.0, "slight cold stress"),
    (9.0, "no thermal stress"),
    (26.0, "moderate heat stress"),
    (32.0, "strong heat stress"),
    (38.0, "very strong heat stress"),
    (46.0, "extreme heat stress"),
]


def utci_category(utci_c):
    """Official UTCI thermal-stress band label for a scalar UTCI value."""
    v = float(utci_c)
    if np.isnan(v):
        return "out of range"
    label = _UTCI_BANDS[0][1]
    for threshold, name in _UTCI_BANDS:
        if v >= threshold:
            label = name
    return label


# Coarse public-health WBGT ladder, for map colouring ONLY.
#
# Deliberate simplification: the occupational standards (ISO 7243, NIOSH, ACGIH)
# set limits that depend on metabolic rate and acclimatisation, so no single
# ladder is strictly correct for every worker. ``physiology.py`` is what actually
# answers "is this safe for this person" -- do not use these labels for that.
#
# Read as (inclusive lower bound, label), same convention as _UTCI_BANDS.
_WBGT_BANDS = [
    (-np.inf, "low"),
    (28.0, "moderate"),
    (30.0, "high"),
    (32.0, "very high"),
    (35.0, "extreme"),
]


def wbgt_category(wbgt_c):
    """Coarse public-health WBGT band label. See the caveat above."""
    v = float(wbgt_c)
    if np.isnan(v):
        return "no data"
    label = _WBGT_BANDS[0][1]
    for threshold, name in _WBGT_BANDS:
        if v >= threshold:
            label = name
    return label
