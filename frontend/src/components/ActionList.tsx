import type { Insights } from "../types";
import { Note, Panel } from "./ui";

const IMPACT = {
  high: { label: "High impact", cls: "bg-flag-bg text-flag border-flag/25" },
  medium: { label: "Medium impact", cls: "bg-exercise-bg text-exercise border-exercise/25" },
  low: { label: "Low impact", cls: "bg-sunken text-ink-soft border-line" },
} as const;

const ICONS = ["◷", "◑", "◈", "☾", "◲"];

/**
 * Recommended actions.
 *
 * These are rules over computed quantities — not an optimiser, and emphatically
 * not a language model. Each carries the evidence that produced it, so an
 * official can check the reasoning instead of trusting a black box. An
 * unexplained recommendation is one nobody can sign.
 */
export function ActionList({ insights }: { insights: Insights }) {
  return (
    <Panel
      title="What to do today"
      subtitle="Derived from the hourly safe-work allowance, highest impact first"
    >
      <ul className="space-y-2.5">
        {insights.actions.map((a, i) => {
          const impact = IMPACT[a.impact as keyof typeof IMPACT] ?? IMPACT.low;
          return (
            <li key={a.title} className="flex gap-3">
              <span
                className="w-8 h-8 rounded-lg bg-sunken grid place-items-center text-[14px] text-ink-soft shrink-0"
                aria-hidden
              >
                {ICONS[i % ICONS.length]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[13px] font-semibold text-ink leading-tight">
                    {a.title}
                  </h3>
                  <span
                    className={`text-[9px] uppercase tracking-wider font-semibold border rounded px-1.5 py-0.5 shrink-0 ${impact.cls}`}
                  >
                    {impact.label}
                  </span>
                </div>
                <p className="text-[12px] text-ink-soft leading-snug mt-0.5">
                  {a.detail}
                </p>
                <p className="text-[10px] text-ink-faint mt-1">
                  Because: {a.evidence}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <Note>
        Rules over computed values, not a recommendation engine and not an AI.
        Every line shows the number that produced it.
      </Note>
    </Panel>
  );
}
