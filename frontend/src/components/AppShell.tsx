import type { ReactNode } from "react";
import type { DatasetKey } from "../data";
import { DATASET_META } from "../data";
import type { HeatData } from "../types";

export type NavItemKey =
  | "dashboard"
  | "map"
  | "simulations"
  | "interventions"
  | "impact"
  | "alerts"
  | "reports"
  | "settings";

interface AppShellProps {
  data: HeatData;
  dataset: DatasetKey;
  onDataset: (k: DatasetKey) => void;
  activeNav: NavItemKey;
  onSelectNav: (key: NavItemKey) => void;
  dateStr?: string;
  timeStr?: string;
  hour: number;
  onHourChange: (hour: number) => void;
  stale?: boolean;
  onOpenAlerts?: () => void;
  onOpenMethodology?: () => void;
  children: ReactNode;
}

const NAV_ITEMS: { key: NavItemKey; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { key: "map", label: "Heat Map", icon: "M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" },
  { key: "simulations", label: "Simulations", icon: "M18 20V10M12 20V4M6 20v-6" },
  { key: "interventions", label: "Interventions", icon: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  { key: "impact", label: "Impact", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
  { key: "alerts", label: "Alerts", icon: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" },
  { key: "reports", label: "Reports", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
  { key: "settings", label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" },
];

export function AppShell({
  data,
  dataset,
  onDataset,
  activeNav,
  onSelectNav,
  dateStr = "14 May 2025",
  timeStr = "3:00 PM IST",
  hour,
  onHourChange,
  stale = false,
  onOpenAlerts,
  onOpenMethodology,
  children,
}: AppShellProps) {
  const isLive = data.meta.mode === "live";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-ink flex font-sans antialiased selection:bg-accent selection:text-white">
      {/* 1. LEFT SIDEBAR (Compact Government Style) */}
      <aside className="w-56 shrink-0 bg-surface border-r border-line min-h-screen flex flex-col justify-between select-none sticky top-0 h-screen z-30">
        <div>
          {/* Top Brand */}
          <div className="px-4 py-4 border-b border-line flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600 text-white grid place-items-center shrink-0 shadow-xs">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </div>
            <div>
              <span className="block text-[15px] font-bold text-ink tracking-tight leading-tight">
                HeatTwin
              </span>
              <span className="block text-[10px] text-ink-faint leading-tight">
                Human Heat Decision Engine
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-0.5" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onSelectNav(item.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[12.5px] font-medium transition-all ${
                    isActive
                      ? "bg-[#0F2942] text-white font-semibold shadow-xs"
                      : "text-ink-soft hover:bg-slate-100 hover:text-ink"
                  }`}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isActive ? "text-white" : "text-ink-faint"}
                  >
                    <path d={item.icon} />
                  </svg>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Jurisdiction Footer */}
        <div className="p-3 border-t border-line text-[10.5px] text-ink-faint space-y-0.5 bg-slate-50/70">
          <span className="font-semibold text-ink block">AMC Control Room</span>
          <span>Ahmedabad Municipal Corp.</span>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* TOP HEADER (Visually Quiet) */}
        <header className="bg-surface border-b border-line px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs sticky top-0 z-20">
          {/* Left: Location & Time */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-[14.5px] text-ink">
              Ahmedabad, Gujarat
            </span>
            <span className="text-ink-faint">•</span>
            <span className="text-[13px] text-ink-soft">
              {dateStr} • {timeStr}
            </span>
          </div>

          {/* Right: Date, Time selector, Operational Status, Alerts, Admin */}
          <div className="flex items-center gap-3">
            {/* Dataset switch */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-line">
              {(Object.keys(DATASET_META) as DatasetKey[]).map((key) => {
                const active = dataset === key;
                return (
                  <button
                    key={key}
                    onClick={() => onDataset(key)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                      active
                        ? "bg-surface text-ink font-bold shadow-xs border border-line"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {DATASET_META[key].label}
                  </button>
                );
              })}
            </div>

            {/* Time select */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-line px-2 py-1 rounded-md text-[11.5px] text-ink-soft">
              <span className="text-ink-faint">Time:</span>
              <select
                value={hour}
                onChange={(e) => onHourChange(Number(e.target.value))}
                className="bg-transparent text-ink font-semibold cursor-pointer outline-hidden"
              >
                <option value={9}>09:00 AM</option>
                <option value={12}>12:00 PM</option>
                <option value={14}>02:00 PM</option>
                <option value={15}>03:00 PM</option>
                <option value={16}>04:00 PM</option>
                <option value={18}>06:00 PM</option>
              </select>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>{isLive ? "System Operational" : "Benchmark Replay"}</span>
              {isLive && stale && (
                <span className="text-[10px] text-amber-700 font-mono pl-1">(Cached)</span>
              )}
            </div>

            {/* Alerts button */}
            <button
              onClick={onOpenAlerts}
              className="w-7 h-7 rounded-md border border-line hover:bg-slate-50 grid place-items-center text-ink-soft hover:text-ink relative transition-colors"
              title="Alerts"
              aria-label="View Alerts"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-orange-600" />
            </button>

            {/* Methodology */}
            <button
              onClick={onOpenMethodology}
              className="px-2 py-1 rounded-md border border-line hover:bg-slate-50 text-[11px] font-medium text-ink-soft hover:text-ink transition-colors"
            >
              Docs
            </button>

            {/* Admin Avatar */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-line">
              <div className="w-6 h-6 rounded-full bg-[#0F2942] text-white font-bold text-[10px] grid place-items-center">
                MC
              </div>
              <span className="text-[11.5px] font-semibold text-ink hidden lg:inline">
                Admin
              </span>
            </div>
          </div>
        </header>

        {/* Main Canvas Body */}
        <main className="p-4 lg:p-6 max-w-[1400px] w-full mx-auto space-y-4">
          {children}
        </main>
      </div>
    </div>
  );
}
