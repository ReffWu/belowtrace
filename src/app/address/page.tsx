import type { Metadata } from "next";
import Link from "next/link";
import { AddressSearch } from "@/components/address-search";
import { StepShell } from "@/components/flow/step-shell";
import { parseBreak } from "@/lib/guide";
import { parseSituation } from "@/lib/report";

export const metadata: Metadata = { title: "Your address" };

const COPY = {
  backup: {
    step: [3, 3],
    back: "/backup/record",
    title: "Now, who can help pay?",
    lead: "Enter the home's address. We'll check it against every City repair program and what public records show.",
  },
  "broken-line": {
    step: [2, 2],
    back: "/quote",
    title: "Where's the home?",
    lead: "We'll check it against every City repair program, so you know what to ask before you sign.",
  },
  checking: {
    step: [1, 1],
    back: "/",
    title: "Which home?",
    lead: "See what public records show under a Detroit home, and who fixes what.",
  },
} as const;

export default async function AddressStep(props: PageProps<"/address">) {
  const sp = await props.searchParams;
  const situation = parseSituation(sp.situation);
  const c = COPY[situation];
  const params: Record<string, string> = situation === "broken-line" ? { break: parseBreak(sp.break) } : {};
  return (
    <StepShell step={c.step[0]} of={c.step[1]} back={c.back} title={c.title} lead={c.lead}>
      <AddressSearch defaultSituation={situation} target="/plan" params={params} cta="Show me" />
      <p className="mt-6 text-ink-3">
        Or try an example:{" "}
        <Link href={`/plan?${new URLSearchParams({ address: "16776 Prevost St", situation, ...params })}`} className="font-semibold text-brand underline">
          16776 Prevost St
        </Link>
      </p>
    </StepShell>
  );
}
