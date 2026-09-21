"use client";

// The 45-day notice, written for them.
//
// The statute asks for six facts (MCL 691.1419(2)(c)). The case already holds four. So this
// asks for a name and a phone number and then produces two finished letters, one for the City,
// one for the regional authority, because the system has two owners and neither forwards.
import Link from "next/link";
import { useState } from "react";
import { markSent, noticeReady, todayInDetroit, unmarkSent, type Case } from "@/lib/case";
import { CITATION, NOTICE_CONTENT, NOTICE_DAYS, noticeClock } from "@/lib/law";
import { NOTICE_RECIPIENTS, SENDING, WHY_TWO, compose, fieldsFrom, missing, type NoticeFields } from "@/lib/notice";
import type { NoticeRecipient } from "@/lib/contacts";
import { save, useActiveCase } from "@/lib/store";

export function NoticeView() {
  const c = useActiveCase();
  const today = todayInDetroit();

  if (c === undefined) return <div className="mx-auto h-[60vh] max-w-xl" aria-busy="true" />;
  if (c === null) return <Empty />;

  const clock = noticeClock(c.foundOn, today);
  const fields = fieldsFrom(c);
  const gaps = missing(fields);
  const ready = noticeReady(c);
  const update = (next: Case) => save(next);

  return (
    <div className="mx-auto max-w-xl px-5 pb-20 pt-7">
      <Link href="/now" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-semibold text-ink-2 hover:text-ink">
        <span aria-hidden="true">←</span> Back
      </Link>

      <div className={`no-print mt-5 overflow-hidden rounded-3xl text-white ${clock.state === "open" ? "bg-ink" : clock.state === "urgent" ? "bg-warn" : "bg-stop"}`}>
        <div className="p-6 sm:p-7">
          {clock.state === "passed" ? (
            <p className="text-[1.6rem] font-extrabold leading-tight">The 45 days have passed. Send it anyway.</p>
          ) : (
            <>
              <p className="text-[3.4rem] font-extrabold leading-none tabular-nums">{Math.max(clock.daysLeft, 0)}</p>
              <p className="mt-1 text-[1.1rem] text-white/75">{clock.daysLeft === 1 ? "day left to put this in writing" : "days left to put this in writing"}</p>
            </>
          )}
        </div>
      </div>

      <h1 className="mt-7 text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.03em]">
        The law asks for six things.
      </h1>
      <p className="mt-3 text-[1.1rem] leading-relaxed text-ink-2">
        Not estimates. Not receipts. Not a dollar figure. Six facts, in writing, within {NOTICE_DAYS} days of the day you found the
        water, and then the rest can follow at your own pace.{" "}
        <a href={CITATION.notice.url} target="_blank" rel="noreferrer" className="font-semibold text-brand underline">
          {CITATION.notice.label} ↗
        </a>
      </p>

      <ol className="no-print mt-6 grid gap-2">
        {NOTICE_CONTENT.map((f) => {
          const have = has(fields, f.id);
          return (
            <li key={f.id} className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${have ? "bg-go-tint" : "bg-sunk/70"}`}>
              <span aria-hidden="true" className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.8rem] font-bold text-white ${have ? "bg-go" : "bg-line-2"}`}>
                {have ? "✓" : ""}
              </span>
              <span className={have ? "font-semibold" : "text-ink-2"}>{f.label}</span>
            </li>
          );
        })}
      </ol>

      {gaps.length > 0 && (
        <section className="no-print mt-7 rounded-3xl border-2 border-own/35 bg-surface p-5 sm:p-6">
          <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">I need {gaps.join(" and ")}.</h2>
          <p className="mt-2 text-ink-2">Used on the letter only. It stays on this phone.</p>
          <div className="mt-4 grid gap-4">
            {!fields.name && <Text label="Your full name" autoFocus value={c.name ?? ""} onChange={(v) => update({ ...c, name: v })} />}
            {!fields.phone && <Text label="Your phone number" value={c.phone ?? ""} onChange={(v) => update({ ...c, phone: v })} />}
            {!fields.property && <Text label="The property address" value={c.address ?? ""} onChange={(v) => update({ ...c, address: v })} />}
          </div>
        </section>
      )}

      {ready && (
        <div className="mt-8 grid gap-8">
          {NOTICE_RECIPIENTS.map((to) => (
            <Letter key={to.id} to={to} fields={fields} today={today} sentOn={c.noticeSentOn?.[to.id]} onSent={() => update(markSent(c, to.id))} onUndo={() => update(unmarkSent(c, to.id))} />
          ))}
        </div>
      )}

      <section className="no-print mt-10 rounded-3xl bg-sunk/70 p-5 sm:p-6">
        <h2 className="text-[1.25rem] font-extrabold tracking-[-0.02em]">{WHY_TWO.title}</h2>
        <p className="mt-2 leading-relaxed text-ink-2">{WHY_TWO.body}</p>
        <a href={WHY_TWO.cite.url} target="_blank" rel="noreferrer" className="mt-2 inline-block font-semibold text-brand underline">
          {WHY_TWO.cite.label} ↗
        </a>
      </section>

      <section className="no-print mt-8">
        <h2 className="text-[1.25rem] font-extrabold tracking-[-0.02em]">Getting it there</h2>
        <ul className="mt-4 grid gap-4">
          {SENDING.map((s) => (
            <li key={s.title}>
              <p className="font-bold">{s.title}</p>
              <p className="mt-1 leading-relaxed text-ink-2">{s.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="no-print mt-10 text-[0.95rem] leading-relaxed text-ink-3">
        This is a letter, not legal advice, and sending it does not decide anything. It keeps a door open that closes on its own.
      </p>
    </div>
  );
}

function Letter({
  to,
  fields,
  today,
  sentOn,
  onSent,
  onUndo,
}: {
  to: NoticeRecipient;
  fields: NoticeFields;
  today: string;
  sentOn?: string;
  onSent: () => void;
  onUndo: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const text = compose(fields, to, today);
  const needsSr = to.needsServiceRequest && !fields.serviceRequest;

  return (
    <section className="print-break-avoid overflow-hidden rounded-3xl border-2 border-line bg-surface">
      <header className="border-b border-line bg-sunk/50 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[1.25rem] font-extrabold tracking-[-0.02em]">{to.agency}</h2>
          {sentOn && <span className="rounded-full bg-go px-3 py-1 text-[0.85rem] font-bold text-white">Mailed</span>}
        </div>
        <p className="mt-1.5 leading-relaxed text-ink-2">{to.why}</p>
      </header>

      <div className="px-5 py-5 sm:px-6">
        {needsSr && (
          <p className="no-print mb-4 rounded-2xl bg-warn-tint p-4 leading-relaxed text-[#6b3d00]">
            DWSD asks for a service request number. You can send this without one, do not let a missing number push you past the
            deadline, but call {to.phone} and add it when you have it.
          </p>
        )}

        <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl bg-paper p-4 font-mono text-[0.82rem] leading-relaxed text-ink">
          {text}
        </pre>

        <div className="no-print mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className="min-h-12 rounded-xl bg-ink px-5 font-bold text-white hover:bg-brand-ink">
            Print
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2200);
              } catch {
                setCopied(false);
              }
            }}
            className="min-h-12 rounded-xl border-2 border-line-2 px-5 font-bold hover:border-ink"
          >
            {copied ? "Copied" : "Copy text"}
          </button>
          {to.online && (
            <a href={to.online.url} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center rounded-xl px-4 font-semibold text-brand hover:bg-brand-tint">
              {to.online.label} ↗
            </a>
          )}
        </div>

        <div className="no-print mt-5 rounded-2xl bg-sunk/60 p-4">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-ink-3">Mail to</p>
          <address className="mt-1.5 not-italic font-semibold leading-snug">
            {to.lines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </address>
          <p className="mt-2 text-[0.95rem] text-ink-2">{to.confirm}</p>
        </div>

        <div className="no-print mt-4">
          {sentOn ? (
            <button type="button" onClick={onUndo} className="min-h-11 px-1 font-semibold text-ink-3 underline">
              Marked mailed on {new Date(`${sentOn}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" })} · undo
            </button>
          ) : (
            <button type="button" onClick={onSent} className="min-h-12 w-full rounded-xl border-2 border-ink font-bold hover:bg-ink hover:text-white">
              I mailed this one
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

const has = (f: NoticeFields, id: string) =>
  id === "name" ? Boolean(f.name) : id === "phone" ? Boolean(f.phone) : id === "address" ? Boolean(f.mailing) : id === "property" ? Boolean(f.property) : true;

function Text({ label, value, autoFocus, onChange }: { label: string; value: string; autoFocus?: boolean; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1.5">
      <span className="font-semibold">{label}</span>
      <input autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value)} className="h-14 w-full rounded-xl border-2 border-line-2 bg-surface px-4 text-lg outline-none focus:border-ink" />
    </label>
  );
}

function Empty() {
  return (
    <div className="mx-auto max-w-xl px-5 pb-20 pt-10">
      <h1 className="text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.03em]">No case open yet.</h1>
      <p className="mt-3 text-[1.1rem] text-ink-2">The notice is written from the day you found the water and the property address.</p>
      <Link href="/now" className="mt-6 inline-flex min-h-14 items-center rounded-2xl bg-ink px-6 font-bold text-white">
        Start one →
      </Link>
    </div>
  );
}
