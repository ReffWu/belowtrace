import type { Metadata } from "next";
import Link from "next/link";
import { AddressSearch } from "@/components/address-search";
import { StepShell } from "@/components/flow/step-shell";

export const metadata: Metadata = { title: "Which home?" };

// Only "just checking" asks for an address up front; a case asks for it when it's needed.
export default function AddressStep() {
  return (
    <StepShell back="/" title="Which home?" lead="See what public records show under a Detroit home, and who fixes what.">
      <AddressSearch defaultSituation="checking" target="/plan" params={{}} cta="Show me" />
      <p className="mt-6 text-ink-3">
        Or try an example:{" "}
        <Link href="/plan?address=16776+Prevost+St&situation=checking" className="font-semibold text-brand underline">
          16776 Prevost St
        </Link>
      </p>
    </StepShell>
  );
}
