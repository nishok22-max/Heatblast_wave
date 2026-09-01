# Heat Stress Early Warning — backend

Human thermal stress and heat-health risk at neighbourhood scale, for Indian
cities. SIH problem statement: *Extreme Heatwave Early Warning and Human Thermal
Stress Index*.

**Repo location:** `C:\Users\HP\sih-heat`
(not `D:\S I H 2 6 0 8 3` — that path is read-only at the NTFS level: `BUILTIN\Users`
has `(RX)` only. To use it instead, run elevated:
`icacls "D:\S I H 2 6 0 8 3" /grant "$env:USERNAME:(OI)(CI)F" /T`)

---

## Quick start

Everything below assumes you are in the repo root:

```powershell
cd C:\Users\HP\sih-heat
```

### Run the tests

```powershell
.\.venv\Scripts\python.exe -m pytest
```

Expect **135 passed**. This is the credibility artefact — it validates the
physics against published reference values (NOAA Heat Index chart, ISO 7243
limits, Stull's own worked example) *and* cross-checks our from-scratch
implementations against `thermofeel`, ECMWF's operational library.

### Run the full pipeline

```powershell
.\.venv\Scripts\python.exe scripts\02_urban_form.py config\ahmedabad.yaml
.\.venv\Scripts\python.exe scripts\04_compute_indices.py config\ahmedabad.yaml
.\.venv\Scripts\python.exe scripts\05_kill_gate.py config\ahmedabad.yaml
.\.venv\Scripts\python.exe scripts\06_bake_web.py config\ahmedabad.yaml
```

**~7 seconds total** once the network responses are cached (they are — see
`data/raw/`). A cold run takes 30–60 min because Overpass is heavily rate-limited.

---

## What each step does

| step | script | does | writes |
|---|---|---|---|
| 2 | `02_urban_form.py` | H3 grid over the city; fetches roads / green / water from OpenStreetMap; derives per-cell temperature offsets | `data/processed/urban_form_<city>.json` |
| 4 | `04_compute_indices.py` | Applies the physics graph to every cell-hour: WBGT (Liljegren), UTCI, Heat Index, risk | `data/processed/indices_<city>.npz` |
| 5 | `05_kill_gate.py` | **The decision script.** Reports intra-city spread, the WBGT-damping finding, and a sensitivity sweep over the assumed UHI amplitude | stdout only |
| 6 | `06_bake_web.py` | Bakes static assets for the frontend | `web/data/*.json`, `web/data/hexes.geojson` |

Step 2 is safe to re-run: every Overpass response is cached per tile, so a run
interrupted or partially failed resumes and only retries the gaps.

---

## Outputs the frontend reads

`web/data/` — 500 KB total, no server, no network:

| file | size | contents |
|---|---|---|
| `hexes.geojson` | 214 KB | 392 cells with static properties |
| `hourly.json` | 267 KB | focus-day 24 h per cell |
| `city.json` | 11 KB | all 264 h city-mean + night-recovery series |
| `personas.json` | 3 KB | safe-work windows per persona |
| `advisory.json` | 3 KB | multilingual advisory + CAP 1.2 XML |
| `meta.json` | 2 KB | provenance, kill-gate numbers, declared caveats |

Full spatial detail for one day; full temporal detail for the city aggregate.
Shipping the cross product would be ~500k numbers.

---

## Targeting a different city

The pipeline is city-agnostic. Copy `config/ahmedabad.yaml`, change the bbox,
centre, and hindcast dates, then run steps 2/4/5/6 against the new file. Nothing
in the code is Ahmedabad-specific, and normalisation is percentile-based so
thresholds do not need retuning per city.

---

## Read this before quoting any number

`web/data/meta.json` carries a `status` on every layer. Three of them are **not**
measured:

- **UHI amplitude is ASSUMED** (3.0 °C, a literature value). The spatial
  *pattern* comes from real OpenStreetMap urban form, but the *magnitude* does
  not. Present the sensitivity sweep from step 5 alongside any spread figure.
- **Vulnerability is a declared PLACEHOLDER.** No ward-level demographics were
  obtainable, so it is a city-wide constant and does not vary between
  neighbourhoods — meaning risk variation is driven almost entirely by hazard.
- **Exposure–response is NOT CALIBRATED** to local health records. The
  coefficients are literature-shaped defaults; `risk.ExposureResponse.calibrate()`
  is the seam where real data enters.

Additionally: **the Hindi and Gujarati advisory strings are machine-composed and
unverified.** An early draft contained a Lao codepoint inside the Gujarati text.
`LANGUAGES_VERIFIED` gates them and a test asserts script integrity, but they
need a native speaker before any pitch or dispatch.

CAP output is stamped `status=Exercise`, never `Actual`.

---

## Environment notes

- Python 3.12 venv at `.venv`. The system `python` on PATH is a different
  interpreter without pip — always use `.\.venv\Scripts\python.exe`.
- **`pythermalcomfort` cannot be imported on this machine.** Windows Application
  Control blocks a `scipy.optimize` DLL it depends on. This removed ISO 7933 PHS;
  `physiology.py` uses ISO 7243 + ACGIH work/rest tables instead, which is a
  lookup rather than a solver and is what occupational hygienists actually use.
- `thermofeel` (ECMWF) works and supplies Liljegren WBGT and the UTCI polynomial.
"# Heatblast_wave" 
