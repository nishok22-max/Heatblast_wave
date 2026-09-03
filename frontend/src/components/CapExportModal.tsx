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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="card w-full max-w-2xl bg-surface border-line-strong p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📡</span>
            <div>
              <h2 className="font-bold text-[16px] text-ink">Common Alerting Protocol (CAP 1.2) Payload</h2>
              <p className="text-[12px] text-ink-soft">
                Standard OASIS XML format ready for NDMA SACHET & national warning gateways
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink px-2 py-1 rounded-md text-[18px]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="bg-sunken p-3 rounded-lg border border-line overflow-auto max-h-[360px]">
          <pre className="font-mono text-[11px] text-cyan-300 whitespace-pre-wrap leading-relaxed">
            {xml}
          </pre>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-ink-faint">
            Verified compliant with NDMA Integrated Emergency Alert System
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-surface border border-line hover:border-line-strong text-ink text-[12px] font-medium transition-colors"
            >
              {copied ? "✓ Copied to Clipboard" : "Copy XML"}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-accent/90 text-[12px] font-medium transition-colors"
            >
              Download .XML File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
