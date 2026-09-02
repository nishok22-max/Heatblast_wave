import type { Insights } from "../types";
import { Panel } from "./ui";

/**
 * What is driving the heat right now — a real sensitivity analysis, not a
 * decorative donut.
 *
 * Each slice is the measured change in UTCI when that input is nudged by a
 * realistic increment, computed through the same physics as the map. The
 * DIRECTION is shown as well as the size, because the most interesting result
 * here is that wind can be a large contributor in the *raising* direction.
 */
export function Drivers({ insights }: { insights: Insights }) {
  const drivers = [...insights.drivers].sort((a, b) => b.share - a.share);
  const colours = [
    "var(--color-ramp-6)",
    "var(--color-ramp-4)",
    "var(--color-ramp-2)",
    "var(--color-ramp-1)",
  ];

  const top = drivers[0];
  const R = 54;
  const C = 2 * Math.PI * R;
  let offset = 0;

  const windRaises = drivers.some(
    (d) => d.driver === "Wind" && d.direction === "raises",
  );

  return (
    <Panel
      title="What is driving the heat"
      subtitle="Measured by nudging each input and recomputing the physics"
    >
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="relative shrink-0">
          <svg width="140" height="140" viewBox="0 0 140 140" role="img"
               aria-label={`Largest driver: ${top?.driver} at ${top?.share}%`}>
            <circle cx="70" cy="70" r={R} fill="none" stroke="var(--color-sunken)"
                    strokeWidth="18" />
            {drivers.map((d, i) => {
              const len = (d.share / 100) * C;
              const el = (
                <circle
                  key={d.driver}
                  cx="70" cy="70" r={R} fill="none"
                  stroke={colours[i % colours.length]}
                  strokeWidth="18"
                  strokeDasharray={`${len} ${C - len}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 70 70)"
                />
              );
              offset += len;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="text-center">
              <div className="text-[22px] font-semibold text-ink tnum leading-none">
                {top ? `${top.share.toFixed(0)}%` : "—"}
              </div>
              <div className="text-[10px] text-ink-faint leading-tight mt-0.5 px-4">
                {top?.driver}
              </div>
            </div>
          </div>
        </div>

        <ul className="flex-1 min-w-0 w-full space-y-1.5">
          {drivers.map((d, i) => (
            <li key={d.driver} className="flex items-center gap-2 text-[12px]">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: colours[i % colours.length] }}
                aria-hidden
              />
              <span className="text-ink flex-1 truncate">{d.driver}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  d.direction === "raises"
                    ? "bg-flag-bg text-flag"
                    : "bg-ok-bg text-ok"
                }`}
              >
                {d.direction === "raises" ? "raises" : "lowers"}
              </span>
              <span className="tnum text-ink-soft w-11 text-right">
                {d.share.toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      {windRaises && (
        <div className="mt-4 pt-3 border-t border-line">
          <p className="text-[12px] leading-relaxed text-ink-soft">
            <strong className="text-ink">Wind is making this worse, not better.</strong>{" "}
            Above about 35 °C — skin temperature — moving air delivers heat to the
            body faster than it carries heat away. This is why health guidance
            says not to rely on electric fans in extreme heat: the same breeze
            that cools you at 30 °C is a fan-forced oven at 45 °C.
          </p>
        </div>
      )}
    </Panel>
  );
}
