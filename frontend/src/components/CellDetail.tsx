import type { HeatData } from "../types";
import { METRICS, colourFor, formatValue, inkOn } from "../metrics";
import {
  coverPhrase,
  densityPhrase,
  minutesPhrase,
  strainPhrase,
  verdictFor,
} from "../plain";
import { Badge, Note, Row } from "./ui";
import { Info } from "./Info";

const SEVERITY_TONE = {
  low: "ok",
  moderate: "warn",
  high: "warn",
  severe: "flag",
  critical: "flag",
} as const;

export function CellDetail({
  data,
  h3,
  hour,
  onClose,
}: {
  data: HeatData;
  h3: string | null;
  hour: number;
  onClose: () => void;
}) {
  if (!h3) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-64 bg-surface/50">
        <span className="w-14 h-14 rounded-2xl bg-accent-soft text-accent grid place-items-center text-[26px] mb-3 border border-accent/20 shadow-2xs">
          🗺️
        </span>
        <h3 className="text-[15px] font-black text-ink mb-1 uppercase tracking-tight">
          Select a Neighbourhood Zone
        </h3>
        <p className="text-[12px] text-ink-faint leading-relaxed max-w-xs font-medium">
          Click any hexagon on the map to inspect ward thermal risk, Urban Heat Island drivers, population strain, peak hours, and recommended emergency actions.
        </p>
      </div>
    );
  }

  const feature = data.hexes.features.find((f) => f.properties.h3_index === h3);
  const series = data.hourly.hexes[h3];
  if (!feature || !series) return null;

  const p = feature.properties;
  const label = data.hourly.meta.labels_ist?.[hour] ?? `${hour}:00`;
  const utci = series.utci[hour];
  const wbgt = series.wbgt[hour];
  const riskVal = Math.round(p.risk_focus * 100);

  return (
    <div className="divide-y divide-line bg-surface rounded-2xl overflow-hidden shadow-sm">
      {/* Sticky Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-slate-900 text-white sticky top-0 z-10 border-b border-slate-800 shadow-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase font-black tracking-wider text-amber-400 bg-amber-900/60 border border-amber-500/40 px-2 py-0.5 rounded">
              {p.place ? (p.place_exact ? "Selected Ward" : "Zone Near") : "H3 Zone"}
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              #{h3.slice(-6)}
            </span>
          </div>
          <div className="text-[17px] font-black text-white leading-tight truncate mt-0.5">
            {p.place ?? "Unnamed area"}
          </div>
        </div>
        <button
          onClick={onClose}
          className="no-print text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2.5 py-1 transition-colors"
        >
          Clear Selection ✕
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* 01 — RISK */}
        <div>
          <StepHeader number="01" title="RISK SCORE & CONDITIONS" subtitle={`Thermal conditions at ${label}`} />
          
          <div className="bg-flag-bg border border-flag/30 p-3 rounded-xl flex items-center justify-between gap-3 mb-3 shadow-2xs">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-flag">
                Human Heat Risk Index
              </div>
              <div className="text-[24px] font-black tnum text-flag leading-none mt-0.5">
                {riskVal} <span className="text-[13px] font-bold text-flag/80">/ 100</span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase ${
              riskVal >= 80 ? "bg-flag text-white" : "bg-amber-500 text-white"
            }`}>
              {riskVal >= 80 ? "Extreme Risk" : "Very High Risk"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(["air_temp", "wbgt", "utci", "risk"] as const).map((key) => {
              const def = METRICS[key];
              const value = series[key][hour];
              const v = verdictFor(key, value);
              return (
                <div
                  key={key}
                  className="rounded-xl p-2.5 border border-line/60 shadow-2xs transition-transform hover:scale-[1.02]"
                  style={{
                    background: colourFor(value, def),
                    color: inkOn(value, def),
                  }}
                >
                  <div className="text-[9px] uppercase font-black tracking-wider opacity-85">
                    {def.plain}
                  </div>
                  <div className="text-[18px] font-black tnum leading-tight mt-0.5">
                    {formatValue(value, def)}
                  </div>
                  <div className="text-[10px] font-extrabold opacity-95 mt-0.5">
                    {v.label}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2.5 text-[12px] leading-relaxed text-ink-soft bg-sunken/50 p-2.5 rounded-xl border border-line/60 font-medium">
            {verdictFor("utci", utci).detail}
          </p>
        </div>

        {/* 02 — WHY */}
        <div>
          <StepHeader number="02" title="WHY IS IT HOT HERE?" subtitle="Urban Heat Island drivers & spatial factors" />
          <p className="text-[12px] leading-relaxed text-ink-soft mb-2.5 font-medium">
            This neighbourhood is <strong>{densityPhrase(p.intensity)}</strong>{" "}
            with {coverPhrase(p.green, "green")} and{" "}
            {coverPhrase(p.water, "water")}. That makes it{" "}
            <strong className="text-brand font-extrabold">
              {p.d_ta_c >= 0
                ? `+${p.d_ta_c.toFixed(1)} °C hotter`
                : `${p.d_ta_c.toFixed(1)} °C cooler`}
            </strong>{" "}
            than the city average due to the{" "}
            <Info term="Urban heat island" label="urban heat island" /> effect.
          </p>

          {/* Visual Bar Contribution Indicators */}
          <div className="space-y-2 mb-3 bg-sunken/40 p-3 rounded-xl border border-line/60">
            <ContributionBar label="Thermal Stress Intensity" pct={Math.min(100, Math.round((utci / 50) * 100))} color="var(--color-flag)" />
            <ContributionBar label="Built-up Surface Density" pct={Math.min(100, Math.round(p.intensity * 100))} color="var(--color-accent)" />
            <ContributionBar label="Road Asphalt Coverage" pct={Math.min(100, Math.round(p.roads * 100))} color="var(--color-gold)" />
            <ContributionBar label="Greenery Cooling Deficit" pct={Math.min(100, Math.round((1 - p.green) * 100))} color="var(--color-brand)" />
          </div>

          <div className="bg-surface rounded-xl border border-line p-2 space-y-0.5">
            <Row
              label="Temperature departure from city mean"
              value={`${p.d_ta_c >= 0 ? "+" : ""}${p.d_ta_c.toFixed(2)} °C`}
              hint="Departure from city mean due to urban form"
            />
            <Row label="Built-up density" value={densityPhrase(p.intensity)} />
            <Row label="Road coverage" value={`${Math.round(p.roads * 100)}%`} />
            <Row label="Parks & Greenery" value={`${Math.round(p.green * 100)}%`} />
            <Row label="Water bodies" value={`${Math.round(p.water * 100)}%`} />
          </div>
        </div>

        {/* 03 — WHO */}
        <div>
          <StepHeader number="03" title="WHO IS EXPOSED & VULNERABLE?" subtitle="Population strain by activity & persona" />
          <div className="space-y-2">
            {data.personas.order.map((key) => {
              const persona = data.personas.personas[key];
              const minutes = safeMinutes(persona.safe_minutes_by_hour[hour]);
              const ratio = wbgt / persona.limit_c;
              const severity = severityFor(ratio);
              return (
                <div
                  key={key}
                  className="bg-surface border border-line/90 rounded-xl p-3 transition-all hover:border-line-strong shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-extrabold text-ink leading-tight">
                      {persona.label}
                    </span>
                    <Badge tone={SEVERITY_TONE[severity]}>{severity}</Badge>
                  </div>
                  <p className="text-[12px] leading-snug text-ink-soft mt-1">
                    At this hour:{" "}
                    <strong className="text-ink">{strainPhrase(ratio)}</strong>{" "}
                    · <strong className="text-ink">{minutesPhrase(minutes)}</strong>.
                  </p>
                  {persona.vulnerability_offset_c > 0 && (
                    <Note>
                      Safe limit lowered by {persona.vulnerability_offset_c.toFixed(1)} °C due to vulnerability factors.
                    </Note>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 04 — WHEN */}
        <div>
          <StepHeader number="04" title="WHEN WILL RISK PEAK?" subtitle="Diurnal peak window for this ward" />
          <div className="bg-amber-500/10 border border-amber-300/80 p-3 rounded-xl flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-brand">
                Peak Ward Heat Hour
              </div>
              <div className="text-[16px] font-black text-ink mt-0.5 tnum">
                {data.hourly.meta.labels_ist?.[p.peak_hour] ?? `${p.peak_hour}:00`} IST
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-brand text-white text-[11px] font-extrabold uppercase">
              Target Cooling Window
            </span>
          </div>
        </div>

        {/* 05 — WHAT NEXT */}
        <div>
          <StepHeader number="05" title="WHAT SHOULD AUTHORITIES DO?" subtitle="Recommended ward intervention" />
          <div className="bg-teal-soft/80 border border-teal/30 p-3 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[16px]">🛡️</span>
              <span className="text-[13px] font-extrabold text-teal-dark uppercase">
                Priority Ward Action
              </span>
            </div>
            <p className="text-[12px] font-semibold text-ink leading-snug">
              Deploy mobile hydration stations & enforce mandatory outdoor work rest intervals between 12:00 and 16:30 IST.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepHeader({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2">
        <span className="px-1.5 py-0.5 rounded bg-accent text-white text-[10px] font-black">
          {number}
        </span>
        <h4 className="text-[12px] font-black uppercase tracking-wider text-ink">
          {title}
        </h4>
      </div>
      <p className="text-[11px] text-ink-faint font-medium pl-6">{subtitle}</p>
    </div>
  );
}

function ContributionBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] font-semibold mb-0.5">
        <span className="text-ink-soft">{label}</span>
        <span className="tnum font-bold text-ink">{pct}%</span>
      </div>
      <div className="h-2 bg-sunken rounded-full overflow-hidden border border-line/40">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function safeMinutes(value: number | undefined): number {
  return Number.isFinite(value) ? (value as number) : 0;
}

function severityFor(ratio: number): keyof typeof SEVERITY_TONE {
  if (ratio >= 1.15) return "critical";
  if (ratio >= 1.0) return "severe";
  if (ratio >= 0.9) return "high";
  if (ratio >= 0.75) return "moderate";
  return "low";
}

