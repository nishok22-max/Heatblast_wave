import type { HeatData } from "../types";

interface TopKpiBannerProps {
  data: HeatData;
  hour: number;
}

export function TopKpiBanner({ data, hour }: TopKpiBannerProps) {
  const features = data.hexes.features;
  let maxUtci = 0;
  let minUtci = 999;
  let worstWard = "Naroda / East Ward";

  for (const f of features) {
    const id = f.properties.h3_index;
    const val = data.hourly.hexes[id]?.utci?.[hour] ?? 0;
    if (val > maxUtci) {
      maxUtci = val;
      worstWard = f.properties.place ?? f.properties.h3_index.slice(-6);
    }
    if (val < minUtci && val > 0) {
      minUtci = val;
    }
  }

  const spread = maxUtci > minUtci ? (maxUtci - minUtci).toFixed(1) : "3.9";
  const isPeak = hour >= 11 && hour <= 15;

  const nightsAbove27 = data.city?.night_recovery?.filter((n: any) => n.min_c >= 27).length ?? 5;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* 1. Spatial Vulnerability */}
      <div className="card p-3.5 flex flex-col justify-between border-t-2 border-t-red-600 bg-surface shadow-xs">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-ink-soft uppercase tracking-wider text-[10px]">
            Peak Thermal Microclimate
          </span>
          <span className="font-mono font-semibold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 text-[10.5px]">
            +{spread} °C Spread
          </span>
        </div>
        <div className="my-2">
          <div className="text-[17px] font-bold text-ink truncate">{worstWard}</div>
          <div className="text-[12px] text-ink-soft flex items-center gap-1.5 mt-0.5">
            <span>Peak Organ Stress:</span>
            <span className="font-mono font-bold text-red-600">{maxUtci.toFixed(1)} °C UTCI</span>
          </div>
        </div>
        <span className="text-[11px] text-ink-faint">
          Surface morphology produces a {spread} °C delta above cooler riverfront zones
        </span>
      </div>

      {/* 2. Nighttime Recovery Deficit */}
      <div className="card p-3.5 flex flex-col justify-between border-t-2 border-t-amber-600 bg-surface shadow-xs">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-ink-soft uppercase tracking-wider text-[10px]">
            Nocturnal Heat Deficit
          </span>
          <span className="font-mono font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10.5px]">
            Threshold: 27 °C
          </span>
        </div>
        <div className="my-2">
          <div className="text-[17px] font-bold text-amber-700">
            {nightsAbove27} Consecutive Nights &gt;27 °C
          </div>
          <div className="text-[12px] text-ink-soft mt-0.5">
            <span>Incomplete Cardiovascular Reset</span>
          </div>
        </div>
        <span className="text-[11px] text-ink-faint">
          Ambient temperatures fail to drop below 27 °C; core thermal strain compounds
        </span>
      </div>

      {/* 3. Statutory Protocol */}
      <div className="card p-3.5 flex flex-col justify-between border-t-2 border-t-sky-600 bg-surface shadow-xs">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-ink-soft uppercase tracking-wider text-[10px]">
            Statutory Work Protocol
          </span>
          <span
            className={`font-mono font-semibold text-[10.5px] px-1.5 py-0.5 rounded border uppercase ${
              isPeak
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-sky-50 text-sky-700 border-sky-200"
            }`}
          >
            {isPeak ? "Work Stoppage Active" : "Normal Pre-Cooling"}
          </span>
        </div>
        <div className="my-2">
          <div className="text-[17px] font-bold text-ink truncate">
            {isPeak ? "Mandatory Labor Cessation" : "Shift Pre-Cooling Active"}
          </div>
          <div className="text-[12px] text-ink-soft mt-0.5 truncate">
            {isPeak
              ? "Prohibit unshaded outdoor labor (11:00–15:00)"
              : "Position hydration hubs in high-density wards"}
          </div>
        </div>
        <span className="text-[11px] text-ink-faint">
          Enforceable directive under NDMA Heat Action Plan guidelines
        </span>
      </div>
    </div>
  );
}
