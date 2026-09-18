import type { Evidence } from "@/lib/types";

const STYLES = {
  recorded: { label: "Recorded", className: "bg-ink text-white border-ink" },
  estimated: { label: "Estimated", className: "bg-warn-tint text-warn border-warn/60" },
  unknown: { label: "Unknown", className: "bg-transparent text-ink-3 border-ink-3 border-dashed" },
} as const;

export function EvidenceBadge({ evidence, className = "" }: { evidence: Evidence; className?: string }) {
  const s = STYLES[evidence.level];
  const title = [evidence.source, evidence.asOf && `as of ${evidence.asOf}`, evidence.note].filter(Boolean).join(" · ");
  const body = (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-px align-[0.12em] text-[0.7rem] font-bold uppercase leading-4 tracking-wide ${s.className} ${className}`}
    >
      {s.label}
    </span>
  );
  return evidence.url ? (
    <a href={evidence.url} target="_blank" rel="noreferrer" title={title} className="no-print-url no-underline" aria-label={`${s.label}: ${title}`}>
      {body}
    </a>
  ) : (
    <span title={title} aria-label={`${s.label}: ${title}`}>
      {body}
    </span>
  );
}

export function SourceLine({ evidence }: { evidence: Evidence }) {
  return (
    <span className="text-xs text-ink-3">
      {evidence.url ? (
        <a href={evidence.url} target="_blank" rel="noreferrer" className="underline decoration-ink-3/40 hover:text-ink-2">
          {evidence.source}
        </a>
      ) : (
        evidence.source
      )}
      {evidence.asOf ? ` · ${evidence.asOf}` : ""}
      {evidence.note ? ` · ${evidence.note}` : ""}
    </span>
  );
}
