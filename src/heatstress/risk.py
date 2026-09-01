"""Heat-health risk: turning a thermal index into an expected health signal.

WHAT THIS MODULE IS, AND WHAT IT IS NOT
---------------------------------------
It is the **machinery** of an epidemiological exposure-response model, wired so
that a city can drop in its own coefficients and get a fitted local estimate.

It is **not** a fitted local estimate. Nobody on this team has ward-level
mortality, emergency-department or ambulance records; obtaining them takes months
of institutional process, which is why the data-request letters go out on day
zero. Until they land, the coefficients below are *literature-shaped defaults*
and every output is stamped ``is_calibrated=False``.

The standard method in this field is a **distributed lag non-linear model**
(DLNM, quasi-Poisson), which captures three things a naive regression misses:

  1. the exposure-response curve is J-shaped, not linear
  2. heat deaths lag exposure by 0-3 days
  3. some of the excess is mortality displacement ("harvesting")

Fitting a DLNM requires the daily death counts we do not have. So this module
implements the *shape* of that model -- a threshold plus an exponential slope,
with an explicit lag kernel -- and exposes ``calibrate()`` as the seam where real
data enters. Saying this out loud is worth more than a fabricated number.

VERIFY THE DEFAULT COEFFICIENTS AGAINST PRIMARY SOURCES BEFORE QUOTING THEM.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

__all__ = [
    "ExposureResponse",
    "DEFAULT_WBGT_RESPONSE",
    "relative_risk",
    "lagged_relative_risk",
    "normalise_hazard",
]


@dataclass
class ExposureResponse:
    """A threshold-and-slope exposure-response relationship.

        RR(x) = exp(beta * (x - mmt))   for x > mmt,  else 1.0

    Attributes:
        metric: which thermal index this is defined on. Coefficients are NOT
            transferable between metrics -- a slope fitted on WBGT means nothing
            applied to UTCI.
        mmt: minimum-morbidity/mortality threshold, degC. Below this, heat is not
            adding risk.
        beta: log-relative-risk per degC above the threshold.
        beta_low, beta_high: bounds giving an uncertainty band. Reported as an
            interval because a single number here would imply a precision this
            model does not have.
        lag_weights: fraction of the effect appearing on day 0, 1, 2, ... Heat
            mortality is not same-day only.
        is_calibrated: False until fitted to local health records.
        source: provenance string, surfaced in the UI.
    """

    metric: str
    mmt: float
    beta: float
    beta_low: float
    beta_high: float
    lag_weights: tuple[float, ...] = (0.45, 0.30, 0.15, 0.10)
    is_calibrated: bool = False
    source: str = "literature-shaped default; not fitted to local data"

    def calibrate(self, mmt: float, beta: float, beta_low: float,
                  beta_high: float, source: str) -> "ExposureResponse":
        """Return a calibrated copy. This is the seam where real data enters."""
        return ExposureResponse(
            metric=self.metric, mmt=mmt, beta=beta,
            beta_low=beta_low, beta_high=beta_high,
            lag_weights=self.lag_weights, is_calibrated=True, source=source,
        )


# Default response on WBGT.
#
# PROVENANCE WARNING: these values are placeholders chosen to sit in the range
# reported by heat-mortality literature for hot-climate cities -- an order of a
# few percent excess all-cause mortality per degC above threshold. They are NOT
# taken from a specific published fit for Ahmedabad. Replace before the pitch,
# or present the output strictly as relative and uncalibrated.
DEFAULT_WBGT_RESPONSE = ExposureResponse(
    metric="wbgt",
    mmt=28.0,
    beta=0.030,        # ~3.0% excess risk per degC above threshold
    beta_low=0.018,    # ~1.8%
    beta_high=0.045,   # ~4.5%
)


def relative_risk(metric_values, response: ExposureResponse = DEFAULT_WBGT_RESPONSE,
                  which: str = "central"):
    """Relative risk versus the no-heat-effect baseline of 1.0.

    Args:
        which: 'central', 'low' or 'high' -- selects which slope to use, so the
            caller can build an uncertainty band.
    """
    beta = {"central": response.beta,
            "low": response.beta_low,
            "high": response.beta_high}[which]
    x = np.asarray(metric_values, dtype=float)
    excess = np.clip(x - response.mmt, 0.0, None)
    return np.exp(beta * excess)


def lagged_relative_risk(daily_metric,
                         response: ExposureResponse = DEFAULT_WBGT_RESPONSE,
                         which: str = "central"):
    """Relative risk on each day, accounting for the lagged effect of prior days.

    Heat kills over the following few days, not only on the day itself -- which is
    exactly why a 3-5 day forecast is actionable and a same-day warning is not.
    This convolves the daily exposure with the lag kernel.

    ``daily_metric`` should be one representative value per day (typically the
    daily maximum WBGT).
    """
    values = np.asarray(daily_metric, dtype=float)
    per_day = relative_risk(values, response, which) - 1.0   # excess only

    weights = np.asarray(response.lag_weights, dtype=float)
    weights = weights / weights.sum()

    out = np.zeros_like(per_day)
    for lag, weight in enumerate(weights):
        if lag == 0:
            out += weight * per_day
        else:
            out[lag:] += weight * per_day[:-lag]
    return out + 1.0


def normalise_hazard(metric_values, response: ExposureResponse = DEFAULT_WBGT_RESPONSE,
                     saturation_rr: float = 2.0):
    """Map a thermal index onto a 0-1 hazard score for the risk composition.

    Anchored on the exposure-response curve rather than on the raw index range,
    so the scale means something: 0 is "no heat effect", 1 is a doubling of
    baseline risk. Min-max scaling the raw index would instead make the hottest
    cell score 1.0 on a mild day, which is actively misleading on a map.
    """
    rr = relative_risk(metric_values, response, "central")
    return np.clip((rr - 1.0) / (saturation_rr - 1.0), 0.0, 1.0)
