import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HeatData } from "../types";
import { Note, Panel } from "./ui";

/**
 * Hero panel 2 — the night-recovery finding.
 *
 * A heatwave warning describes the afternoon. It says nothing about whether
 * anyone got to cool down overnight, which across the May 2010 event is what
 * actually accumulated.
 */

/** Above this overnight minimum, sleep provides little physiological recovery.
 *  Indicative, drawn from heat-health guidance on night-time minima rather than
 *  from a single definitive threshold — shown as a reference, not a verdict. */
const RECOVERY_THRESHOLD_C = 27;

export function NightRecovery({ data }: { data: HeatData }) {
  const nights = data.city.night_recovery;
  const noRecovery = nights.filter((n) => n.min_c >= RECOVERY_THRESHOLD_C).length;
  const worst = nights.reduce((a, b) => (b.min_c > a.min_c ? b : a), nights[0]);

  const chart = nights.map((n) => ({
    date: n.date.slice(5),
    min_c: n.min_c,
    max_c: n.max_c,
  }));

  return (
    <Panel
      title="Night-time recovery"
      subtitle="Coolest air temperature between 22:00 and 06:00 IST, each night of the event"
      right={
        <div className="text-right">
          <div className="text-[22px] font-semibold tnum leading-none text-ink">
            {noRecovery}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-ink-faint">
            nights without recovery
          </div>
        </div>
      }
    >
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
            <CartesianGrid stroke="#e2e0da" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#85817a" }}
              axisLine={{ stroke: "#d6d3cc" }}
              tickLine={false}
            />
            <YAxis
              domain={[24, 32]}
              tick={{ fontSize: 11, fill: "#85817a" }}
              axisLine={false}
              tickLine={false}
              unit="°"
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                border: "1px solid #d6d3cc",
                borderRadius: 2,
              }}
              formatter={(v) => [`${Number(v).toFixed(1)} °C`, "overnight min"]}
            />
            <ReferenceLine
              y={RECOVERY_THRESHOLD_C}
              stroke="#8a3324"
              strokeDasharray="4 3"
              label={{
                value: `recovery threshold ${RECOVERY_THRESHOLD_C}°C`,
                position: "insideTopLeft",
                fontSize: 10,
                fill: "#8a3324",
              }}
            />
            <Bar dataKey="min_c" radius={[2, 2, 0, 0]}>
              {chart.map((d) => (
                <Cell
                  key={d.date}
                  fill={
                    d.min_c >= 30
                      ? "var(--color-ramp-6)"
                      : d.min_c >= RECOVERY_THRESHOLD_C
                        ? "var(--color-ramp-4)"
                        : "var(--color-ramp-2)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">
        Across this event the overnight minimum never fell below{" "}
        <strong className="text-ink tnum">
          {Math.min(...nights.map((n) => n.min_c)).toFixed(1)} °C
        </strong>
        , peaking at{" "}
        <strong className="text-ink tnum">{worst.min_c.toFixed(1)} °C</strong> on{" "}
        {worst.date}. Heat load accumulates across days when the body never gets
        a cool night to shed it —{" "}
        <strong className="text-ink">
          and a daytime-maximum warning is blind to this entirely.
        </strong>
      </p>

      <Note>
        City-mean air temperature from ERA5. Indoor temperatures in metal- and
        asbestos-roofed housing run higher and decay more slowly; modelling that
        by roof typology is the highest-value item in the production plan.
      </Note>
    </Panel>
  );
}
