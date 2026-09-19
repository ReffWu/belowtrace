import type { Metadata } from "next";
import { StepShell } from "@/components/flow/step-shell";
import { QuoteChoices } from "@/components/case/quote-choices";

export const metadata: Metadata = { title: "Before you sign" };

const ASK = ["The camera video of your line", "Exactly where the break is", "A written quote, with a City permit"];

export default function QuoteStep() {
  return (
    <StepShell
      back="/"
      title="Don't sign yet."
      lead="Sewer repairs can easily pass $10,000, and some City programs pay for them. First, ask the plumber for three things."
    >
      <ol className="grid gap-2">
        {ASK.map((a, i) => (
          <li key={a} className="flex items-center gap-4 rounded-2xl bg-surface px-5 py-4 text-[1.1rem] font-semibold">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-own-tint text-sm font-bold text-own">{i + 1}</span>
            {a}
          </li>
        ))}
      </ol>

      <h2 className="mt-12 text-[1.6rem] font-extrabold tracking-tight">Where&apos;s the break?</h2>
      <p className="mt-1 text-ink-2">It decides who pays.</p>
      <div className="mt-5">
        <QuoteChoices />
      </div>
    </StepShell>
  );
}
