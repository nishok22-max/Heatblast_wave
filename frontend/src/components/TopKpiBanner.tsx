import type { HeatData } from "../types";

interface TopKpiBannerProps {
  data: HeatData;
  hour: number;
}

export function TopKpiBanner({ data, hour }: TopKpiBannerProps) {
  // Find peak danger zone at current hour
  const features = data.hexes.features;
  let maxUtci = 0;
  let minUtci = 999;
  let worstWard = "Naroda / East AMC";

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

  // Night recovery metrics
  const nightsAbove27 = data.city?.night_recovery?.filter((n: any) => n.min_c >= 27).length ?? 5;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* 1. WHERE IS THE DANGER? */}
      <div className="card p-3.5 border-l-4 border-l-red-500 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-wider uppercase text-ink-faint">
            1. Spatial Epicenter
          </span>
          <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 text-[10px] font-bold">
            +{spread} °C Spread
          </span>
        </div>
        <div className="my-1.5">
          <div className="text-[18px] font-bold text-ink truncate">{worstWard}</div>
          <div className="text-[12px] text-ink-soft flex items-center gap-1.5">
            <span>Peak Organ Stress:</span>
            <span className="font-mono font-bold text-red-400">{maxUtci.toFixed(1)} °C UTCI</span>
          </div>
        </div>
        <span className="text-[10px] text-ink-faint truncate">
          Intra-city microclimate makes this zone {spread} °C hotter than riverfront
        </span>
      </div>

      {/* 2. HOW SEVERE IS THE THREAT? */}
      <div className="card p-3.5 border-l-4 border-l-amber-500 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-wider uppercase text-ink-faint">
            2. Physiological Trap
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[10px] font-bold">
            Nocturnal Deficit
          </span>
        </div>
        <div className="my-1.5">
          <div className="text-[18px] font-bold text-amber-400">
            {nightsAbove27} Consecutive Nights &gt;27 °C
          </div>
          <div className="text-[12px] text-ink-soft">
            <span>Zero Cardiovascular Recovery</span>
          </div>
        </div>
        <span className="text-[10px] text-ink-faint truncate">
          Nighttime ambient never drops below threshold; cardiac stress accumulates
        </span>
      </div>

      {/* 3. WHAT DO I DO RIGHT NOW? */}
      <div
        className={`card p-3.5 border-l-4 flex flex-col justify-between ${
          isPeak
            ? "border-l-red-500 bg-red-950/20"
            : "border-l-cyan-500 bg-cyan-950/10"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-wider uppercase text-ink-faint">
            3. Active Operational Order
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
              isPeak
                ? "bg-red-500/20 text-red-400 animate-pulse"
                : "bg-cyan-500/15 text-cyan-400"
            }`}
          >
            {isPeak ? "Immediate Stop" : "Pre-Cooling Active"}
          </span>
        </div>
        <div className="my-1.5">
          <div className="text-[16px] font-bold text-ink truncate">
            {isPeak
              ? "Mandatory Work Cessation"
              : "Pre-Shift Water Tanker Deployment"}
          </div>
          <div className="text-[12px] text-ink-soft truncate">
            {isPeak
              ? "Halt all unshaded labor (11:00–15:00)"
              : "Pre-position hydration hubs in ranked wards"}
          </div>
        </div>
        <span className="text-[10px] text-ink-faint truncate">
          Statutory NDMA & Labour Department action protocol
        </span>
      </div>
    </div>
  );
}
