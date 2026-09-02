import type { HeatData } from "./types";

/**
 * The baked dataset, BUNDLED AT BUILD TIME rather than fetched.
 *
 * WHY NOT fetch():
 * Chromium treats a page loaded from file:// as an opaque origin and blocks
 * fetch()/XHR against sibling file:// URLs. A fetch-based build therefore works
 * over http in dev and silently fails the moment the demo is opened straight
 * from disk — which is exactly the scenario NFR-1 exists to guarantee, and
 * exactly the scenario you would discover on stage.
 *
 * Inlining the six files removes that entire class of failure: there is no
 * network, no origin, and no loading state. The cost is ~500 KB added to the
 * bundle and, more importantly, that RE-BAKING THE DATA REQUIRES A REBUILD:
 *
 *     python scripts/06_bake_web.py config/ahmedabad.yaml
 *     cd frontend && npm run build
 *
 * That is a deliberate trade: a guaranteed-offline demo is worth more than
 * hot-swappable data for a fixed historical hindcast.
 *
 * `?raw` is used uniformly so the .geojson extension needs no special Vite
 * config, and so every file travels the same code path.
 */
import metaRaw from "../../web/data/meta.json?raw";
import hexesRaw from "../../web/data/hexes.geojson?raw";
import hourlyRaw from "../../web/data/hourly.json?raw";
import cityRaw from "../../web/data/city.json?raw";
import personasRaw from "../../web/data/personas.json?raw";
import advisoryRaw from "../../web/data/advisory.json?raw";
import insightsRaw from "../../web/data/insights.json?raw";

export const HEAT_DATA: HeatData = {
  meta: JSON.parse(metaRaw),
  hexes: JSON.parse(hexesRaw),
  hourly: JSON.parse(hourlyRaw),
  city: JSON.parse(cityRaw),
  personas: JSON.parse(personasRaw),
  advisory: JSON.parse(advisoryRaw),
  insights: JSON.parse(insightsRaw),
};

/**
 * The live forecast dataset, bundled the same way.
 *
 * Both datasets ship inside the page. The historical hindcast is the narrative
 * hero; the live view answers the obvious objection ("so it only works on the
 * past?") and closes the forecast requirement. Because both are compiled in,
 * switching between them needs no network — the live view degrades to "forecast
 * as of <timestamp>" rather than breaking when there is no wifi.
 *
 * Refreshing the live data means re-running `scripts/07_live.py` and rebuilding.
 */
import liveMetaRaw from "../../web/data/live/meta.json?raw";
import liveHexesRaw from "../../web/data/live/hexes.geojson?raw";
import liveHourlyRaw from "../../web/data/live/hourly.json?raw";
import liveCityRaw from "../../web/data/live/city.json?raw";
import livePersonasRaw from "../../web/data/live/personas.json?raw";
import liveAdvisoryRaw from "../../web/data/live/advisory.json?raw";
import liveInsightsRaw from "../../web/data/live/insights.json?raw";

export const LIVE_DATA: HeatData = {
  meta: JSON.parse(liveMetaRaw),
  hexes: JSON.parse(liveHexesRaw),
  hourly: JSON.parse(liveHourlyRaw),
  city: JSON.parse(liveCityRaw),
  personas: JSON.parse(livePersonasRaw),
  advisory: JSON.parse(liveAdvisoryRaw),
  insights: JSON.parse(liveInsightsRaw),
};

export type DatasetKey = "historical" | "live";

export const DATASETS: Record<DatasetKey, { data: HeatData; label: string; sub: string }> = {
  historical: {
    data: HEAT_DATA,
    label: "May 2010 heatwave",
    sub: "the event that killed ~1,344 people",
  },
  live: {
    data: LIVE_DATA,
    label: "Forecast",
    sub: "now and the next few days",
  },
};
