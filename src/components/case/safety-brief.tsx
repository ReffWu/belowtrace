"use client";

import { PHONES, SOURCES } from "@/lib/facts";
import type { Case } from "@/lib/case";

export function SafetyBrief({ c, update }: { c: Case; update: (patch: Partial<Case>) => void }) {
  const done = Boolean(c.safeAcknowledgedAt);
  return (
    <section className={`rounded-3xl border-2 p-5 sm:p-6 ${done ? "border-go/30 bg-go/5" : "border-stop/40 bg-stop-tint"}`} aria-labelledby="safety-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-stop">First minute</p>
          <h2 id="safety-title" className="mt-1 text-2xl font-extrabold tracking-tight">Make sure it is safe before you enter.</h2>
        </div>
        {done && <span className="rounded-full bg-go px-3 py-1 text-sm font-bold text-white">Safety check saved</span>}
      </div>
      <ul className="mt-4 grid gap-3 text-[1.03rem] leading-relaxed text-ink-2">
        <li><strong className="text-ink">Do not enter standing water</strong> if the area has a fuse box, electrical appliances, outlets, or wires.</li>
        <li>From a dry, safe place, record when you found the water and take photos before cleanup or disposal.</li>
        <li>If there is immediate danger or a fire emergency, call <a href="tel:911" className="font-bold text-brand underline">911</a>. BelowTrace cannot assess electrical, gas, or building safety.</li>
      </ul>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!done && (
          <button type="button" onClick={() => update({ safeAcknowledgedAt: new Date().toISOString() })} className="min-h-11 rounded-xl bg-ink px-4 font-bold text-white hover:bg-brand-ink">
            I am in a safe place
          </button>
        )}
        <a href={SOURCES.floodSafety.url} target="_blank" rel="noreferrer" className="min-h-11 rounded-xl px-2 py-2 font-semibold text-brand underline decoration-brand/30 hover:decoration-brand">
          DWSD flood-safety guidance ↗
        </a>
        <a href={`tel:${PHONES.dwsd.number.replace(/\D/g, "")}`} className="min-h-11 rounded-xl px-2 py-2 font-semibold text-brand underline decoration-brand/30 hover:decoration-brand">
          Report to DWSD: {PHONES.dwsd.number}
        </a>
      </div>
    </section>
  );
}
