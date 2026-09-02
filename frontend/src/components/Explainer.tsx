import { useState } from "react";
import type { HeatData } from "../types";
import { Info } from "./Info";

/**
 * "What am I looking at?"
 *
 * The single most important addition for a non-expert reader. Without it the
 * page opens on a grid of hexagons and four acronyms, and someone who does not
 * already work in heat-health has no way in.
 *
 * Kept short deliberately: three sentences and a worked contrast. Open by
 * default, collapsible for anyone who already knows.
 */
export function Explainer({ data }: { data: HeatData }) {
  const [open, setOpen] = useState(true);
  const g = data.meta.kill_gate;
  const isLive = data.meta.mode === "live";

  return (
    <section className="bg-accent-soft border-b border-line">
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-accent">
            What you are looking at
          </h2>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="no-print text-[11px] text-accent underline shrink-0"
          >
            {open ? "Hide" : "Show"}
          </button>
        </div>

        {open && (
          <div className="mt-2 max-w-4xl space-y-2.5 text-[13px] leading-relaxed text-ink">
            <p>
              A heatwave warning tells you the air temperature. It does not tell
              you what that heat does to a <em>person</em> — which depends just
              as much on humidity, wind and sunshine, and differs from one
              street to the next.
            </p>
            {isLive ? (
              <p>
                This is the <strong>live forecast for {data.meta.city}</strong> —
                conditions now and over the next few days, run through exactly
                the same calculations as the historical view. Switch tabs above
                to compare against the May 2010 disaster.
              </p>
            ) : (
              <p>
                This replays a real disaster: the{" "}
                <strong>May 2010 heatwave in {data.meta.city}</strong>, which
                killed roughly 1,344 people and led to India&apos;s first Heat
                Action Plan. Every number here is computed from the weather that
                actually occurred.
              </p>
            )}

            <div className="grid sm:grid-cols-3 gap-2 pt-1">
              <Step
                n={1}
                title="The map"
                body="The city is split into equal hexagons, each about a neighbourhood in size. Darker means more dangerous. Drag the hour slider to watch the day unfold."
              />
              <Step
                n={2}
                title="Click any hexagon"
                body="You get that neighbourhood's readings, why it scores that way, and what it meant for four different kinds of people living there."
              />
              <Step
                n={3}
                title="Scroll for the findings"
                body={
                  isLive
                    ? "Charts below show how the days ahead compare, how cool the nights get, and when it is safe to be outdoors."
                    : "Three charts below show what a temperature-only warning misses — including six consecutive nights when nobody could cool down."
                }
              />
            </div>

            <p className="pt-1">
              <strong>The one idea to take away:</strong>{" "}
              {isLive ? "at the peak hour ahead" : "on this day"} the air
              temperature varied by {g.air_temp_spread_c.toFixed(1)} °C across
              the city, but{" "}
              <Info term="UTCI" label="what the heat actually felt like to a body" />{" "}
              varied by <strong>{g.utci_spread_c.toFixed(1)} °C</strong>. Two
              neighbourhoods a few kilometres apart were having genuinely
              different — and differently dangerous — days.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="bg-surface/70 border border-line rounded-sm px-2.5 py-2">
      <div className="flex items-center gap-1.5">
        <span className="w-4 h-4 rounded-full bg-accent text-white text-[10px] font-semibold grid place-items-center shrink-0">
          {n}
        </span>
        <span className="text-[12px] font-semibold text-ink">{title}</span>
      </div>
      <p className="text-[12px] leading-snug text-ink-soft mt-1">{body}</p>
    </div>
  );
}
