import { useEffect, useId, useRef, useState } from "react";
import { GLOSSARY } from "../plain";

/**
 * Inline glossary marker: a small ⓘ that explains one technical term in a
 * sentence of plain English.
 *
 * Built as a real <button> with aria-expanded and aria-controls rather than a
 * hover tooltip, because hover tooltips are unreachable by keyboard, unusable on
 * touch, and invisible to screen readers — which would defeat the point of
 * adding an explanation in the first place.
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
    <span ref={wrap} className="relative inline-block">
      {label ?? term}{" "}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        aria-label={`What does ${term} mean?`}
        className="no-print align-middle w-4 h-4 rounded-full border border-line-strong text-ink-soft text-[9px] leading-none hover:bg-accent hover:text-white hover:border-accent"
      >
        i
      </button>
      {open && (
        <span
          id={id}
          role="note"
          className="absolute z-50 left-0 top-6 w-64 bg-surface border border-line-strong rounded-sm p-2.5 text-[12px] leading-relaxed text-ink font-normal normal-case tracking-normal"
          style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.13)" }}
        >
          <strong className="block text-[11px] uppercase tracking-wider text-ink-soft mb-1">
            {term}
          </strong>
          {text}
        </span>
      )}
    </span>
  );
}
