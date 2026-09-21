import type { Metadata } from "next";
import Link from "next/link";
import stats from "@/data/citywide-stats.json";
import calibration from "@/data/asrp-calibration.json";
import { ASRP } from "@/lib/asrp";
import { SplitMap } from "@/components/split-map";
import { StartSearch } from "@/components/start-search";

export const metadata: Metadata = {
  title: "Where the money goes",
  description: "Every basement-flooding report Detroit has received since 2023, against the alleys in the first round of the $184M repair program.",
};

export default function MapPage() {
  const outsidePct = Math.round((stats.outsidePsrp / stats.total) * 100);
  return (
    <div>
      <section className="mx-auto max-w-4xl px-5 pt-8">
        <Link href="/" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-semibold text-ink-2 hover:text-ink">
          <span aria-hidden="true">←</span> Back
        </Link>
        <h1 className="mt-5 text-[2.1rem] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[2.6rem]">
          Where it floods, and where the money is going.
        </h1>
        <p className="mt-4 max-w-2xl text-[1.1rem] leading-relaxed text-ink-2">
          Every one of the {stats.total.toLocaleString("en-US")} times a Detroiter asked the City to investigate water in their
          basement since 2023, and the {calibration.selected.n} alleys in the first round of contracts under the $
          {(ASRP.total / 1_000_000).toFixed(0)}M Alley Sewer Repair Program.
        </p>
      </section>

      <section className="mx-auto mt-7 max-w-6xl px-5">
        <div className="overflow-hidden rounded-3xl border border-line">
          <SplitMap height="clamp(24rem, 70vh, 44rem)" />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          <Fig n="1.0%" t="of basement-flooding reports are within 200 m of a contracted alley" />
          <Fig n="2.5×" t="fewer flooding reports around the chosen alleys than around earlier alley projects" />
          <Fig n={`${outsidePct}%`} t={`of reports are outside every neighborhood the $30,000 repair program serves`} />
        </div>

        <p className="mt-10 leading-relaxed text-ink-2">
          Cave-ins are a street-surface failure the City sees in its own maintenance records. Water in a basement is a 311 request
          from a household. The first round of contracts tracks the first and not the second.{" "}
          <Link href="/method" className="font-semibold text-brand underline">
            How this was worked out, and what it does not prove
          </Link>
          .
        </p>

        <div className="mt-10 rounded-3xl border-2 border-line bg-surface p-6">
          <h2 className="text-[1.35rem] font-extrabold tracking-[-0.025em]">What about one address?</h2>
          <p className="mt-2 text-ink-2">Six segments, who owns each, and who might pay.</p>
          <div className="mt-5">
            <StartSearch />
          </div>
        </div>
      </section>
    </div>
  );
}

function Fig({ n, t }: { n: string; t: string }) {
  return (
    <div>
      <p className="text-[3rem] font-extrabold leading-none tracking-[-0.04em] tabular-nums">{n}</p>
      <p className="mt-2 leading-snug text-ink-2">{t}</p>
    </div>
  );
}
