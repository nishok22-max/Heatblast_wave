import type { HeatData } from "../types";

export type RoleType = "commissioner" | "health" | "labour" | "citizen";

interface RoleDirectiveCardProps {
  role: RoleType;
  data: HeatData;
  hour: number;
}

export function RoleDirectiveCard({ role, data, hour }: RoleDirectiveCardProps) {
  // Find top risk zone at current hour
  const features = data.hexes.features;
  let maxUtci = 0;
  let worstWard = "Naroda / East AMC";

  for (const f of features) {
    const id = f.properties.h3_index;
    const val = data.hourly.hexes[id]?.utci?.[hour] ?? 0;
    if (val > maxUtci) {
      maxUtci = val;
      worstWard = f.properties.place ?? f.properties.h3_index.slice(-6);
    }
  }

  const isPeakDanger = hour >= 11 && hour <= 16;

  const roleMeta: Record<
    RoleType,
    { title: string; badge: string; icon: string; items: { tag: string; action: string; urgency: "critical" | "warning" | "info" }[] }
  > = {
    commissioner: {
      title: "Municipal Commissioner Action Matrix",
      badge: "LOGISTICS & EMERGENCY ASSETS",
      icon: "🏛️",
      items: [
        {
          tag: "Water Tankers",
          action: `Deploy high-capacity water tankers immediately to top thermal pocket: ${worstWard} (${maxUtci.toFixed(1)} °C UTCI).`,
          urgency: isPeakDanger ? "critical" : "warning",
        },
        {
          tag: "Shade Corridors",
          action: "Activate green transit shade awnings and misting fans at Kalupur Railway Station and Geeta Mandir bus terminus.",
          urgency: "warning",
        },
        {
          tag: "Nocturnal Relief",
          action: "Keep 14 air-cooled municipal community halls open overnight for unshaded tin-roof settlement residents.",
          urgency: "info",
        },
      ],
    },
    health: {
      title: "Chief Medical Officer & Hospital Triage",
      badge: "CLINICAL CAPACITY & SURGE",
      icon: "🏥",
      items: [
        {
          tag: "ER Surge Alert",
          action: isPeakDanger
            ? "CRITICAL: Expect +40% heatstroke ER admissions between 13:00–18:00. Clear non-emergency triage beds."
            : "Standby alert: Brief emergency staff on rapid ice-bath cooling protocols for severe hyperthermia.",
          urgency: isPeakDanger ? "critical" : "warning",
        },
        {
          tag: "UPHC Pre-Stocking",
          action: "Ensure 500 ORS sachets and 200 units of normal saline (0.9% IV) are staged at Danapith & Vatva Urban Health Centres.",
          urgency: "warning",
        },
        {
          tag: "High-Risk Outreach",
          action: "Dispatch ASHA community health workers to check on vulnerable elderly living alone in concrete tenements.",
          urgency: "info",
        },
      ],
    },
    labour: {
      title: "Labour Department & Site Supervisors",
      badge: "STATUTORY WORK-REST ENFORCEMENT",
      icon: "⚠️",
      items: [
        {
          tag: "Work Stoppage",
          action: isPeakDanger
            ? "MANDATORY LEGAL STOP: Prohibit heavy outdoor construction, bricklaying, and asphalt paving (11:00–15:00)."
            : "Authorized Hours: Normal outdoor labor permitted with mandatory 15-minute rest breaks per hour.",
          urgency: isPeakDanger ? "critical" : "info",
        },
        {
          tag: "Split Shift Protocol",
          action: "Authorize split shifts (06:00–10:30 & 16:30–19:30) to protect workers' daily wages while avoiding peak solar radiant flux.",
          urgency: "warning",
        },
        {
          tag: "Hydration Mandate",
          action: "Enforce employer provision of potable earthen pot (matka) cool drinking water and shaded rest sheds on all sites.",
          urgency: "info",
        },
      ],
    },
    citizen: {
      title: "Public Health & Worker Survival Directive",
      badge: "DIRECT CITIZEN GUIDANCE",
      icon: "👷",
      items: [
        {
          tag: "Immediate Directive",
          action: isPeakDanger
            ? "SEEK COOL SHELTER: Outdoor sun exposure is life-threatening right now. Stop physical exertion immediately."
            : "Stay alert: Thermal load is manageable now, but temperatures will climb rapidly past 10:00 AM.",
          urgency: isPeakDanger ? "critical" : "info",
        },
        {
          tag: "Hydration Rule",
          action: "Drink 500 ml of water or lemon water every 30 minutes, even before you feel thirsty. Avoid caffeinated drinks.",
          urgency: "warning",
        },
        {
          tag: "Vulnerable Care",
          action: "Never leave children or pets inside stationary vehicles. Move elderly family members to the ground floor or shaded rooms.",
          urgency: "info",
        },
      ],
    },
  };

  const current = roleMeta[role];

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xl">{current.icon}</span>
          <div>
            <h3 className="font-semibold text-[13px] text-ink">{current.title}</h3>
            <span className="text-[10px] font-mono tracking-wider text-accent uppercase">
              {current.badge}
            </span>
          </div>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
            isPeakDanger
              ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
          }`}
        >
          {isPeakDanger ? "Peak Alert" : "Monitoring"}
        </span>
      </div>

      <div className="space-y-2">
        {current.items.map((item, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-lg border text-[12px] leading-snug ${
              item.urgency === "critical"
                ? "bg-red-500/10 border-red-500/25 text-red-200"
                : item.urgency === "warning"
                ? "bg-amber-500/10 border-amber-500/25 text-amber-200"
                : "bg-surface border-line text-ink-soft"
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold mb-1 text-[11px]">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  item.urgency === "critical"
                    ? "bg-red-400"
                    : item.urgency === "warning"
                    ? "bg-amber-400"
                    : "bg-cyan-400"
                }`}
              />
              <span className="uppercase tracking-wide text-ink">{item.tag}</span>
            </div>
            <p className="text-ink-soft">{item.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
