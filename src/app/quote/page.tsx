import type { Metadata } from "next";
import Link from "next/link";
import { StepShell } from "@/components/flow/step-shell";

export const metadata: Metadata = { title: "Before you sign" };

const ASK = ["The camera video of your line", "Exactly where the break is", "A written quote, with a City permit"];

const WHERE = [
  { value: "alley", title: "Near the alley", note: "Where my line meets the city sewer" },
  { value: "yard", title: "Under my yard or house", note: "Somewhere along my own line" },
  { value: "unsure", title: "I don't know yet", note: "That's fine. We'll cover both." },
];

export default function QuoteStep() {
  return (
    <StepShell
      step={1}
      of={2}
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
      <nav aria-label="Where's the break" className="mt-5 grid gap-3">
        {WHERE.map((w) => (
          <Link
            key={w.value}
            href={`/address?situation=broken-line&break=${w.value}`}
            className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border-2 border-line-2 bg-surface px-5 py-4 transition hover:border-ink active:scale-[0.995]"
          >
            <span>
              <span className="block text-[1.2rem] font-bold">{w.title}</span>
              <span className="block text-ink-3">{w.note}</span>
            </span>
            <span aria-hidden="true" className="text-2xl transition group-hover:translate-x-1">
              →
            </span>
          </Link>
        ))}
      </nav>
    </StepShell>
  );
}
