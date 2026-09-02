import type { Insights } from "../types";
import { Note, Panel } from "./ui";

/**
 * What-if simulator.
 *
 * Every scenario here is recomputed through the project's own physics — none is
 * a stated percentage or a designer's guess. Interventions the model genuinely
 * cannot represent are listed as omitted rather than estimated, which is the
 * whole reason this panel can be trusted.
 */
export function Scenarios({ insights }: { insights: Insights }) {
  const best = insights.scenarios.reduce((a, b) => (score(b) > score(a) ? b : a));

  return (
    <Panel
      title="What if we did something about it?"
      subtitle="Each option is re-run through the same physics as the map"
    >
      <div className="grid md:grid-cols-3 gap-3">
        {insights.scenarios.map((s) => {
          const isWork = typeof s.reduction_pct === "number";
          const isBest = s.key === best.key;
          return (
            <div
              key={s.key}
              className={`rounded-xl border p-3.5 ${
                isBest ? "border-ok bg-ok-bg/40" : "border-line bg-surface"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[13px] font-semibold text-ink leading-tight">
                  {s.label}
                </h3>
                {isBest && (
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-ok bg-surface border border-ok/30 rounded px-1.5 py-0.5 shrink-0">
                    Best value
                  </span>
                )}
              </div>
              <p className="text-[11px] text-ink-soft mt-1 leading-snug">
                {s.detail}
              </p>

              <div className="mt-3 flex items-baseline gap-2">
                {isWork ? (
                  <>
                    <span className="text-[24px] font-semibold text-ink tnum leading-none">
                      −{s.reduction_pct}%
                    </span>
                    <span className="text-[11px] text-ink-soft">
                      unsafe work hours
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[24px] font-semibold text-ink tnum leading-none">
                      {s.delta_c}
                    </span>
                    <span className="text-[11px] text-ink-soft">
                      °C felt {s.scope ? `(${s.scope})` : ""}
                    </span>
                  </>
                )}
              </div>

              <div className="mt-2 text-[11px] tnum text-ink-faint">
                {isWork
                  ? `${s.unsafe_before} h → ${s.unsafe_after} h`
                  : `${s.utci_before} °C → ${s.utci_after} °C`}
              </div>

              <div className="mt-3 pt-2 border-t border-line/70">
                <div className="text-[10px] uppercase tracking-wider text-ink-faint">
                  Cost
                </div>
                <div className="text-[11px] text-ink">{s.cost}</div>
              </div>

              <p className="text-[10px] leading-relaxed text-ink-faint mt-2">
                {s.basis}
              </p>
            </div>
          );
        })}
      </div>

      {insights.omitted?.length > 0 && (
        <div className="mt-4 pt-3 border-t border-line">
          <h4 className="text-[10px] uppercase tracking-wider font-semibold text-ink-soft mb-1.5">
            Deliberately not offered
          </h4>
          <ul className="space-y-1.5">
            {insights.omitted.map((o) => (
              <li key={o.item} className="text-[12px] leading-relaxed">
                <span className="text-ink font-medium">{o.item}</span>
                <span className="text-ink-soft"> — {o.why}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Note>
        A model that offers every intervention is a model that has stopped
        checking whether it can actually evaluate them.
      </Note>
    </Panel>
  );
}

function score(s: Insights["scenarios"][number]): number {
  // Rank by benefit per unit of cost: a free scheduling change that removes a
  // third of the exposure beats a multi-year planting programme that removes
  // slightly more.
  const cost = /no cost/i.test(s.cost) ? 1 : /low/i.test(s.cost) ? 2 : 5;
  const benefit =
    typeof s.reduction_pct === "number"
      ? s.reduction_pct / 10
      : Math.abs(s.delta_c ?? 0);
  return benefit / cost;
}
