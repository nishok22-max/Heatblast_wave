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
      <div className="card p-4 space-y-1.5 border-dashed bg-slate-50/50 border-slate-300/70">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[13px] text-ink">Ward Microclimate Drill-Down</h3>
          <span className="text-[10px] text-ink-faint font-mono uppercase">Map Inspection</span>
        </div>
        <p className="text-[12px] text-ink-soft leading-relaxed">
          Select any hexagonal micro-zone on the map or search by landmark to inspect street-level temperature deviations, surface properties, and localized work limits.
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
    <div className="card p-4 space-y-3 bg-surface border-sky-300 shadow-sm">
      <div className="flex items-center justify-between border-b border-line pb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-[14px] text-ink">{placeName}</h3>
            {props?.place_exact && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200 font-mono font-medium">
                Verified Node
              </span>
            )}
          </div>
          <span className="text-[10.5px] font-mono text-ink-faint">
            Index: {selectedH3}
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-[11px] text-ink-soft hover:text-ink px-2 py-0.5 rounded hover:bg-slate-100 border border-slate-200 transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
          <span className="text-[9px] text-ink-faint block uppercase font-medium">Air Temp</span>
          <span className="font-mono font-bold text-[12px] text-amber-700">
            {ta.toFixed(1)} °C
          </span>
        </div>
        <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
          <span className="text-[9px] text-ink-faint block uppercase font-medium">Local UTCI</span>
          <span className="font-mono font-bold text-[12px] text-red-600">
            {utci.toFixed(1)} °C
          </span>
        </div>
        <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
          <span className="text-[9px] text-ink-faint block uppercase font-medium">Local WBGT</span>
          <span className="font-mono font-bold text-[12px] text-rose-700">
            {wbgt.toFixed(1)} °C
          </span>
        </div>
        <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
          <span className="text-[9px] text-ink-faint block uppercase font-medium">UHI Delta</span>
          <span className="font-mono font-bold text-[12px] text-sky-700">
            {uhiDelta >= 0 ? `+${uhiDelta.toFixed(1)} °C` : `${uhiDelta.toFixed(1)} °C`}
          </span>
        </div>
      </div>

      <div className="space-y-1 text-[11.5px] pt-1.5 border-t border-line">
        <div className="flex justify-between text-ink-soft">
          <span>Road Surface Perviousness:</span>
          <span className="font-mono font-medium text-ink">{((props?.roads ?? 0) * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between text-ink-soft">
          <span>Vegetative Canopy Cover:</span>
          <span className="font-mono font-medium text-ink">{((props?.green ?? 0) * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between text-ink-soft">
          <span>Water Surface Proximity:</span>
          <span className="font-mono font-medium text-ink">{((props?.water ?? 0) * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}
