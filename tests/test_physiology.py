"""Persona heat-strain assessment, against ISO 7243 / ACGIH published limits."""

import numpy as np
import pytest

from heatstress import physiology as ph


class TestISO7243Limits:
    """PUBLISHED: ISO 7243 reference WBGT limit values by metabolic class."""

    @pytest.mark.parametrize("metabolic,expected", [
        (ph.RESTING, 33.0),
        (ph.LOW, 30.0),
        (ph.MODERATE, 28.0),
        (ph.HIGH, 26.0),
        (ph.VERY_HIGH, 25.0),
    ])
    def test_acclimatised_limits(self, metabolic, expected):
        assert ph.wbgt_limit(metabolic, acclimatised=True) == expected

    def test_unacclimatised_is_always_stricter(self):
        for metabolic in (ph.RESTING, ph.LOW, ph.MODERATE, ph.HIGH, ph.VERY_HIGH):
            assert (ph.wbgt_limit(metabolic, acclimatised=False)
                    <= ph.wbgt_limit(metabolic, acclimatised=True))

    def test_harder_work_lowers_the_limit(self):
        """PHYSICAL: more metabolic heat produced means less environmental heat
        can be tolerated."""
        limits = [ph.wbgt_limit(m) for m in
                  (ph.RESTING, ph.LOW, ph.MODERATE, ph.HIGH, ph.VERY_HIGH)]
        assert np.all(np.diff(limits) < 0)


class TestSafeWorkMinutes:
    def test_cool_conditions_allow_full_hour(self):
        worker = ph.PERSONAS["construction"]
        assert ph.safe_work_minutes_per_hour(22.0, worker) == 60.0

    def test_extreme_conditions_allow_none(self):
        worker = ph.PERSONAS["construction"]
        assert ph.safe_work_minutes_per_hour(40.0, worker) == 0.0

    def test_monotonically_decreasing_with_heat(self):
        """PHYSICAL: permissible work never increases as WBGT rises."""
        worker = ph.PERSONAS["construction"]
        minutes = ph.safe_work_minutes_per_hour(
            np.array([20.0, 25.0, 26.0, 28.0, 30.0, 32.0, 36.0]), worker)
        assert np.all(np.diff(minutes) <= 0)

    def test_acgih_heavy_work_continuous_threshold(self):
        """PUBLISHED: ACGIH TLV allows continuous heavy work up to 25.0 degC WBGT
        for acclimatised workers, and steps down above it."""
        worker = ph.PERSONAS["construction"]        # HIGH -> column 3
        assert ph.safe_work_minutes_per_hour(25.0, worker) == 60.0
        assert ph.safe_work_minutes_per_hour(25.5, worker) == 45.0

    def test_lighter_work_tolerates_more_heat(self):
        """At the same WBGT, a delivery rider (moderate) can work longer than a
        construction worker (heavy)."""
        wbgt = 27.0
        assert (ph.safe_work_minutes_per_hour(wbgt, ph.PERSONAS["delivery"])
                >= ph.safe_work_minutes_per_hour(wbgt, ph.PERSONAS["construction"]))


class TestPersonaDivergence:
    """The core product claim, as a test: one environment, different verdicts."""

    def test_same_wbgt_gives_different_verdicts(self):
        wbgt = 31.0
        verdicts = {key: ph.assess(wbgt, persona)["severity"]
                    for key, persona in ph.PERSONAS.items()}
        assert len(set(verdicts.values())) > 1, (
            f"all personas agreed at {wbgt} degC WBGT: {verdicts}"
        )

    def test_elderly_limit_is_lower_than_resting_standard(self):
        """The vulnerability offset must actually bite -- otherwise the persona
        layer is decorative."""
        elderly = ph.PERSONAS["elderly"]
        assert elderly.limit_c() < ph.wbgt_limit(ph.RESTING)
        assert elderly.vulnerability_offset_c > 0

    def test_strain_ratio_crosses_one_at_the_limit(self):
        for persona in ph.PERSONAS.values():
            assert ph.strain_ratio(persona.limit_c(), persona) == pytest.approx(1.0)


class TestAssess:
    def test_returns_declared_basis(self):
        result = ph.assess(30.0, ph.PERSONAS["construction"])
        assert "ISO 7243" in result["basis"]
        assert "ACGIH" in result["basis"]

    def test_vulnerability_offset_is_disclosed(self):
        """A non-standard adjustment must never be presented silently."""
        result = ph.assess(30.0, ph.PERSONAS["elderly"])
        assert "non-standard" in result["basis"]
        assert "4.0" in result["basis"]

    def test_no_offset_means_no_caveat(self):
        result = ph.assess(30.0, ph.PERSONAS["construction"])
        assert "non-standard" not in result["basis"]

    def test_severity_escalates_with_heat(self):
        worker = ph.PERSONAS["construction"]
        order = ["low", "moderate", "high", "severe", "critical"]
        seen = [ph.assess(w, worker)["severity"] for w in (18, 22, 24, 27, 34)]
        indices = [order.index(s) for s in seen]
        assert np.all(np.diff(indices) >= 0), seen

    def test_output_is_json_serialisable(self):
        import json
        json.dumps(ph.assess(30.0, ph.PERSONAS["elderly"]))
