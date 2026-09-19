"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { newCase, stageOf } from "@/lib/case";
import { STAGES } from "./journey";
import { caseHref, saveCase, todayInDetroit, useCase } from "./store";

const primary =
  "group flex min-h-16 w-full items-center justify-between rounded-2xl bg-ink px-6 text-lg font-bold text-white transition hover:bg-brand-ink active:scale-[0.99]";

export function StartCase() {
  const router = useRouter();
  const current = useCase();
  const open = current && !current.closedAt ? current : null;

  const start = () => {
    saveCase(newCase("backup", todayInDetroit()));
    router.push("/case");
  };

  if (open) {
    const stage = stageOf(open);
    return (
      <div className="grid gap-3">
        <Link href={caseHref(open)} className={primary}>
          <span>
            Continue your case
            <span className="block text-sm font-medium text-white/65">
              {open.address ? `${open.address.split(",")[0]} · ` : ""}Next: {STAGES[Math.min(stage, 4) - 1].short}
            </span>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
        <button type="button" onClick={start} className="min-h-12 rounded-2xl font-semibold text-ink-2 underline decoration-line-2 hover:text-ink">
          This is a new backup. Start a new case.
        </button>
      </div>
    );
  }
  return (
    <button type="button" onClick={start} className={primary}>
      Start with step 1
      <span aria-hidden="true" className="transition group-hover:translate-x-1">
        →
      </span>
    </button>
  );
}
