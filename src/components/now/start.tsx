"use client";

// Two facts, one screen. The date defaults to today because that is almost always true,
// and a wrong default that is one tap from correct beats a question nobody wants to answer
// while standing in a wet basement.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddressSearch } from "@/components/address-search";
import { newCase, todayInDetroit } from "@/lib/case";
import { addDays } from "@/lib/law";
import { save } from "@/lib/store";

export function Start() {
  const router = useRouter();
  const today = todayInDetroit();
  const [foundOn, setFoundOn] = useState(today);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);

  const yesterday = addDays(today, -1);
  const label = foundOn === today ? "today" : foundOn === yesterday ? "yesterday" : longish(foundOn);

  return (
    <div className="grid gap-4">
      <AddressSearch
        cta="Start the clock"
        busy={busy}
        onPick={(address) => {
          setBusy(true);
          const c = newCase(foundOn, { address });
          save(c);
          router.push("/now");
        }}
      />

      <div className="text-center">
        {!picking ? (
          <button type="button" onClick={() => setPicking(true)} className="min-h-11 rounded-lg px-2 text-ink-2 hover:text-ink">
            Found the water <strong className="text-ink">{label}</strong> · change
          </button>
        ) : (
          <div className="rounded-2xl border-2 border-line-2 bg-surface p-4 text-left">
            <p className="font-semibold">When did you find the water?</p>
            <p className="mt-0.5 text-[0.95rem] text-ink-3">Michigan counts the 45 days from this day.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { v: today, l: "Today" },
                { v: yesterday, l: "Yesterday" },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => {
                    setFoundOn(o.v);
                    setPicking(false);
                  }}
                  className={`min-h-12 rounded-xl border-2 font-semibold ${foundOn === o.v ? "border-ink bg-ink text-white" : "border-line-2 hover:border-ink"}`}
                >
                  {o.l}
                </button>
              ))}
            </div>
            <label className="mt-3 grid gap-1.5">
              <span className="text-[0.95rem] font-semibold text-ink-2">Another day</span>
              <input
                type="date"
                max={today}
                value={foundOn}
                onChange={(e) => e.target.value && setFoundOn(e.target.value)}
                className="h-14 w-full rounded-xl border-2 border-line-2 bg-surface px-4 text-lg"
              />
            </label>
            <button type="button" onClick={() => setPicking(false)} className="mt-3 min-h-11 w-full rounded-xl bg-sunk font-semibold">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const longish = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
