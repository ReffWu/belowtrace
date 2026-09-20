"use client";

import { useId } from "react";
import { claimDeadline } from "@/lib/plan";
import { type Case, type CaseTracker, type TrackerId, type TrackerStatus } from "@/lib/case";
import { SOURCES } from "@/lib/facts";
import { longDate } from "./store";

const STATUS: { value: TrackerStatus; label: string }[] = [
  { value: "not-started", label: "Not started" },
  { value: "submitted", label: "Submitted" },
  { value: "waiting", label: "Waiting for a response" },
  { value: "more-info", label: "More information requested" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "complete", label: "Complete" },
  { value: "not-approved", label: "Not approved" },
];

function updateTracker(c: Case, update: (patch: Partial<Case>) => void, id: TrackerId, patch: Partial<CaseTracker>) {
  update({ trackers: { ...c.trackers, [id]: { status: c.trackers?.[id]?.status ?? "not-started", ...c.trackers?.[id], ...patch } } });
}

function Tracker({ c, update, id, title, note, link }: { c: Case; update: (patch: Partial<Case>) => void; id: TrackerId; title: string; note: React.ReactNode; link?: { href: string; label: string } }) {
  const tracker = c.trackers?.[id] ?? { status: "not-started" };
  const referenceId = useId();
  const dueId = useId();
  const lastActionId = useId();
  const noteId = useId();
  return (
    <li className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="text-lg font-extrabold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-ink-2">{note}</p></div>
        {link && <a href={link.href} target="_blank" rel="noreferrer" className="min-h-10 rounded-lg px-1 py-2 text-sm font-bold text-brand underline decoration-brand/30 hover:decoration-brand">{link.label} ↗</a>}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold">Status
          <select value={tracker.status} onChange={(e) => updateTracker(c, update, id, { status: e.target.value as TrackerStatus })} className="h-11 rounded-lg border-2 border-line-2 bg-surface px-3 font-normal">
            {STATUS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </label>
        <label htmlFor={referenceId} className="grid gap-1.5 text-sm font-semibold">Reference or case number
          <input id={referenceId} value={tracker.reference ?? ""} onChange={(e) => updateTracker(c, update, id, { reference: e.target.value })} className="h-11 rounded-lg border-2 border-line-2 bg-surface px-3 font-normal" placeholder="Save it when you receive one" />
        </label>
        <label htmlFor={lastActionId} className="grid gap-1.5 text-sm font-semibold">Last action date
          <input id={lastActionId} type="date" value={tracker.lastAction ?? ""} onChange={(e) => updateTracker(c, update, id, { lastAction: e.target.value })} className="h-11 rounded-lg border-2 border-line-2 bg-surface px-3 font-normal" />
        </label>
        <label htmlFor={dueId} className="grid gap-1.5 text-sm font-semibold">Deadline shown in your notice
          <input id={dueId} type="date" value={tracker.due ?? ""} onChange={(e) => updateTracker(c, update, id, { due: e.target.value })} className="h-11 rounded-lg border-2 border-line-2 bg-surface px-3 font-normal" />
        </label>
      </div>
      <label htmlFor={noteId} className="mt-3 grid gap-1.5 text-sm font-semibold">What did they tell you?
        <textarea id={noteId} value={tracker.note ?? ""} onChange={(e) => updateTracker(c, update, id, { note: e.target.value })} rows={2} className="rounded-lg border-2 border-line-2 bg-surface p-3 font-normal" placeholder="Record the next step in your own words" />
      </label>
      <p className="mt-3 text-xs text-ink-3">This is saved only in this browser. A date here is your record of an official notice; BelowTrace does not create, extend, or submit a deadline.</p>
    </li>
  );
}

export function CaseTrackers({ c, update, hasPsrp }: { c: Case; update: (patch: Partial<Case>) => void; hasPsrp: boolean }) {
  const deadline = claimDeadline(c.found);
  return (
    <section className="mt-10 rounded-3xl bg-sunk p-5 sm:p-6" aria-labelledby="tracking-title">
      <p className="text-sm font-bold uppercase tracking-[0.12em] text-own">Stay with the case</p>
      <h2 id="tracking-title" className="mt-1 text-2xl font-extrabold tracking-tight">Applications and repairs do not end when you click a link.</h2>
      <p className="mt-2 text-ink-2">Keep each path separate. Record only dates and numbers you actually receive.</p>
      <ul className="mt-5 grid gap-3">
        <Tracker c={c} update={update} id="claim" title="DWSD damage claim" note={<>The official deadline is <strong>{longDate(deadline)}</strong>, 45 days after the date you found the backup. An SR number is required before filing.</>} link={{ href: SOURCES.claims.url, label: "Claim instructions" }} />
        {hasPsrp && <Tracker c={c} update={update} id="psrp" title="Private Sewer Repair Program" note={<>This address is in the mapped program area. That is not approval; keep the official eligibility review and any document deadline here.</>} link={{ href: SOURCES.psrp.url, label: "Program conditions" }} />}
        <Tracker c={c} update={update} id="repair" title="Inspection or repair" note={<>Track your camera inspection, licensed contractor, permit questions, and final work separately from any claim or program application.</>} />
      </ul>
      <div className="mt-5 border-t border-line pt-5">
        <p className="text-sm text-ink-2">Only mark the case complete after the repair or your chosen stopping point is actually complete. This changes this browser&apos;s record only; it does not notify DWSD, HRD, an insurer, or a contractor.</p>
        {!c.closedAt && <button type="button" onClick={() => update({ closedAt: new Date().toLocaleDateString("en-CA", { timeZone: "America/Detroit" }) })} className="mt-3 min-h-11 rounded-xl border-2 border-line-2 bg-surface px-4 font-bold hover:border-ink">Mark my local case complete</button>}
      </div>
    </section>
  );
}
