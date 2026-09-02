import { useState } from "react";
import type { HeatData } from "../types";
import { Badge, Note, Panel } from "./ui";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "हिन्दी (Hindi)",
  gu: "ગુજરાતી (Gujarati)",
};

/**
 * What would be dispatched — rendered, never sent.
 *
 * No gateway is wired. An alerting system that can fire during a demo is a
 * liability, and the CAP payload is stamped status=Exercise precisely so that
 * nothing downstream could mistake it for a real warning.
 */
export function AdvisoryPanel({ data }: { data: HeatData }) {
  const a = data.advisory;
  const [language, setLanguage] = useState("en");
  const [showCap, setShowCap] = useState(false);
  const verified = a.languages_verified[language] ?? false;

  return (
    <Panel
      title="The warning that would go out"
      subtitle={`For the worst-affected neighbourhood on ${data.meta.focus.date}`}
      right={<Badge tone="flag">{a.severity}</Badge>}
    >
      <div className="flex gap-1 mb-3 no-print">
        {Object.keys(a.text).map((code) => (
          <button
            key={code}
            onClick={() => setLanguage(code)}
            className={`px-2 py-1 text-[11px] border rounded-[2px] transition-colors ${
              language === code
                ? "bg-accent text-white border-accent"
                : "bg-surface text-ink-soft border-line hover:border-line-strong"
            }`}
          >
            {LANGUAGE_NAMES[code] ?? code}
            {!a.languages_verified[code] && <span className="ml-1">⚠</span>}
          </button>
        ))}
      </div>

      {!verified && (
        <div className="mb-2 px-2 py-1.5 bg-flag-bg border border-flag/30 rounded-[2px]">
          <p className="text-[11px] text-flag leading-snug">
            <strong>Unverified translation.</strong> This copy is
            machine-composed and has not been reviewed by a native speaker. It
            must not be dispatched to the public in this state.
          </p>
        </div>
      )}

      <blockquote className="border-l-2 border-accent pl-3 py-1 text-[13px] leading-relaxed text-ink">
        {a.text[language]}
      </blockquote>

      <div className="mt-3 px-2 py-1.5 bg-sunken rounded-[2px]">
        <div className="text-[10px] uppercase tracking-wider text-ink-faint">
          Operational instruction
        </div>
        <div className="text-[12px] text-ink">{a.safe_work_note}</div>
      </div>

      <button
        onClick={() => setShowCap((v) => !v)}
        className="mt-3 text-[11px] text-accent hover:underline no-print"
      >
        {showCap ? "Hide" : "Show"} CAP 1.2 payload
      </button>

      {showCap && (
        <div className="mt-2">
          <pre className="text-[10px] leading-tight bg-sunken border border-line rounded-[2px] p-2 overflow-x-auto max-h-64 font-mono">
            {a.cap_xml}
          </pre>
          <Note>
            This is the machine-readable form of the same warning, in the
            international standard format used by national emergency-alert
            systems. It means this tool could feed real alerting infrastructure
            instead of being a dashboard nobody can connect to.
          </Note>
        </div>
      )}

      <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-line">
        <Badge tone="warn">status = Exercise</Badge>
        <Badge tone="neutral">not dispatched</Badge>
        <Badge tone="flag">hi / gu unverified</Badge>
      </div>
    </Panel>
  );
}
