import { useMemo } from "react";
import type { HeatData, MetricKey } from "../types";
import { METRICS, formatValue } from "../metrics";

export function ZonePicker({
  data,
  metric,
  hour,
  selected,
  onSelect,
}: {
  data: HeatData;
  metric: MetricKey;
  hour: number;
  selected: string | null;
  onSelect: (h3: string) => void;
}) {
  const def = METRICS[metric];

  const options = useMemo(() => {
    const byName = new Map<string, { h3: string; value: number }>();
    for (const f of data.hexes.features) {
      const name = f.properties.place;
      if (!name) continue;
      const value = data.hourly.hexes[f.properties.h3_index]?.[metric][hour];
      if (!Number.isFinite(value)) continue;
      const current = byName.get(name);
      if (!current || value > current.value) {
        byName.set(name, { h3: f.properties.h3_index, value });
      }
    }
    return [...byName.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data, metric, hour]);

  if (!options.length) return null;

  const selectedName =
    data.hexes.features.find((f) => f.properties.h3_index === selected)
      ?.properties.place ?? "";

  return (
    <div className="mt-1 space-y-2">
      <label
        htmlFor="zone-picker"
        className="block text-[10px] uppercase tracking-wider font-black text-ink-faint"
      >
        Select a Neighbourhood Zone ({options.length} locations)
      </label>
      <div className="relative">
        <select
          id="zone-picker"
          value={selectedName}
          onChange={(e) => {
            const hit = options.find((o) => o.name === e.target.value);
            if (hit) onSelect(hit.h3);
          }}
          className="w-full bg-surface border border-line-strong/60 rounded-xl px-3.5 py-2.5 text-[13px] text-ink font-bold hover:border-accent focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all cursor-pointer shadow-2xs"
        >
          <option value="">Choose an area from the list…</option>
          {options.map((o) => (
            <option key={o.name} value={o.name}>
              {o.name} — {formatValue(o.value, def)} ({def.short})
            </option>
          ))}
        </select>
      </div>
      {selected && (
        <div className="pt-2 border-t border-line/60 flex items-center justify-between">
          <span className="text-[11px] text-ink-soft font-semibold">Selected: <strong className="text-ink font-black">{selectedName}</strong></span>
          <button
            onClick={() => onSelect(selected)}
            className="text-[12px] font-black text-accent hover:underline flex items-center gap-1"
          >
            <span>Focus Ward Risk</span>
            <span>→</span>
          </button>
        </div>
      )}
      <p className="text-[11px] leading-relaxed text-ink-faint font-medium">
        Landmark locations derived from OpenStreetMap. Selecting an area focuses its highest-reading H3 zone at this hour.
      </p>
    </div>
  );
}



