"use client";

import Link from "next/link";
import { useActiveCase } from "@/lib/store";
import { noticeClock } from "@/lib/law";
import { todayInDetroit } from "@/lib/case";

/** If a case is open, it outranks everything else on the page. */
export function Resume() {
  const c = useActiveCase();
  if (!c) return null;
  const clock = noticeClock(c.foundOn, todayInDetroit());
  const urgent = clock.state === "urgent" || clock.state === "last-day" || clock.state === "passed";
  return (
    <Link
      href="/now"
      className={`mb-7 flex min-h-[4.5rem] items-center justify-between gap-4 rounded-2xl px-5 py-3 text-white transition active:scale-[0.99] ${
        urgent ? "bg-stop hover:brightness-110" : "bg-ink hover:bg-brand-ink"
      }`}
    >
      <span className="min-w-0">
        <span className="block text-[0.8rem] font-bold uppercase tracking-[0.12em] text-white/60">Day {clock.dayOfCase}</span>
        <span className="mt-0.5 block truncate text-[1.15rem] font-bold">
          {c.address?.split(",")[0] ?? "Your case"}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[1.9rem] font-extrabold leading-none tabular-nums">{Math.max(clock.daysLeft, 0)}</span>
        <span className="text-[0.8rem] text-white/65">days to file</span>
      </span>
    </Link>
  );
}
