"use client";

// Cases live only in this browser. Keeping an address-specific record prevents
// a report for one home from being attached to another home's service request.
import { useSyncExternalStore } from "react";
import type { Case } from "@/lib/case";

const KEY = "belowtrace:cases";
const LEGACY_KEY = "belowtrace:case";
let memory: string | null = null;
const listeners = new Set<() => void>();

type CaseStore = { activeId: string | null; cases: Record<string, Case> };

const read = () => {
  try {
    return localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY) ?? memory;
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

function valid(v: unknown): v is Case {
  return Boolean(v && typeof v === "object" && ((v as Case).entry === "backup" || (v as Case).entry === "quote") && typeof (v as Case).found === "string");
}

function parse(raw: string | null): CaseStore {
  try {
    const v = JSON.parse(raw ?? "null");
    if (v && typeof v === "object" && "cases" in v && typeof v.cases === "object") {
      const cases = Object.fromEntries(
        Object.entries(v.cases as Record<string, unknown>)
          .filter(([, c]) => valid(c))
          .map(([id, c]) => {
            const saved = c as Case;
            return [id, { ...saved, kept: saved.kept ?? {}, sr: saved.sr ?? "", id }];
          }),
      );
      const activeId = typeof v.activeId === "string" && cases[v.activeId] ? v.activeId : Object.keys(cases).at(-1) ?? null;
      return { activeId, cases };
    }
    if (valid(v)) {
      const id = v.id ?? "legacy";
      return { activeId: id, cases: { [id]: { ...v, kept: v.kept ?? {}, sr: v.sr ?? "", id } } };
    }
  } catch {
    // A damaged saved value should not prevent the rest of the app from loading.
  }
  return { activeId: null, cases: {} };
}

function write(store: CaseStore) {
  memory = JSON.stringify(store);
  try {
    localStorage.setItem(KEY, memory);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* private mode: kept in memory */
  }
  listeners.forEach((l) => l());
}

export function saveCase(c: Case | null, caseId?: string) {
  const store = parse(read());
  const id = caseId ?? c?.id ?? store.activeId;
  if (!c) {
    if (id) delete store.cases[id];
    store.activeId = Object.keys(store.cases).at(-1) ?? null;
    write(store);
    return;
  }
  const nextId = id ?? `case-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  store.cases[nextId] = { ...c, id: nextId };
  store.activeId = nextId;
  write(store);
}

// undefined while rendering on the server; null when the requested case is absent.
export function useCase(caseId?: string): Case | null | undefined {
  const raw = useSyncExternalStore(subscribe, read, () => undefined);
  if (raw === undefined) return undefined;
  const store = parse(raw);
  return store.cases[caseId ?? store.activeId ?? ""] ?? null;
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

export const caseHref = (c: Pick<Case, "address" | "id">) => {
  const params = new URLSearchParams();
  if (c.address) params.set("address", c.address);
  if (c.id) params.set("case", c.id);
  const query = params.toString();
  return query ? `/case?${query}` : "/case";
};
