import { useState, useEffect } from "react";
import type { DatasetKey } from "./data";
import { BUNDLED, fetchDataset } from "./data";
import type { MetricKey, HeatData } from "./types";
import type { ScaleMode } from "./metrics";
import type { NavItemKey } from "./components/AppShell";
import { AppShell } from "./components/AppShell";
import { UnifiedCommandCenter } from "./components/UnifiedCommandCenter";
import { CapExportModal } from "./components/CapExportModal";
import { MethodologyModal } from "./components/MethodologyModal";

/** Matches heatstress.live.LIVE_REFRESH_SECONDS on the backend (5 minutes). */
const REFRESH_MS = 5 * 60 * 1000;

export default function App() {
  const [dataset, setDataset] = useState<DatasetKey>("live");
  const [data, setData] = useState<HeatData>(BUNDLED.live);
  const [stale, setStale] = useState(false);

  // Active navigation sidebar state
  const [activeNav, setActiveNav] = useState<NavItemKey>("dashboard");

  // Core telemetry state
  const [metric, setMetric] = useState<MetricKey>("utci");
  const [hour, setHour] = useState(15); // 3:00 PM IST
  const [selected, setSelected] = useState<string | null>(null);
  const [scaleMode, setScaleMode] = useState<ScaleMode>("contrast");

  // Modals
  const [isCapOpen, setIsCapOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const load = () =>
      fetchDataset(dataset).then(
        (d) => {
          if (!active) return;
          setData(d);
          setStale(false);
          setHour((h) => Math.min(h, (d.hourly.meta.labels_ist?.length ?? 24) - 1));
        },
        () => {
          if (active) setStale(true);
        },
      );

    setData(BUNDLED[dataset]);
    load();

    if (dataset !== "live") return () => { active = false; };

    // Poll every 5 minutes in live forecast mode
    const tick = () => { if (document.visibilityState === "visible") load(); };
    const id = window.setInterval(tick, REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      active = false;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [dataset]);

  const labels = data.hourly.meta.labels_ist ?? [];
  const label = labels[hour] ?? `${String(hour).padStart(2, "0")}:00`;

  function switchDataset(key: DatasetKey) {
    setDataset(key);
    setSelected(null);
    const next = BUNDLED[key].hourly.meta.labels_ist?.length ?? 24;
    setHour((h) => Math.min(h, next - 1));
  }

  return (
    <AppShell
      data={data}
      dataset={dataset}
      onDataset={switchDataset}
      activeNav={activeNav}
      onSelectNav={setActiveNav}
      dateStr="14 May 2025"
      timeStr={`${label} IST`}
      hour={hour}
      onHourChange={setHour}
      stale={stale}
      onOpenAlerts={() => setIsCapOpen(true)}
      onOpenMethodology={() => setIsMethodologyOpen(true)}
    >
      <UnifiedCommandCenter
        data={data}
        metric={metric}
        setMetric={setMetric}
        scaleMode={scaleMode}
        setScaleMode={setScaleMode}
        hour={hour}
        setHour={setHour}
        selected={selected}
        setSelected={setSelected}
        onOpenCap={() => setIsCapOpen(true)}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
      />

      <CapExportModal
        isOpen={isCapOpen}
        onClose={() => setIsCapOpen(false)}
        data={data}
      />

      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
        data={data}
      />
    </AppShell>
  );
}
