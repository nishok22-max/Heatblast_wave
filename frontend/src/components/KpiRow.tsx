import type { HeatData } from "../types";
import { utciVerdict } from "../plain";
import { Info } from "./Info";

/**
 * Headline figures.
 *
 * NOTHING HERE IS A HEADCOUNT. A card reading "18,420 people at risk" would be
 * the most persuasive thing on the page and also the least defensible: we have
 * no population data, and the vulnerability layer is a declared placeholder.
 * Every figure below is computed from the physics or from published
 * occupational standards, and each says what it is measuring.
 */
export function KpiRow({ data }: { data: HeatData }) {
  const hourIdx = data.hourly.meta.hours_ist.indexOf(data.meta.focus.hour_ist);
  const idx = hourIdx >= 0 ? hourIdx : 0;

  const cells = Object.values(data.hourly.hexes);
  const meanAt = (metric: "utci" | "wbgt") =>
    cells.reduce((a, c) => a + c[metric][idx], 0) / (cells.length || 1);

  const utci = meanAt("utci");
  const verdict = utciVerdict(utci);

  // Unsafe person-hours: the shortfall between a 9-hour day and what the
  // standards actually permit, summed over the outdoor personas.
  const outdoor = ["construction", "delivery"];
  const unsafeHours = outdoor.reduce((total, key) => {
    const p = data.personas.personas[key];
    if (!p) return total;
    return (
      total +
      p.safe_minutes_by_hour
        .slice(9, 18)
        .reduce((a, m) => a + (60 - m) / 60, 0)
    );
  }, 0);

  const nights = data.city.night_recovery;
  const worstNight = nights.length
    ? Math.max(...nights.map((n) => n.min_c))
    : NaN;
  const badNights = nights.filter((n) => n.min_c >= 27).length;

  const hottest = data.hexes.features.reduce((best, f) => {
    const v = data.hourly.hexes[f.properties.h3_index]?.utci[idx] ?? -Infinity;
    const bv = data.hourly.hexes[best.properties.h3_index]?.utci[idx] ?? -Infinity;
    return v > bv ? f : best;
  }, data.hexes.features[0]);

  const cards = [
    {
      icon: "🌡",
      tint: "var(--color-flag-bg)",
      label: <><Info term="UTCI" label="What the heat feels like" /></>,
      value: `${utci.toFixed(1)} °C`,
      foot: verdict.label,
      footTone: "flag" as const,
    },
    {
      icon: "◈",
      tint: "var(--color-brand-soft)",
      label: "Hottest neighbourhood",
      value: hottest?.properties.place ?? "—",
      foot: `${(data.hourly.hexes[hottest?.properties.h3_index]?.utci[idx] ?? 0).toFixed(1)} °C felt`,
      footTone: "neutral" as const,
    },
    {
      icon: "◷",
      tint: "var(--color-accent-soft)",
      label: "Unsafe work hours",
      value: `${unsafeHours.toFixed(1)} h`,
      foot: "lost from a 9-hour day, per outdoor worker type",
      footTone: "neutral" as const,
    },
    {
      icon: "☾",
      tint: "var(--color-sunken)",
      label: "Night recovery",
      value: badNights > 0 ? "Poor" : "Adequate",
      foot: Number.isFinite(worstNight)
        ? `warmest night ${worstNight.toFixed(1)} °C · ${badNights}/${nights.length} without recovery`
        : "no data",
      footTone: badNights > 0 ? ("flag" as const) : ("ok" as const),
    },
    {
      icon: "◑",
      tint: "var(--color-flag-bg)",
      label: "Spread across the city",
      value: `${data.meta.kill_gate.utci_spread_c.toFixed(1)} °C`,
      foot: `air temperature varied only ${data.meta.kill_gate.air_temp_spread_c.toFixed(1)} °C`,
      footTone: "neutral" as const,
    },
  ];

  const footClass = {
    flag: "text-flag",
    ok: "text-ok",
    neutral: "text-ink-faint",
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((c, i) => (
        <div key={i} className="card px-3.5 py-3">
          <div className="flex items-start gap-2.5">
            <span
              className="w-8 h-8 rounded-lg grid place-items-center text-[15px] shrink-0"
              style={{ background: c.tint }}
              aria-hidden
            >
              {c.icon}
            </span>
            <div className="min-w-0">
              <div className="text-[11px] text-ink-soft leading-snug">
                {c.label}
              </div>
              <div className="text-[20px] font-semibold text-ink tnum leading-tight mt-0.5 truncate">
                {c.value}
              </div>
              <div className={`text-[10px] leading-snug mt-0.5 ${footClass[c.footTone]}`}>
                {c.foot}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
