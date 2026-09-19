"use client";

import { useRouter } from "next/navigation";
import { newCase, stageOf } from "@/lib/case";
import type { BreakAt } from "@/lib/guide";
import { caseHref, saveCase, todayInDetroit, useCase } from "./store";

const WHERE: { value: BreakAt; title: string; note: string }[] = [
  { value: "alley", title: "Near the alley", note: "Where my line meets the city sewer" },
  { value: "yard", title: "Under my yard or house", note: "Somewhere along my own line" },
  { value: "unsure", title: "I don't know yet", note: "That's fine. We'll cover both." },
];

// Picking where the break is opens a case at "get it paid for", or moves an open case there.
export function QuoteChoices() {
  const router = useRouter();
  const current = useCase();

  const choose = (breakAt: BreakAt) => {
    const waiting = current && !current.closedAt && stageOf(current) === 3 ? current : null;
    const next = waiting ? { ...waiting, breakAt } : newCase("quote", todayInDetroit(), { breakAt, address: current?.address });
    saveCase(next);
    router.push(caseHref(next));
  };

  return (
    <div className="grid gap-3">
      {WHERE.map((w) => (
        <button
          key={w.value}
          type="button"
          onClick={() => choose(w.value)}
          className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border-2 border-line-2 bg-surface px-5 py-4 text-left transition hover:border-ink active:scale-[0.995]"
        >
          <span>
            <span className="block text-[1.2rem] font-bold">{w.title}</span>
            <span className="block text-ink-3">{w.note}</span>
          </span>
          <span aria-hidden="true" className="text-2xl transition group-hover:translate-x-1">
            →
          </span>
        </button>
      ))}
    </div>
  );
}
