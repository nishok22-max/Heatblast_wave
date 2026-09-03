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

const ROLES: { key: RoleType; label: string }[] = [
  { key: "commissioner", label: "Commissioner" },
  { key: "health", label: "Health Officer" },
  { key: "labour", label: "Labour Inspection" },
  { key: "citizen", label: "Field & Public" },
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
    <div className="min-h-screen bg-ground text-ink flex flex-col font-sans antialiased selection:bg-accent selection:text-white">
      {/* Top advisory banner */}
      <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-1 text-center text-[11px] font-mono text-amber-900 tracking-wide">
        Operational Prototype · SIH Problem ID 26083 ·{" "}
        {isLive ? "5-Day Predictive Hindcast & Forecast Integration" : "May 2010 Historical Disaster Calibration"}
      </div>

      {/* Main Navigation Bar */}
      <header className="bg-surface border-b border-line sticky top-0 z-40 px-4 lg:px-6 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto w-full">
          {/* Brand & City */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-600 grid place-items-center text-white text-[15px] font-bold shadow-sm">
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
              <div className="flex items-center gap-2">
                <span className="font-bold text-[15px] tracking-tight text-ink">
                  HeatLens
                </span>
                <span className="text-[10px] font-semibold text-ink-soft bg-sunken px-1.5 py-0.5 rounded border border-line uppercase">
                  Biometeorology
                </span>
                {isLive ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    LIVE FORECAST
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    HISTORICAL BENCHMARK
                  </span>
                )}
                {isLive && stale && (
                  <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Cached
                  </span>
                )}
              </div>
              <span className="text-[11.5px] text-ink-soft">
                {data.meta.city}, Gujarat · 392 Micro-Zones · {hourLabel} IST
              </span>
            </div>
          </div>

          {/* Role Persona Segmented Switcher */}
          <div className="flex items-center bg-sunken p-0.5 rounded-lg border border-line">
            <span className="text-[10px] text-ink-faint px-2.5 font-medium uppercase tracking-wider hidden sm:inline">
              Target Role:
            </span>
            {ROLES.map((r) => {
              const active = role === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => onRole(r.key)}
                  className={`px-3 py-1 rounded-md text-[11.5px] font-medium transition-all ${
                    active
                      ? "bg-surface text-accent font-semibold shadow-xs border border-line"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Dataset Switcher & Technical Actions */}
          <div className="flex items-center gap-2">
            <div className="flex bg-sunken p-0.5 rounded-lg border border-line">
              {(Object.keys(DATASET_META) as DatasetKey[]).map((key) => {
                const active = dataset === key;
                return (
                  <button
                    key={key}
                    onClick={() => onDataset(key)}
                    className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-all ${
                      active
                        ? "bg-surface text-ink font-semibold shadow-xs border border-line"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {DATASET_META[key].label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={onOpenCap}
              className="px-2.5 py-1 rounded-lg bg-surface border border-line hover:bg-surface-hover text-[11.5px] font-medium text-ink-soft hover:text-ink transition-colors"
            >
              Export CAP 1.2
            </button>

            <button
              onClick={onOpenMethodology}
              className="px-2.5 py-1 rounded-lg bg-surface border border-line hover:bg-surface-hover text-[11.5px] font-medium text-ink-soft hover:text-ink transition-colors"
            >
              Methodology
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
