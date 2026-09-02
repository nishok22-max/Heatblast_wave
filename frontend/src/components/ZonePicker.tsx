import { useMemo } from "react";
import type { HeatData, MetricKey } from "../types";
import { METRICS, formatValue } from "../metrics";

/**
 * Find-your-neighbourhood control.
 *
 * Without this, the only way to inspect a zone is to guess which hexagon it is
 * and click it — which assumes the viewer can already locate their area on an
 * unlabelled grid. Most people cannot, and the ones who most need this tool are
 * the least likely to be able to.
 *
 * A native <select> on purpose: keyboard accessible, screen-reader friendly, and
 * on a phone it opens the OS picker with type-to-search built in. A custom
 * combobox would look better and work worse.
 */
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

  /** name -> the worst-affected zone carrying that name, at this hour.
   *
   *  Several hexagons share a name, so picking one has to be deliberate rather
   *  than arbitrary. We surface the hottest, because someone looking up their
   *  own area wants the worst case there, not a random sample of it. */
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
    <div className="mt-4">
      <label
        htmlFor="zone-picker"
        className="block text-[10px] uppercase tracking-wider font-semibold text-ink-soft mb-2"
      >
        Find a neighbourhood
      </label>
      <select
        id="zone-picker"
        value={selectedName}
        onChange={(e) => {
          const hit = options.find((o) => o.name === e.target.value);
          if (hit) onSelect(hit.h3);
        }}
        className="w-full bg-surface border border-line rounded-[2px] px-2 py-1.5 text-[12px] text-ink hover:border-line-strong"
      >
        <option value="">Choose an area…</option>
        {options.map((o) => (
          <option key={o.name} value={o.name}>
            {o.name} — {formatValue(o.value, def)}
          </option>
        ))}
      </select>
      <p className="text-[11px] leading-relaxed text-ink-faint mt-1.5">
        {options.length} named areas, from OpenStreetMap. Names label the nearest
        recognised place — they are not official ward boundaries.
      </p>
    </div>
  );
}
