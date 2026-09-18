"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import type { Situation } from "@/lib/types";
import { SITUATION_OPTIONS } from "@/lib/situations";

type Suggestion = { text: string; magicKey: string };

export function AddressSearch({
  defaultAddress = "",
  defaultSituation = "backup",
  compact = false,
}: {
  defaultAddress?: string;
  defaultSituation?: Situation;
  compact?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultAddress);
  const [situation, setSituation] = useState<Situation>(defaultSituation);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const picked = useRef<Suggestion | null>(null);
  const listId = useId();
  const inputId = useId();

  useEffect(() => {
    const text = value.trim();
    if (text.length < 3 || picked.current?.text === value) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(text)}`, { signal: ctrl.signal });
        const list: Suggestion[] = await res.json();
        setSuggestions(list);
        setOpen(list.length > 0);
        setActive(-1);
      } catch {
        /* typing faster than the network; ignore */
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  function go(address: string, key?: string) {
    const text = address.trim();
    if (!text) {
      setError("Enter a street address, like 16776 Prevost St.");
      return;
    }
    setError("");
    setOpen(false);
    const params = new URLSearchParams({ address: text.replace(/, USA$/, ""), situation });
    if (key) params.set("key", key);
    startTransition(() => router.push(`/report?${params}`));
  }

  function choose(s: Suggestion) {
    picked.current = s;
    setValue(s.text.replace(/, USA$/, ""));
    setSuggestions([]);
    setOpen(false);
    go(s.text, s.magicKey);
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const exact = picked.current && picked.current.text.replace(/, USA$/, "") === value ? picked.current : null;
        if (active >= 0 && suggestions[active]) choose(suggestions[active]);
        else go(value, exact?.magicKey);
      }}
      className="grid gap-4"
    >
      <div className="relative">
        <label htmlFor={inputId} className={compact ? "sr-only" : "mb-2 block text-base font-semibold text-ink"}>
          Your Detroit street address
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={inputId}
            type="text"
            inputMode="text"
            autoComplete="street-address"
            placeholder="e.g. 16776 Prevost St"
            value={value}
            onChange={(e) => {
              picked.current = null;
              setValue(e.target.value);
            }}
            onFocus={() => suggestions.length && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (!open || !suggestions.length) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => (i + 1) % suggestions.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className="h-14 w-full min-w-0 rounded-xl border-2 border-line-2 bg-surface px-4 text-lg text-ink shadow-sm outline-none transition placeholder:text-ink-3 focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-lg font-semibold text-white shadow-sm transition hover:bg-brand-ink active:translate-y-px disabled:opacity-70"
          >
            {pending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                Checking…
              </>
            ) : (
              "Check my address"
            )}
          </button>
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-2 text-sm font-medium text-stop">
            {error}
          </p>
        )}
        {open && suggestions.length > 0 && (
          <ul
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl sm:right-[11.5rem]"
          >
            {suggestions.map((s, i) => (
              <li
                key={s.magicKey}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(s);
                }}
                onMouseEnter={() => setActive(i)}
                className={`cursor-pointer px-4 py-2.5 text-base ${i === active ? "bg-brand-tint text-brand-ink" : "text-ink"}`}
              >
                {s.text.replace(/, USA$/, "")}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!compact && (
        <fieldset>
          <legend className="mb-2 text-base font-semibold text-ink">What&apos;s going on?</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {SITUATION_OPTIONS.map((o) => (
              <label
                key={o.value}
                className={`flex cursor-pointer gap-3 rounded-xl border-2 p-3.5 transition ${
                  situation === o.value ? "border-brand bg-brand-tint/60" : "border-line bg-surface hover:border-line-2"
                }`}
              >
                <input
                  type="radio"
                  name="situation"
                  value={o.value}
                  checked={situation === o.value}
                  onChange={() => setSituation(o.value)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand)]"
                />
                <span>
                  <span className="block font-semibold leading-snug text-ink">{o.label}</span>
                  <span className="mt-0.5 block text-sm text-ink-2">{o.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </form>
  );
}
