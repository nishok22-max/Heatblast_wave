"""H3 tessellation and the urban-heat offset that makes the map hyper-local.

WHY HEXAGONS AND NOT WARDS
--------------------------
Indian municipal ward shapefiles are a multi-day scavenge with essentially zero
learning value for the question the prototype exists to answer. H3 has no
dependency, tessellates any city in milliseconds, and every cell has identical
area -- so per-cell statistics are directly comparable, which is not true of
wards. Hexes map onto wards in production; the physics is unchanged.

THE URBAN-HEAT OFFSET
---------------------
Coarse reanalysis gives one weather series for the whole city. The intra-city
variation -- the entire premise of the project -- has to come from somewhere else.
We derive it from **urban form**:

    dTa_hex = uhi_amplitude * (intensity_hex - mean_intensity)

where ``intensity`` is a 0-1 index built from built-up density, road density and
(negatively) green and water cover. This is the same signal WUDAPT's Local
Climate Zones encode, computed directly from OpenStreetMap instead of from a
categorical raster.

APPROXIMATION, stated plainly and repeated on stage: this is a *proxy* for the
urban heat island, calibrated to a literature amplitude rather than fitted to
local observations. Production replaces it with satellite land-surface
temperature and a trained residual model -- which is exactly why the source is
pluggable (see ``UrbanFormSource``).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

import h3
import numpy as np

__all__ = [
    "build_grid",
    "cell_polygon",
    "grid_geojson",
    "UrbanFormSource",
    "UrbanIntensity",
    "urban_heat_offset",
]


# ---------------------------------------------------------------------------
# Tessellation
# ---------------------------------------------------------------------------

def build_grid(bbox: dict, resolution: int = 8) -> list[str]:
    """Return the H3 cell indices covering a bounding box.

    Args:
        bbox: mapping with min_lat, max_lat, min_lon, max_lon
        resolution: H3 resolution. 8 gives ~0.74 km2 cells (~0.53 km edge),
            which is finer than a typical Indian municipal ward and coarse
            enough to stay under the ~3k-cell budget in NFR-6.

    Returns cell indices sorted for deterministic output -- the baked GeoJSON
    should not churn between runs.
    """
    poly = h3.LatLngPoly([
        (bbox["min_lat"], bbox["min_lon"]),
        (bbox["min_lat"], bbox["max_lon"]),
        (bbox["max_lat"], bbox["max_lon"]),
        (bbox["max_lat"], bbox["min_lon"]),
    ])
    return sorted(h3.polygon_to_cells(poly, resolution))


def cell_polygon(cell: str) -> list[list[float]]:
    """GeoJSON-ready [lon, lat] ring for one H3 cell, explicitly closed."""
    boundary = h3.cell_to_boundary(cell)
    ring = [[lon, lat] for lat, lon in boundary]
    ring.append(ring[0])
    return ring


def cell_centroids(cells: list[str]) -> np.ndarray:
    """(N, 2) array of [lat, lon] centroids."""
    return np.array([h3.cell_to_latlng(c) for c in cells], dtype=float)


def grid_geojson(cells: list[str], properties: dict[str, dict] | None = None) -> dict:
    """Assemble cells into a GeoJSON FeatureCollection.

    ``properties`` maps cell index -> property dict, merged into each feature.
    """
    properties = properties or {}
    features = []
    for cell in cells:
        props = {"h3_index": cell}
        props.update(properties.get(cell, {}))
        features.append({
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [cell_polygon(cell)]},
            "properties": props,
        })
    return {"type": "FeatureCollection", "features": features}


# ---------------------------------------------------------------------------
# Urban form -> temperature offset
# ---------------------------------------------------------------------------

@dataclass
class UrbanIntensity:
    """Per-cell urban-form measures, each normalised to 0-1.

    built:  building footprint area fraction
    roads:  road length density
    green:  vegetation and open-space fraction
    water:  water surface fraction
    """

    built: dict[str, float]
    roads: dict[str, float]
    green: dict[str, float]
    water: dict[str, float]

    def composite(self, cells: list[str]) -> np.ndarray:
        """Combine into a single 0-1 urban-heat intensity index.

        Weights reflect the physical drivers of the urban heat island:
        impervious mass stores and re-radiates heat (built, roads), while
        vegetation cools by evapotranspiration and water by thermal inertia.

        These weights are a judgement, not a fit. They are the first thing a
        production model should learn from data rather than assume.
        """
        built = np.array([self.built.get(c, 0.0) for c in cells])
        roads = np.array([self.roads.get(c, 0.0) for c in cells])
        green = np.array([self.green.get(c, 0.0) for c in cells])
        water = np.array([self.water.get(c, 0.0) for c in cells])

        raw = 0.55 * built + 0.25 * roads - 0.30 * green - 0.20 * water
        return _minmax(raw)


def _minmax(values: np.ndarray) -> np.ndarray:
    """Scale to 0-1, returning all-0.5 if the array is constant."""
    lo, hi = float(np.nanmin(values)), float(np.nanmax(values))
    if not np.isfinite(lo) or not np.isfinite(hi) or hi - lo < 1e-12:
        return np.full_like(values, 0.5, dtype=float)
    return (values - lo) / (hi - lo)


def urban_heat_offset(intensity: np.ndarray, uhi_amplitude_c: float = 3.0) -> np.ndarray:
    """Convert a 0-1 urban intensity index into an air-temperature offset, degC.

    Centred on the city mean so the offsets sum to ~zero: we are redistributing
    the coarse forecast across the city, not inventing extra heat. A cell at the
    hottest end of the index sits roughly ``+uhi_amplitude/2`` above the city
    mean and the greenest sits the same distance below.

    ``uhi_amplitude_c`` is the *air* temperature UHI range. Indian cities report
    canopy-layer UHI of roughly 2-5 degC; 3.0 degC is a deliberately conservative
    default. Surface UHI is much larger -- do not confuse the two.
    """
    return (np.asarray(intensity, dtype=float) - float(np.nanmean(intensity))) * uhi_amplitude_c


class UrbanFormSource(Protocol):
    """Pluggable provider of per-cell urban form.

    The prototype ships ``sources.osm.OSMUrbanForm``. Production adds a Landsat
    land-surface-temperature source; because both satisfy this interface,
    swapping them changes nothing downstream of ``spatial``.
    """

    def fetch(self, bbox: dict, cells: list[str]) -> UrbanIntensity:
        ...
