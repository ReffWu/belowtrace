"use client";

import Link from "next/link";
import { useState } from "react";
import type { AsrpAssessment } from "@/lib/asrp";
import { ASRP, CALIBRATION, VERDICT_TONE } from "@/lib/asrp";
import { OWNER_LABEL, type Payer, type Segment } from "@/lib/anatomy";
import type { Report } from "@/lib/types";
import { SOURCES } from "@/lib/facts";
import { CONTACTS, type ContactId } from "@/lib/contacts";
import { CallCard } from "@/components/now/call-card";
import { OwnershipDiagram } from "./ownership-diagram";
import { RecordsMap } from "./records-map";
import { PsrpScreener } from "./psrp-screener";
import { SourceLine } from "@/components/evidence-badge";

const TONE = {
  good: { bar: "bg-go", chip: "bg-go text-white", ring: "border-go/40" },
  info: { bar: "bg-brand", chip: "bg-brand text-white", ring: "border-brand/40" },
  warn: { bar: "bg-warn", chip: "bg-warn text-white", ring: "border-warn/40" },
  stop: { bar: "bg-stop", chip: "bg-stop text-white", ring: "border-stop/40" },
} as const;

const STATUS: Record<Payer["status"], { label: string; cls: string }> = {
  yes: { label: "Likely covered", cls: "bg-go-tint text-[#14532d]" },
  maybe: { label: "Worth checking", cls: "bg-brand-tint text-brand-ink" },
  no: { label: "Not here", cls: "bg-sunk text-ink-3" },
  unknown: { label: "Confirm", cls: "bg-warn-tint text-[#6b3d00]" },
  info: { label: "", cls: "" },
};

export function AnatomyReport({
  report: r,
  asrp,
  segments,
  verdict,
}: {
  report: Report;
  asrp: AsrpAssessment;
  segments: Segment[];
  verdict: { headline: string; sub: string };
}) {
  const [open, setOpen] = useState<string | null>("connection");
  const tone = TONE[VERDICT_TONE[asrp.verdict]];
  const street = r.address.split(",")[0];

  return (
    <article className="mx-auto max-w-2xl px-5 pb-20 pt-6">
      <Link href="/" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-semibold text-ink-2 hover:text-ink">
        <span aria-hidden="true">←</span> Another address
      </Link>

      <header className="mt-5">
        <h1 className="text-[1.5rem] font-extrabold tracking-[-0.02em]">{street}</h1>
        <p className="mt-1 text-ink-3">
          {r.psrpNeighborhood.name ?? "Detroit"}
          {asrp.district ? ` · District ${asrp.district}` : ""}
          {r.parcel?.yearBuilt ? ` · built ${r.parcel.yearBuilt}` : ""}
        </p>
      </header>

      {/* The one line. */}
      <section className={`mt-6 overflow-hidden rounded-3xl border-2 bg-surface ${tone.ring}`}>
        <div className={`h-1.5 ${tone.bar}`} />
        <div className="p-6 sm:p-7">
          <h2 className="text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.03em] sm:text-[2rem]">{verdict.headline}</h2>
          <p className="mt-3 text-[1.08rem] leading-relaxed text-ink-2">{verdict.sub}</p>
          <div className="mt-5">
            <CallCard contact={CONTACTS.dwsd} defaultOpen />
          </div>
        </div>
      </section>

      {r.warnings.length > 0 && (
        <div className="mt-5 rounded-2xl bg-warn-tint px-4 py-3 text-[0.95rem] text-[#6b3d00]" role="note">
          {r.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}

      {/* What is under the house. */}
      <section className="mt-10">
        <h2 className="text-[1.35rem] font-extrabold tracking-[-0.025em]">What is under this house</h2>
        <p className="mt-2 leading-relaxed text-ink-2">
          Six segments. The $15,000 lands on you or on the City depending entirely on which one broke — and the private line is never
          drawn here, because no public record locates it.
        </p>
        <div className="mt-5">
          <OwnershipDiagram parcel={r.parcel} main={r.nearestMain} side={r.mainSide} site={r.site} center={r.lngLat} />
        </div>
      </section>

      {/* The six segments. */}
      <section className="mt-10">
        <ol className="grid gap-3">
          {segments.map((s) => (
            <SegmentCard key={s.id} s={s} open={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)} asrp={s.spotlight ? asrp : null} report={r} />
          ))}
        </ol>
      </section>

      {/* The records behind it. */}
      <section className="mt-12">
        <h2 className="text-[1.35rem] font-extrabold tracking-[-0.025em]">This block, on the record</h2>
        <p className="mt-2 leading-relaxed text-ink-2">
          <strong className="text-ink">{r.asrp.water500}</strong> reports of water in a basement and{" "}
          <strong className="text-ink">{r.asrp.caveIns500}</strong> cave-ins within 500 m since 2023. These are requests to the City,
          not confirmed incidents or unique households.
        </p>
        <div className="mt-5 overflow-hidden rounded-3xl border border-line">
          <RecordsMap center={r.lngLat} parcel={r.parcel?.geometry} mains={r.mainsNearby} projects={r.projects} points={r.reports311.points} />
        </div>
        <div className="mt-3">
          <SourceLine evidence={r.reports311.evidence} />
        </div>
      </section>

      <section className="mt-10 rounded-3xl bg-sunk/70 p-5 sm:p-6">
        <h2 className="text-[1.15rem] font-extrabold tracking-[-0.02em]">What nobody can tell you</h2>
        <ul className="mt-3 grid gap-4">
          {r.unknowns.map((u) => (
            <li key={u.what}>
              <p className="font-bold">{u.what}</p>
              <p className="mt-1 leading-relaxed text-ink-2">{u.why}</p>
              <p className="mt-1 text-[0.95rem] text-ink-3">Where to ask: {u.whereToAsk}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-3xl border-2 border-own/35 bg-surface p-5 sm:p-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-own">Second track</p>
        <h2 className="mt-1.5 text-[1.35rem] font-extrabold leading-tight tracking-[-0.02em]">Has it already flooded?</h2>
        <p className="mt-2 leading-relaxed text-ink-2">
          Everything above is about who repairs the pipe. None of it pays for a ruined basement — that is a separate claim, with a
          45-day deadline from the day you found the water, to the City <em>and</em> to GLWA.
        </p>
        <Link href="/now" className="mt-4 flex min-h-14 items-center justify-between rounded-2xl bg-ink px-5 font-bold text-white hover:bg-brand-ink">
          Start the 45-day clock <span aria-hidden="true">→</span>
        </Link>
      </section>

      <div className="mt-8 grid gap-2">
        <Link href="/method" className="flex min-h-14 items-center justify-between rounded-2xl border-2 border-line-2 bg-surface px-5 font-bold hover:border-ink">
          How the likelihood was worked out <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

function SegmentCard({
  s,
  open,
  onToggle,
  asrp,
  report,
}: {
  s: Segment;
  open: boolean;
  onToggle: () => void;
  asrp: AsrpAssessment | null;
  report: Report;
}) {
  const spotlight = s.spotlight;
  return (
    <li className={`min-w-0 overflow-hidden rounded-3xl border-2 bg-surface ${spotlight ? "border-own/45" : "border-line"}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-start gap-4 px-5 py-4 text-left hover:bg-sunk/40">
        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[0.9rem] font-extrabold ${spotlight ? "bg-own text-white" : "bg-sunk text-ink-2"}`}>
          {s.n}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[1.12rem] font-extrabold leading-tight tracking-[-0.01em]">{s.name}</span>
            <span className={`rounded-full px-2 py-0.5 text-[0.75rem] font-bold ${s.owner === "city" ? "bg-brand-tint text-brand-ink" : s.owner === "regional" ? "bg-sunk text-ink-2" : "bg-own-tint text-own"}`}>
              {OWNER_LABEL[s.owner]}
            </span>
          </span>
          <span className="mt-1 block text-[0.95rem] text-ink-3">{s.where}</span>
        </span>
        <span aria-hidden="true" className="mt-1 shrink-0 text-ink-3">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="border-t border-line px-5 pb-5 pt-4">
          <p className="rounded-2xl bg-sunk/60 p-4 leading-relaxed text-ink-2">
            <strong className="text-ink">How you&rsquo;d know it is this one: </strong>
            {s.symptom}
          </p>

          {asrp && <AsrpPanel asrp={asrp} />}

          <ul className="mt-4 grid gap-3">
            {s.payers.map((p) => (
              <li key={p.name} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-bold">{p.name}</span>
                  <span className="text-[0.95rem] font-semibold text-ink-2">{p.amount}</span>
                </div>
                {p.status !== "info" && (
                  <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[0.78rem] font-bold ${STATUS[p.status].cls}`}>{STATUS[p.status].label}</span>
                )}
                <p className="mt-2 leading-relaxed text-ink-2">{p.detail}</p>
                {p.phone && (
                  <div className="mt-3">
                    <CallCard contact={contactByPhone(p.phone)} tone="quiet" />
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-3">
                  {p.href && (
                    <a href={p.href} target={p.href.startsWith("/") ? undefined : "_blank"} rel="noreferrer" className="min-h-11 font-semibold text-brand underline decoration-brand/30 underline-offset-4">
                      {p.href.startsWith("/") ? "Open" : "Official page ↗"}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {(s.id === "lateral" || s.id === "connection") && <PermitHistory report={report} showHere={s.id === "lateral"} />}

          {s.id === "lateral" && report.psrpNeighborhood.inProgram && (
            <div className="mt-4">
              <PsrpScreener
                auto={{
                  inNeighborhood: report.psrpNeighborhood.inProgram,
                  neighborhoodName: report.psrpNeighborhood.name,
                  isSFHA: report.floodZone.isSFHA,
                  residential: report.parcel?.propertyClass ? /RESIDENTIAL/i.test(report.parcel.propertyClass) : null,
                }}
              />
            </div>
          )}
        </div>
      )}
    </li>
  );
}

/** Payers carry a number; the script lives with the contact it belongs to. */
function contactByPhone(phone: string) {
  const id = (Object.keys(CONTACTS) as ContactId[]).find((k) => CONTACTS[k].phone === phone);
  return id ? CONTACTS[id] : { id: "other", name: "Call", phone, tel: phone.replace(/\D/g, "") };
}

const KIND_LABEL: Record<string, string> = {
  lateral: "Private lateral",
  valve: "Backwater valve",
  cleanout: "Cleanout",
  sewer: "Sewer line",
};

/**
 * The only per-house record of a private line that exists anywhere public: not where it runs,
 * but whether anyone has ever dug it up.
 */
function PermitHistory({ report: r, showHere }: { report: Report; showHere: boolean }) {
  const { here, nearby, valvesNearby, radiusM, since } = r.permits;
  return (
    <div className="mt-4 rounded-2xl border border-line bg-paper p-4">
      <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-ink-3">Permitted work on the private line</p>
      {showHere &&
        (here.length > 0 ? (
          <ul className="mt-3 grid gap-2">
            {here.map((p) => (
              <li key={`${p.on}${p.what}`} className="rounded-xl bg-surface px-3 py-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-bold">{KIND_LABEL[p.kind] ?? "Sewer work"}</span>
                  <span className="text-[0.9rem] font-semibold tabular-nums text-ink-2">{p.on}</span>
                </div>
                <p className="mt-1 text-[0.95rem] leading-snug text-ink-2">{p.what}</p>
                <p className="mt-1 text-[0.88rem] text-ink-3">
                  {p.distanceM === 0 ? "This property" : `${p.addr} · ${p.distanceM} m`}
                  {p.by ? ` · ${p.by}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 leading-relaxed text-ink-2">
            <strong className="text-ink">No permit on record at this property since {since}.</strong> That does not mean the line is
            sound — most of these lines have never been opened. It means nothing has been done to it that the City wrote down.
          </p>
        ))}
      <p className={`${showHere ? "mt-3 border-t border-line pt-3 " : "mt-2 "}leading-relaxed text-ink-2`}>
        Within {radiusM} m, <strong className="text-ink">{nearby}</strong> private sewer {nearby === 1 ? "permit has" : "permits have"}{" "}
        been pulled since {since}
        {valvesNearby > 0 ? (
          <>
            , <strong className="text-ink">{valvesNearby}</strong> of them backwater valves — neighbors paying to protect themselves
          </>
        ) : null}
        .
      </p>
    </div>
  );
}

function AsrpPanel({ asrp }: { asrp: AsrpAssessment }) {
  const tone = TONE[VERDICT_TONE[asrp.verdict]];
  return (
    <div className={`mt-4 overflow-hidden rounded-2xl border-2 ${tone.ring} bg-paper`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <span className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-ink-3">
          ${(ASRP.total / 1_000_000).toFixed(0)}M Alley Sewer Repair Program
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[0.78rem] font-bold ${tone.chip}`}>{asrp.headline}</span>
      </div>
      <dl className="divide-y divide-line px-4">
        {asrp.signals.map((sig) => (
          <div key={sig.label} className="grid gap-1 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <dt className="font-semibold">{sig.label}</dt>
              <dd className="flex items-center gap-2 text-[0.95rem] font-bold tabular-nums">
                {sig.value}
                <span aria-hidden="true" className={`grid h-5 w-5 place-items-center rounded-full text-[0.7rem] font-bold text-white ${sig.met === true ? "bg-go" : sig.met === false ? "bg-line-2" : "bg-warn"}`}>
                  {sig.met === true ? "✓" : sig.met === false ? "–" : "?"}
                </span>
              </dd>
            </div>
            <p className="text-[0.93rem] leading-snug text-ink-3">{sig.note}</p>
          </div>
        ))}
      </dl>
      <p className="border-t border-line bg-sunk/50 px-4 py-3 text-[0.9rem] leading-relaxed text-ink-2">
        Measured against the {CALIBRATION.selected.n} alleys already under contract.{" "}
        <a href={SOURCES.asrp.url} target="_blank" rel="noreferrer" className="font-semibold text-brand underline">
          DWSD&rsquo;s own criteria ↗
        </a>{" "}
        · <Link href="/method" className="font-semibold text-brand underline">method</Link>
      </p>
    </div>
  );
}
