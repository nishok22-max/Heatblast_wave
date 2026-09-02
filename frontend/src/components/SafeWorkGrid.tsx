import type { HeatData } from "../types";
import { Badge, Note, Panel } from "./ui";
import { Info } from "./Info";

/**
 * Hero panel 3 — the safe-work-window analysis.
 *
 * This is the output that maps directly onto the intervention the problem
 * statement asks for ("shifting outdoor work hours"), and it is computed from
 * published occupational standards rather than invented.
 */

/** Permissible working minutes per hour → swatch. Zero is the finding. */
function swatch(minutes: number): { bg: string; ink: string } {
  if (minutes >= 60) return { bg: "#e6efe7", ink: "#2f5d3a" };
  if (minutes >= 45) return { bg: "#fddfb0", ink: "#5c4a1f" };
  if (minutes >= 30) return { bg: "#fbb97e", ink: "#5c3a1f" };
  if (minutes > 0) return { bg: "#f78f65", ink: "#3d1a10" };
  return { bg: "#8c2a7c", ink: "#ffffff" };
}

export function SafeWorkGrid({
  data,
  hour,
  onHour,
}: {
  data: HeatData;
  hour: number;
  onHour: (h: number) => void;
}) {
  const labels = data.hourly.meta.labels_ist ?? [];
  const hours = data.hourly.meta.hours_ist;

  // Hours in which no persona can work at all — the headline number.
  const blockedHours = hours.filter((_, i) =>
    data.personas.order.every(
      (k) => data.personas.personas[k].safe_minutes_by_hour[i] === 0,
    ),
  );

  // The copy below calls these hours "consecutive", so measure the longest
  // actual run rather than assuming the blocked hours form one block. They do
  // for this event, but a claim that happens to be true is not the same as one
  // that is true by construction — and this figure gets quoted on stage.
  const longestRun = hours.reduce(
    (acc, _, i) => {
      const blocked = data.personas.order.every(
        (k) => data.personas.personas[k].safe_minutes_by_hour[i] === 0,
      );
      const run = blocked ? acc.run + 1 : 0;
      return { run, best: Math.max(acc.best, run) };
    },
    { run: 0, best: 0 },
  ).best;

  return (
    <Panel
      title="When could people safely be outside?"
      subtitle={`Minutes of outdoor work allowed each hour, by published safety standards · ${data.personas.date}`}
      right={
        <div className="text-right">
          <div className="text-[22px] font-semibold tnum leading-none text-ink">
            {blockedHours.length}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-ink-faint">
            hours unsafe for everyone
          </div>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[10px] uppercase tracking-wider text-ink-faint font-semibold pb-1 pr-2 w-52">
                Persona
              </th>
              {hours.map((h, i) => (
                <th
                  key={h}
                  className="text-[9px] text-ink-faint font-normal tnum pb-1"
                  title={labels[i]}
                >
                  {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
                </th>
              ))}
              <th className="text-[10px] uppercase tracking-wider text-ink-faint font-semibold pb-1 pl-2">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.personas.order.map((key) => {
              const p = data.personas.personas[key];
              return (
                <tr key={key}>
                  <td className="pr-2 py-0.5 align-middle">
                    <div className="text-[11px] text-ink leading-tight truncate max-w-52" title={p.notes}>
                      {p.label}
                    </div>
                    <div className="text-[10px] text-ink-faint tnum">
                      limit {p.limit_c} °C
                      {p.full_capacity_hours.length === 0 && (
                        <span className="ml-1 text-flag font-semibold">
                          · no full-capacity hour
                        </span>
                      )}
                    </div>
                  </td>
                  {p.safe_minutes_by_hour.map((minutes, i) => {
                    const s = swatch(minutes);
                    return (
                      <td key={i} className="p-0">
                        <button
                          onClick={() => onHour(i)}
                          title={`${labels[i] ?? i} IST — ${minutes} min/hour`}
                          aria-label={`${p.label} at ${labels[i] ?? i}: ${
                            minutes === 0
                              ? "no safe outdoor work"
                              : `${minutes} minutes of work permitted per hour`
                          }`}
                          className={`w-full h-6 text-[9px] tnum border border-white/70 transition-opacity hover:opacity-75 ${
                            i === hour ? "ring-2 ring-accent ring-inset" : ""
                          }`}
                          style={{ background: s.bg, color: s.ink }}
                        >
                          {minutes === 0 ? "" : minutes}
                        </button>
                      </td>
                    );
                  })}
                  <td className="pl-2 text-[12px] tnum font-semibold text-ink text-right">
                    {p.total_safe_hours}h
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className="text-[10px] uppercase tracking-wider text-ink-faint">
          minutes of work permitted per hour
        </span>
        {[60, 45, 30, 15, 0].map((m) => {
          const s = swatch(m);
          return (
            <span
              key={m}
              className="px-1.5 py-0.5 text-[10px] tnum border border-line rounded-[2px]"
              style={{ background: s.bg, color: s.ink }}
            >
              {m === 0 ? "none" : m}
            </span>
          );
        })}
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">
        An outdoor construction worker had{" "}
        <strong className="text-ink">no full-capacity working hour</strong> in
        the entire 24 hours, and for{" "}
        <strong className="text-ink">{longestRun} consecutive hours</strong>{" "}
        no persona could safely work outdoors at all. The only viable window was
        before dawn.
      </p>

      <div className="flex flex-wrap gap-1 mt-2">
        <Badge tone="ok">Published standards</Badge>
        <Badge tone="warn">Vulnerability offsets are a judgement</Badge>
      </div>

      <Note>
        Based on <Info term="ISO 7243" /> and <Info term="ACGIH" /> standards,
        using the city average. Hotter-than-average neighbourhoods lose their
        window earlier — click any hexagon on the map for its own figures.
      </Note>
    </Panel>
  );
}
