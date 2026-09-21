"use client";

// One page to hand to DWSD, a plumber, an adjuster or a program intake worker.
// Only facts that were recorded appear. Nothing here is inferred, scored or predicted.
import { useState } from "react";
import { neighborReading, todayInDetroit, type Case } from "@/lib/case";
import { CONTACTS } from "@/lib/contacts";
import { noticeDeadline } from "@/lib/law";
import { remove } from "@/lib/store";
import type { AddressContext } from "@/lib/use-address-context";

const day = (d?: string) =>
  d ? new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : null;

export function CaseFacts({ c, update, ctx }: { c: Case; update: (c: Case) => void; ctx: AddressContext }) {
  const [editing, setEditing] = useState(false);
  const sent = c.noticeSentOn ?? {};

  const rows: [string, string | null][] = [
    ["Property", c.address ?? null],
    ["Parcel", ctx.parcelId ?? null],
    ["Water found", day(c.foundOn)],
    ["Depth", c.waterDepth || null],
    ["DWSD service request", c.serviceRequest || null],
    ["Insurance claim", c.insuranceClaim || null],
    ["Neighbors", c.neighbors === "same" ? "Others on the block backed up too" : c.neighbors === "only-me" ? "Only this home" : null],
    ["Notice deadline", day(noticeDeadline(c.foundOn))],
    ["Notice to DWSD", day(sent.dwsd)],
    ["Notice to GLWA", day(sent.glwa)],
    ["Who owns the pipe", c.whose === "city" ? `The City's, ${c.whoseBasis || "as told to me"}` : c.whose === "mine" ? `The owner's, ${c.whoseBasis || "as told to me"}` : null],
  ];

  return (
    <section className="mt-10" aria-labelledby="case-facts">
      <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="case-facts" className="text-[1.25rem] font-extrabold tracking-[-0.02em]">
            What you have on record
          </h2>
          <span className="only-print text-sm">BelowTrace Detroit · printed {day(todayInDetroit())}</span>
          <div className="no-print flex gap-1">
            <button type="button" onClick={() => window.print()} className="min-h-11 rounded-lg px-3 font-semibold text-brand hover:bg-brand-tint">
              Print
            </button>
            <button type="button" onClick={() => setEditing((v) => !v)} className="min-h-11 rounded-lg px-3 font-semibold text-ink-2 hover:bg-sunk">
              {editing ? "Done" : "Edit"}
            </button>
          </div>
        </div>

        <dl className="mt-4 divide-y divide-line">
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="grid gap-1 py-2.5 sm:grid-cols-[10rem_1fr] sm:gap-3">
              <dt className="text-[0.95rem] text-ink-3">{k}</dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        {neighborReading(c.neighbors) && (
          <p className="mt-4 rounded-2xl bg-sunk/70 p-4 leading-relaxed text-ink-2">{neighborReading(c.neighbors)}</p>
        )}

        {editing && (
          <div className="no-print mt-5 grid gap-4 border-t border-line pt-5">
            <Text label="Your name" hint="Only used on the written notice." value={c.name ?? ""} onChange={(v) => update({ ...c, name: v })} />
            <Text label="Your phone" value={c.phone ?? ""} onChange={(v) => update({ ...c, phone: v })} />
            <Text label="Service request number" value={c.serviceRequest ?? ""} onChange={(v) => update({ ...c, serviceRequest: v })} />
            <Text label="Insurance claim number" value={c.insuranceClaim ?? ""} onChange={(v) => update({ ...c, insuranceClaim: v })} />
            <Text label="How deep the water got" value={c.waterDepth ?? ""} onChange={(v) => update({ ...c, waterDepth: v })} />
            <label className="grid gap-1.5">
              <span className="font-semibold">Anything else worth recording</span>
              <textarea
                rows={3}
                value={c.damageNote ?? ""}
                onChange={(e) => update({ ...c, damageNote: e.target.value })}
                placeholder="What was damaged, who you spoke to, what they said"
                className="rounded-xl border-2 border-line-2 bg-surface p-3 outline-none focus:border-ink"
              />
            </label>
            <Whose c={c} update={update} />
            <button
              type="button"
              onClick={() => confirm("Delete this case from this phone? It cannot be recovered.") && remove(c.id)}
              className="min-h-12 rounded-xl px-3 text-left font-semibold text-stop hover:bg-stop-tint"
            >
              Delete this case
            </button>
          </div>
        )}

        <p className="mt-4 border-t border-line pt-4 text-[0.95rem] text-ink-2">
          DWSD {CONTACTS.dwsd.phone} · GLWA {CONTACTS.glwa.phone} · Saved on this phone only.
        </p>
      </div>
    </section>
  );
}

/** "Whose pipe" is recorded as something a person was told, with who told them. Never a verdict. */
function Whose({ c, update }: { c: Case; update: (c: Case) => void }) {
  const OPTIONS = [
    { v: "unknown", l: "Nobody has said yet" },
    { v: "city", l: "I was told it is the City's sewer" },
    { v: "mine", l: "I was told it is my own line" },
  ] as const;
  return (
    <div role="group" aria-label="Whose pipe">
      <p className="font-semibold">Has anyone said whose pipe it is?</p>
      <div className="mt-2 grid gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.v}
            type="button"
            aria-pressed={c.whose === o.v}
            onClick={() => update({ ...c, whose: o.v })}
            className={`min-h-12 rounded-xl border-2 px-4 text-left font-semibold ${c.whose === o.v ? "border-ink bg-ink text-white" : "border-line-2 bg-surface hover:border-ink"}`}
          >
            {o.l}
          </button>
        ))}
      </div>
      {c.whose && c.whose !== "unknown" && (
        <>
          <div className="mt-3">
            <Text label="Who told you, and when" value={c.whoseBasis ?? ""} onChange={(v) => update({ ...c, whoseBasis: v })} />
          </div>
          {c.whose === "mine" && (
            <p className="mt-3 rounded-2xl bg-warn-tint p-4 leading-relaxed text-[#6b3d00]">
              Send the written notice anyway. A plumber&apos;s opinion is not the City&apos;s finding, the letter costs a stamp, and the
              45 days do not pause while anyone works it out.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Text({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1.5">
      <span className="font-semibold">{label}</span>
      {hint && <span className="text-[0.95rem] text-ink-3">{hint}</span>}
      <input value={value} onChange={(e) => onChange(e.target.value)} className="h-14 w-full rounded-xl border-2 border-line-2 bg-surface px-4 text-lg outline-none focus:border-ink" />
    </label>
  );
}
