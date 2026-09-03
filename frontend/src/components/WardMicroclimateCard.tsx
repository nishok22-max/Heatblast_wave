import type { HeatData } from "../types";

interface WardMicroclimateCardProps {
  data: HeatData;
  selectedH3: string | null;
  hour: number;
  onClear: () => void;
}

export function WardMicroclimateCard({
  data,
  selectedH3,
  hour,
  onClear,
}: WardMicroclimateCardProps) {
  if (!selectedH3) {
    return (
      <div className="card p-4 space-y-2 border-dashed">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[13px] text-ink">Ward Microclimate Drill-Down</h3>
          <span className="text-[10px] text-accent font-mono">MAP SELECTION</span>
        </div>
        <p className="text-[12px] text-ink-soft leading-relaxed">
          Click any hexagonal zone on the map or use landmark search to inspect street-level microclimate data, local urban heat island delta, and ward-specific safe working limits.
        </p>
      </div>
    );
  }

  const feature = data.hexes.features.find((f: any) => f.properties.h3_index === selectedH3);
  const cellData = data.hourly.hexes[selectedH3];
  const props = feature?.properties;

  const placeName = props?.place ?? `Zone ${selectedH3.slice(-6)}`;
  const uhiDelta = props?.d_ta_c ?? 0;
  const utci = cellData?.utci?.[hour] ?? 0;
  const wbgt = cellData?.wbgt?.[hour] ?? 0;
  const ta = cellData?.air_temp?.[hour] ?? 0;

  return (
    <div className="card p-4 space-y-3 border-accent/40 shadow-lg">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-[14px] text-ink">{placeName}</h3>
            {props?.place_exact && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                VERIFIED LANDMARK
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-ink-faint">
            H3: {selectedH3}
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-[11px] text-ink-soft hover:text-ink px-2 py-0.5 rounded hover:bg-surface border border-line"
        >
          ✕ Clear
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div className="p-1.5 rounded bg-sunken border border-line">
          <span className="text-[9px] text-ink-faint block">Air Temp</span>
          <span className="font-mono font-bold text-[12px] text-amber-400">
            {ta.toFixed(1)} °C
          </span>
        </div>
        <div className="p-1.5 rounded bg-sunken border border-line">
          <span className="text-[9px] text-ink-faint block">Local UTCI</span>
          <span className="font-mono font-bold text-[12px] text-red-400">
            {utci.toFixed(1)} °C
          </span>
        </div>
        <div className="p-1.5 rounded bg-sunken border border-line">
          <span className="text-[9px] text-ink-faint block">Local WBGT</span>
          <span className="font-mono font-bold text-[12px] text-pink-400">
            {wbgt.toFixed(1)} °C
          </span>
        </div>
        <div className="p-1.5 rounded bg-sunken border border-line">
          <span className="text-[9px] text-ink-faint block">UHI Delta</span>
          <span className="font-mono font-bold text-[12px] text-accent">
            {uhiDelta >= 0 ? `+${uhiDelta.toFixed(1)} °C` : `${uhiDelta.toFixed(1)} °C`}
          </span>
        </div>
      </div>

      {/* Surface morphology */}
      <div className="space-y-1 text-[11px] pt-1 border-t border-line/60">
        <div className="flex justify-between text-ink-soft">
          <span>Road Surface Perviousness:</span>
          <span className="font-mono text-ink">{((props?.roads ?? 0) * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between text-ink-soft">
          <span>Canopy & Green Cover:</span>
          <span className="font-mono text-ink">{((props?.green ?? 0) * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between text-ink-soft">
          <span>Water Proximity:</span>
          <span className="font-mono text-ink">{((props?.water ?? 0) * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}
