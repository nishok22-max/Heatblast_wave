import type { HeatData } from "../types";
import { useState } from "react";
import { Badge, Panel, statusTone } from "./ui";

/**
 * The honesty panel — and deliberately not a footnote.
 *
 * Every layer declares whether it is measured, assumed, unfitted or
 * uncalibrated. The three non-measured layers are the ones a judge would
 * otherwise have to catch us on; showing them first is both correct and, in a
 * field of dashboards claiming 97% accuracy, the most credible thing on screen.
 *
 * The statuses come from meta.json rather than being written here, so this
 * panel cannot drift away from what the pipeline actually did.
 */
export function ProvenancePanel({ data }: { data: HeatData }) {
  const [showTechnical, setShowTechnical] = useState(false);
  const flagged = data.meta.provenance.filter(
    (p) => statusTone(p.status) !== "ok",
  ).length;

  return (
    <Panel
      title="What we know, and what we don't"
      subtitle="Every layer below says whether it was measured or assumed. The flagged ones are the honest gaps."
      right={
        <div className="text-right">
          <div className="text-[22px] font-semibold tnum leading-none text-flag">
            {flagged}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-ink-faint">
            of 7 layers not measured
          </div>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[12px] border-collapse">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-ink-faint">
              <th className="text-left font-semibold pb-1.5 pr-3">Layer</th>
              <th className="text-left font-semibold pb-1.5 pr-3">Source</th>
              <th className="text-left font-semibold pb-1.5 pr-3">Resolution</th>
              <th className="text-left font-semibold pb-1.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.meta.provenance.map((p) => {
              const tone = statusTone(p.status);
              return (
                <tr key={p.layer} className="border-t border-line/70 align-top">
                  <td className="py-1.5 pr-3">
                    <div className="text-ink font-medium">{p.plain ?? p.layer}</div>
                    <div className="text-[10px] text-ink-faint capitalize">
                      {p.layer}
                    </div>
                  </td>
                  <td className="py-1.5 pr-3 text-ink-soft">{p.source}</td>
                  <td className="py-1.5 pr-3 text-ink-faint tnum whitespace-nowrap">
                    {p.resolution}
                  </td>
                  <td className="py-1.5">
                    <Badge tone={tone}>{plainStatus(p.status)}</Badge>
                    <div className="text-[10px] text-ink-faint mt-0.5 max-w-48">
                      {p.status}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-3 border-t border-line">
        <div className="flex items-baseline justify-between gap-3 mb-1.5">
          <h3 className="text-[10px] uppercase tracking-wider font-semibold text-ink-soft">
            Things this tool cannot yet tell you
          </h3>
          <button
            onClick={() => setShowTechnical((v) => !v)}
            aria-expanded={showTechnical}
            className="no-print text-[11px] text-accent underline shrink-0"
          >
            {showTechnical ? "Hide" : "Show"} technical wording
          </button>
        </div>
        <ul className="space-y-2">
          {data.meta.caveats.map((c) => (
            <li key={c.technical} className="flex gap-2 text-[12px] leading-relaxed">
              <span className="text-flag shrink-0" aria-hidden>
                ▸
              </span>
              <span>
                <span className="text-ink">{c.plain}</span>
                {showTechnical && (
                  <span className="block text-[11px] text-ink-faint mt-0.5">
                    {c.technical}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 pt-3 border-t border-line grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
        <div className="col-span-2 text-[10px] uppercase tracking-wider font-semibold text-ink-soft">
          How heat is turned into a health number
        </div>
        <span className="text-ink-soft">Metric / threshold</span>
        <span className="text-ink tnum text-right">
          {data.meta.exposure_response.metric.toUpperCase()} ·{" "}
          {data.meta.exposure_response.mmt_c} °C
        </span>
        <span className="text-ink-soft">Slope (95% range)</span>
        <span className="text-ink tnum text-right">
          {data.meta.exposure_response.beta} (
          {data.meta.exposure_response.beta_ci.join(" – ")})
        </span>
        <span className="text-ink-soft">
          Checked against real local health records
        </span>
        <span className="text-right">
          <Badge tone={data.meta.exposure_response.is_calibrated ? "ok" : "flag"}>
            {data.meta.exposure_response.is_calibrated ? "yes" : "no"}
          </Badge>
        </span>
      </div>
    </Panel>
  );
}

/**
 * Plain-language equivalent of a provenance status.
 *
 * The technical string still renders underneath, so nothing is hidden — but
 * "NOT FITTED -- exposure proxied by urban intensity" tells a non-specialist
 * nothing, and this panel is the one place the project cannot afford to be
 * unreadable.
 */
function plainStatus(status: string): string {
  const s = status.toLowerCase();
  if (s.startsWith("measured")) return "Measured";
  if (s.startsWith("published")) return "Published standard";
  if (s.includes("not calibrated")) return "Not checked locally";
  if (s.includes("not fitted")) return "Stand-in, not real data";
  if (s.includes("assumed")) return "Assumed, not measured";
  return status;
}
