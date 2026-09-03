import type { HeatData } from "./types";
import type { DatasetKey } from "./data";
import { DATASETS } from "./data";

/**
 * HEATSHIELD Frontend-to-Backend API Service Layer
 * Communicates with the Heatwave Early Warning & Thermal Stress API server.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface BackendStatus {
  connected: boolean;
  serverName?: string;
  version?: string;
  city?: string;
  lastChecked: string;
  error?: string;
}

/**
 * Health check ping to verify backend connectivity on http://localhost:8000
 */
export async function checkBackendHealth(): Promise<BackendStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${API_BASE_URL}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        connected: true,
        serverName: data.server,
        version: data.version,
        city: data.city,
        lastChecked: new Date().toLocaleTimeString(),
      };
    }
    return {
      connected: false,
      lastChecked: new Date().toLocaleTimeString(),
      error: `Server returned status ${res.status}`,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Backend server unreachable";
    return {
      connected: false,
      lastChecked: new Date().toLocaleTimeString(),
      error: errMsg,
    };
  }
}

/**
 * Fetch complete HeatData payload from backend REST API with demo fallback.
 */
export async function fetchHeatDataFromAPI(
  dataset: DatasetKey,
): Promise<{ data: HeatData; fromBackend: boolean; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${API_BASE_URL}/api/heat-data?dataset=${dataset}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: HeatData = await res.json();
      return { data, fromBackend: true };
    }
    return {
      data: DATASETS[dataset].data,
      fromBackend: false,
      error: `Backend HTTP ${res.status}`,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Network error";
    return {
      data: DATASETS[dataset].data,
      fromBackend: false,
      error: errMsg,
    };
  }
}

/**
 * Fetch specific ward detail metrics from backend REST API
 */
export async function fetchWardDetailFromAPI(
  h3Index: string,
  hour: number,
  dataset: DatasetKey,
): Promise<any | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `${API_BASE_URL}/api/ward-detail?h3=${encodeURIComponent(
        h3Index,
      )}&hour=${hour}&dataset=${dataset}`,
      { signal: controller.signal },
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch intervention scenarios from backend REST API
 */
export async function fetchScenariosFromAPI(dataset: DatasetKey): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/scenarios?dataset=${dataset}`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch public advisory copy & CAP 1.2 XML payload from backend REST API
 */
export async function fetchAdvisoryFromAPI(dataset: DatasetKey): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/advisory?dataset=${dataset}`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}
