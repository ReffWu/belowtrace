"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { newCase, stageOf, stepBack, type Case, type CaseReport } from "@/lib/case";
import { claimDeadline } from "@/lib/plan";
import { PHONES } from "@/lib/facts";
import { AddressSearch } from "@/components/address-search";
import { Spine } from "./journey";
import { CallStage, CheckStage, ClaimStage, ClosedStage, PayStage, PipeStage } from "./stages";
import { caseHref, longDate, saveCase, todayInDetroit, useCase } from "./store";

type Props = {
  queryAddress?: string;
  report: CaseReport | null;
  error: { message: string; outside: boolean } | null;
  under: React.ReactNode;
};

export function CaseView({ queryAddress, report, error, under }: Props) {
  const router = useRouter();
  const c = useCase();
  const stage = c ? stageOf(c) : null;

  // The case always opens at its current step, and each answer brings the next step's title into view.
  const shown = useRef<typeof stage>(null);
  useEffect(() => {
    if (stage && shown.current !== stage) window.scrollTo({ top: 0, behavior: shown.current ? "smooth" : "instant" });
    shown.current = stage;
  }, [stage]);

  // Keep the URL and the saved case pointing at the same home, so the server can load its records.
  useEffect(() => {
    if (!c) return;
    if (report && queryAddress && !c.address) saveCase({ ...c, address: queryAddress });
    else if (!queryAddress && c.address) router.replace(caseHref(c));
  }, [c, report, queryAddress, router]);

  if (c === undefined) return <div className="mx-auto h-[60vh] max-w-3xl" aria-busy="true" />;

  if (c === null) return <NoCase queryAddress={queryAddress} report={report} />;

  const update = (patch: Partial<Case>) => saveCase({ ...c, ...patch });
  const step = stageOf(c);
  const street = (report?.address ?? c.address)?.split(",")[0] ?? null;
  const props = { c, update, report, street };
  const otherHome = report && c.address && queryAddress && c.address !== queryAddress;

  return (
    <article>
      <div className="no-print mx-auto max-w-3xl px-5 pt-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-semibold text-ink-2 hover:text-ink">
            <span aria-hidden="true">←</span> Home
          </Link>
          <span className="truncate text-sm font-semibold text-ink-3">
            {street ? `Your case · ${street}` : "Your case"} · Day {dayOf(c)}
          </span>
        </div>
        <div className="mt-5">
          <Spine current={step} skipped={c.entry === "quote" ? [1, 2] : []} />
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-warn-tint p-5" role="alert">
            <p className="font-semibold text-[#6b3d00]">{error.message}</p>
            <div className="mt-3">
              <AddressSearch defaultSituation="backup" target="/case" params={{}} cta="Save" compact />
            </div>
          </div>
        )}
        {otherHome && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-warn-tint p-5">
            <p className="text-[#6b3d00]">Your case is for {c.address!.split(",")[0]}. Switch it to {queryAddress!.split(",")[0]}?</p>
            <button type="button" onClick={() => update({ address: queryAddress })} className="min-h-11 rounded-xl bg-ink px-4 font-bold text-white">
              Switch
            </button>
          </div>
        )}
        {report && report.warnings.length > 0 && (
          <div className="mt-6 rounded-xl bg-warn-tint px-4 py-3 text-[0.95rem] text-[#6b3d00]" role="note">
            {report.warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </div>
        )}

        <div key={step} className="rise mt-10">
          {step === 1 && <CallStage {...props} />}
          {step === 2 && <CheckStage {...props} />}
          {step === 3 && <PipeStage {...props} />}
          {step === 4 && (c.verdict === "city" ? <ClaimStage {...props} /> : <PayStage {...props} />)}
          {step === 5 && (
            <ClosedStage
              onNew={() => {
                saveCase(null);
                router.push("/backup");
              }}
            />
          )}
        </div>
        {step > 1 && !(c.entry === "quote" && step === 3) && (
          <button type="button" onClick={() => saveCase(stepBack(c))} className="mt-6 min-h-11 rounded-lg px-1 font-semibold text-ink-3 underline decoration-line-2 hover:text-ink">
            Go back a step
          </button>
        )}
      </div>

      <CaseFile c={c} report={report} update={update} />
      <div className="no-print">{under}</div>
    </article>
  );
}

const dayOf = (c: Case) => Math.max(1, Math.round((Date.parse(todayInDetroit()) - Date.parse(c.found)) / 86_400_000) + 1);

const VERDICT = { city: "The city sewer was the problem", mine: "The problem is in the owner's line", unsure: "Not clear yet" };
const BREAK = { alley: "Near the alley connection", yard: "Under the yard or house", unsure: "Not known yet" };

// One page a resident can hand to DWSD, a plumber or a program: every date and number in the case.
function CaseFile({ c, report, update }: { c: Case; report: CaseReport | null; update: (p: Partial<Case>) => void }) {
  const at = (d: string) => longDate(new Date(`${d}T12:00:00`));
  const rows: [string, string | null][] = [
    ["Home", report?.address ?? c.address ?? null],
    ["Parcel", report?.parcel?.id ?? null],
    ["Water found", c.entry === "backup" ? at(c.found) : null],
    ["DWSD called", c.calledAt ? new Date(c.calledAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Detroit" }) : null],
    ["Service request #", c.sr || null],
    ["DWSD found", c.verdict && c.entry === "backup" ? VERDICT[c.verdict] : null],
    ["Break", c.breakAt ? BREAK[c.breakAt] : null],
    ["Quote", c.quote || null],
    ["Claim deadline", c.entry === "backup" && c.verdict !== "mine" ? longDate(claimDeadline(c.found)) : null],
    ["Claim filed", c.claimFiledAt ? at(c.claimFiledAt) : null],
  ];
  return (
    <section className="mx-auto mt-14 max-w-3xl px-5 pb-16" aria-labelledby="case-file">
      <div className="rounded-3xl border border-line bg-surface p-6 sm:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="case-file" className="text-xl font-extrabold tracking-tight">
            Your case file
          </h2>
          <span className="only-print text-sm">BelowTrace Detroit · printed {new Date().toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
          <div className="no-print flex gap-1">
            <button type="button" onClick={() => window.print()} className="min-h-11 rounded-lg px-3 font-semibold text-brand hover:bg-brand-tint">
              Print
            </button>
            <button
              type="button"
              onClick={() => confirm("Delete this case from this phone?") && saveCase(null)}
              className="min-h-11 rounded-lg px-3 font-semibold text-ink-3 hover:bg-sunk"
            >
              Delete
            </button>
          </div>
        </div>
        <dl className="mt-4 divide-y divide-line">
          {rows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="grid grid-cols-[9.5rem_1fr] gap-3 py-2.5">
                <dt className="text-ink-3">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          {c.entry === "backup" && !c.sr && stageOf(c) > 1 && (
            <div className="no-print grid grid-cols-[9.5rem_1fr] items-center gap-3 py-2.5">
              <dt className="text-ink-3">Service request #</dt>
              <dd>
                <input value={c.sr} onChange={(e) => update({ sr: e.target.value })} placeholder="Add it when you have it" className="h-11 w-full rounded-lg border-2 border-line-2 px-3" />
              </dd>
            </div>
          )}
        </dl>
        <p className="mt-4 border-t border-line pt-4 text-sm text-ink-2">
          DWSD {PHONES.dwsd.number} · Housing &amp; Revitalization {PHONES.hrd.number} · Saved on this phone only.
        </p>
      </div>
    </section>
  );
}

function NoCase({ queryAddress, report }: { queryAddress?: string; report: CaseReport | null }) {
  const street = report?.address.split(",")[0];
  const start = (entry: Case["entry"]) => {
    saveCase(newCase(entry, todayInDetroit(), report && queryAddress ? { address: queryAddress } : {}));
  };
  return (
    <div className="mx-auto max-w-xl px-5 pb-20 pt-12">
      <h1 className="text-[2.4rem] font-extrabold leading-[1.05] tracking-[-0.035em]">{street ? `Start a case for ${street}` : "You don't have an open case."}</h1>
      <p className="mt-4 text-[1.2rem] text-ink-2">A case walks you through a sewer problem step by step, and remembers every number and date. It stays on this phone.</p>
      <div className="mt-8 grid gap-3">
        <button type="button" onClick={() => start("backup")} className="flex min-h-16 items-center justify-between rounded-2xl bg-ink px-6 text-lg font-bold text-white hover:bg-brand-ink">
          Water or sewage came in <span aria-hidden="true">→</span>
        </button>
        <Link href="/quote" className="flex min-h-16 items-center justify-between rounded-2xl border-2 border-line-2 bg-surface px-6 text-lg font-bold hover:border-ink">
          A plumber quoted a repair <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
