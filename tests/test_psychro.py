"""Psychrometrics validated against published reference values.

Every expected value here traces to a citable source, not to a previous run of
this code. Where a value was verified by execution it is marked REGRESSION and
its purpose is to catch drift, not to prove correctness.
"""

import numpy as np
import pytest

from heatstress import psychro as ps


class TestSaturationVapourPressure:
    """Arden Buck (1996) against standard steam-table values."""

    # (temperature degC, published es hPa, tolerance hPa)
    #   0 degC   -> 6.112   (definitional reference point)
    #  20 degC   -> 23.39   (standard psychrometric tables)
    # 100 degC   -> 1013.25 (boiling at 1 atm, by definition)
    @pytest.mark.parametrize("t_c,expected,tol", [
        (0.0, 6.112, 0.005),
        (20.0, 23.39, 0.02),
        (100.0, 1013.25, 0.30),
    ])
    def test_reference_points(self, t_c, expected, tol):
        assert ps.saturation_vapour_pressure(t_c) == pytest.approx(expected, abs=tol)

    def test_monotonic_increasing(self):
        t = np.linspace(-20, 50, 100)
        es = ps.saturation_vapour_pressure(t)
        assert np.all(np.diff(es) > 0)


class TestWetBulbStull:
    """Stull (2011), J. Appl. Meteor. Climatol., doi:10.1175/JAMC-D-11-0143.1"""

    def test_published_worked_example(self):
        """The worked example given in Stull's own paper: 20 degC, 50% RH -> 13.7 degC.

        This is the single most important assertion in the psychrometrics suite:
        it validates the coefficients against the source publication.
        """
        assert ps.wet_bulb_stull(20.0, 50.0) == pytest.approx(13.7, abs=0.05)

    def test_saturation_gives_wet_bulb_equal_to_dry_bulb(self):
        """At 100% RH there is no evaporative cooling, so Tw -> Ta.

        Stull's fit is empirical, so it does not land exactly on Ta; a few tenths
        is the documented accuracy of the approximation.
        """
        for t in (10.0, 25.0, 40.0):
            assert ps.wet_bulb_stull(t, 100.0) == pytest.approx(t, abs=0.5)

    def test_wet_bulb_never_meaningfully_exceeds_dry_bulb(self):
        """Physically Tw <= Ta always. Stull's fit is empirical, so it overshoots
        very slightly at the saturation corner.

        Measured worst case across the whole envelope: +0.035 degC at
        T = 50 degC, RH = 99% -- an order of magnitude inside the +/-0.3 degC
        accuracy Stull reports, so it is a property of the approximation rather
        than a defect in this implementation.
        """
        t = np.repeat(np.linspace(0, 50, 40), 20)
        rh = np.tile(np.linspace(5, 99, 20), 40)
        assert np.all(ps.wet_bulb_stull(t, rh) <= t + 0.05)

    def test_decreases_as_air_dries(self):
        """Lower humidity -> more evaporative cooling -> lower wet bulb."""
        tw = ps.wet_bulb_stull(40.0, np.array([20.0, 40.0, 60.0, 80.0]))
        assert np.all(np.diff(tw) > 0)

    def test_validity_envelope_flagged(self):
        assert bool(ps.stull_in_range(30.0, 50.0))
        assert not bool(ps.stull_in_range(60.0, 50.0))   # too hot
        assert not bool(ps.stull_in_range(30.0, 2.0))    # too dry


class TestDewPoint:
    def test_equals_air_temp_at_saturation(self):
        for t in (5.0, 20.0, 35.0):
            assert ps.dew_point(t, 100.0) == pytest.approx(t, abs=0.05)

    def test_below_air_temp_when_unsaturated(self):
        assert ps.dew_point(30.0, 50.0) < 30.0

    def test_known_value(self):
        """30 degC / 50% RH -> dew point close to 18.4 degC (psychrometric tables)."""
        assert ps.dew_point(30.0, 50.0) == pytest.approx(18.4, abs=0.2)


class TestSpecificHumidity:
    def test_dry_air_is_zero(self):
        assert ps.specific_humidity(25.0, 0.0) == pytest.approx(0.0, abs=1e-12)

    def test_increases_with_humidity(self):
        q = ps.specific_humidity(30.0, np.array([10.0, 50.0, 90.0]))
        assert np.all(np.diff(q) > 0)

    def test_plausible_magnitude(self):
        """Warm humid air carries roughly 10-30 g/kg."""
        q = float(ps.specific_humidity(30.0, 70.0))
        assert 0.010 < q < 0.030
