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

      {/* 2. MAIN OPERATIONAL WORKSPACE (Map on left 60%, Directives & Gauges on right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Interactive Geospatial Grid + Integrated Time Scrubber */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          <div className="card overflow-hidden">
            {/* Map Controls Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b border-line bg-surface">
              <div className="flex items-center gap-1 bg-sunken p-1 rounded-lg">
                {METRIC_ORDER.map((key) => (
                  <button
                    key={key}
                    onClick={() => setMetric(key)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                      metric === key
                        ? "bg-accent text-white shadow-sm font-bold"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {METRICS[key].plain}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-ink-faint">Scale:</span>
                <div className="flex bg-sunken p-0.5 rounded-lg">
                  {(["contrast", "absolute"] as ScaleMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setScaleMode(m)}
                      className={`px-2 py-0.5 rounded text-[10px] capitalize font-medium ${
                        scaleMode === m
                          ? "bg-surface text-ink font-semibold"
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
            <div className="px-3.5 py-2 bg-sunken/60 border-b border-line flex items-center gap-2">
              <span className="text-[12px] text-ink-faint">🔍 Search Ward:</span>
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
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink uppercase tracking-wider text-[10px]">
                    24h Solar Scrubber
                  </span>
                  {isSolarPeak && (
                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-mono text-[9px] font-bold uppercase animate-pulse">
                      Peak Radiation Danger Window (11:00–15:00)
                    </span>
                  )}
                </div>
                <span className="font-mono text-[14px] font-bold text-accent">
                  {label} IST
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={labels.length - 1 || 23}
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-sunken rounded-lg"
                aria-label="Hour of day (IST)"
              />

              <div className="flex justify-between text-[10px] text-ink-faint font-mono">
                <span>00:00 (Midnight)</span>
                <span>06:00 (Dawn)</span>
                <span className="text-amber-400 font-bold">12:00 (Solar Noon)</span>
                <span className="text-orange-400 font-bold">15:00 (Peak Heat)</span>
                <span>18:00 (Dusk)</span>
                <span>23:00 (Night)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Role Directive, Multi-Index Gauge, and Selected Ward */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Action Matrix for the active Role */}
          <RoleDirectiveCard role={role} data={data} hour={hour} />

          {/* Multi-Index "True Feel" Breakdown */}
          <MultiIndexGauge data={data} hour={hour} selectedH3={selected} />

          {/* Selected Ward Microclimate */}
          <WardMicroclimateCard
            data={data}
            selectedH3={selected}
            hour={hour}
            onClear={() => setSelected(null)}
          />

          {/* Quick Deep-Dive Triggers */}
          <div className="flex gap-2">
            <button
              onClick={onOpenCap}
              className="flex-1 py-2 px-3 rounded-lg bg-surface border border-line hover:border-line-strong text-ink text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>📡</span>
              <span>Export CAP 1.2 XML</span>
            </button>
            <button
              onClick={onOpenMethodology}
              className="flex-1 py-2 px-3 rounded-lg bg-surface border border-line hover:border-line-strong text-ink text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>🔬</span>
              <span>Methodology & Provenance</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. LOWER OPERATIONAL BAND: Scannable 24h Persona Matrix + Nocturnal Recovery Deficit */}
      <div className="space-y-4">
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div>
              <h3 className="font-bold text-[14px] text-ink">
                ISO 7243 & ACGIH Persona Safe-Work Matrix
              </h3>
              <p className="text-[11px] text-ink-soft">
                Legally permitted outdoor working minutes per hour across 4 vulnerable demographic profiles
              </p>
            </div>
            <span className="text-[10px] font-mono text-ink-faint">
              STATUTORY WORK LIMITS
            </span>
          </div>
          <SafeWorkGrid data={data} hour={hour} onHour={setHour} />
        </div>

        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div>
              <h3 className="font-bold text-[14px] text-ink">
                Nocturnal Recovery Deficit Tracker
              </h3>
              <p className="text-[11px] text-ink-soft">
                The hidden heatwave killer: tracking consecutive nights failing to drop below the 27 °C cardiovascular reset barrier
              </p>
            </div>
            <span className="text-[10px] font-mono text-amber-400">
              BIOLOGICAL RESET THRESHOLD: 27 °C
            </span>
          </div>
          <NightRecovery data={data} />
        </div>
      </div>
    </div>
  );
}
