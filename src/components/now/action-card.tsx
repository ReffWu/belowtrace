"use client";

import { useState } from "react";
import Link from "next/link";
import { contactFor, windowLabel, type ActionState } from "@/lib/agenda";
import type { NoticeClock } from "@/lib/law";
import { CallCard } from "./call-card";

const URGENCY = {
  danger: { label: "Safety", dot: "bg-stop", ring: "border-stop/40 bg-stop-tint" },
  irreversible: { label: "Cannot be undone", dot: "bg-own", ring: "border-own/35 bg-surface" },
  window: { label: "Closing", dot: "bg-warn", ring: "border-warn/35 bg-surface" },
  steady: { label: "Next", dot: "bg-ink-3", ring: "border-line bg-surface" },
} as const;

export function ActionCard({
  state,
  clock,
  onDone,
  defaultOpen = false,
  children,
}: {
  state: ActionState;
  clock: NoticeClock;
  onDone?: () => void;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}) {
  const { action } = state;
  const [open, setOpen] = useState(defaultOpen);
  const u = URGENCY[action.urgency];
  const contact = contactFor(action);
  const when = windowLabel(state, clock);
  const bodyId = `body-${action.id}`;
  const hasBody = Boolean(action.points?.length || action.script?.length || contact || action.link || action.warn || children);
  const canTick = Boolean(onDone) && !action.standing;

  return (
    <li className={`min-w-0 rounded-3xl border-2 p-5 sm:p-6 ${u.ring}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
        <p className="flex items-center gap-2 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-ink-2">
          <span className={`h-2 w-2 rounded-full ${u.dot}`} aria-hidden="true" />
          {u.label}
        </p>
        {when && <span className="shrink-0 rounded-full bg-ink/5 px-2.5 py-1 text-[0.8rem] font-bold text-ink-2">{when}</span>}
      </div>

      <h3 className="mt-2 text-[1.45rem] font-extrabold leading-[1.12] tracking-[-0.02em]">{action.title}</h3>
      <p className="mt-2 text-[1.05rem] leading-relaxed text-ink-2">{action.why}</p>

      {!open && (hasBody || canTick) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-5">
          {hasBody && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={false}
              aria-controls={bodyId}
              className="min-h-11 font-bold text-brand underline decoration-brand/30 underline-offset-4"
            >
              How to do it
            </button>
          )}
          {canTick && (
            <button type="button" onClick={onDone} className="min-h-11 font-semibold text-ink-3 underline decoration-line-2 underline-offset-4 hover:text-ink">
              Already done
            </button>
          )}
        </div>
      )}

      {open && (
        <div id={bodyId} className="mt-4 grid gap-4">
          {action.script && (
            <div className="rounded-2xl bg-brand-tint/70 p-4">
              <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-brand-ink/70">Say this</p>
              <ol className="mt-2 grid gap-2">
                {action.script.map((line) => (
                  <li key={line} className="text-[1.05rem] font-semibold leading-snug text-brand-ink">
                    &ldquo;{line}&rdquo;
                  </li>
                ))}
              </ol>
            </div>
          )}

          {contact && <CallCard contact={contact} tone={action.urgency === "danger" ? "quiet" : "primary"} />}

          {action.points && (
            <ul className="grid gap-2.5">
              {action.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-[1.03rem] leading-relaxed text-ink-2">
                  <span aria-hidden="true" className="mt-[0.62rem] h-1.5 w-1.5 shrink-0 rounded-full bg-line-2" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}

          {action.warn && <p className="rounded-2xl bg-warn-tint p-4 text-[1.02rem] leading-relaxed text-[#6b3d00]">{action.warn}</p>}

          {children}

          {action.link && (
            <Link
              href={action.link.href}
              className="flex min-h-14 items-center justify-between rounded-2xl bg-ink px-5 font-bold text-white transition hover:bg-brand-ink"
            >
              {action.link.label} <span aria-hidden="true">→</span>
            </Link>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {canTick && (
              <button type="button" onClick={onDone} className="min-h-12 rounded-xl border-2 border-ink px-5 font-bold transition hover:bg-ink hover:text-white">
                Mark done
              </button>
            )}
            {!defaultOpen && (
              <button type="button" onClick={() => setOpen(false)} className="min-h-12 rounded-xl px-3 font-semibold text-ink-3 hover:text-ink">
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
