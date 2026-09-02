import { useState, useEffect } from "react";
import type { DatasetKey } from "./data";
import { fetchDataset, DATASET_META } from "./data";
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

export default function App() {
  const [dataset, setDataset] = useState<DatasetKey>("historical");
  const [data, setData] = useState<HeatData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setData(null);
    setError(null);
    fetchDataset(dataset)
      .then(d => {
        if (active) setData(d);
      })
      .catch(e => {
        if (active) setError(e.message);
      });
    return () => { active = false; };
  }, [dataset]);

  const [view, setView] = useState<ViewKey>("dashboard");
  const [metric, setMetric] = useState<MetricKey>("utci");
  const [hour, setHour] = useState(14);
  const [selected, setSelected] = useState<string | null>(null);
  const [scaleMode, setScaleMode] = useState<ScaleMode>("contrast");

  if (error) {
    return <div className="p-8 text-red-600">Failed to load data: {error}</div>;
  }
  
  if (!data) {
    return <div className="p-8 text-ink-soft flex items-center gap-2">
      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      Loading dataset...
    </div>;
  }

  const labels = data.hourly.meta.labels_ist ?? [];
  const label = labels[hour] ?? `${String(hour).padStart(2, "0")}:00`;

  /** Switching dataset must not leave a zone selected that only exists in the
   *  other one, or an hour past the end of a shorter day. */
  function switchDataset(key: DatasetKey) {
    setDataset(key);
    setSelected(null);
    setHour((h) => {
      // We can't access DATASETS[key].data here anymore synchronously.
      // Resetting to 14 is safe, or keeping the current hour.
      return 14;
    });
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
