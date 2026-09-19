"use client";

import Link from "next/link";
import { useId, useSyncExternalStore } from "react";
import { claimDeadline } from "@/lib/plan";

export const todayInDetroit = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Detroit" });

export function daysLeft(due: Date) {
  const start = new Date(`${todayInDetroit()}T00:00:00`);
  const end = new Date(`${due.toLocaleDateString("en-CA", { timeZone: "America/Detroit" })}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export const longDate = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/Detroit" });

// The claim lives only in this browser: no account, nothing in the URL or on a server.
const KEY = "belowtrace:claim";
export type SavedClaim = { sr: string; found: string; kept: Record<number, boolean> };

let memory: string | null = null; // used when storage is blocked, so the page still works
const listeners = new Set<() => void>();
const read = () => {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};

function parse(raw: string | null): SavedClaim {
  try {
    const v = JSON.parse(raw ?? "null");
    if (v && typeof v.found === "string") return { sr: v.sr ?? "", found: v.found, kept: v.kept ?? {} };
  } catch {
    /* fall through to a fresh claim */
  }
  return { sr: "", found: todayInDetroit(), kept: {} };
}

// Null while rendering on the server; the saved claim (or a fresh one dated today) in the browser.
export function useClaim(): [SavedClaim | null, (c: SavedClaim) => void] {
  const raw = useSyncExternalStore(subscribe, read, () => undefined);
  const save = (c: SavedClaim) => {
    memory = JSON.stringify(c);
    try {
      localStorage.setItem(KEY, memory);
    } catch {
      /* private mode: keep it in memory for this visit */
    }
    listeners.forEach((l) => l());
  };
  return [raw === undefined ? null : parse(raw), save];
}

export const KEEP = ["Photos of the water line and anything damaged", "Receipts for cleanup, repairs and anything you replace", "A list of damaged items and what they cost"];

export function RecordForm() {
  const [saved, save] = useClaim();
  const claim = saved ?? { sr: "", found: todayInDetroit(), kept: {} };
  const { sr, found, kept } = claim;
  const srId = useId();
  const dateId = useId();
  const due = claimDeadline(found);
  const left = daysLeft(due);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label htmlFor={srId} className="grid gap-2">
          <span className="font-semibold">Service request number</span>
          <input
            id={srId}
            value={sr}
            onChange={(e) => save({ ...claim, sr: e.target.value })}
            inputMode="numeric"
            autoComplete="off"
            placeholder="Optional"
            className="h-14 rounded-xl border-2 border-line-2 bg-surface px-4 text-lg outline-none transition focus:border-ink"
          />
        </label>
        <label htmlFor={dateId} className="grid gap-2">
          <span className="font-semibold">When did you find the water?</span>
          <input
            id={dateId}
            type="date"
            value={found}
            max={todayInDetroit()}
            onChange={(e) => e.target.value && save({ ...claim, found: e.target.value })}
            className="h-14 rounded-xl border-2 border-line-2 bg-surface px-4 text-lg outline-none transition focus:border-ink"
          />
        </label>
      </div>

      {(sr || found !== todayInDetroit() || Object.values(kept).some(Boolean)) && (
        <button
          type="button"
          onClick={() => save({ sr: "", found: todayInDetroit(), kept: {} })}
          className="-mt-3 w-fit rounded-lg px-1 text-sm font-semibold text-ink-3 underline decoration-line-2 hover:text-ink"
        >
          This is a new backup. Start fresh.
        </button>
      )}

      <div className="rounded-2xl bg-ink p-6 text-white" aria-live="polite">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-white/60">Your claim deadline</p>
        <p className="mt-2 text-[2rem] font-extrabold leading-tight tracking-tight">{longDate(due)}</p>
        <p className="mt-1 text-lg text-white/80">
          {left < 0 ? "This date has passed." : left === 0 ? "That's today." : `${left} days from today.`} DWSD only takes damage claims within 45 days.
        </p>
      </div>

      <fieldset>
        <legend className="font-semibold">Keep these for your claim</legend>
        <ul className="mt-3 grid gap-2">
          {KEEP.map((k, i) => (
            <li key={k}>
              <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 border-line bg-surface px-4 transition hover:border-line-2">
                <input
                  type="checkbox"
                  checked={Boolean(kept[i])}
                  onChange={(e) => save({ ...claim, kept: { ...kept, [i]: e.target.checked } })}
                  className="h-5 w-5 shrink-0 accent-[var(--ink)]"
                />
                <span className={kept[i] ? "text-ink-3 line-through" : ""}>{k}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <Link
        href="/address?situation=backup"
        className="group flex min-h-16 w-full items-center justify-between rounded-2xl bg-ink px-6 text-lg font-bold text-white transition hover:bg-brand-ink active:scale-[0.99]"
      >
        Next: who can help pay
        <span aria-hidden="true" className="transition group-hover:translate-x-1">
          →
        </span>
      </Link>
    </div>
  );
}
