"use client";

import { useId } from "react";
import { callbackDue, EVIDENCE, type Case, type CaseReport, type Verdict } from "@/lib/case";
import { psrpFits, whoCanPay, type BreakAt } from "@/lib/guide";
import { COSTS, PHONES, SOURCES } from "@/lib/facts";
import { claimDeadline } from "@/lib/plan";
import { deadlineIcs, downloadIcs } from "@/lib/ics";
import { AddressSearch } from "@/components/address-search";
import { PayOptions } from "@/components/flow/pay-options";
import stats from "@/data/citywide-stats.json";
import { caseHref, daysFromToday, longDate, shortDate, todayInDetroit } from "./store";

export type StageProps = { c: Case; update: (patch: Partial<Case>) => void; report: CaseReport | null; street: string | null };

const tel = `tel:${PHONES.dwsd.number.replace(/\D/g, "")}`;
const caseUrl = (c: Case) => (typeof window === "undefined" ? undefined : `${window.location.origin}${caseHref(c)}`);

// ---- building blocks: every step is some mix of know / say / write down / remind ----

const PART = {
  know: { label: "What to know", box: "" },
  say: { label: "What to say", box: "rounded-2xl bg-brand-tint/70 p-5" },
  write: { label: "Write it down", box: "rounded-2xl border-2 border-own/35 bg-surface p-5" },
  remind: { label: "Reminder", box: "rounded-2xl bg-warn-tint p-5" },
};
const DOT = { know: "bg-ink-3", say: "bg-brand", write: "bg-own", remind: "bg-warn" };

function Part({ kind, label, children }: { kind: keyof typeof PART; label?: string; children: React.ReactNode }) {
  return (
    <section className={PART[kind].box}>
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-ink-2">
        <span className={`h-2 w-2 rounded-full ${DOT[kind]}`} aria-hidden="true" />
        {label ?? PART[kind].label}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Lines({ lines }: { lines: string[] }) {
  return (
    <ol className="grid gap-2">
      {lines.map((l) => (
        <li key={l} className="text-[1.15rem] font-semibold leading-snug text-brand-ink">
          &ldquo;{l}&rdquo;
        </li>
      ))}
    </ol>
  );
}

function Title({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.03em] sm:text-[2.6rem]">{children}</h2>
      {sub && <p className="mt-3 text-[1.15rem] leading-relaxed text-ink-2">{sub}</p>}
    </div>
  );
}

function Choice({ onClick, title, note }: { onClick: () => void; title: string; note?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border-2 border-line-2 bg-surface px-4 py-3 text-left transition hover:border-ink active:scale-[0.99]"
    >
      <span>
        <span className="block text-[1.1rem] font-bold">{title}</span>
        {note && <span className="block text-sm text-ink-3">{note}</span>}
      </span>
      <span aria-hidden="true">→</span>
    </button>
  );
}

const field = "h-14 w-full rounded-xl border-2 border-line-2 bg-surface px-4 text-lg outline-none transition focus:border-ink";
const action =
  "group flex min-h-16 w-full items-center justify-between rounded-2xl bg-ink px-6 text-lg font-bold text-white transition hover:bg-brand-ink active:scale-[0.99]";

function SrField({ c, update }: Pick<StageProps, "c" | "update">) {
  const id = useId();
  return (
    <label htmlFor={id} className="grid gap-2">
      <span className="font-semibold">Service request number</span>
      <input id={id} value={c.sr} onChange={(e) => update({ sr: e.target.value })} inputMode="numeric" autoComplete="off" placeholder="From DWSD" className={field} />
    </label>
  );
}

const RAIN = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
] as const;

// Rain is an important fact to record while it is fresh, but it does not decide a claim.
function RainQuestion({ c, update }: Pick<StageProps, "c" | "update">) {
  return (
    <div role="group" aria-labelledby="rain-now">
      <p id="rain-now" className="font-semibold">
        Was it raining hard when the water came in?
      </p>
      <p className="text-sm text-ink-3">Record what you remember. DWSD and any insurer will review the full facts.</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {RAIN.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={c.rain === o.value}
            onClick={() => update({ rain: o.value })}
            className={`min-h-12 rounded-xl border-2 font-semibold transition ${c.rain === o.value ? "border-ink bg-ink text-white" : "border-line-2 bg-surface hover:border-ink"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- 1 · Call DWSD ----

export function CallStage({ c, update, report, street }: StageProps) {
  const dateId = useId();
  const markReported = () => update({ calledAt: new Date().toISOString(), contactStatus: "reported" });
  const markAttempted = () => update({ contactStatus: "attempted", contactAttemptedAt: new Date().toISOString() });
  return (
    <div className="grid gap-6">
      <Title sub="They check whether the city sewer is backed up. If it is, fixing it is their job, not yours.">Call DWSD first. It&apos;s free.</Title>
      <a
        href={tel}
        className="flex min-h-20 items-center justify-center gap-3 rounded-2xl bg-brand text-[1.6rem] font-extrabold tracking-tight text-white shadow-[0_14px_30px_-14px_rgb(13_92_107/0.7)] transition hover:bg-brand-ink active:scale-[0.99]"
      >
        <PhoneIcon /> {PHONES.dwsd.number}
      </a>

      <Part kind="say" label="When they answer">
        <Lines lines={[`Sewage is backing up into my basement at ${street ?? "my home"}.`, "Please send a crew to check the city sewer.", "What's my service request number?"]} />
      </Part>

      <Part kind="know" label="While you wait">
        <ul className="grid gap-2 text-[1.05rem]">
          <li>
            <strong>Water still rising?</strong> <span className="text-ink-2">Call a drain cleaning company too. Keep the receipt.</span>
          </li>
          <li>
            <strong>Stay safe.</strong> <span className="text-ink-2">Keep children and pets out. Wear gloves and boots near sewage.</span>
          </li>
          <li>
            <strong>Take photos first.</strong> <span className="text-ink-2">Before you clean up or throw anything away.</span>
          </li>
        </ul>
      </Part>

      <Part kind="write" label="After the call, write down">
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SrField c={c} update={update} />
            <label htmlFor={dateId} className="grid gap-2">
              <span className="font-semibold">When did you find the water?</span>
              <input
                id={dateId}
                type="date"
                value={c.found}
                max={todayInDetroit()}
                onChange={(e) => e.target.value && update({ found: e.target.value })}
                className={field}
              />
            </label>
          </div>
          <RainQuestion c={c} update={update} />
          {report ? (
            <>
              <button type="button" onClick={markReported} className={action}>
                I reached DWSD and reported it <span aria-hidden="true">→</span>
              </button>
              <button type="button" onClick={markAttempted} className="rounded-xl border border-line px-4 py-3 font-semibold text-ink transition hover:border-brand">
                I tried, but did not reach them
              </button>
            </>
          ) : (
            <div>
              <p className="mb-2 font-semibold">The home&apos;s address</p>
              <AddressSearch defaultSituation="backup" target="/case" params={{}} cta="Save address" compact onGo={(address) => update({ address })} />
            </div>
          )}
          {c.contactStatus === "attempted" && <p className="text-ink-3">Your attempt is saved. This case will stay on this step until DWSD receives your report.</p>}
        </div>
      </Part>
    </div>
  );
}

// ---- 2 · DWSD checks ----

const VERDICTS: { value: Verdict; title: string; note: string }[] = [
  { value: "city", title: "The city sewer was the problem", note: "They cleared it, or will fix it" },
  { value: "mine", title: "The problem is in my line", note: "The part from my house to the city sewer" },
  { value: "unsure", title: "They didn't say, or I'm not sure", note: "We'll help you find out" },
];

export function CheckStage({ c, update }: StageProps) {
  const due = c.calledAt ? callbackDue(c.calledAt) : null;
  const remind = () =>
    due &&
    downloadIcs(
      "call-dwsd-back.ics",
      deadlineIcs({
        title: "Call DWSD back if no one came",
        detail: `Call ${PHONES.dwsd.number}${c.sr ? ` and give service request #${c.sr}` : " and ask for a service request number"}.`,
        due,
        url: caseUrl(c),
        alarms: ["PT0M"],
        prefix: "",
      }),
    );
  return (
    <div className="grid gap-6">
      <Title sub={`In the past year, DWSD closed ${stats.response.within48Pct}% of similar requests within 2 days. That is not a promise for this case.`}>After DWSD receives your report</Title>

      {!c.sr && (
        <Part kind="remind" label="You still need a number">
          <p className="text-[1.05rem]">
            Call <a href={tel} className="whitespace-nowrap font-bold underline">{PHONES.dwsd.number}</a> again and ask for a service request number. A damage claim needs it.
          </p>
          <div className="mt-4">
            <SrField c={c} update={update} />
          </div>
        </Part>
      )}

      <Part kind="say" label="When the crew comes, ask">
        <Lines lines={["Is the city sewer blocked?", "What did you find, and what happens next?"]} />
        <p className="mt-3 text-ink-2">Write down their answer and the date. It helps if you need to follow up.</p>
      </Part>

      {due && (
        <Part kind="remind">
          <p className="text-[1.05rem]">
            No one by <strong>{shortDate(due)}</strong>? Call <span className="whitespace-nowrap">{PHONES.dwsd.number}</span>
            {c.sr ? ` and give them number ${c.sr}` : ""}.
          </p>
          <button type="button" onClick={remind} className="mt-3 min-h-11 rounded-xl bg-ink px-4 font-bold text-white hover:bg-brand-ink">
            Remind me on {shortDate(due)}
          </button>
        </Part>
      )}

      <Part kind="write" label="What did DWSD find?">
        <div className="grid gap-2">
          {VERDICTS.map((v) => (
            <Choice key={v.value} title={v.title} note={v.note} onClick={() => update({ verdict: v.value })} />
          ))}
        </div>
      </Part>
    </div>
  );
}

// ---- 3 · Whose pipe (the owner's line, or not sure) ----

const BREAKS: { value: BreakAt; title: string; note: string }[] = [
  { value: "alley", title: "Near the alley", note: "Where my line meets the city sewer" },
  { value: "yard", title: "Under my yard or house", note: "Somewhere along my own line" },
  { value: "unsure", title: "I don't know yet", note: "No camera inspection yet" },
];

export function PipeStage({ c, update, report }: StageProps) {
  const quoteId = useId();
  const unsure = c.verdict === "unsure";
  return (
    <div className="grid gap-6">
      <Title sub="Only a camera (CCTV) inspection shows where a sewer line is broken. Don't let anyone dig before that.">
        {unsure ? "Find out where the problem is." : "Your line needs a camera inspection."}
      </Title>

      {(unsure || (report && psrpFits(report))) && (
        <Part kind="know">
          <ul className="grid gap-2 text-[1.05rem] text-ink-2">
            {unsure && (
              <li>
                Ask DWSD for a clear answer too: call <span className="whitespace-nowrap">{PHONES.dwsd.number}</span>
                {c.sr ? ` with number ${c.sr}` : ""}.
              </li>
            )}
            {report && psrpFits(report) && (
              <>
                <li>If you qualify for the Private Sewer Repair Program, it pays for the inspection.</li>
                <li>
                  <strong className="text-ink">Apply before you sign a repair contract.</strong> The program can&apos;t pay for work that starts before its review.
                </li>
              </>
            )}
          </ul>
        </Part>
      )}

      <Part kind="say" label="Tell the plumber">
        <Lines lines={["Please run a camera through my sewer line.", "Send me the video and show me exactly where the break is.", "Put the quote in writing, and pull a City permit."]} />
      </Part>

      <Part kind="write" label="What did the camera show?">
        <label htmlFor={quoteId} className="mb-4 grid gap-2">
          <span className="font-semibold">Quote amount, if you have one</span>
          <input id={quoteId} value={c.quote ?? ""} onChange={(e) => update({ quote: e.target.value })} inputMode="decimal" placeholder="$" className={field} />
        </label>
        <p className="mb-2 font-semibold">Where&apos;s the break?</p>
        <div className="grid gap-2">
          {BREAKS.map((b) => (
            <Choice key={b.value} title={b.title} note={b.note} onClick={() => update({ breakAt: b.value })} />
          ))}
        </div>
      </Part>

      <Part kind="remind">
        <p className="text-[1.05rem]">
          {report && psrpFits(report)
            ? "Don't sign anything until you've checked the programs in the next step."
            : `Get a second written quote before you sign anything. Repairs like this often cost ${COSTS.lateral}.`}
        </p>
      </Part>
    </div>
  );
}

// ---- 4 · Get it paid for: the City's pipe → damage claim ----

// Michigan law: DWSD pays only when a failure in its system caused at least half the backup.
const CLAIM_SUB = "DWSD reviews each claim. Keep the facts, photos, receipts, and any written finding together before you file.";

export function ClaimStage({ c, update }: StageProps) {
  const due = claimDeadline(c.found);
  const left = daysFromToday(due);
  const remind = () =>
    downloadIcs(
      "dwsd-claim-deadline.ics",
      deadlineIcs({
        title: "File DWSD damage claim",
        detail: `${c.sr ? `Service request #${c.sr}. ` : ""}DWSD only takes damage claims within 45 days of finding the backup.`,
        due,
        url: caseUrl(c),
      }),
    );

  if (c.claimFiledAt) {
    return (
      <div className="grid gap-6">
        <Title sub={`You filed on ${longDate(new Date(`${c.claimFiledAt}T12:00:00`))}. DWSD reviews each claim and decides whether to pay.`}>Your claim is in.</Title>
        <Part kind="know">
          <p className="text-[1.05rem] text-ink-2">Keep every receipt and photo until you hear back. If DWSD asks for more, your case file below has the dates and numbers.</p>
        </Part>
        <button type="button" onClick={() => update({ closedAt: todayInDetroit() })} className={action}>
          Everything&apos;s sorted. Close my case <span aria-hidden="true">→</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <Title sub={CLAIM_SUB}>File your damage claim.</Title>

      <div className="overflow-hidden rounded-3xl bg-ink text-white">
        <div className="grid gap-5 p-6 sm:grid-cols-[1fr_auto] sm:items-end sm:p-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-white/55">File by</p>
            <p className="mt-2 text-[2rem] font-extrabold leading-tight tracking-tight sm:text-[2.5rem]">{longDate(due)}</p>
            <p className="mt-1 text-white/70">{c.sr ? `Service request #${c.sr}` : "You'll need your service request number"}</p>
          </div>
          <p>
            <span className={`block text-[3.5rem] font-extrabold leading-none tabular-nums ${left <= 7 ? "text-[#ff9b8f]" : ""}`}>{Math.max(left, 0)}</span>
            <span className="text-white/60">{left === 1 ? "day left" : "days left"}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-white/10 px-6 py-4 sm:px-8">
          <button type="button" onClick={remind} className="min-h-11 rounded-xl bg-white px-4 font-bold text-ink hover:bg-white/85">
            Remind me
          </button>
          <a href={SOURCES.claims.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-xl px-4 font-semibold text-white/85 hover:bg-white/10">
            How to file ↗
          </a>
        </div>
      </div>

      {c.rain !== "no" && (
        <Part kind="know">
          <p className="text-[1.05rem] text-ink-2">
            Call your home insurance too. Ask whether your policy has a <strong className="text-ink">sewer backup rider</strong>: without one, most policies
            don&apos;t cover basement backups.
          </p>
        </Part>
      )}

      <Part kind="write" label="Gather for your claim">
        <ul className="grid gap-2">
          {EVIDENCE.map((e) => (
            <li key={e.id}>
              <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 border-line bg-surface px-4 transition hover:border-line-2">
                <input
                  type="checkbox"
                  checked={Boolean(c.kept[e.id])}
                  onChange={(ev) => update({ kept: { ...c.kept, [e.id]: ev.target.checked } })}
                  className="h-5 w-5 shrink-0 accent-[var(--ink)]"
                />
                <span className={c.kept[e.id] ? "text-ink-3 line-through" : ""}>{e.label}</span>
              </label>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => update({ claimFiledAt: todayInDetroit() })} className={`${action} mt-5`}>
          I filed my claim <span aria-hidden="true">→</span>
        </button>
      </Part>
    </div>
  );
}

// ---- 4 · Get it paid for: the owner's line → repair programs ----

export function PayStage({ c, update, report, street }: StageProps) {
  const breakAt = c.breakAt ?? "unsure";
  return (
    <div className="grid gap-6">
      <Title sub={report ? `Checked against every City repair program for ${street}.` : "Enter the home's address to check it against every City repair program."}>
        {breakAt === "alley" ? "A break at the alley may be fixed for free." : "Here's who can help pay."}
      </Title>
      {report ? (
        (() => {
          const { fits, checked } = whoCanPay(report, c.entry === "backup" ? "backup" : "broken-line", breakAt);
          return <PayOptions fits={fits} checked={checked} report={report} />;
        })()
      ) : (
        <AddressSearch defaultSituation="broken-line" target="/case" params={{}} cta="Check" compact onGo={(address) => update({ address })} />
      )}
      {report && (
        <button type="button" onClick={() => update({ closedAt: todayInDetroit() })} className={action}>
          It&apos;s fixed. Close my case <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}

// ---- 5 · Closed ----

export function ClosedStage({ onNew }: { onNew: () => void }) {
  return (
    <div className="grid gap-6">
      <Title sub="Glad it's behind you. Your case file stays on this phone until you delete it.">Case closed.</Title>
      <Part kind="know" label="Lower the risk next time">
        <ul className="grid gap-2 text-[1.05rem] text-ink-2">
          <li>Disconnect downspouts that drain into the sewer.</li>
          <li>Keep grease out of drains.</li>
          <li>Ask a plumber about a backwater valve.</li>
        </ul>
      </Part>
      <button type="button" onClick={onNew} className={action}>
        Start a new case <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7" aria-hidden="true">
      <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" />
    </svg>
  );
}
