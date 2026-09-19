"use client";

import Link from "next/link";
import { stageOf } from "@/lib/case";
import { STAGES } from "./journey";
import { caseHref, useCase } from "./store";

// A resident coming back days later lands on their case, not on a blank start.
export function ContinueCase() {
  const c = useCase();
  if (!c || c.closedAt) return null;
  const stage = Math.min(stageOf(c), 4);
  return (
    <Link
      href={caseHref(c)}
      className="rise group mb-8 flex items-center justify-between gap-4 rounded-2xl border-2 border-own bg-own-tint px-5 py-4 transition hover:bg-[#f8e3c7]"
    >
      <span>
        <span className="block text-sm font-bold uppercase tracking-[0.12em] text-own">Your case{c.address ? ` · ${c.address.split(",")[0]}` : ""}</span>
        <span className="mt-0.5 block text-[1.15rem] font-bold">
          Step {stage} of 4: {STAGES[stage - 1].title}
        </span>
      </span>
      <span aria-hidden="true" className="text-2xl transition group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}
