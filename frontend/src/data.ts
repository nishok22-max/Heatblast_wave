import type { HeatData } from "./types";

export type DatasetKey = "historical" | "live";

export const DATASET_META: Record<DatasetKey, { label: string; sub: string }> = {
  historical: {
    label: "May 2010 heatwave",
    sub: "the event that killed ~1,344 people",
  },
  live: {
    label: "Forecast",
    sub: "now and the next few days",
  },
};

const API_BASE = "http://localhost:8000/api/v1";

export async function fetchDataset(key: DatasetKey): Promise<HeatData> {
  const base = `${API_BASE}/${key}`;
  
  // We fetch hourly separately but the UI currently expects the full hourly object.
  // To preserve UI behavior exactly without breaking components, we fetch the full hourly
  // JSON directly from the backend if it was exposed, but since our API exposes specific 
  // endpoints, we will construct the expected shape.
  // Wait, I need to fetch the full hourly data to satisfy `data.hourly.meta.labels_ist` etc.
  // Let's create an endpoint in main.py for `/api/v1/{key}/hourly` to return the whole thing.
  
  const [meta, hexes, hourly, city, personas, advisory, insights] = await Promise.all([
    fetch(`${base}/meta`).then(r => r.json()),
    fetch(`${base}/map`).then(r => r.json()),
    fetch(`${base}/hourly`).then(r => r.json()),
    fetch(`${base}/summary`).then(r => r.json()),
    fetch(`${base}/personas`).then(r => r.json()),
    fetch(`${base}/advisory`).then(r => r.json()),
    fetch(`${base}/insights`).then(r => r.json()),
  ]);

  return {
    meta,
    hexes,
    hourly,
    city,
    personas,
    advisory,
    insights,
  };
}
