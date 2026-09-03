import type { HeatData } from "../types";

export type RoleType = "commissioner" | "health" | "labour" | "citizen";

interface RoleDirectiveCardProps {
  role: RoleType;
  data: HeatData;
  hour: number;
}

export function RoleDirectiveCard({ role, data, hour }: RoleDirectiveCardProps) {
  const features = data.hexes.features;
  let maxUtci = 0;
  let worstWard = "Naroda / East Ward";

  for (const f of features) {
    const id = f.properties.h3_index;
    const val = data.hourly.hexes[id]?.utci?.[hour] ?? 0;
    if (val > maxUtci) {
      maxUtci = val;
      worstWard = f.properties.place ?? f.properties.h3_index.slice(-6);
    }
  }

  const isPeakDanger = hour >= 11 && hour <= 15;

  const roleMeta: Record<
    RoleType,
    { title: string; subtitle: string; items: { tag: string; action: string; urgency: "critical" | "warning" | "info" }[] }
  > = {
    commissioner: {
      title: "Municipal Operational Directives",
      subtitle: "Emergency Infrastructure & Logistics",
      items: [
        {
          tag: "Water Dispatch",
          action: `Deploy municipal water tankers to priority ward: ${worstWard} (${maxUtci.toFixed(1)} °C UTCI).`,
          urgency: isPeakDanger ? "critical" : "warning",
        },
        {
          tag: "Cooling Corridors",
          action: "Activate green transit shade awnings and misting fans at Kalupur Railway Station and Geeta Mandir transit hubs.",
          urgency: "warning",
        },
        {
          tag: "Night Facilities",
          action: "Open municipal community centers overnight with ceiling fans for unshaded informal settlement residents.",
          urgency: "info",
        },
      ],
    },
    health: {
      title: "Hospital & Clinical Triage Directives",
      subtitle: "Medical Surge & Emergency Capacity",
      items: [
        {
          tag: "ER Capacity",
          action: isPeakDanger
            ? "Anticipate +40% heat-exhaustion presentations between 13:00–18:00. Clear non-urgent emergency beds."
            : "Brief clinical teams on rapid cooling and intravenous rehydration protocols for acute hyperthermia.",
          urgency: isPeakDanger ? "critical" : "warning",
        },
        {
          tag: "UPHC Stocks",
          action: "Pre-position 500 ORS sachets and 200 units of normal saline at Danapith and Vatva Urban Health Centres.",
          urgency: "warning",
        },
        {
          tag: "ASHA Outreach",
          action: "Task community health workers with welfare checks for elderly residents living alone in uninsulated homes.",
          urgency: "info",
        },
      ],
    },
    labour: {
      title: "Labour Inspection & Work Safety Protocol",
      subtitle: "Statutory Work-Rest Regulations",
      items: [
        {
          tag: "Work Stoppage",
          action: isPeakDanger
            ? "Statutory prohibition: Halt heavy outdoor construction, excavation, and road paving (11:00–15:00)."
            : "Permitted shifts: Ensure mandatory 15-minute shaded rest breaks per hour during morning shifts.",
          urgency: isPeakDanger ? "critical" : "info",
        },
        {
          tag: "Split Shifts",
          action: "Authorize split shifts (06:00–10:30 and 16:30–19:30) to preserve daily earnings while avoiding peak radiant heat flux.",
          urgency: "warning",
        },
        {
          tag: "Site Facilities",
          action: "Enforce employer provision of cool drinking water and ventilated shaded resting sheds on all active job sites.",
          urgency: "info",
        },
      ],
    },
    citizen: {
      title: "Public Health Advisory & Worker Guidance",
      subtitle: "Personal Heat Safety Protocol",
      items: [
        {
          tag: "Sun Exposure",
          action: isPeakDanger
            ? "Avoid direct sun exposure: Physical exertion outdoors between 11:00 and 15:00 carries extreme heatstroke risk."
            : "Schedule necessary outdoor chores and travel before 10:00 AM or after 5:30 PM.",
          urgency: isPeakDanger ? "critical" : "info",
        },
        {
          tag: "Hydration",
          action: "Drink 500 ml of water or lemon water every 30 to 45 minutes, even without feeling thirsty.",
          urgency: "warning",
        },
        {
          tag: "Home Cooling",
          action: "Cover east and south-facing windows during morning hours. Move infants and elderly family members to lower floors.",
          urgency: "info",
        },
      ],
    },
  };

  const current = roleMeta[role];

  return (
    <div className="card p-4 space-y-3 bg-surface shadow-xs">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <div>
          <h3 className="font-semibold text-[13.5px] text-ink leading-tight">{current.title}</h3>
          <p className="text-[11px] text-ink-faint">{current.subtitle}</p>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
            isPeakDanger
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          {isPeakDanger ? "Peak Alert Active" : "Routine Operations"}
        </span>
      </div>

      <div className="space-y-2">
        {current.items.map((item, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-lg border text-[12px] leading-snug transition-colors ${
              item.urgency === "critical"
                ? "bg-red-50/70 border-red-200 text-red-950"
                : item.urgency === "warning"
                ? "bg-amber-50/70 border-amber-200 text-amber-950"
                : "bg-slate-50 border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  item.urgency === "critical"
                    ? "bg-red-600"
                    : item.urgency === "warning"
                    ? "bg-amber-600"
                    : "bg-sky-600"
                }`}
              />
              <span className="font-semibold text-[11px] uppercase tracking-wide text-ink">
                {item.tag}
              </span>
            </div>
            <p className="text-ink-soft text-[12px] pl-3.5">{item.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
