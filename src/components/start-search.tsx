"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddressSearch } from "./address-search";

const TONE: Record<string, string> = {
  go: "bg-go-tint text-[#14532d]",
  stop: "bg-stop-tint text-stop",
  brand: "bg-brand-tint text-brand-ink",
};

const EXAMPLES = [
  { a: "7806 Mettetal St", n: "Covered", tone: "go" },
  { a: "5017 W Outer Dr", n: "Not coming", tone: "stop" },
  { a: "16776 Prevost St", n: "Worth a call", tone: "brand" },
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
                className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-1 text-left hover:bg-sunk/60"
              >
                <span className="truncate font-semibold text-brand underline decoration-brand/30 underline-offset-4">{e.a}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.78rem] font-bold ${TONE[e.tone]}`}>{e.n}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
