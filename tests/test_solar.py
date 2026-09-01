"""Solar geometry validated against astronomical facts.

Solar position is the one part of this pipeline with unambiguous ground truth:
the sun is where it is. These tests check against equinox/solstice geometry and
against Ahmedabad's own sunrise behaviour.
"""

import numpy as np
import pytest

from heatstress import solar as so

LAT, LON = 23.03, 72.58          # Ahmedabad
IST_OFFSET = 5.5                 # UTC+5:30


def ist_to_utc(hour_ist):
    return hour_ist - IST_OFFSET


class TestSolarDeclination:
    """PUBLISHED: declination is ~0 at the equinoxes and ~+/-23.44 at solstices."""

    @pytest.mark.parametrize("doy,expected_deg,tol", [
        (80, 0.0, 1.0),      # ~20 March, vernal equinox
        (172, 23.44, 0.6),   # ~21 June, summer solstice
        (266, 0.0, 1.0),     # ~23 September, autumnal equinox
        (355, -23.44, 0.6),  # ~21 December, winter solstice
    ])
    def test_seasonal_extremes(self, doy, expected_deg, tol):
        decl = np.degrees(float(so.solar_declination(doy)))
        assert decl == pytest.approx(expected_deg, abs=tol)


class TestEquationOfTime:
    """PUBLISHED: EoT swings roughly -14 min (Feb) to +16 min (Nov)."""

    def test_stays_within_known_envelope(self):
        eot = so.equation_of_time(np.arange(1, 366))
        assert eot.min() > -17.0
        assert eot.max() < 17.0

    def test_february_is_negative(self):
        assert float(so.equation_of_time(45)) < -10.0

    def test_november_is_positive(self):
        assert float(so.equation_of_time(310)) > 10.0


class TestCosSolarZenithAngle:
    def test_zero_at_night(self):
        """PHYSICAL: the sun contributes nothing below the horizon."""
        for ist in (0.0, 2.0, 22.0, 23.5):
            assert float(so.cos_solar_zenith_angle(
                LAT, LON, 141, ist_to_utc(ist))) == 0.0

    def test_peaks_near_local_solar_noon(self):
        """Ahmedabad is 72.58E; IST is referenced to 82.5E, so solar noon falls
        roughly 40 minutes after 12:00 IST."""
        hours = np.arange(6.0, 19.0, 0.25)
        mu = so.cos_solar_zenith_angle(LAT, LON, 141, ist_to_utc(hours))
        peak_ist = hours[int(np.argmax(mu))]
        assert 12.2 <= peak_ist <= 13.0

    def test_summer_elevation_is_near_overhead(self):
        """PUBLISHED: at 23.03N on 21 May the sun passes almost overhead --
        declination is close to the latitude, so elevation approaches 90 deg."""
        mu = so.cos_solar_zenith_angle(LAT, LON, 141, ist_to_utc(12.5))
        elevation = np.degrees(np.arcsin(float(mu)))
        assert elevation > 80.0

    def test_bounded_zero_to_one(self):
        hours = np.linspace(0, 24, 200)
        for doy in (1, 100, 200, 300):
            mu = so.cos_solar_zenith_angle(LAT, LON, doy, ist_to_utc(hours))
            assert np.all((mu >= 0.0) & (mu <= 1.0))

    def test_winter_sun_is_lower_than_summer(self):
        """PHYSICAL: northern-hemisphere seasonality."""
        summer = float(so.cos_solar_zenith_angle(LAT, LON, 172, ist_to_utc(12.5)))
        winter = float(so.cos_solar_zenith_angle(LAT, LON, 355, ist_to_utc(12.5)))
        assert summer > winter


class TestExtraterrestrialIrradiance:
    def test_perihelion_exceeds_aphelion(self):
        """PUBLISHED: Earth is closest to the sun in early January, so TOA
        irradiance peaks then -- about 6.7% above the July minimum."""
        january = float(so.extraterrestrial_normal_irradiance(3))
        july = float(so.extraterrestrial_normal_irradiance(185))
        assert january > july
        assert (january - july) / july == pytest.approx(0.067, abs=0.01)

    def test_magnitude_near_solar_constant(self):
        e0 = so.extraterrestrial_normal_irradiance(np.arange(1, 366))
        assert np.all((e0 > 1300.0) & (e0 < 1420.0))


class TestDirectFraction:
    def test_components_path_is_exact(self):
        assert float(so.direct_fraction_from_components(600.0, 200.0)) == \
            pytest.approx(0.75, abs=1e-9)

    def test_components_zero_at_night(self):
        assert float(so.direct_fraction_from_components(0.0, 0.0)) == 0.0

    def test_erbs_plateau_above_clearness_index_0_8(self):
        """PUBLISHED (Erbs et al. 1982): above kt = 0.80 the diffuse fraction is
        pinned at 0.165, so the direct fraction plateaus at 0.835.

        With the sun near overhead at Ahmedabad the extraterrestrial horizontal
        irradiance is ~1325 W/m2, so kt > 0.8 requires GHI above ~1060 W/m2.
        """
        mu = float(so.cos_solar_zenith_angle(LAT, LON, 141, ist_to_utc(12.5)))
        assert float(so.direct_fraction_erbs(1100.0, mu, 141)) == \
            pytest.approx(0.835, abs=0.01)

    def test_erbs_realistic_clear_sky_is_mostly_direct(self):
        """A strong but ordinary clear-sky GHI of 950 W/m2 gives kt ~ 0.72, which
        sits on the quartic branch rather than the plateau: mostly direct, but
        not yet saturated."""
        mu = float(so.cos_solar_zenith_angle(LAT, LON, 141, ist_to_utc(12.5)))
        fdir = float(so.direct_fraction_erbs(950.0, mu, 141))
        assert 0.70 < fdir < 0.83

    def test_erbs_overcast_is_mostly_diffuse(self):
        """Heavy cloud -> low clearness index -> nearly all diffuse."""
        mu = float(so.cos_solar_zenith_angle(LAT, LON, 141, ist_to_utc(12.5)))
        assert float(so.direct_fraction_erbs(80.0, mu, 141)) < 0.15

    def test_erbs_zero_at_night(self):
        assert float(so.direct_fraction_erbs(0.0, 0.0, 141)) == 0.0

    def test_erbs_bounded(self):
        mu = so.cos_solar_zenith_angle(LAT, LON, 141,
                                       ist_to_utc(np.linspace(5, 19, 60)))
        fdir = so.direct_fraction_erbs(np.linspace(0, 1000, 60), mu, 141)
        assert np.all((fdir >= 0.0) & (fdir <= 1.0))
