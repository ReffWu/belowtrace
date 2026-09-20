"use client";

import { useEffect, useRef, useState } from "react";
import {
  activeQuestions,
  evaluatePsrp,
  incomeLimitsFor,
  type FloodProof,
  type PsrpAnswers,
  type PsrpAuto,
} from "@/lib/psrp";
import { PHONES, SOURCES } from "@/lib/facts";
import { getCallProtocol } from "@/lib/call-protocols";
import { CallScriptDrawer } from "./call-script-drawer";

type Option = { value: string | number; label: string; hint?: string };
const money = (n: number) => `$${n.toLocaleString("en-US")}`;

const PROOFS: { value: FloodProof; label: string }[] = [
  { value: "insurance", label: "A home insurance claim" },
  { value: "fema", label: "A FEMA claim" },
  { value: "sba", label: "An SBA disaster loan claim" },
  { value: "dwsd-claim", label: "A DWSD water-in-basement claim" },
  { value: "contractor-invoice", label: "A licensed contractor's invoice" },
];

function question(key: keyof PsrpAnswers, a: PsrpAnswers): { title: string; hint?: string; options?: Option[] } {
  switch (key) {
    case "ownership":
      return {
        title: "Do you own this home or rent it?",
        options: [
          { value: "owner-occupant", label: "I own it and live here" },
          { value: "landlord", label: "I own it and rent it out" },
          { value: "renter", label: "I rent it" },
        ],
      };
    case "ownedSixMonths":
      return { title: "Have you owned it for at least 6 months?", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] };
    case "householdSize":
      return {
        title: a.ownership === "landlord" ? "How many people live in the rental, including children?" : "How many people live in your home, including you?",
        options: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: n, label: n === 8 ? "8 or more" : String(n) })),
      };
    case "income": {
      const { veryLow50, low80 } = incomeLimitsFor(a.householdSize ?? 1);
      return {
        title: a.ownership === "landlord" ? "What is your tenants' total yearly income before taxes?" : "What is your household's total yearly income before taxes?",
        hint: "Add up everyone 18 and older. Last year's tax return is the easiest place to look.",
        options: [
          { value: "under50", label: `Under ${money(veryLow50)}` },
          { value: "50to80", label: `${money(veryLow50)} to ${money(low80)}` },
          { value: "over80", label: `Over ${money(low80)}` },
        ],
      };
    }
    case "flooded2021":
      return {
        title: "Did water or sewage get into this home during the June 25–26, 2021 flood?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "unsure", label: "Not sure / I didn't own it then" },
        ],
      };
    case "floodProof":
      return { title: "Do you have any of these from June–September 2021?", hint: "Pick all that apply. It's fine if you have none." };
    case "taxesCurrent":
      return {
        title: "Are your property taxes paid — or are you on a payment plan or HOPE exemption?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No, I'm behind" },
          { value: "unsure", label: "Not sure" },
        ],
      };
    case "otherAssistance":
      return {
        title: "Have you already received money for this same repair?",
        hint: "Insurance payouts, FEMA, SBA, or another program.",
        options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }],
      };
  }
}

const VERDICT_STYLE = {
  likely: { box: "border-go bg-go-tint", title: "text-go", label: "Your answers fit this screen" },
  possible: { box: "border-warn bg-warn-tint", title: "text-warn", label: "You might qualify" },
  unlikely: { box: "border-stop bg-stop-tint", title: "text-stop", label: "Probably not this program" },
};

const ICON = { pass: "✓", fail: "✕", warn: "!" };
const ICON_STYLE = { pass: "bg-go text-white", fail: "bg-stop text-white", warn: "bg-warn text-white" };

export function PsrpScreener({ auto, address }: { auto: PsrpAuto; address?: string }) {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<PsrpAnswers>({});
  const [step, setStep] = useState(0);
  const [proofDraft, setProofDraft] = useState<FloodProof[]>([]);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const headingRef = useRef<HTMLHeadingElement>(null);

  const questions = activeQuestions(answers);
  const finished = started && step >= questions.length;
  const key = questions[step];

  useEffect(() => {
    if (started) headingRef.current?.focus();
  }, [step, started]);

  function answer(value: unknown) {
    const next = { ...answers, [key]: value } as PsrpAnswers;
    if (key === "flooded2021" && value === "no") delete next.floodProof;
    setAnswers(next);
    setStep(activeQuestions(next).indexOf(key) + 1);
  }

  function restart() {
    setAnswers({});
    setProofDraft([]);
    setDone({});
    setStep(0);
  }

  if (!started) {
    return (
      <div id="psrp-screener" className="no-print mt-5 scroll-mt-4 rounded-xl border-2 border-brand/30 bg-brand-tint/50 p-4 sm:p-5">
        <p className="font-semibold text-brand-ink">See if you qualify — 8 questions, about 2 minutes.</p>
        <p className="mt-1 text-sm text-ink-2">Your answers stay in this browser. Nothing is sent or saved.</p>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="mt-3 inline-flex min-h-12 items-center rounded-xl bg-brand px-5 text-lg font-semibold text-white hover:bg-brand-ink"
        >
          Check if I qualify
        </button>
      </div>
    );
  }

  if (finished) {
    const r = evaluatePsrp(answers, auto);
    const s = VERDICT_STYLE[r.verdict];
    return (
      <div id="psrp-screener" className="mt-5 scroll-mt-4 space-y-4">
        <div className={`rounded-xl border-2 p-4 sm:p-5 ${s.box}`} role="status">
          <h4 ref={headingRef} tabIndex={-1} className={`text-xl font-extrabold outline-none ${s.title}`}>
            {s.label}
          </h4>
          <p className="mt-1 text-ink">{r.summary}</p>
          <ul className="mt-4 space-y-2">
            {r.checks.map((c) => (
              <li key={c.text} className="flex gap-2.5 text-[0.95rem]">
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-black ${ICON_STYLE[c.status]}`} aria-hidden="true">
                  {ICON[c.status]}
                </span>
                <span>
                  <span className="sr-only">{c.status === "pass" ? "Meets: " : c.status === "fail" ? "Does not meet: " : "Check: "}</span>
                  {c.text}
                  {c.cite && <span className="ml-1 whitespace-nowrap text-xs text-ink-3">({c.cite})</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {r.verdict !== "unlikely" && (
          <div className="print-break-avoid rounded-xl border border-line bg-paper p-4 sm:p-5">
            <h4 className="font-bold">Your document checklist</h4>
            <p className="text-sm text-ink-2">Bring or upload clear copies. Tick them off as you find them.</p>
            <ul className="mt-3 space-y-2">
              {r.documents.map((d, i) => (
                <li key={d}>
                  <label className="flex cursor-pointer gap-3">
                    <input
                      type="checkbox"
                      checked={Boolean(done[i])}
                      onChange={(e) => setDone({ ...done, [i]: e.target.checked })}
                      className="mt-1 h-5 w-5 shrink-0 accent-[var(--brand)]"
                    />
                    <span className={done[i] ? "text-ink-3 line-through" : ""}>{d}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-ink-2">
              Apply on the{" "}
              <a href={SOURCES.neighborly.url} target="_blank" rel="noreferrer" className="font-semibold text-brand underline">
                City&apos;s Neighborly portal
              </a>{" "}
              or call HRD at{" "}
              <a href={`tel:${PHONES.hrd.number.replace(/\D/g, "")}`} className="font-semibold text-brand underline">
                {PHONES.hrd.number}
              </a>
              . Record any follow-up date, document request, or appeal information exactly as it appears in the official notice you receive.
            </p>
            {getCallProtocol("psrp", { address, hood: auto.neighborhoodName ?? undefined }) && (
              <CallScriptDrawer protocol={getCallProtocol("psrp", { address, hood: auto.neighborhoodName ?? undefined })!} />
            )}
          </div>
        )}

        <div className="no-print flex flex-wrap gap-2">
          <button type="button" onClick={() => setStep(questions.length - 1)} className="min-h-11 rounded-xl border-2 border-line-2 px-4 font-semibold hover:border-brand">
            Change my last answer
          </button>
          <button type="button" onClick={restart} className="min-h-11 rounded-xl px-4 font-semibold text-brand underline">
            Start over
          </button>
        </div>
        <p className="text-xs text-ink-3">
          This is a screening guide, not a decision. Only the City decides eligibility. Rules from the{" "}
          <a href={SOURCES.psrpGuide.url} target="_blank" rel="noreferrer" className="underline">
            PSRP Program Guide
          </a>{" "}
          and{" "}
          <a href={SOURCES.psrpPolicy.url} target="_blank" rel="noreferrer" className="underline">
            2026 Policy &amp; Procedure
          </a>
          .
        </p>
      </div>
    );
  }

  const q = question(key, answers);
  const current = answers[key];

  return (
    <div id="psrp-screener" className="no-print mt-5 scroll-mt-4 rounded-xl border-2 border-brand/30 bg-paper p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 text-sm text-ink-2">
        <span>
          Question {step + 1} of {questions.length}
        </span>
        <button type="button" onClick={() => (step === 0 ? setStarted(false) : setStep(step - 1))} className="rounded-md px-2 py-1 font-semibold text-brand underline">
          Back
        </button>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(step / questions.length) * 100}%` }} />
      </div>
      <fieldset className="mt-4">
        <legend className="w-full">
          <h4 ref={headingRef} tabIndex={-1} className="text-lg font-bold leading-snug outline-none sm:text-xl">
            {q.title}
          </h4>
          {q.hint && <p className="mt-1 text-sm text-ink-2">{q.hint}</p>}
        </legend>

        {key === "floodProof" ? (
          <div className="mt-4 space-y-2">
            {PROOFS.map((p) => (
              <label key={p.value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-line bg-surface px-4 hover:border-line-2">
                <input
                  type="checkbox"
                  checked={proofDraft.includes(p.value)}
                  onChange={(e) => setProofDraft(e.target.checked ? [...proofDraft, p.value] : proofDraft.filter((x) => x !== p.value))}
                  className="h-5 w-5 accent-[var(--brand)]"
                />
                <span className="font-medium">{p.label}</span>
              </label>
            ))}
            <button type="button" onClick={() => answer(proofDraft)} className="mt-2 min-h-12 rounded-xl bg-brand px-5 font-semibold text-white hover:bg-brand-ink">
              {proofDraft.length ? "Continue" : "I have none of these"}
            </button>
          </div>
        ) : (
          <div className={`mt-4 grid gap-2 ${key === "householdSize" ? "grid-cols-4" : ""}`}>
            {q.options!.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={current === o.value}
                onClick={() => answer(o.value)}
                className={`min-h-12 rounded-xl border-2 px-4 py-2.5 text-left text-[1.05rem] font-semibold transition ${
                  key === "householdSize" ? "text-center" : ""
                } ${current === o.value ? "border-brand bg-brand-tint text-brand-ink" : "border-line bg-surface hover:border-brand"}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </fieldset>
    </div>
  );
}
