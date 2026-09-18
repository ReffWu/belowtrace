import type { ProgramCard as Card } from "@/lib/types";
import { EvidenceBadge } from "@/components/evidence-badge";

const STATUS: Record<Card["status"], string> = {
  open: "bg-go-tint text-go",
  "closing-soon": "bg-own text-white",
  upcoming: "bg-brand-tint text-brand-ink",
  paused: "bg-sunk text-ink-2",
  closed: "bg-sunk text-ink-2",
  always: "bg-sunk text-ink",
};

const VERDICT: Partial<Record<Card["verdict"], { label: string; className: string }>> = {
  likely: { label: "Likely fits", className: "border-go text-go" },
  possible: { label: "Worth asking", className: "border-go text-go" },
  check: { label: "Check eligibility", className: "border-brand text-brand" },
  unlikely: { label: "Unlikely here", className: "border-stop text-stop" },
};

function fmtDeadline(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Detroit",
  });
}

export function ProgramCard({ card, children }: { card: Card; children?: React.ReactNode }) {
  const verdict = VERDICT[card.verdict];
  // The PSRP screener renders inside the card, so its jump link would be redundant here.
  const actions = card.actions.filter((a) => a.kind !== "screener");
  return (
    <article id={`program-${card.id}`} className="print-break-avoid scroll-mt-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${STATUS[card.status]}`}>{card.statusLabel}</span>
        {verdict && <span className={`rounded-full border-2 px-2.5 py-px text-sm font-bold ${verdict.className}`}>{verdict.label}</span>}
      </div>
      <h3 className="mt-3 text-xl font-bold tracking-tight">{card.name}</h3>
      {card.amount && <p className="mt-0.5 font-medium text-ink-2">{card.amount}</p>}
      <p className="mt-3 text-[1.05rem] leading-relaxed text-ink">{card.headline}</p>

      {card.deadline && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-own-tint px-3 py-1.5 text-sm font-semibold text-[#8a4700]">
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="currentColor">
            <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm.75 4a.75.75 0 0 0-1.5 0v4.25c0 .2.08.39.22.53l2.5 2.5a.75.75 0 1 0 1.06-1.06l-2.28-2.28V6Z" />
          </svg>
          {card.deadline.label}: {fmtDeadline(card.deadline.date)}
        </p>
      )}

      {card.reasons.length > 0 && (
        <ul className="mt-4 space-y-2.5 border-t border-line pt-4">
          {card.reasons.map((r) => (
            <li key={r.text} className="flex gap-2 text-[0.95rem] text-ink-2">
              <span className="mt-0.5 shrink-0">
                <EvidenceBadge evidence={r.evidence} />
              </span>
              <span>{r.text}</span>
            </li>
          ))}
        </ul>
      )}

      {children}

      {actions.length > 0 && (
        <div className="no-print mt-5 flex flex-wrap gap-2">
          {actions.map((a, i) => (
            <a
              key={a.label}
              href={a.href}
              {...(a.kind === "link" ? { target: "_blank", rel: "noreferrer" } : {})}
              className={
                i === 0
                  ? "inline-flex min-h-11 items-center rounded-xl bg-brand px-4 font-semibold text-white hover:bg-brand-ink"
                  : "inline-flex min-h-11 items-center rounded-xl border-2 border-line-2 bg-surface px-4 font-semibold text-ink hover:border-brand hover:text-brand"
              }
            >
              {a.label}
            </a>
          ))}
        </div>
      )}
      {actions.length > 0 && (
        <p className="only-print mt-2 text-sm font-semibold">
          {actions.map((a) => (a.kind === "phone" ? a.label : `${a.label}: ${a.href.replace(/^https?:\/\//, "")}`)).join("  ·  ")}
        </p>
      )}
      <p className="mt-4 text-xs text-ink-3 print:mt-1">
        Source:{" "}
        <a href={card.source.url} target="_blank" rel="noreferrer" className="underline decoration-ink-3/40">
          {card.source.label}
        </a>{" "}
        · checked {card.verifiedOn}
      </p>
    </article>
  );
}

export function UnavailableList({ cards }: { cards: Card[] }) {
  return (
    <div className="print-break-avoid rounded-2xl border border-dashed border-line-2 p-5">
      <h3 className="font-bold">Checked, but not available right now</h3>
      <p className="mt-1 text-sm text-ink-2">People often get sent to these. Save yourself the call.</p>
      <ul className="mt-3 divide-y divide-line">
        {cards.map((c) => (
          <li key={c.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-4">
            <span className="min-w-56 font-semibold">
              <a href={c.source.url} target="_blank" rel="noreferrer" className="underline decoration-line-2 hover:decoration-ink">
                {c.shortName}
              </a>
            </span>
            <span className="text-sm text-ink-2">
              <span className="mr-2 rounded bg-sunk px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-ink-2">{c.statusLabel}</span>
              {c.headline}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
