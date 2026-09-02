import type { HeatData } from "../types";
import { Note, Panel } from "./ui";
import { Info } from "./Info";

/**
 * Hero panel 1 — the finding that two standard indices portray the same urban
 * heat island 2.8x differently, and why.
 */
export function IndexComparison({ data }: { data: HeatData }) {
  const g = data.meta.kill_gate;
  const rows = [
    { label: "Air temperature", spread: g.air_temp_spread_c, ratio: 1 },
    { label: "Heat stress for workers (WBGT)", spread: g.wbgt_spread_c, ratio: g.wbgt_damping_ratio },
    { label: "What the heat feels like (UTCI)", spread: g.utci_spread_c, ratio: g.utci_amplification },
  ];
  const max = Math.max(...rows.map((r) => r.spread));

  return (
    <Panel
      title="The same city, measured three ways"
      subtitle="How much conditions varied between the coolest and the hottest neighbourhood, at the very same moment"
    >
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between text-[12px]">
              <span className="text-ink">{r.label}</span>
              <span className="tnum text-ink-soft">
                <strong className="text-ink text-[13px]">
                  {r.spread.toFixed(2)} °C
                </strong>
                <span className="ml-2">×{r.ratio.toFixed(2)}</span>
              </span>
            </div>
            <div className="mt-1 h-3 bg-sunken rounded-[2px] overflow-hidden">
              <div
                className="h-full"
                style={{
                  width: `${(r.spread / max) * 100}%`,
                  background:
                    r.ratio > 1.1
                      ? "var(--color-ramp-6)"
                      : r.ratio < 0.7
                        ? "var(--color-ramp-2)"
                        : "var(--color-ramp-4)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-line text-[12px] leading-relaxed text-ink-soft">
        <p>
          <strong className="text-ink">Why the three disagree.</strong> Hot
          concrete warms the air but does not add moisture to it, so the hottest
          neighbourhoods are also the driest. <Info term="WBGT" /> leans heavily
          on humidity, so those two effects cancel out and it under-states the
          difference. <Info term="UTCI" /> follows heat and sunshine instead, so
          it shows the difference clearly.
        </p>
        <p className="mt-2">
          <strong className="text-ink">
            So for a dry heatwave like this one, WBGT is the wrong thing to map.
          </strong>{" "}
          May 2010 in Ahmedabad was dry — 13–16% humidity. Picking the right
          measure for the event is part of the job.
        </p>
      </div>

        <Note>
        Technical note: we carry vapour pressure across zones and recompute
        relative humidity per zone. Holding humidity fixed instead would have
        invented moisture in exactly the hottest zones and exaggerated this
        result in our favour.
      </Note>
    </Panel>
  );
}
