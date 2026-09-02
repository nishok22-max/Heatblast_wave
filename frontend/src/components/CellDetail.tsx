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

/**
 * Per-cell readout. Answers NFR-2 (explainability): every number on screen
 * decomposes into the drivers that produced it, so an official can justify
 * acting on it.
 */
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
      <div className="flex items-center justify-center p-6 text-center min-h-32">
        <p className="text-[12px] text-ink-faint leading-relaxed">
          Click any hexagon on the map to see how hot it was there, why, and
          what it meant for the different people living in that neighbourhood.
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

  return (
    <div>
      <div className="flex items-start justify-between gap-2 px-3 py-2 border-b border-line sticky top-0 bg-surface z-10">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-ink-faint">
            {p.place ? (p.place_exact ? "Zone" : "Zone near") : "Zone"}
          </div>
          <div className="text-[14px] font-semibold text-ink leading-tight truncate">
            {p.place ?? "Unnamed area"}
          </div>
          <div className="font-mono text-[10px] text-ink-faint">
            {h3.slice(-8)}
          </div>
        </div>
        <button
          onClick={onClose}
          className="no-print text-[11px] text-ink-soft hover:text-ink border border-line rounded-[2px] px-1.5 py-0.5"
        >
          Clear
        </button>
      </div>

      <div className="p-3 space-y-4">
        {/* Indices at the selected hour */}
        <div>
          <SectionLabel>Conditions at {label}</SectionLabel>
          <div className="grid grid-cols-2 gap-1.5 mt-1.5">
            {(["air_temp", "wbgt", "utci", "risk"] as const).map((key) => {
              const def = METRICS[key];
              const value = series[key][hour];
              const v = verdictFor(key, value);
              return (
                <div
                  key={key}
                  className="rounded-[3px] px-2 py-1.5 border border-line"
                  style={{
                    background: colourFor(value, def),
                    color: inkOn(value, def),
                  }}
                >
                  <div className="text-[9px] uppercase tracking-wider opacity-80">
                    {def.plain}
                  </div>
                  <div className="text-[15px] font-semibold tnum leading-tight">
                    {formatValue(value, def)}
                  </div>
                  {/* The word matters more than the number to most readers. */}
                  <div className="text-[10px] font-semibold opacity-90">
                    {v.label}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
            {verdictFor("utci", utci).detail}
          </p>
        </div>

        {/* Why this cell scores as it does */}
        <div>
          <SectionLabel>Why is it this hot here?</SectionLabel>
          <p className="text-[12px] leading-relaxed text-ink-soft mt-1 mb-2">
            This neighbourhood is <strong>{densityPhrase(p.intensity)}</strong>{" "}
            with {coverPhrase(p.green, "green")} and{" "}
            {coverPhrase(p.water, "water")}. That makes it{" "}
            <strong>
              {p.d_ta_c >= 0
                ? `${p.d_ta_c.toFixed(1)} degrees hotter`
                : `${Math.abs(p.d_ta_c).toFixed(1)} degrees cooler`}
            </strong>{" "}
            than the city average — the{" "}
            <Info term="Urban heat island" label="urban heat island" /> effect.
          </p>
          <div className="mt-1">
            <Row
              label="Hotter or cooler than average"
              value={`${p.d_ta_c >= 0 ? "+" : ""}${p.d_ta_c.toFixed(2)} °C`}
              hint="Departure from the city mean, from this cell's urban form"
            />
            <Row label="How built-up" value={densityPhrase(p.intensity)} />
            <Row label="Road coverage" value={`${Math.round(p.roads * 100)}%`} />
            <Row label="Parks and greenery" value={`${Math.round(p.green * 100)}%`} />
            <Row label="Water" value={`${Math.round(p.water * 100)}%`} />
            <Row
              label="Hottest time here"
              value={data.hourly.meta.labels_ist?.[p.peak_hour] ?? `${p.peak_hour}:00`}
            />
          </div>
          <Note>
            We measured <em>which</em> areas are hotter from real map data. How
            much hotter comes from a published average
            ({data.hourly.meta.uhi_amplitude_c} °C across the city), not from
            measurements taken here.
          </Note>
        </div>

        {/* What it means for a body */}
        <div>
          <SectionLabel>What this meant for people here</SectionLabel>
          <div className="mt-1.5 space-y-1.5">
            {data.personas.order.map((key) => {
              const persona = data.personas.personas[key];
              const minutes = safeMinutes(persona.safe_minutes_by_hour[hour]);
              const ratio = wbgt / persona.limit_c;
              const severity = severityFor(ratio);
              return (
                <div
                  key={key}
                  className="border border-line rounded-[3px] px-2 py-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[12px] text-ink leading-tight">
                      {persona.label}
                    </span>
                    <Badge tone={SEVERITY_TONE[severity]}>{severity}</Badge>
                  </div>
                  <p className="text-[11px] leading-snug text-ink-soft mt-1">
                    At this hour they were{" "}
                    <strong className="text-ink">{strainPhrase(ratio)}</strong>{" "}
                    and{" "}
                    <strong className="text-ink">{minutesPhrase(minutes)}</strong>.
                  </p>
                  {persona.vulnerability_offset_c > 0 && (
                    <Note>
                      We lowered their safe limit by{" "}
                      {persona.vulnerability_offset_c.toFixed(1)} °C because they
                      cope with heat less well. That adjustment is our judgement,
                      not a published standard.
                    </Note>
                  )}
                </div>
              );
            })}
          </div>
          <Note>
            Based on <Info term="ISO 7243" /> safe-heat limits and{" "}
            <Info term="ACGIH" /> work–rest tables — the same standards
            occupational-health inspectors use.
          </Note>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider font-semibold text-ink-soft">
      {children}
    </div>
  );
}

function safeMinutes(value: number | undefined): number {
  return Number.isFinite(value) ? (value as number) : 0;
}

/** Mirrors physiology.assess() severity thresholds so the UI and the Python
 *  core cannot disagree about what counts as unsafe. */
function severityFor(ratio: number): keyof typeof SEVERITY_TONE {
  if (ratio >= 1.15) return "critical";
  if (ratio >= 1.0) return "severe";
  if (ratio >= 0.9) return "high";
  if (ratio >= 0.75) return "moderate";
  return "low";
}
