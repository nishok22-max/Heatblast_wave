import { useState } from "react";
import type { HeatData, MetricKey } from "../types";
import type { ScaleMode } from "../metrics";
import { HexMap } from "./HexMap";

interface UnifiedCommandCenterProps {
  data: HeatData;
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
  // Scenario Simulator state
  const [activeScenario, setActiveScenario] = useState<"current" | "shift" | "shade">("shift");

  // HeatTwinGPT state
  const [gptQuery, setGptQuery] = useState("");
  const [gptResponse, setGptResponse] = useState<string | null>(null);

  const labels = data.hourly.meta.labels_ist ?? [];
  const label = labels[hour] ?? `${String(hour).padStart(2, "0")}:00`;

  // Selected Hexagon details
  const selectedFeature = selected
    ? data.hexes.features.find((f: any) => f.properties.h3_index === selected)
    : null;
  const selectedHourly = selected ? data.hourly.hexes[selected] : null;

  const hexName = selectedFeature
    ? selectedFeature.properties.place ?? `H3-${selected?.slice(-3)}`
    : "H3-183";
  const hexUtci = selectedHourly ? selectedHourly.utci?.[hour] ?? 48.7 : 48.7;
  const hexPop = (selectedFeature?.properties as any)?.population ?? "1,248";

  // Safe Work Window hours: 00 to 22
  const workHours = [
    { h: "00", state: "SAFE" },
    { h: "02", state: "SAFE" },
    { h: "04", state: "SAFE" },
    { h: "06", state: "SAFE" },
    { h: "08", state: "SAFE" },
    { h: "10", state: "CAUTION" },
    { h: "12", state: "UNSAFE" },
    { h: "14", state: "UNSAFE" },
    { h: "16", state: "CAUTION" },
    { h: "18", state: "SAFE" },
    { h: "20", state: "SAFE" },
    { h: "22", state: "SAFE" },
  ];

  const handleGptAsk = (q: string) => {
    setGptQuery(q);
    if (q.includes("Which areas") || q.includes("risk tomorrow")) {
      setGptResponse("HeatTwin Engine: Tomorrow's high-risk clusters concentrate in Naroda, Vatva Industrial Corridor, and Danapith with peak UTCI reaching 46.2°C at 14:00. UHI delta is +3.4°C over urban average.");
    } else if (q.includes("safe work window")) {
      setGptResponse("HeatTwin Engine: For outdoor construction (ISO 7243 heavy metabolic load), complete work cessation is mandatory from 11:00 to 15:30. Permitted shifts are 06:00–10:00 and 16:30–20:00.");
    } else if (q.includes("cooling centres")) {
      setGptResponse("HeatTwin Engine: Opening 3 cooling centres at Kalupur, Danapith, and Geeta Mandir will shelter ~4,200 vulnerable daily wagers, reducing acute ER heatstroke surge by 28%.");
    } else if (q.includes("10 lakh")) {
      setGptResponse("HeatTwin Engine: Highest impact under ₹10 lakh is temporary shade awnings & cold water distribution across the 12 worst transit nodes, reducing local radiant load by 7.0°C UTCI for 14,000 transit commuters.");
    } else {
      setGptResponse(`HeatTwin Engine: Analyzing spatial data for "${q}"... The dominant driver is air temperature (56%) coupled with solar radiation. Shifting work hours reduces unsafe hours by 54%.`);
    }
  };

  return (
    <div className="space-y-4">
      {/* =========================================================================
          1. TOP KPI STRIP (HOW BAD IS THE HEAT? - EXACTLY 4 METRICS)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1 */}
        <div className="card p-3.5 bg-surface border-line shadow-xs">
          <span className="text-[10.5px] font-semibold tracking-wider text-ink-faint uppercase block">
            Current Thermal Stress
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[21px] font-bold font-mono text-red-600 tracking-tight">
              45.6°C UTCI
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <span className="text-[12px] font-medium text-red-700">
              Extreme Stress
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="card p-3.5 bg-surface border-line shadow-xs">
          <span className="text-[10.5px] font-semibold tracking-wider text-ink-faint uppercase block">
            People at Risk
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[21px] font-bold font-mono text-orange-600 tracking-tight">
              18,420
            </span>
          </div>
          <span className="text-[12px] text-ink-soft">
            23% of population
          </span>
        </div>

        {/* KPI 3 */}
        <div className="card p-3.5 bg-surface border-line shadow-xs">
          <span className="text-[10.5px] font-semibold tracking-wider text-ink-faint uppercase block">
            Unsafe Work Hours
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[21px] font-bold font-mono text-red-700 tracking-tight">
              31,200 hrs
            </span>
          </div>
          <span className="text-[12px] text-ink-soft">
            Today
          </span>
        </div>

        {/* KPI 4 */}
        <div className="card p-3.5 bg-surface border-line shadow-xs">
          <span className="text-[10.5px] font-semibold tracking-wider text-ink-faint uppercase block">
            Night Recovery
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[21px] font-bold text-amber-700 tracking-tight">
              Poor
            </span>
          </div>
          <span className="text-[12px] text-ink-soft">
            Minimum UTCI: <span className="font-mono font-medium text-amber-800">33.1°C</span>
          </span>
        </div>
      </div>

      {/* =========================================================================
          2. MAIN WORKSPACE (WHERE IS IT WORST? + WHY & WHO?)
          Map: 58% width | Analytics Cards: 42% width
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Large H3 Thermal Map Centerpiece */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
          <div className="card overflow-hidden bg-surface border-line shadow-xs flex-1 flex flex-col min-h-[460px]">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-line flex flex-wrap items-center justify-between gap-2 bg-surface">
              <div>
                <h2 className="text-[14px] font-bold text-ink">
                  Thermal Stress (UTCI)
                </h2>
                <p className="text-[11px] text-ink-faint">
                  14 May 2025 • {label} IST • 392 Hexagonal H3 Zones
                </p>
              </div>

              {/* Metric Toggle: UTCI / WBGT / HI */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-line">
                <button
                  onClick={() => setMetric("utci")}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                    metric === "utci"
                      ? "bg-surface text-[#0F2942] font-bold shadow-xs border border-line"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  UTCI
                </button>
                <button
                  onClick={() => setMetric("wbgt")}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                    metric === "wbgt"
                      ? "bg-surface text-[#0F2942] font-bold shadow-xs border border-line"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  WBGT
                </button>
                <button
                  onClick={() => setMetric("air_temp")}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                    metric === "air_temp"
                      ? "bg-surface text-[#0F2942] font-bold shadow-xs border border-line"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  HI / Temp
                </button>
              </div>

              <button
                onClick={() => setScaleMode(scaleMode === "contrast" ? "absolute" : "contrast")}
                className="px-2 py-0.5 rounded text-[10.5px] font-medium text-ink-faint hover:text-ink capitalize border border-line bg-slate-50"
                title="Toggle contrast/absolute scale"
              >
                Scale: {scaleMode}
              </button>
            </div>

            {/* Map Canvas with Compact Hex Inspector */}
            <div className="relative flex-1 min-h-[380px] bg-slate-50">
              <HexMap
                data={data}
                metric={metric}
                hour={hour}
                selected={selected}
                onSelect={setSelected}
                scaleMode={scaleMode}
              />

              {/* Selected Hexagon Popup Detail */}
              <div className="absolute top-3 left-3 z-20 bg-surface/95 backdrop-blur-xs border border-slate-300 rounded-lg p-3 shadow-md w-[205px] text-[11.5px] space-y-1">
                <div className="flex items-center justify-between border-b border-line pb-1">
                  <span className="font-bold text-[12px] text-ink truncate">
                    {hexName}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-red-50 text-red-700 font-mono font-bold text-[9px] border border-red-200">
                    EXTREME
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-ink-faint">UTCI:</span>
                    <span className="font-mono font-bold text-red-600">{hexUtci.toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Population:</span>
                    <span className="font-mono font-medium text-ink">{hexPop}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Unsafe Work:</span>
                    <span className="font-mono font-medium text-red-700">2,980 hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Main Driver:</span>
                    <span className="text-ink-soft text-[10.5px] font-medium">Heat + low wind</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelected(selected ? null : "8842cc69edfffff")}
                  className="w-full mt-1 py-0.5 text-center bg-slate-50 hover:bg-slate-100 border border-line rounded text-[10px] font-semibold text-accent transition-colors"
                >
                  {selected ? "Deselect Cell" : "View Details →"}
                </button>
              </div>

              {/* Small Scale Legend */}
              <div className="absolute bottom-2 right-2 z-20 bg-surface/90 backdrop-blur-xs border border-line rounded px-2 py-0.5 text-[9.5px] text-ink-faint flex items-center gap-1.5 shadow-xs">
                <span>Low</span>
                <div className="w-14 h-1.5 rounded-xs bg-gradient-to-r from-yellow-300 via-orange-500 to-red-600" />
                <span>&gt;46°C Extreme</span>
              </div>
            </div>

            {/* 24h Slider */}
            <div className="p-2.5 border-t border-line bg-surface flex items-center gap-3">
              <span className="text-[11px] font-semibold text-ink-soft whitespace-nowrap">
                Timeline: <span className="font-mono text-ink font-bold">{label}</span>
              </span>
              <input
                type="range"
                min={0}
                max={labels.length - 1 || 23}
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
                className="flex-1 accent-[#0F2942] cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                aria-label="Timeline scrubber"
              />
              <span className="text-[10px] text-ink-faint font-mono">00:00—23:00</span>
            </div>
          </div>
        </div>

        {/* Right Column: Analytics Card #1 & Analytics Card #2 */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Card #1: Why is this area dangerous? */}
          <div className="card p-4 bg-surface border-line shadow-xs space-y-3">
            <div>
              <h3 className="text-[13.5px] font-bold text-ink leading-tight">
                Why is this area dangerous?
              </h3>
              <p className="text-[11px] text-ink-faint">
                Biometeorological driver contributions
              </p>
            </div>

            <div className="space-y-2 pt-0.5">
              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-ink">Air Temperature</span>
                  <span className="font-mono font-bold text-ink">56%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-red-600 rounded-full" style={{ width: "56%" }} />
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-ink">Humidity</span>
                  <span className="font-mono font-bold text-ink">20%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: "20%" }} />
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-ink">Solar Radiation</span>
                  <span className="font-mono font-bold text-ink">12%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: "12%" }} />
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-ink">Wind + Urban Form</span>
                  <span className="font-mono font-bold text-ink">12%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-sky-600 rounded-full" style={{ width: "12%" }} />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-line text-[11.5px] text-ink-soft bg-slate-50 p-2 rounded-md">
              <span className="font-semibold text-ink">Driver Insight:</span> Temperature is the dominant driver in this zone.
            </div>
          </div>

          {/* Card #2: Safe Work Window */}
          <div className="card p-4 bg-surface border-line shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[13.5px] font-bold text-ink leading-tight">
                  Safe Work Window
                </h3>
                <p className="text-[11px] text-ink-faint">
                  Outdoor Construction Worker
                </p>
              </div>
              <span className="text-[9.5px] font-mono text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-bold">
                12PM–4PM HALT
              </span>
            </div>

            {/* 24-Hour Timeline Bar */}
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-1">
                {workHours.map((item, idx) => {
                  let bg = "bg-emerald-500";
                  if (item.state === "CAUTION") bg = "bg-amber-400";
                  if (item.state === "UNSAFE") bg = "bg-red-600";

                  return (
                    <div key={idx} className="flex flex-col items-center gap-0.5">
                      <div
                        className={`h-6 w-full rounded-xs ${bg}`}
                        title={`${item.h}:00 IST — ${item.state}`}
                      />
                      <span className="text-[9px] font-mono text-ink-faint">
                        {item.h}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-3 pt-1 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-emerald-500" />
                  <span className="text-ink-soft">SAFE</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-amber-400" />
                  <span className="text-ink-soft">CAUTION</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-red-600" />
                  <span className="text-ink font-semibold">UNSAFE</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-line text-[11px] text-ink-soft space-y-0.5">
              <span className="font-semibold text-ink block">
                Recommended full-capacity work:
              </span>
              <div className="flex items-center gap-2 font-mono font-bold text-emerald-700 text-[11.5px]">
                <span>06:00–10:00</span>
                <span className="text-ink-faint">&amp;</span>
                <span>16:00–20:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. PRIMARY DECISION FEATURE: WHAT-IF ACTION SIMULATOR
          ========================================================================= */}
      <div className="card p-5 bg-surface border-line shadow-xs space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-[15.5px] font-bold text-ink tracking-tight">
              What-If Action Simulator
            </h2>
            <span className="text-[10.5px] font-mono text-ink-faint uppercase font-medium">
              3 Scenarios Modeled
            </span>
          </div>
          <p className="text-[11.5px] text-ink-soft">
            See how different government interventions change human heat risk.
          </p>
        </div>

        {/* 3 Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Current Situation */}
          <button
            onClick={() => setActiveScenario("current")}
            className={`card p-3.5 text-left border transition-all cursor-pointer ${
              activeScenario === "current"
                ? "ring-2 ring-slate-400 bg-slate-50/70 border-slate-300 shadow-xs"
                : "bg-white border-line hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between border-b border-line pb-1.5 mb-2">
              <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-ink-faint">
                Current Situation
              </span>
              <span className="text-[9.5px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                Baseline
              </span>
            </div>
            <p className="text-[12.5px] font-bold text-ink leading-tight mb-2.5">
              No Intervention
            </p>

            <div className="space-y-1.5 text-[11.5px]">
              <div>
                <span className="text-ink-faint text-[10.5px] block">People at Risk:</span>
                <span className="font-mono font-bold text-[13.5px] text-ink">18,420</span>
              </div>
              <div>
                <span className="text-ink-faint text-[10.5px] block">Unsafe Work Hours:</span>
                <span className="font-mono font-bold text-[13.5px] text-red-700">31,200 hrs</span>
              </div>
              <div>
                <span className="text-ink-faint text-[10.5px] block">Average UTCI:</span>
                <span className="font-mono font-bold text-[13.5px] text-red-600">45.6°C</span>
              </div>
            </div>
          </button>

          {/* Scenario A: Shift Work Hours */}
          <button
            onClick={() => setActiveScenario("shift")}
            className={`card p-3.5 text-left border transition-all cursor-pointer relative ${
              activeScenario === "shift"
                ? "ring-2 ring-emerald-500 bg-emerald-50/40 border-emerald-300 shadow-sm"
                : "bg-white border-line hover:border-emerald-200"
            }`}
          >
            <div className="flex items-center justify-between border-b border-line pb-1.5 mb-2">
              <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-emerald-800">
                Scenario A
              </span>
              <span className="text-[9.5px] text-emerald-800 bg-emerald-100 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                Recommended
              </span>
            </div>
            <p className="text-[12.5px] font-bold text-ink leading-tight mb-0.5">
              Shift Work Hours
            </p>
            <p className="text-[10px] font-mono text-emerald-700 font-medium mb-2">
              06:00–10:00 &amp; 16:00–20:00
            </p>

            <div className="space-y-1.5 text-[11.5px]">
              <div>
                <span className="text-ink-faint text-[10.5px] block">People at Risk:</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-bold text-[13.5px] text-ink">11,760</span>
                  <span className="font-mono font-bold text-[10.5px] text-emerald-700">↓ 36%</span>
                </div>
              </div>
              <div>
                <span className="text-ink-faint text-[10.5px] block">Unsafe Work Hours:</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-bold text-[13.5px] text-emerald-700">14,300 hrs</span>
                  <span className="font-mono font-bold text-[10.5px] text-emerald-700">↓ 54%</span>
                </div>
              </div>
              <div>
                <span className="text-ink-faint text-[10.5px] block">Average UTCI:</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-bold text-[13.5px] text-ink">45.6°C</span>
                  <span className="text-[10px] text-ink-faint">(Schedule shift)</span>
                </div>
              </div>
            </div>
          </button>

          {/* Scenario B: Water Stations + Shade */}
          <button
            onClick={() => setActiveScenario("shade")}
            className={`card p-3.5 text-left border transition-all cursor-pointer ${
              activeScenario === "shade"
                ? "ring-2 ring-sky-500 bg-sky-50/40 border-sky-300 shadow-sm"
                : "bg-white border-line hover:border-sky-200"
            }`}
          >
            <div className="flex items-center justify-between border-b border-line pb-1.5 mb-2">
              <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-sky-800">
                Scenario B
              </span>
              <span className="text-[9.5px] text-sky-800 bg-sky-100 font-medium px-1.5 py-0.2 rounded border border-sky-200">
                Infrastructure
              </span>
            </div>
            <p className="text-[12.5px] font-bold text-ink leading-tight mb-0.5">
              Water Stations + Shade
            </p>
            <p className="text-[10px] text-ink-faint mb-2">
              Canopy &amp; hydration
            </p>

            <div className="space-y-1.5 text-[11.5px]">
              <div>
                <span className="text-ink-faint text-[10.5px] block">People at Risk:</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-bold text-[13.5px] text-ink">13,850</span>
                  <span className="font-mono font-bold text-[10.5px] text-sky-700">↓ 25%</span>
                </div>
              </div>
              <div>
                <span className="text-ink-faint text-[10.5px] block">Unsafe Work Hours:</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-bold text-[13.5px] text-ink">18,900 hrs</span>
                  <span className="font-mono font-bold text-[10.5px] text-sky-700">↓ 39%</span>
                </div>
              </div>
              <div>
                <span className="text-ink-faint text-[10.5px] block">Average UTCI:</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-bold text-[13.5px] text-ink">44.2°C</span>
                  <span className="font-mono font-bold text-[10.5px] text-sky-700">↓ 1.4°C</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* RECOMMENDATION BANNER */}
        <div className="card p-3.5 bg-emerald-50/70 border-emerald-200 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                Recommended Action
              </span>
              <span className="text-[13.5px] font-bold text-ink">
                Shift Outdoor Work Hours
              </span>
            </div>
            <div className="text-[11.5px] text-emerald-950 font-medium flex items-center gap-2">
              <span className="font-bold">54% reduction in unsafe work hours</span>
              <span className="text-emerald-400">•</span>
              <span>No additional intervention cost</span>
            </div>
            <p className="text-[11px] text-ink-soft">
              <span className="font-semibold text-ink">Primary reason:</span> Highest reduction in human heat exposure.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMethodology}
              className="px-2.5 py-1.5 rounded-md border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 text-[11px] font-medium transition-colors"
            >
              Methodology &amp; Evidence
            </button>
            <button
              onClick={() => onOpenCap()}
              className="px-3 py-1.5 rounded-md bg-[#0F2942] hover:bg-[#153a5c] text-white text-[11.5px] font-medium transition-colors shadow-xs"
            >
              Compare All Scenarios →
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. RECOMMENDED GOVERNMENT ACTIONS + CONTEXTUAL HEATTWINGPT
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Recommended Government Actions (3 actions) */}
        <div className="lg:col-span-7 card p-4 bg-surface border-line shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h3 className="text-[13.5px] font-bold text-ink">
              Recommended Government Actions
            </h3>
            <span className="text-[10px] font-mono text-ink-faint uppercase font-medium">
              3 Primary Directives
            </span>
          </div>

          <div className="space-y-2">
            {/* Action 1 */}
            <div className="p-2.5 rounded-lg border border-line bg-slate-50/60 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-md bg-white border border-line text-[#0F2942] grid place-items-center shrink-0 mt-0.5 shadow-2xs font-bold text-[11px]">
                1
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[12.5px] font-bold text-ink">
                    Shift Outdoor Work Hours
                  </h4>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border bg-red-50 text-red-700 border-red-200">
                    HIGH IMPACT
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft mt-0.5">
                  Reduce outdoor work during 12PM–4PM peak radiation window.
                </p>
              </div>
            </div>

            {/* Action 2 */}
            <div className="p-2.5 rounded-lg border border-line bg-slate-50/60 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-md bg-white border border-line text-[#0F2942] grid place-items-center shrink-0 mt-0.5 shadow-2xs font-bold text-[11px]">
                2
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[12.5px] font-bold text-ink">
                    Deploy Water Stations
                  </h4>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border bg-orange-50 text-orange-700 border-orange-200">
                    HIGH IMPACT
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft mt-0.5">
                  Priority deployment to high-density zones: H3-183, H3-077, H3-091.
                </p>
              </div>
            </div>

            {/* Action 3 */}
            <div className="p-2.5 rounded-lg border border-line bg-slate-50/60 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-md bg-white border border-line text-[#0F2942] grid place-items-center shrink-0 mt-0.5 shadow-2xs font-bold text-[11px]">
                3
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[12.5px] font-bold text-ink">
                    Open Cooling Centres
                  </h4>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border bg-sky-50 text-sky-700 border-sky-200">
                    MEDIUM IMPACT
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft mt-0.5">
                  2 additional centres in high-risk areas (Kalupur &amp; Danapith).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contextual HeatTwinGPT */}
        <div className="lg:col-span-5 card p-4 bg-surface border-line shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[13.5px] text-ink">HeatTwinGPT</span>
              <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                BETA
              </span>
            </div>
            <span className="text-[10px] text-ink-faint">Model: Liljegren + UTCI Engine</span>
          </div>

          <p className="text-[11px] text-ink-soft">
            Ask about heat risk, human impact, or what-if scenarios.
          </p>

          {/* Suggested Question Chips */}
          <div className="space-y-1.5">
            {[
              "Which areas are most at risk tomorrow?",
              "What is the safe work window for construction workers?",
              "What happens if we open 3 cooling centres?",
              "What intervention gives the highest impact under ₹10 lakh?",
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleGptAsk(chip)}
                className="w-full text-left p-1.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-[10.5px] text-ink-soft hover:text-ink transition-colors truncate block"
              >
                • {chip}
              </button>
            ))}
          </div>

          {/* Live Response Box */}
          {gptResponse && (
            <div className="p-2.5 rounded-md bg-sky-50/70 border border-sky-200 text-[11px] text-sky-950 leading-relaxed">
              <span className="font-bold block text-[#0F2942] mb-0.5">Response:</span>
              {gptResponse}
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (gptQuery) handleGptAsk(gptQuery);
            }}
            className="flex gap-1.5 pt-1"
          >
            <input
              type="text"
              value={gptQuery}
              onChange={(e) => setGptQuery(e.target.value)}
              placeholder="Type your query to HeatTwin..."
              className="flex-1 px-2.5 py-1 text-[11.5px] rounded-md border border-line bg-slate-50 focus:bg-white outline-hidden"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-[#0F2942] hover:bg-[#153a5c] text-white text-[11px] font-medium rounded-md transition-colors"
            >
              Ask
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
