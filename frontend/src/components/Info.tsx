import { useEffect, useId, useRef, useState } from "react";
import { GLOSSARY } from "../plain";

/**
 * Inline glossary marker: a small ⓘ that explains one technical term in a
 * sentence of plain English.
 */
export function Info({ term, label }: { term: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrap = useRef<HTMLSpanElement>(null);
  const text = GLOSSARY[term];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!text) return <>{label ?? term}</>;

  return (
    <span ref={wrap} className="relative inline-flex items-baseline gap-1">
      <span className="border-b border-dotted border-ink-soft/60 cursor-help">
        {label ?? term}
      </span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        aria-label={`What does ${term} mean?`}
        className="no-print inline-grid place-items-center w-4 h-4 rounded-full border border-accent/40 bg-accent-soft text-accent text-[10px] font-bold leading-none hover:bg-accent hover:text-white hover:border-accent transition-all shadow-2xs"
      >
        i
      </button>
      {open && (
        <span
          id={id}
          role="note"
          className="absolute z-50 left-0 top-6 w-72 bg-surface border border-line-strong rounded-lg p-3 text-[12px] leading-relaxed text-ink font-normal normal-case tracking-normal shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
        >
          <span className="flex items-center justify-between border-b border-line pb-1.5 mb-1.5">
            <strong className="text-[11px] uppercase tracking-wider font-semibold text-accent">
              {term}
            </strong>
            <span className="text-[10px] text-ink-faint">Glossary term</span>
          </span>
          {text}
        </span>
      )}
    </span>
  );
}

