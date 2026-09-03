import { useState } from "react";
import type { HeatData } from "../types";

interface CapExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: HeatData;
}

export function CapExportModal({ isOpen, onClose, data }: CapExportModalProps) {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const xml = data.advisory?.cap_xml ?? '<?xml version="1.0" encoding="UTF-8"?>\n<alert>No alert payload generated</alert>';

  const handleCopy = () => {
    navigator.clipboard.writeText(xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `heatlens-cap-alert-${data.meta.focus.date}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="card w-full max-w-2xl bg-white border border-slate-300 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h2 className="font-bold text-[15px] text-ink">Common Alerting Protocol (CAP 1.2) Payload</h2>
            <p className="text-[11.5px] text-ink-soft">
              Standard OASIS XML format ready for NDMA SACHET and state emergency gateways
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink px-2 py-1 rounded-md text-[16px]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 overflow-auto max-h-[360px]">
          <pre className="font-mono text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed">
            {xml}
          </pre>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-ink-faint">
            Compliant with NDMA National Disaster Management Authority specifications
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-surface border border-line hover:bg-slate-50 text-ink text-[11.5px] font-medium transition-colors"
            >
              {copied ? "Copied" : "Copy XML"}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-sky-700 text-[11.5px] font-medium transition-colors"
            >
              Download .XML File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
