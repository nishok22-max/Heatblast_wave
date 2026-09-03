import type { HeatData } from "../types";

interface MultiIndexGaugeProps {
  data: HeatData;
  hour: number;
  selectedH3: string | null;
}

export function MultiIndexGauge({ data, hour, selectedH3 }: MultiIndexGaugeProps) {
  // If a cell is selected, show its data; otherwise show the city average/peak
  const cellData = selectedH3 ? data.hourly.hexes[selectedH3] : null;

  let taVal = 0;
  let wbgtVal = 0;
  let utciVal = 0;

  if (cellData) {
    taVal = cellData.air_temp?.[hour] ?? 0;
    wbgtVal = cellData.wbgt?.[hour] ?? 0;
    utciVal = cellData.utci?.[hour] ?? 0;
  } else {
    // City-wide values
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

  // Visual gauge bars (0 to 65 °C scale)
  const maxScale = 65;
  const pct = (val: number) => Math.min(Math.max((val / maxScale) * 100, 5), 100);

  const getUtciSeverity = (u: number) => {
    if (u >= 46) return { label: "Extreme Heat Stress", color: "text-red-400", bg: "bg-red-500", border: "border-red-500/30" };
    if (u >= 38) return { label: "Very Strong Stress", color: "text-orange-400", bg: "bg-orange-500", border: "border-orange-500/30" };
    if (u >= 32) return { label: "Strong Heat Stress", color: "text-amber-400", bg: "bg-amber-500", border: "border-amber-500/30" };
    return { label: "Moderate / Manageable", color: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500/30" };
  };

  const utciSev = getUtciSeverity(utciVal);
  const deltaFeel = utciVal - taVal;

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <div>
          <h3 className="font-semibold text-[13px] text-ink">Multi-Index "True Feel" Breakdown</h3>
          <p className="text-[11px] text-ink-soft">
            Why thermometers mislead: Radiation & humidity vs human physiology
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${utciSev.color} ${utciSev.border}`}>
          {utciSev.label}
        </span>
      </div>

      <div className="space-y-2.5">
        {/* Air Temp */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-ink-soft">Air Temperature (Thermometer / Coarse)</span>
            <span className="font-mono font-bold text-amber-400">{taVal.toFixed(1)} °C</span>
          </div>
          <div className="h-2 w-full bg-sunken rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${pct(taVal)}%` }}
            />
          </div>
          <span className="text-[10px] text-ink-faint">Standard dry-bulb reading broadcasted by conventional news</span>
        </div>

        {/* WBGT */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-ink-soft">Worker Wet-Bulb (WBGT · ISO 7243)</span>
            <span className="font-mono font-bold text-pink-400">{wbgtVal.toFixed(1)} °C</span>
          </div>
          <div className="h-2 w-full bg-sunken rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${pct(wbgtVal)}%` }}
            />
          </div>
          <span className="text-[10px] text-ink-faint">Damped in low humidity — can understate danger under direct sun</span>
        </div>

        {/* UTCI */}
        <div className="space-y-1 pt-1 border-t border-line/50">
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold text-ink">Organ Physiological Strain (UTCI)</span>
            <span className="font-mono font-bold text-red-400 text-[13px]">{utciVal.toFixed(1)} °C</span>
          </div>
          <div className="h-2.5 w-full bg-sunken rounded-full overflow-hidden">
            <div
              className={`h-full ${utciSev.bg} rounded-full transition-all duration-300`}
              style={{ width: `${pct(utciVal)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-accent font-medium">
              {deltaFeel >= 0 ? `+${deltaFeel.toFixed(1)} °C` : `${deltaFeel.toFixed(1)} °C`} radiant solar amplification
            </span>
            <span className="text-ink-faint">What human core organs actually feel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
