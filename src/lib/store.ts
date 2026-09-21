"use client";

// Cases live in this browser and nowhere else.
//
// The address belongs to the case, and /now never takes an address from the URL. That is a
// structural fix, not a warning: in the old build, opening a link for a different house
// silently repainted an open case, and printed the wrong property onto a case file that still
// carried the first home's service request number.
import { useSyncExternalStore } from "react";
import type { Case } from "./case";

const KEY = "belowtrace:v2";
const LEGACY = ["belowtrace:cases", "belowtrace:case"];
const VERSION = 2;

type Store = { v: number; activeId: string | null; cases: Record<string, Case> };
const EMPTY: Store = { v: VERSION, activeId: null, cases: {} };

let memory: string | null = null;
let saveFailed = false;
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

function valid(v: unknown): v is Case {
  const c = v as Case;
  return Boolean(c && typeof c === "object" && typeof c.foundOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(c.foundOn));
}

function parse(raw: string | null): Store {
  try {
    const v = JSON.parse(raw ?? "null");
    if (v && typeof v === "object" && v.cases) {
      const cases: Record<string, Case> = {};
      for (const [id, c] of Object.entries(v.cases as Record<string, unknown>)) {
        if (valid(c)) cases[id] = { ...c, id, done: c.done ?? {} };
      }
      const activeId = typeof v.activeId === "string" && cases[v.activeId] ? v.activeId : (Object.keys(cases).at(-1) ?? null);
      return { v: VERSION, activeId, cases };
    }
  } catch {
    // A damaged value must never stop the rest of the app from loading.
  }
  return EMPTY;
}

function write(store: Store) {
  memory = JSON.stringify(store);
  try {
    localStorage.setItem(KEY, memory);
    LEGACY.forEach((k) => localStorage.removeItem(k));
    saveFailed = false;
  } catch {
    saveFailed = true;
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};

export function save(c: Case) {
  const store = parse(readRaw());
  store.cases[c.id] = c;
  store.activeId = c.id;
  write(store);
}

export function remove(id: string) {
  const store = parse(readRaw());
  delete store.cases[id];
  store.activeId = Object.keys(store.cases).at(-1) ?? null;
  write(store);
}

export function setActive(id: string) {
  const store = parse(readRaw());
  if (store.cases[id]) {
    store.activeId = id;
    write(store);
  }
}

/** undefined until the browser has been read; null when there is no case. */
export function useActiveCase(): Case | null | undefined {
  const raw = useSyncExternalStore(subscribe, readRaw, () => undefined);
  if (raw === undefined) return undefined;
  const store = parse(raw);
  return store.activeId ? (store.cases[store.activeId] ?? null) : null;
}

export function useAllCases(): Case[] | undefined {
  const raw = useSyncExternalStore(subscribe, readRaw, () => undefined);
  if (raw === undefined) return undefined;
  return Object.values(parse(raw).cases).sort((a, b) => b.startedOn.localeCompare(a.startedOn));
}

/** True when the browser refused to persist, so the UI can stop promising it was saved. */
export function useSaveFailed() {
  useSyncExternalStore(subscribe, readRaw, () => undefined);
  return saveFailed;
}
