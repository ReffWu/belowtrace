import Link from "next/link";
import { AddressSearch } from "@/components/address-search";

const STATS = [
  { value: "14,115", label: "“water in basement” investigations requested through Detroit 311 since 2023" },
  { value: "1 in 3", label: "private sewer connections are clogged, offset, or cut off from the city sewer, DWSD says" },
  { value: "$10,000+", label: "is what these repairs can easily cost — out of reach for many families" },
];

const EXAMPLES = [
  { address: "16776 Prevost St", note: "The city sewer out back was laid in 1928" },
  { address: "16821 Fenmore St", note: "DWSD alley sewer work is under way nearby" },
  { address: "14600 Archdale St", note: "Outside the Private Sewer Repair area" },
];

export default function Home() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-5xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-16">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium text-ink-2">
            <span className="h-2 w-2 rounded-full bg-own" aria-hidden="true" />
            Free · No sign-up · City of Detroit addresses
          </p>
          <h1 className="max-w-3xl text-[2.35rem] font-extrabold leading-[1.08] tracking-tight text-ink sm:text-[3.4rem]">
            Sewage in your basement? <span className="text-brand">Start here.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-2 sm:text-xl">
            Enter your address to see who&apos;s responsible for the sewer line, which City programs might pay for the repair, the
            deadlines you can&apos;t miss, and what public records actually show about the pipes behind your home.
          </p>
          <div className="mt-8 max-w-4xl rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_0_rgb(21_33_43/0.04),0_12px_32px_-16px_rgb(21_33_43/0.25)] sm:p-6">
            <AddressSearch />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.95rem] text-ink-2">
            <span className="font-medium">Try an example:</span>
            {EXAMPLES.map((e) => (
              <Link
                key={e.address}
                href={`/report?${new URLSearchParams({ address: e.address, situation: "backup" })}`}
                className="group rounded-md text-brand underline decoration-brand/30 hover:decoration-brand"
                title={e.note}
              >
                {e.address}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight">You&apos;ll get a one-page answer to four questions</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ["Whose pipe is it?", "In Detroit the line from your house to the alley sewer is yours. We show where the City's part starts."],
            ["Will anyone help pay?", "The City's new $184M alley repair program, up to $40,000 from PSRP, Critical Home Repair — checked against your address."],
            ["What do I do first?", "A step-by-step plan with real dates: the 45-day claim window, the next program deadline, who to call."],
            ["What do the records show?", "The city sewer behind you, sewer work nearby, and neighbors' 311 reports — with what's known, estimated, and unknown."],
          ].map(([q, a], i) => (
            <li key={q} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-tint font-bold text-brand-ink">{i + 1}</span>
              <span>
                <span className="block text-lg font-semibold">{q}</span>
                <span className="mt-1 block text-ink-2">{a}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <h2 className="max-w-3xl text-2xl font-bold tracking-tight">
            The money exists. Finding it shouldn&apos;t take twenty phone calls.
          </h2>
          <dl className="mt-8 grid gap-6 sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.value} className="border-l-4 border-own pl-4">
                <dt className="text-4xl font-extrabold tracking-tight text-ink">{s.value}</dt>
                <dd className="mt-2 text-ink-2">{s.label}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 max-w-3xl text-ink-2">
            Detroit is spending <strong className="text-ink">$184 million</strong> to fix about 8,000 broken alley connections for free
            starting October 2026 — with no application and no way to look up your address. The Private Sewer Repair Program offers up to{" "}
            <strong className="text-ink">$40,000</strong>, but its own guide lists two different income limits. BelowTrace puts the rules,
            the records and the deadlines for your address in one place.
          </p>
          <p className="mt-4 text-sm text-ink-3">
            Sources: Improve Detroit 311 (as of Sep 17, 2026); DWSD; City of Detroit.{" "}
            <Link href="/sources" className="underline">
              Details
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-[1fr_1.4fr] sm:items-start">
          <h2 className="text-2xl font-bold tracking-tight">Honest about what nobody knows</h2>
          <div className="space-y-3 text-ink-2">
            <p>
              Every fact in a BelowTrace report is labeled{" "}
              <span className="rounded-md bg-ink px-1.5 py-0.5 text-sm font-semibold text-white">Recorded</span>,{" "}
              <span className="rounded-md border border-warn px-1.5 py-0.5 text-sm font-semibold text-warn">Estimated</span> or{" "}
              <span className="rounded-md border border-dashed border-ink-3 px-1.5 py-0.5 text-sm font-semibold text-ink-3">Unknown</span>,
              with a link to where it came from.
            </p>
            <p>
              We never draw a guessed pipe. No public record shows where a private sewer line runs — only a camera inspection can.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
