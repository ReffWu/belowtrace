"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddressSearch } from "./address-search";

const EXAMPLES = [
  { a: "7806 Mettetal St", n: "work contracted 200 m away" },
  { a: "5017 W Outer Dr", n: "District 2 — nothing in round one" },
  { a: "16776 Prevost St", n: "107 flooding reports, not selected" },
];

export function StartSearch() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const go = (address: string) => {
    setBusy(true);
    router.push(`/report?address=${encodeURIComponent(address)}`);
  };
  return (
    <div>
      <AddressSearch cta="See what is under my house" busy={busy} onPick={go} />
      <div className="mt-5">
        <p className="text-[0.8rem] font-bold uppercase tracking-[0.12em] text-ink-3">Three real addresses, three different answers</p>
        <ul className="mt-2 grid gap-1.5">
          {EXAMPLES.map((e) => (
            <li key={e.a}>
              <button
                type="button"
                onClick={() => go(e.a)}
                className="flex min-h-11 w-full flex-col items-start gap-0.5 rounded-lg px-1 py-1.5 text-left hover:bg-sunk/60 xs:flex-row xs:items-baseline xs:justify-between xs:gap-3 xs:py-0"
              >
                <span className="font-semibold text-brand underline decoration-brand/30 underline-offset-4">{e.a}</span>
                <span className="min-w-0 text-[0.88rem] leading-snug text-ink-3 xs:shrink-0 xs:text-right">{e.n}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
