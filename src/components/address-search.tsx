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
  target = "/report",
  params,
  cta = "Check my address",
  onGo,
}: {
  defaultAddress?: string;
  defaultSituation?: Situation;
  compact?: boolean;
  // Where the address goes, and any flow state to carry along (the step-by-step flow uses /plan).
  target?: string;
  params?: Record<string, string>;
  cta?: string;
  onGo?: (address: string) => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultAddress);
  const [situation, setSituation] = useState<Situation>(defaultSituation);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [pending, startTransition] = useTransition();
  const picked = useRef<Suggestion | null>(null);
  const listId = useId();
  const inputId = useId();

  function useCurrentLocation() {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      return;
    }
    setError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`/api/locate?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
          const data = await res.json();
          if (data.ok && data.inDetroit && data.address) {
            setValue(data.address);
            setLocating(false);
            go(data.address);
          } else if (data.ok && !data.inDetroit) {
            setLocating(false);
            setError(`Your location appears to be in ${data.city || "another area"}, outside Detroit city limits.`);
          } else {
            setLocating(false);
            setError(data.error || "Could not match a Detroit property at your current location.");
          }
        } catch {
          setLocating(false);
          setError("Failed to look up address from your location. Please enter your address manually.");
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location permission was denied. Please enter your address manually.");
        } else {
          setError("Could not retrieve GPS location. Please enter your address manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

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
    if (!/^\d/.test(text)) {
      setError("Please start with your house number, like 16776 Prevost St.");
      return;
    }
    setError("");
    setOpen(false);
    const clean = text.replace(/, USA$/, "");
    onGo?.(clean);
    const query = new URLSearchParams({ address: clean, situation, ...params });
    if (key) query.set("key", key);
    startTransition(() => router.push(`${target}?${query}`));
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
              cta
            )}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 px-1">
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating || pending}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline disabled:opacity-50"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
              <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a16.892 16.892 0 0 0 1.25-.662c1.096-.642 2.58-1.674 3.823-3.15 2.47-2.935 3.593-6.143 3.593-8.86 0-4.604-3.582-8.25-8-8.25S3 1.646 3 6.25c0 2.717 1.123 5.925 3.593 8.86 1.243 1.476 2.727 2.508 3.823 3.15.42.246.804.453 1.14.615l.11.047.018.008.006.003ZM10 9a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z" clipRule="evenodd" />
            </svg>
            {locating ? "Locating your Detroit address…" : "Use my current location"}
          </button>
          <span className="text-[0.7rem] text-ink-3">City of Detroit only</span>
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

      {!compact && !params && (
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
