import type { Metadata } from "next";
import { NextButton, StepShell } from "@/components/flow/step-shell";
import { PHONES } from "@/lib/facts";
import stats from "@/data/citywide-stats.json";

export const metadata: Metadata = { title: "Call DWSD first" };

const WHILE_YOU_WAIT = [
  ["Water still rising?", "Call a drain cleaning company too. Keep the receipt."],
  ["Stay safe.", "Keep children and pets out. Wear gloves and boots near sewage."],
  ["Take photos first.", "Before you clean up or throw anything away."],
];

export default function BackupStep() {
  const tel = `tel:${PHONES.dwsd.number.replace(/\D/g, "")}`;
  return (
    <StepShell
      step={1}
      of={3}
      back="/"
      title="Call DWSD first. It's free."
      lead="They'll check whether the city sewer is backed up. If it is, fixing it is their job, not yours."
    >
      <a
        href={tel}
        className="flex min-h-20 items-center justify-center gap-3 rounded-2xl bg-brand text-[1.6rem] font-extrabold tracking-tight text-white shadow-[0_14px_30px_-14px_rgb(13_92_107/0.7)] transition hover:bg-brand-ink active:scale-[0.99]"
      >
        <PhoneIcon />
        {PHONES.dwsd.number}
      </a>
      <p className="mt-4 rounded-2xl bg-own-tint px-5 py-4 text-[1.05rem] leading-relaxed text-[#6b3a06]">
        <strong>Ask for a service request number</strong> and write it down. You need it to get paid for damage.
      </p>
      <p className="mt-3 px-1 text-ink-3">
        Over the past year, DWSD closed {stats.response.within48Pct}% of requests like this within 2 days.
      </p>

      <h2 className="mt-12 text-sm font-bold uppercase tracking-[0.12em] text-ink-3">While you wait</h2>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {WHILE_YOU_WAIT.map(([lead, rest]) => (
          <li key={lead} className="py-4 text-[1.05rem]">
            <strong>{lead}</strong> <span className="text-ink-2">{rest}</span>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <NextButton href="/backup/record">Next: save your number</NextButton>
        <p className="mt-3 text-center text-ink-3">Couldn&apos;t get through yet? Keep trying, and continue meanwhile.</p>
      </div>
    </StepShell>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7" aria-hidden="true">
      <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" />
    </svg>
  );
}
