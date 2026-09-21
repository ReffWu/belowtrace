"use client";

// One job: hand back a Detroit street address the resident confirmed.
// It no longer decides where to navigate or what "situation" someone is in, the caller does.
import { useEffect, useId, useRef, useState } from "react";

type Suggestion = { text: string; magicKey: string };

export function AddressSearch({
  defaultAddress = "",
  cta = "Continue",
  autoFocus = false,
  onPick,
  busy = false,
}: {
  defaultAddress?: string;
  cta?: string;
  autoFocus?: boolean;
  onPick: (address: string) => void;
  busy?: boolean;
}) {
  const [value, setValue] = useState(defaultAddress);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
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
        /* typing faster than the network */
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  function submit(address: string) {
    const text = address.trim().replace(/,\s*USA$/i, "");
    if (!text) return setError("Enter a street address, like 16776 Prevost St.");
    if (!/^\d/.test(text)) return setError("Start with the house number, like 16776 Prevost St.");
    setError("");
    setOpen(false);
    onPick(text);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) return setError("This device cannot share a location. Type the address instead.");
    setError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`/api/locate?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
          const data = await res.json();
          setLocating(false);
          if (data.ok && data.inDetroit && data.address) {
            setValue(data.address);
            submit(data.address);
          } else if (data.ok && !data.inDetroit) {
            setError(`That looks like ${data.city || "somewhere"} outside Detroit. BelowTrace covers the City of Detroit.`);
          } else {
            setError("No Detroit property matched that location. Type the address instead.");
          }
        } catch {
          setLocating(false);
          setError("The lookup did not answer. Type the address instead.");
        }
      },
      (err) => {
        setLocating(false);
        setError(err.code === err.PERMISSION_DENIED ? "Location was not shared. Type the address instead." : "Could not get a location. Type the address instead.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (active >= 0 && suggestions[active]) {
          picked.current = suggestions[active];
          setValue(suggestions[active].text);
          submit(suggestions[active].text);
        } else submit(value);
      }}
      className="grid gap-3"
    >
      <div className="relative">
        <label htmlFor={inputId} className="sr-only">
          Your Detroit street address
        </label>
        <input
          id={inputId}
          type="text"
          autoComplete="street-address"
          autoFocus={autoFocus}
          placeholder="16776 Prevost St"
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
            } else if (e.key === "Escape") setOpen(false);
          }}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className="h-16 w-full rounded-2xl border-2 border-line-2 bg-surface px-5 text-[1.15rem] outline-none transition placeholder:text-ink-3 focus:border-brand focus:ring-4 focus:ring-brand/15"
        />
        {open && suggestions.length > 0 && (
          <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-2xl border border-line bg-surface py-1 shadow-xl">
            {suggestions.map((s, i) => (
              <li
                key={s.magicKey}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  picked.current = s;
                  setValue(s.text);
                  submit(s.text);
                }}
                onMouseEnter={() => setActive(i)}
                className={`cursor-pointer px-5 py-3 ${i === active ? "bg-brand-tint text-brand-ink" : ""}`}
              >
                {s.text.replace(/,\s*USA$/i, "")}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} role="alert" className="font-semibold text-stop">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-ink text-[1.15rem] font-bold text-white transition hover:bg-brand-ink active:scale-[0.99] disabled:opacity-60"
      >
        {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> : cta}
      </button>

      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={locating || busy}
        className="min-h-11 rounded-xl font-semibold text-brand hover:underline disabled:opacity-50"
      >
        {locating ? "Finding your address…" : "Use my current location"}
      </button>
    </form>
  );
}
