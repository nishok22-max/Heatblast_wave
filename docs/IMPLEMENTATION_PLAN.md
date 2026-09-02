# Implementation Plan
## Heat Stress Early Warning — build status and remaining work

**Repo:** `C:\Users\HP\sih-heat` · **Tests:** 135 passing · **Backend:** complete
**Kill gate:** PROCEED (UTCI spread 3.88 °C on real Ahmedabad urban form)

---

## 1. Strategy

The prototype is **an experiment, not a small product.** It exists to answer one
load-bearing question:

> Does meaningful intra-city thermal stress variation actually show up?

Everything else — the map, an API, alerting — is known-outcome engineering that
de-risks nothing. So the build terminates in a **kill gate** with pre-committed
thresholds, decided before any UI work begins.

| Spread | Verdict | Action |
|---|---|---|
| ≥ 3 °C | Thesis holds | Geography is the story; lead with the map |
| 1.5–3 °C | Real but modest | Lead with humidity + physiology |
| < 1.5 °C | Premise weak | Pivot to *same place, different bodies* |

**Result: 3.88 °C on UTCI → PROCEED.** Robust across the entire literature
amplitude range (2.57–6.53 °C), so the verdict does not depend on a flattering
choice of parameter.

---

## 2. What Was Built

### Phase 0 — Environment
| Task | Status | Note |
|---|---|---|
| Resolve repo location | ✅ | `D:\S I H 2 6 0 8 3` is read-only at NTFS level; relocated to `C:\Users\HP\sih-heat` |
| Python 3.12 venv + dependencies | ✅ | `numpy`, `pandas`, `h3`, `thermofeel`, `requests`, `pyyaml`, `pytest` |

### Phase 1 — Physics core
| Task | Status | Validation |
|---|---|---|
| `psychro.py` — Buck, Stull, dew point | ✅ | Buck within 0.017 % at 100 °C; Stull hits its published worked example exactly (20 °C/50 % → 13.70 °C) |
| `solar.py` — NOAA position, Erbs split | ✅ | Declination checked at equinoxes/solstices; solar noon at Ahmedabad |
| `thermal.py` — HI, WBGT, UTCI, MRT | ✅ | HI matches NOAA chart within 0.4 °F; our MRT vs thermofeel agree to **0.005 °C** |
| `physiology.py` — ISO 7243 + ACGIH | ✅ | Limits and work-rest thresholds checked against published tables |
| Test suite | ✅ | **135 tests** |

### Phase 2 — Data & spatial
| Task | Status | Note |
|---|---|---|
| `sources/openmeteo.py` | ✅ | ERA5 archive, disk-cached, wind unit asserted (`ms`, not the km/h default) |
| `sources/osm.py` | ✅ | Overpass with tiling, backoff, endpoint rotation, per-tile caching, percentile scaling |
| `spatial.py` — H3 + UHI offset | ✅ | 392 cells at res 8 over 289 km² |
| Real Ahmedabad urban form | ✅ | All 32 tile-queries fetched |

### Phase 3 — Risk & delivery
| Task | Status | Note |
|---|---|---|
| `vulnerability.py` | ✅ | Declared placeholder; interface is the deliverable |
| `risk.py` | ✅ | Exposure-response machinery with `calibrate()` seam; uncalibrated by design |
| `advisory.py` | ✅ | CAP 1.2 XML validates; `status=Exercise` |
| Pipeline scripts 02/04/05/06 | ✅ | Full run in ~7 s cached |
| Static web assets | ✅ | 500 KB, opens from `file://` offline |

---

## 3. Running It

```powershell
cd C:\Users\HP\sih-heat

.\.venv\Scripts\python.exe -m pytest                                    # 135 tests

.\.venv\Scripts\python.exe scripts\02_urban_form.py     config\ahmedabad.yaml
.\.venv\Scripts\python.exe scripts\04_compute_indices.py config\ahmedabad.yaml
.\.venv\Scripts\python.exe scripts\05_kill_gate.py       config\ahmedabad.yaml
.\.venv\Scripts\python.exe scripts\06_bake_web.py        config\ahmedabad.yaml
```

Use `.\.venv\Scripts\python.exe`, never bare `python` — the interpreter on PATH
is a different venv without the dependencies.

Step 02 is safe to re-run: every Overpass response is cached per tile, so an
interrupted or partially failed run resumes and retries only the gaps. Cold run
on a new city takes 30–60 min (Overpass rate limits); warm run is instant.

---

## 4. Remaining Work

### 4.1 Frontend — BUILT

React + TypeScript + Vite in `frontend/`; the production build is a single
self-contained `index.html`.

| # | Component | Status |
|---|---|---|
| 1 | SVG hex choropleth, 4 layers, 24 h scrubber, zoom/pan, keyboard-navigable | done |
| 2 | Cell detail — indices, urban-form drivers, per-persona verdict | done |
| 3 | Index-disagreement panel (WBGT x0.46 vs UTCI x1.29) | done |
| 4 | Night-recovery chart | done |
| 5 | Safe-work-window grid | done |
| 6 | Advisory + CAP payload, with unverified-translation badges | done |
| 7 | Provenance panel — 7 layers, 3 flagged as not measured | done |
| 8 | **Open `dist/index.html` from `file://` with wifi off** | TODO — do before the pitch |
| 9 | Screen-recorded backup video | TODO — live demos die |

**Three decisions worth knowing about:**

- **MapLibre was removed.** v6 loads its parser in a web worker, and Chromium
  refuses to construct a worker from a `file://` origin, so the map rendered
  blank from disk. Replaced with hand-rolled SVG: 392 polygons is trivial
  geometry, and it removed ~1.5 MB of bundle, the worker, a CSS-cascade bug, and
  brought real keyboard accessibility and correct print output.
- **Data is compiled into the bundle, not fetched.** `fetch()` and module-script
  loading are both blocked from `file://`. So re-baking data now also requires
  `npm run build`.
- **The colour scale has an explicit mode switch.** A fixed domain is honest
  across hours but flattens the city at peak; a per-hour domain reveals the
  pattern but is not comparable between hours. Both ship, and the legend always
  states which is active.

### 4.2 Chennai — the humid counterpoint

Ahmedabad 2010 was *dry* heat. **Live mode has since supplied a humid regime for
the same city**, so Chennai is no longer needed to demonstrate the humid
mechanism — it is now a portability demonstration only, and correspondingly lower
priority. The pipeline is city-agnostic and normalisation is percentile-based, so
it remains config plus a fetch:

| # | Task | Est. |
|---|---|---|
| 1 | `config/chennai.yaml` — bbox, centre, humid heatwave dates | 20 min |
| 2 | Run steps 02/04/05/06 (cold Overpass fetch dominates) | 30–60 min |
| 3 | Verify WBGT/UTCI ordering **inverts** vs Ahmedabad — the payoff | 20 min |

**This prediction was made, tested, and turned out WRONG — which is a better
result.** The live September forecast for Ahmedabad (63% mean humidity, 26-35 degC)
was run through the same pipeline as the dry May 2010 event (14% humidity, 45 degC):

| | May 2010, dry | Sept 2026 forecast, humid |
|---|---|---|
| air spread | 3.00 degC | 3.00 degC |
| WBGT spread | 1.39 degC (x0.46) | 1.38 degC (**x0.46**) |
| UTCI spread | 3.88 degC (x1.29) | 3.98 degC (**x1.33**) |

The damping ratio did **not** move with humidity. The mechanism is not
humidity-dependent as predicted: it comes from holding vapour pressure constant
while air temperature varies across cells, and the sub-linear wet-bulb response
to that is roughly scale-invariant across this range.

**Why this is the better outcome:** "use UTCI, not WBGT, for the intra-city map"
now holds in *both* regimes rather than being event-specific. A single-city
observation became a general finding — and it is a finding we can show we
predicted incorrectly and corrected, which is worth more than one we guessed
right.

### 4.3 Before any pitch

| # | Task | Why |
|---|---|---|
| 1 | **Native-speaker review of Hindi and Gujarati advisory copy** | Machine-composed; an early draft contained a Lao codepoint inside the Gujarati |
| 2 | Verify the May 2010 casualty figure and HAP evaluation against primary sources | Judges check numbers |
| 3 | Source real exposure–response coefficients, or present risk as strictly relative | Currently literature-shaped defaults |
| 4 | Make one phone call to a municipal health officer — *"if you knew four days ahead, what would you do differently?"* | Answers R4; a killer quote; zero build cost |

---

## 5. Bridge to Production

The prototype was built so production is a **substitution, not a rewrite**.

| Prototype | Production | Seam already in place |
|---|---|---|
| Hindcast of one past event | 5-day probabilistic forecast | New source module; physics unchanged |
| OSM urban form | Landsat LST + trained LightGBM residual | `spatial.UrbanFormSource` protocol |
| Assumed 3 °C UHI amplitude | Fitted from LST, validated against stations | Amplitude already isolated in config |
| H3 hexagons | Municipal ward boundaries | Aggregation is cell-agnostic |
| Placeholder vulnerability | Census 2011 + NFHS-5 ward index | `vulnerability.VulnerabilitySource` protocol |
| Literature exposure-response | DLNM fitted on IHIP / 108 / CRS records | `risk.ExposureResponse.calibrate()` |
| Static GeoJSON | PostGIS + TimescaleDB + FastAPI | Data contract already frozen |
| Rendered advisory | CAP → NDMA SACHET + SMS / WhatsApp / IVR | CAP emitter valid; dispatch deliberately unwired |
| — | Indoor + night-time RC model by roof typology | Census roof-material tables |
| — | HAP rules engine, cooling-centre optimiser, what-if planner | — |

**Highest-value production item:** the indoor/night-time model. The Ahmedabad
finding — six consecutive nights above 26.7 °C with no physiological recovery —
is the strongest evidence in the whole project, and it is currently inferred from
*outdoor* air temperature. Modelling indoor temperature by roof typology (tin,
asbestos, RCC, tiled), which Census 2011 provides at ward level, would make it
far stronger and is something essentially no competing team will attempt.

**Longest lead time:** health-outcome data. Institutional requests should go out
immediately regardless of build order — a rejection letter is still evidence of
having pursued the real path rather than inventing numbers.

---

## 6. Key Findings from the Build

Recorded because they changed the design, and because several are presentable
results in their own right.

1. **May 2010 Ahmedabad was dry heat (13–16 % RH).** Humidity was not the killer.
   The correct thesis is that temperature alone misleads *in both directions*.
2. **The nights were the killer.** Six consecutive nights with no drop below
   26.7 °C; midnight UTCI of 33.1 °C. Daytime-maximum warnings are blind to this.
3. **WBGT damps intra-city variation (×0.46); UTCI amplifies it (×1.29).** A hotter
   cell is a drier cell. Index choice is event-dependent.
4. **An outdoor construction worker had zero full-capacity working hours** on
   21 May 2010, with **eight** consecutive hours (10:00-17:00 IST) at zero safe
   minutes for every persona. Earlier notes said nine; the computed value is
   eight, because at 18:00 a delivery rider regains 15 min/hour. Directly actionable, from published occupational standards.
5. **Application Control blocks `scipy.optimize`**, which removed PHS — but
   `thermofeel` supplies the full Liljegren WBGT model, a net upgrade that retired
   the psychrometric-wet-bulb approximation entirely.
6. **Fixed-cap normalisation flattened the city** (median intensity 0.975) until
   replaced with percentile scaling — which also makes the pipeline portable.
7. **Overpass rejects the default `python-requests` user agent with HTTP 406**,
   and request count rather than payload dominates its cost.
