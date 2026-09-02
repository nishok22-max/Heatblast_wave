import type { ReactNode } from "react";

/** A titled panel. The basic unit of the console layout. */
export function Panel({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`card ${className}`}
    >
      <header className="flex items-start justify-between gap-4 px-4 py-3 border-b border-line">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-ink">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[12px] text-ink-soft mt-0.5 leading-snug">
              {subtitle}
            </p>
          )}
        </div>
        {right && <div className="shrink-0 no-print">{right}</div>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

type Tone = "neutral" | "ok" | "warn" | "flag" | "accent";

const TONES: Record<Tone, string> = {
  neutral: "bg-sunken text-ink-soft border-line",
  ok: "bg-ok-bg text-ok border-ok/30",
  warn: "bg-exercise-bg text-exercise border-exercise/30",
  flag: "bg-flag-bg text-flag border-flag/30",
  accent: "bg-accent-soft text-accent border-accent/25",
};

export function Badge({
  tone = "neutral",
  children,
  title,
}: {
  tone?: Tone;
  children: ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border rounded-[2px] ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/**
 * Maps a provenance `status` string to a visual tone.
 *
 * Anything that is not plainly measured or a published standard is surfaced as
 * a flag. This is deliberately fail-loud: a new status value nobody styled
 * shows up as a warning rather than quietly rendering as "fine".
 */
export function statusTone(status: string): Tone {
  const s = status.toLowerCase();
  if (s.startsWith("measured")) return "ok";
  if (s.startsWith("published")) return "ok";
  if (s.includes("not fitted") || s.includes("not calibrated")) return "flag";
  if (s.includes("assumed")) return "warn";
  return "warn";
}

/** Label/value row for readouts. */
export function Row({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-line/60 last:border-0">
      <span className="text-[12px] text-ink-soft" title={hint}>
        {label}
      </span>
      <span className="text-[13px] font-medium tnum text-ink">{value}</span>
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] leading-relaxed text-ink-faint mt-2">{children}</p>
  );
}
