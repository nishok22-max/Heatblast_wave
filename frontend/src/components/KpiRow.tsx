import type { HeatData } from "../types";
import { utciVerdict } from "../plain";
import { Info } from "./Info";

export function KpiRow({ data }: { data: HeatData }) {
  const hourIdx = data.hourly.meta.hours_ist.indexOf(data.meta.focus.hour_ist);
  const idx = hourIdx >= 0 ? hourIdx : 0;

  const cells = Object.values(data.hourly.hexes);
  const meanAt = (metric: "utci" | "wbgt") =>
    cells.reduce((a, c) => a + c[metric][idx], 0) / (cells.length || 1);

  const utci = meanAt("utci");
  const verdict = utciVerdict(utci);

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
      icon: "🌡️",
      tint: "var(--color-flag-bg)",
      label: "Felt Heat Index",
      termInfo: <Info term="UTCI" label="UTCI Physical Feel" />,
      value: `${utci.toFixed(1)} °C`,
      foot: verdict.label,
      footTone: "flag" as const,
      subText: "Overall outdoor thermal stress",
    },
    {
      icon: "🔥",
      tint: "var(--color-brand-soft)",
      label: "Hottest Ward",
      termInfo: null,
      value: hottest?.properties.place ?? "—",
      foot: `${(data.hourly.hexes[hottest?.properties.h3_index]?.utci[idx] ?? 0).toFixed(1)} °C felt`,
      footTone: "neutral" as const,
      subText: "Peak urban heat island core",
    },
    {
      icon: "⏱️",
      tint: "var(--color-teal-soft)",
      label: "Unsafe Work Window",
      termInfo: <Info term="WBGT" label="WBGT Work Limit" />,
      value: `${unsafeHours.toFixed(1)} h`,
      foot: "lost from 9h outdoor shift",
      footTone: "neutral" as const,
      subText: "ISO 7243 outdoor labor limit",
    },
    {
      icon: "🌙",
      tint: "var(--color-cyan-soft)",
      label: "Night Recovery",
      termInfo: null,
      value: badNights > 0 ? "Poor" : "Adequate",
      foot: Number.isFinite(worstNight)
        ? `warmest ${worstNight.toFixed(1)} °C · ${badNights}/${nights.length} nights warm`
        : "no data",
      footTone: badNights > 0 ? ("flag" as const) : ("ok" as const),
      subText: "Overnight cooling deficit",
    },
    {
      icon: "📊",
      tint: "var(--color-accent-soft)",
      label: "City Disparity Spread",
      termInfo: null,
      value: `${data.meta.kill_gate.utci_spread_c.toFixed(1)} °C`,
      foot: `air temp spread ${data.meta.kill_gate.air_temp_spread_c.toFixed(1)} °C`,
      footTone: "neutral" as const,
      subText: "Ward-to-ward heat gap",
    },
  ];

  const footClass = {
    flag: "text-flag font-extrabold bg-flag-bg/80 px-2 py-0.5 rounded border border-flag/20",
    ok: "text-ok font-extrabold bg-ok-bg/80 px-2 py-0.5 rounded border border-ok/20",
    neutral: "text-ink-soft font-semibold",
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
      {cards.map((c, i) => (
        <div
          key={i}
          className="card px-4 py-3.5 border border-line/90 hover:border-accent/40 transition-all hover:shadow-md bg-surface flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span
                className="w-9 h-9 rounded-xl grid place-items-center text-[16px] shrink-0 shadow-2xs border border-line/50"
                style={{ background: c.tint }}
                aria-hidden
              >
                {c.icon}
              </span>
              {c.termInfo && (
                <div className="text-[10px]">
                  {c.termInfo}
                </div>
              )}
            </div>
            
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-ink-faint leading-snug">
              {c.label}
            </div>
            <div className="text-[20px] lg:text-[22px] font-black text-ink tnum leading-tight mt-0.5 tracking-tight truncate">
              {c.value}
            </div>
            <div className="text-[10px] text-ink-faint font-medium mt-0.5">
              {c.subText}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-line/60">
            <div className={`text-[10px] leading-snug truncate inline-block ${footClass[c.footTone]}`}>
              {c.foot}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


