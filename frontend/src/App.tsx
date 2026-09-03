import { useState, useEffect } from "react";
import type { DatasetKey } from "./data";
import { BUNDLED, fetchDataset } from "./data";
import type { MetricKey, HeatData } from "./types";
import { METRICS, METRIC_ORDER } from "./metrics";
import type { ScaleMode } from "./metrics";
import type { ViewKey } from "./components/AppShell";
import { AppShell } from "./components/AppShell";
import { HexMap } from "./components/HexMap";
import { CellDetail } from "./components/CellDetail";
import { ZonePicker } from "./components/ZonePicker";
import { KpiRow } from "./components/KpiRow";
import { Drivers } from "./components/Drivers";
import { Scenarios } from "./components/Scenarios";
import { ActionList } from "./components/ActionList";
import { IndexComparison } from "./components/IndexComparison";
import { NightRecovery } from "./components/NightRecovery";
import { SafeWorkGrid } from "./components/SafeWorkGrid";
import { AdvisoryPanel } from "./components/AdvisoryPanel";
import { ProvenancePanel } from "./components/ProvenancePanel";
import { Explainer } from "./components/Explainer";
import { Panel } from "./components/ui";

/** Matches heatstress.live.LIVE_REFRESH_SECONDS on the backend. */
const REFRESH_MS = 5 * 60 * 1000;

export default function App() {
  const [dataset, setDataset] = useState<DatasetKey>("historical");
  /** Never null: the bundled bake is the floor, so there is no loading state
   *  and the page renders from file:// with no server at all. */
  const [data, setData] = useState<HeatData>(BUNDLED.historical);
  const [stale, setStale] = useState(false);

  const [view, setView] = useState<ViewKey>("dashboard");
  const [metric, setMetric] = useState<MetricKey>("utci");
  const [hour, setHour] = useState(14);
  const [selected, setSelected] = useState<string | null>(null);
  const [scaleMode, setScaleMode] = useState<ScaleMode>("contrast");

  useEffect(() => {
    let active = true;

    const load = () =>
      fetchDataset(dataset).then(
        d => {
          if (!active) return;
          setData(d);
          setStale(false);
          // A refresh can move the focus day, so the hour array can shrink.
          // Clamp rather than reset: yanking the slider out from under someone
          // every five minutes would be worse than a slightly stale position.
          setHour(h => Math.min(h, (d.hourly.meta.labels_ist?.length ?? 24) - 1));
        },
        () => {
          // Keep showing the last good data. A poll failing while uvicorn
          // restarts must not replace a working dashboard with an error page.
          if (active) setStale(true);
        },
      );

    setData(BUNDLED[dataset]);   // instant, then upgraded by the fetch below
    load();

    if (dataset !== "live") return () => { active = false; };

    // Only the forecast polls. Refetching on tab focus matters because timers
    // are suspended while the laptop sleeps — without it you reopen the lid to
    // yesterday's forecast on a page labelled live.
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

  /** Switching dataset must not leave a zone selected that only exists in the
   *  other one, or an hour past the end of a shorter day. */
  function switchDataset(key: DatasetKey) {
    setDataset(key);
    setSelected(null);
    // Clamp rather than reset to 14: the other dataset may have a shorter day,
    // and a hour past its end would index off the end of every series.
    const next = BUNDLED[key].hourly.meta.labels_ist?.length ?? 24;
    setHour(h => Math.min(h, next - 1));
  }

  const mapBlock = (height: string) => (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-line">
        <div className="flex gap-1 bg-sunken p-0.5 rounded-lg no-print">
          {METRIC_ORDER.map((key) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              aria-pressed={metric === key}
              className={`px-2.5 py-1 rounded-md text-[12px] whitespace-nowrap transition-colors ${
                metric === key
                  ? "bg-surface text-ink shadow-sm font-medium"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {METRICS[key].plain}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-sunken p-0.5 rounded-lg no-print">
          {(["contrast", "absolute"] as ScaleMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setScaleMode(m)}
              aria-pressed={scaleMode === m}
              className={`px-2.5 py-1 rounded-md text-[11px] capitalize transition-colors ${
                scaleMode === m
                  ? "bg-surface text-ink shadow-sm font-medium"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className={height}>
        <HexMap
          data={data}
          metric={metric}
          hour={hour}
          selected={selected}
          onSelect={setSelected}
          scaleMode={scaleMode}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-2.5 border-t border-line">
        <span className="text-[11px] text-ink-faint shrink-0">Time of day</span>
        <input
          type="range"
          min={0}
          max={labels.length - 1 || 23}
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          className="flex-1 accent-[#1d4ed8]"
          aria-label="Hour of day (IST)"
        />
        <span className="text-[14px] font-semibold tnum text-ink w-14 text-right">
          {label}
        </span>
      </div>
    </div>
  );

  const detailCard = (
    <div className="card overflow-hidden">
      <CellDetail
        data={data}
        h3={selected}
        hour={hour}
        onClose={() => setSelected(null)}
      />
    </div>
  );

  const finder = (
    <Panel title="Find your area" subtitle="Jump to a neighbourhood by name">
      <ZonePicker
        data={data}
        metric={metric}
        hour={hour}
        selected={selected}
        onSelect={setSelected}
      />
    </Panel>
  );

  return (
    <AppShell
      data={data}
      dataset={dataset}
      onDataset={switchDataset}
      view={view}
      onView={setView}
      hourLabel={label}
      stale={stale}
    >
      {view === "dashboard" && (
        <div className="space-y-4">
          <Explainer data={data} />
          <KpiRow data={data} />
          <div className="grid xl:grid-cols-3 gap-4 items-start">
            <div className="xl:col-span-2">{mapBlock("h-[380px] lg:h-[440px]")}</div>
            <div className="space-y-4">
              <Drivers insights={data.insights} />
              <ActionList insights={data.insights} />
            </div>
          </div>
          <Scenarios insights={data.insights} />
        </div>
      )}

      {view === "map" && (
        <div className="grid xl:grid-cols-4 gap-4 items-start">
          <div className="xl:col-span-3">{mapBlock("h-[520px] lg:h-[620px]")}</div>
          <div className="space-y-4">
            {finder}
            {detailCard}
          </div>
        </div>
      )}

      {view === "work" && (
        <div className="space-y-4">
          <SafeWorkGrid data={data} hour={hour} onHour={setHour} />
          <div className="grid lg:grid-cols-2 gap-4 items-start">
            {mapBlock("h-[340px]")}
            {detailCard}
          </div>
        </div>
      )}

      {view === "scenarios" && (
        <div className="space-y-4">
          <Scenarios insights={data.insights} />
          <ActionList insights={data.insights} />
        </div>
      )}

      {view === "findings" && (
        <div className="space-y-4">
          <IndexComparison data={data} />
          <NightRecovery data={data} />
          <Drivers insights={data.insights} />
        </div>
      )}

      {view === "advisory" && (
        <div className="grid lg:grid-cols-2 gap-4 items-start">
          <AdvisoryPanel data={data} />
          <ActionList insights={data.insights} />
        </div>
      )}

      {view === "data" && <ProvenancePanel data={data} />}
    </AppShell>
  );
}
