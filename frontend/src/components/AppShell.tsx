import type { ReactNode } from "react";
import type { DatasetKey } from "../data";
import { DATASET_META } from "../data";
import type { HeatData } from "../types";
import type { RoleType } from "./RoleDirectiveCard";

interface AppShellProps {
  data: HeatData;
  dataset: DatasetKey;
  onDataset: (k: DatasetKey) => void;
  role: RoleType;
  onRole: (r: RoleType) => void;
  hourLabel: string;
  stale?: boolean;
  onOpenCap: () => void;
  onOpenMethodology: () => void;
  children: ReactNode;
}

const ROLES: { key: RoleType; label: string; icon: string }[] = [
  { key: "commissioner", label: "Commissioner", icon: "🏛️" },
  { key: "health", label: "Health Officer", icon: "🏥" },
  { key: "labour", label: "Labour Dept", icon: "⚠️" },
  { key: "citizen", label: "Citizen / Worker", icon: "👷" },
];

export function AppShell({
  data,
  dataset,
  onDataset,
  role,
  onRole,
  hourLabel,
  stale = false,
  onOpenCap,
  onOpenMethodology,
  children,
}: AppShellProps) {
  const isLive = data.meta.mode === "live";

  return (
    <div className="min-h-screen bg-ground text-ink flex flex-col font-sans selection:bg-accent selection:text-white">
      {/* Exercise honesty banner */}
      <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1 text-center text-[10.5px] font-mono tracking-wider uppercase text-amber-300">
        Emergency Exercise Prototype · SIH 2026 Problem ID 26083 ·{" "}
        {isLive ? "Live Forecast Mode (5-day lead time)" : "Replay of May 2010 Disaster (1,344 Fatalities)"}
      </div>

      {/* Main Command Bar */}
      <header className="bg-surface border-b border-line sticky top-0 z-40 px-4 lg:px-6 py-2.5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brand & City */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center text-white text-[16px] shadow-sm font-bold">
              ☀
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[15px] tracking-tight text-ink">
                  HeatLens
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-mono font-bold uppercase">
                  Command Center
                </span>
                {isLive && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE
                  </span>
                )}
                {isLive && stale && (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Reconnecting...
                  </span>
                )}
              </div>
              <span className="text-[11px] text-ink-soft">
                {data.meta.city}, Gujarat · 392 Micro-Zones · {hourLabel} IST
              </span>
            </div>
          </div>

          {/* Role Persona Switcher */}
          <div className="flex items-center gap-1 bg-sunken p-1 rounded-xl border border-line">
            <span className="text-[10px] text-ink-faint px-2 uppercase font-mono tracking-wider hidden sm:inline">
              Role:
            </span>
            {ROLES.map((r) => {
              const active = role === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => onRole(r.key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    active
                      ? "bg-accent text-white shadow-sm font-bold"
                      : "text-ink-soft hover:text-ink hover:bg-surface/50"
                  }`}
                >
                  <span>{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dataset Switcher & Modal Triggers */}
          <div className="flex items-center gap-2">
            {/* Dataset switch */}
            <div className="flex bg-sunken p-0.5 rounded-lg border border-line">
              {(Object.keys(DATASET_META) as DatasetKey[]).map((key) => {
                const active = dataset === key;
                return (
                  <button
                    key={key}
                    onClick={() => onDataset(key)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      active
                        ? "bg-surface text-ink font-bold shadow-sm"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {DATASET_META[key].label}
                  </button>
                );
              })}
            </div>

            {/* Triggers */}
            <button
              onClick={onOpenCap}
              className="px-2.5 py-1 rounded-lg bg-surface border border-line hover:border-line-strong text-[11px] font-medium text-ink transition-colors flex items-center gap-1"
              title="View CAP 1.2 XML Alert"
            >
              <span>📡</span>
              <span className="hidden md:inline">Alert XML</span>
            </button>

            <button
              onClick={onOpenMethodology}
              className="px-2.5 py-1 rounded-lg bg-surface border border-line hover:border-line-strong text-[11px] font-medium text-ink transition-colors flex items-center gap-1"
              title="Methodology & Verification Telemetry"
            >
              <span>🔬</span>
              <span className="hidden md:inline">Methodology</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-6 py-4">
        {children}
      </main>
    </div>
  );
}
