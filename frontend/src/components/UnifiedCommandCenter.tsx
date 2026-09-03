import type { HeatData, MetricKey } from "../types";
import type { ScaleMode } from "../metrics";
import { METRICS, METRIC_ORDER } from "../metrics";
import { HexMap } from "./HexMap";
import { TopKpiBanner } from "./TopKpiBanner";
import { RoleDirectiveCard, type RoleType } from "./RoleDirectiveCard";
import { MultiIndexGauge } from "./MultiIndexGauge";
import { WardMicroclimateCard } from "./WardMicroclimateCard";
import { SafeWorkGrid } from "./SafeWorkGrid";
import { NightRecovery } from "./NightRecovery";
import { ZonePicker } from "./ZonePicker";

interface UnifiedCommandCenterProps {
  data: HeatData;
  role: RoleType;
  metric: MetricKey;
  setMetric: (m: MetricKey) => void;
  scaleMode: ScaleMode;
  setScaleMode: (m: ScaleMode) => void;
  hour: number;
  setHour: (h: number) => void;
  selected: string | null;
  setSelected: (h3: string | null) => void;
  onOpenCap: () => void;
  onOpenMethodology: () => void;
}

export function UnifiedCommandCenter({
  data,
  role,
  metric,
  setMetric,
  scaleMode,
  setScaleMode,
  hour,
  setHour,
  selected,
  setSelected,
  onOpenCap,
  onOpenMethodology,
}: UnifiedCommandCenterProps) {
  const labels = data.hourly.meta.labels_ist ?? [];
  const label = labels[hour] ?? `${String(hour).padStart(2, "0")}:00`;
  const isSolarPeak = hour >= 11 && hour <= 15;

  return (
    <div className="space-y-4 pb-12">
      {/* 1. TOP TRIAGE KPI BANNER */}
      <TopKpiBanner data={data} hour={hour} />

      {/* 2. MAIN OPERATIONAL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Interactive Geospatial Grid + Integrated Time Scrubber */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          <div className="card overflow-hidden bg-surface shadow-xs">
            {/* Map Controls Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b border-line bg-surface">
              <div className="flex items-center gap-1 bg-sunken p-0.5 rounded-lg border border-line">
                {METRIC_ORDER.map((key) => (
                  <button
                    key={key}
                    onClick={() => setMetric(key)}
                    className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-all ${
                      metric === key
                        ? "bg-surface text-accent font-semibold shadow-xs border border-line"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {METRICS[key].plain}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-ink-faint">Scale:</span>
                <div className="flex bg-sunken p-0.5 rounded-lg border border-line">
                  {(["contrast", "absolute"] as ScaleMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setScaleMode(m)}
                      className={`px-2 py-0.5 rounded text-[10.5px] capitalize font-medium ${
                        scaleMode === m
                          ? "bg-surface text-ink font-semibold shadow-xs border border-line"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Neighborhood Quick Search Bar */}
            <div className="px-3.5 py-2 bg-slate-50 border-b border-line flex items-center gap-2">
              <span className="text-[11.5px] font-medium text-ink-soft">Search Ward:</span>
              <div className="flex-1">
                <ZonePicker
                  data={data}
                  metric={metric}
                  hour={hour}
                  selected={selected}
                  onSelect={(h3) => setSelected(h3)}
                />
              </div>
            </div>

            {/* SVG H3 Geospatial Map */}
            <div className="h-[430px] xl:h-[500px]">
              <HexMap
                data={data}
                metric={metric}
                hour={hour}
                selected={selected}
                onSelect={setSelected}
                scaleMode={scaleMode}
              />
            </div>

            {/* Integrated Continuous 24-Hour Time Scrubber */}
            <div className="p-3.5 border-t border-line bg-surface space-y-1.5">
              <div className="flex items-center justify-between text-[11.5px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink text-[11px]">
                    24-Hour Time Progression
                  </span>
                  {isSolarPeak && (
                    <span className="px-1.5 py-0.2 rounded bg-red-50 text-red-700 font-mono text-[10px] font-medium border border-red-200">
                      Peak Solar Flux Window (11:00–15:00)
                    </span>
                  )}
                </div>
                <span className="font-mono text-[13.5px] font-bold text-accent">
                  {label} IST
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={labels.length - 1 || 23}
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                aria-label="Hour of day (IST)"
              />

              <div className="flex justify-between text-[10px] text-ink-faint font-mono">
                <span>00:00 (Night)</span>
                <span>06:00 (Dawn)</span>
                <span className="font-medium text-amber-700">12:00 (Solar Noon)</span>
                <span className="font-medium text-red-700">15:00 (Peak Heat)</span>
                <span>18:00 (Sunset)</span>
                <span>23:00 (Night)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Role Directive, Multi-Index Gauge, and Selected Ward */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3.5">
          {/* Action Matrix for the active Role */}
          <RoleDirectiveCard role={role} data={data} hour={hour} />

          {/* Multi-Index Breakdown */}
          <MultiIndexGauge data={data} hour={hour} selectedH3={selected} />

          {/* Selected Ward Microclimate */}
          <WardMicroclimateCard
            data={data}
            selectedH3={selected}
            hour={hour}
            onClear={() => setSelected(null)}
          />

          {/* Secondary Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onOpenCap}
              className="flex-1 py-1.5 px-3 rounded-lg bg-surface border border-line hover:bg-surface-hover text-ink-soft hover:text-ink text-[11.5px] font-medium transition-colors text-center"
            >
              Export CAP 1.2 XML
            </button>
            <button
              onClick={onOpenMethodology}
              className="flex-1 py-1.5 px-3 rounded-lg bg-surface border border-line hover:bg-surface-hover text-ink-soft hover:text-ink text-[11.5px] font-medium transition-colors text-center"
            >
              Methodology & Sources
            </button>
          </div>
        </div>
      </div>

      {/* 3. LOWER OPERATIONAL BAND: Scannable 24h Persona Matrix + Nocturnal Recovery Deficit */}
      <div className="space-y-4">
        <div className="card p-4 space-y-3 bg-surface shadow-xs">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div>
              <h3 className="font-semibold text-[14px] text-ink">
                Occupational Work-Rest Regimes (ISO 7243 / ACGIH)
              </h3>
              <p className="text-[11.5px] text-ink-soft">
                Hourly safe working minute allocations across four heat-vulnerable demographics
              </p>
            </div>
            <span className="text-[10px] font-mono text-ink-faint uppercase font-medium">
              Statutory Benchmark
            </span>
          </div>
          <SafeWorkGrid data={data} hour={hour} onHour={setHour} />
        </div>

        <div className="card p-4 space-y-3 bg-surface shadow-xs">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div>
              <h3 className="font-semibold text-[14px] text-ink">
                Nocturnal Recovery Deficit Assessment
              </h3>
              <p className="text-[11.5px] text-ink-soft">
                Tracking overnight minimum temperatures against the 27 °C biological cardiovascular reset barrier
              </p>
            </div>
            <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Recovery Threshold: 27 °C
            </span>
          </div>
          <NightRecovery data={data} />
        </div>
      </div>
    </div>
  );
}
