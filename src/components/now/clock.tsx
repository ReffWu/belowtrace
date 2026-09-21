"use client";

import Link from "next/link";
import type { NoticeClock } from "@/lib/law";

const TONE = {
  open: "bg-ink text-white",
  urgent: "bg-warn text-white",
  "last-day": "bg-stop text-white",
  passed: "bg-stop text-white",
} as const;

/** The only persistent chrome. One date drives it, and it moves without anyone touching it. */
export function Clock({ clock, street }: { clock: NoticeClock; street?: string }) {
  const n = Math.max(clock.daysLeft, 0);
  return (
    <div className={`sticky top-0 z-30 ${TONE[clock.state]}`}>
      <div className="mx-auto flex max-w-xl items-center justify-between gap-4 px-5 py-3">
        <div className="min-w-0">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.14em] opacity-60">Day {clock.dayOfCase}</p>
          <p className="truncate text-[1.05rem] font-bold leading-tight">{street ?? "Your case"}</p>
        </div>
        <Link href="/notice" className="flex shrink-0 items-baseline gap-2 rounded-xl px-2 py-1 hover:bg-white/10">
          {clock.state === "passed" ? (
            <span className="text-[1.05rem] font-extrabold">Deadline passed</span>
          ) : (
            <>
              <span className="text-[2rem] font-extrabold leading-none tabular-nums">{n}</span>
              <span className="text-[0.85rem] opacity-70">{n === 1 ? "day to file" : "days to file"}</span>
            </>
          )}
        </Link>
      </div>
    </div>
  );
}
