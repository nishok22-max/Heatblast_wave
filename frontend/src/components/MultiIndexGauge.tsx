import type { HeatData } from "../types";

interface MultiIndexGaugeProps {
  data: HeatData;
  hour: number;
  selectedH3: string | null;
}

export function MultiIndexGauge({ data, hour, selectedH3 }: MultiIndexGaugeProps) {
  const cellData = selectedH3 ? data.hourly.hexes[selectedH3] : null;

  let taVal = 0;
  let wbgtVal = 0;
  let utciVal = 0;

  if (cellData) {
    taVal = cellData.air_temp?.[hour] ?? 0;
    wbgtVal = cellData.wbgt?.[hour] ?? 0;
    utciVal = cellData.utci?.[hour] ?? 0;
  } else {
    const features = data.hexes.features;
    let sumTa = 0;
    let sumWbgt = 0;
    let sumUtci = 0;
    let count = 0;

    for (const f of features) {
      const id = f.properties.h3_index;
      const h = data.hourly.hexes[id];
      if (h) {
        sumTa += h.air_temp?.[hour] ?? 0;
        sumWbgt += h.wbgt?.[hour] ?? 0;
        sumUtci += h.utci?.[hour] ?? 0;
        count++;
      }
    }

    if (count > 0) {
      taVal = sumTa / count;
      wbgtVal = sumWbgt / count;
      utciVal = sumUtci / count;
    }
  }

  const maxScale = 65;
  const pct = (val: number) => Math.min(Math.max((val / maxScale) * 100, 5), 100);

  const getUtciSeverity = (u: number) => {
    if (u >= 46) return { label: "Extreme Heat Stress", color: "text-red-700 bg-red-50 border-red-200", bar: "bg-red-600" };
    if (u >= 38) return { label: "Very Strong Stress", color: "text-orange-700 bg-orange-50 border-orange-200", bar: "bg-orange-600" };
    if (u >= 32) return { label: "Strong Heat Stress", color: "text-amber-700 bg-amber-50 border-amber-200", bar: "bg-amber-600" };
    return { label: "Moderate Thermal Load", color: "text-emerald-700 bg-emerald-50 border-emerald-200", bar: "bg-emerald-600" };
  };

  const utciSev = getUtciSeverity(utciVal);
  const deltaFeel = utciVal - taVal;

  return (
    <div className="card p-4 space-y-3 bg-surface shadow-xs">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <div>
          <h3 className="font-semibold text-[13.5px] text-ink">Thermal Index Breakdown</h3>
          <p className="text-[11px] text-ink-faint">
            Thermometer vs Worker Wet-Bulb vs Physiological Organ Strain
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10.5px] font-medium border ${utciSev.color}`}>
          {utciSev.label}
        </span>
      </div>

      <div className="space-y-3">
        {/* Air Temp */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11.5px]">
            <span className="text-ink-soft">Dry-Bulb Air Temperature (Ta)</span>
            <span className="font-mono font-bold text-amber-700">{taVal.toFixed(1)} °C</span>
          </div>
          <div className="h-2 w-full bg-slate-100 border border-slate-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${pct(taVal)}%` }}
            />
          </div>
          <span className="text-[10px] text-ink-faint">Standard ambient reading broadcast in regular weather reports</span>
        </div>

        {/* WBGT */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11.5px]">
            <span className="text-ink-soft">Worker Index (Liljegren WBGT · ISO 7243)</span>
            <span className="font-mono font-bold text-rose-700">{wbgtVal.toFixed(1)} °C</span>
          </div>
          <div className="h-2 w-full bg-slate-100 border border-slate-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-300"
              style={{ width: `${pct(wbgtVal)}%` }}
            />
          </div>
          <span className="text-[10px] text-ink-faint">Standard wet-bulb under-reads during dry heat (13-16% RH)</span>
        </div>

        {/* UTCI */}
        <div className="space-y-1 pt-1.5 border-t border-line/60">
          <div className="flex justify-between text-[11.5px]">
            <span className="font-semibold text-ink">Physiological Organ Strain (UTCI)</span>
            <span className="font-mono font-bold text-red-600 text-[13px]">{utciVal.toFixed(1)} °C</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 border border-slate-200/80 rounded-full overflow-hidden">
            <div
              className={`h-full ${utciSev.bar} rounded-full transition-all duration-300`}
              style={{ width: `${pct(utciVal)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-orange-700 font-semibold">
              {deltaFeel >= 0 ? `+${deltaFeel.toFixed(1)} °C` : `${deltaFeel.toFixed(1)} °C`} radiant solar amplification
            </span>
            <span className="text-ink-faint">Actual biological load on cardiovascular system</span>
          </div>
        </div>
      </div>
    </div>
  );
}
