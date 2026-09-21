import { beforeEach, describe, expect, it, vi } from "vitest";
import { newCase } from "./case";

// A minimal browser, so the store can be tested without pulling in a DOM dependency.
class MemoryStorage {
  private map = new Map<string, string>();
  getItem = (k: string) => this.map.get(k) ?? null;
  setItem = (k: string, v: string) => void this.map.set(k, v);
  removeItem = (k: string) => void this.map.delete(k);
  clear = () => this.map.clear();
}
const storage = new MemoryStorage();
vi.stubGlobal("localStorage", storage);
vi.stubGlobal("window", { addEventListener() {}, removeEventListener() {} });

const { remove, save } = await import("./store");

const KEY = "belowtrace:v2";
const read = () => JSON.parse(storage.getItem(KEY) ?? "null");

// The store keeps an in-memory copy so a private-mode browser does not lose the case, and that
// copy outlives a cleared localStorage — so reset by writing an empty store, not by clearing.
const EMPTY = JSON.stringify({ v: 2, activeId: null, cases: {} });
beforeEach(() => {
  storage.clear();
  storage.setItem(KEY, EMPTY);
});

describe("cases survive a reload", () => {
  it("stores a case under its own id and makes it active", () => {
    const c = newCase("2026-09-20", { address: "16776 Prevost St" });
    save(c);
    expect(read().activeId).toBe(c.id);
    expect(read().cases[c.id].address).toBe("16776 Prevost St");
  });

  it("keeps two homes apart instead of merging them", () => {
    // The old build repainted an open case when a link for another address was opened, and
    // printed the wrong property onto a case file still carrying the first home's SR number.
    save(newCase("2026-09-20", { address: "16776 Prevost St", serviceRequest: "SR-1" }));
    const second = newCase("2026-09-21", { address: "14600 Archdale St" });
    save(second);

    const cases = Object.values(read().cases) as { address: string; serviceRequest?: string }[];
    expect(cases).toHaveLength(2);
    expect(read().activeId).toBe(second.id);
    expect(cases.find((s) => s.address.startsWith("16776"))!.serviceRequest).toBe("SR-1");
    expect(cases.find((s) => s.address.startsWith("14600"))!.serviceRequest).toBeUndefined();
  });

  it("falls back to another case when the active one is deleted", () => {
    const first = newCase("2026-09-20", { address: "A St" });
    save(first);
    const second = newCase("2026-09-21", { address: "B St" });
    save(second);
    remove(second.id);
    expect(read().activeId).toBe(first.id);
  });
});

describe("damaged storage never takes the app down", () => {
  it("ignores unparseable saved data", () => {
    storage.setItem(KEY, "{{{not json");
    const c = newCase("2026-09-20", { address: "A St" });
    expect(() => save(c)).not.toThrow();
    expect(read().cases[c.id].address).toBe("A St");
  });

  it("drops entries that are not cases rather than rendering them", () => {
    storage.setItem(KEY, JSON.stringify({ v: 2, activeId: "x", cases: { x: { nonsense: true } } }));
    const c = newCase("2026-09-20");
    save(c);
    expect(read().cases.x).toBeUndefined();
    expect(read().activeId).toBe(c.id);
  });

  it("keeps a case usable when a date is missing rather than guessing one", () => {
    storage.setItem(KEY, JSON.stringify({ v: 2, activeId: "y", cases: { y: { id: "y", foundOn: "not-a-date", done: {} } } }));
    save(newCase("2026-09-20"));
    expect(read().cases.y).toBeUndefined();
  });
});
