"use client";

// The case lives only in this browser: no account, nothing on a server.
import { useSyncExternalStore } from "react";
import type { Case } from "@/lib/case";

const KEY = "belowtrace:case";
let memory: string | null = null; // used when storage is blocked, so the page still works for this visit
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

function parse(raw: string | null): Case | null {
  try {
    const v = JSON.parse(raw ?? "null");
    return v && (v.entry === "backup" || v.entry === "quote") && typeof v.found === "string" ? { kept: {}, sr: "", ...v } : null;
  } catch {
    return null;
  }
}

export function saveCase(c: Case | null) {
  memory = c ? JSON.stringify(c) : null;
  try {
    if (memory) localStorage.setItem(KEY, memory);
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode: kept in memory */
  }
  listeners.forEach((l) => l());
}

// undefined while rendering on the server; null when this browser has no case.
export function useCase(): Case | null | undefined {
  const raw = useSyncExternalStore(subscribe, read, () => undefined);
  return raw === undefined ? undefined : parse(raw);
}

export const todayInDetroit = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Detroit" });

export function daysFromToday(d: Date) {
  const start = new Date(`${todayInDetroit()}T00:00:00`);
  const end = new Date(`${d.toLocaleDateString("en-CA", { timeZone: "America/Detroit" })}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export const longDate = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/Detroit" });

export const shortDate = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Detroit" });

export const caseHref = (c: Pick<Case, "address">) => (c.address ? `/case?${new URLSearchParams({ address: c.address })}` : "/case");
