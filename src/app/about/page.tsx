import type { Metadata } from "next";
import Link from "next/link";
import stats from "@/data/citywide-stats.json";
import { SOURCES } from "@/lib/facts";
import calibration from "@/data/asrp-calibration.json";
import { ASRP } from "@/lib/asrp";

export const metadata: Metadata = { title: "About", description: "What BelowTrace does, what it refuses to do, and what has not been proven yet." };

function Block({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-10">
      <p className="text-sm font-bold uppercase tracking-[0.12em] text-own">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-[1.75rem]">{title}</h2>
      <div className="mt-4 space-y-4 text-[1.05rem] leading-relaxed text-ink-2">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  const outsidePct = Math.round((stats.outsidePsrp / stats.total) * 100);
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-[0.12em] text-ink-3">About BelowTrace</p>
      <h1 className="mt-1 text-[2.3rem] font-extrabold leading-tight tracking-tight sm:text-[2.9rem]">
        Detroit is spending $184M on sewer connections, and does not publish where.
      </h1>
      <p className="mt-5 text-lg text-ink-2">
        If a contract reaches your alley, the repair is free. If it never does, you pay $5,000–25,000 yourself. Nobody can apply,
        there is no list, and nobody is told either way — so a household staring at a quote cannot answer the only question that
        matters: wait, or pay? BelowTrace answers it from one address.
      </p>

      <Block eyebrow="The problem" title="A basement full of sewage, and a $15,000 quote">
        <p>
          Detroiters asked the City to investigate water in their basements{" "}
          <strong className="text-ink">{stats.total.toLocaleString("en-US")} times</strong> between January 2023 and {stats.snapshot}.
          DWSD says about one in three private sewer connections is clogged, offset, or has fallen off the City&apos;s sewer. When the
          problem is on the homeowner&apos;s side, a repair runs $5,000–$20,000.
        </p>
        <p>
          The help is real but scattered: a $184M Alley Sewer Repair Program with no application and no address lookup; a Private Sewer
          Repair Program worth up to $30,000 whose own guide states two different income limits on different pages; a Critical Home
          Repair round that closes in days; and the 45-day clock, which is the only one that runs whether or not anyone is paying
          attention.
        </p>
        <p>
          In April 2026 an 86-year-old Detroiter was pumping his basement by hand every morning while the City said his sewer was not
          on its records (
          <a href={SOURCES.beasley.url} target="_blank" rel="noreferrer" className="text-brand underline">
            WDIV
          </a>
          ). And the biggest private-line program does not reach everyone:{" "}
          <strong className="text-ink">
            {stats.outsidePsrp.toLocaleString("en-US")} of those reports ({outsidePct}%)
          </strong>{" "}
          came from outside its 97 neighborhoods. <Link href="/map" className="font-semibold text-brand underline">See the map</Link>.
        </p>
      </Block>

      <Block eyebrow="What it does" title="One address, six segments">
        <p>
          Detroit&rsquo;s money is not organised by what happened to you. It is organised by <em>which part of the pipe broke</em> — and
          each segment has a different owner, a different symptom and an entirely different funding source. No page anywhere lays them
          side by side, so that is what the report is.
        </p>
        <p>
          The segment that matters is the fourth: the connection between your lateral and the main under the alley. Legally it is
          yours, physically it sits under public ground, and it is what the ${(ASRP.total / 1_000_000).toFixed(0)}M program repairs
          for free — if it reaches you.
        </p>
      </Block>

      <Block eyebrow="The finding" title="The first round is not going where the basements flood">
        <p>
          DWSD publishes its selection criteria but not its list. We queried all 782 feature services on the City&rsquo;s ArcGIS
          organization: for sewers, only catch basins and gravity mains are public. The{" "}
          {ASRP.knownDefectPoints.toLocaleString("en-US")}+ failed-connection data points the City says it holds are in none of them.
        </p>
        <p>
          So we measured the criteria that do have open data, against the {calibration.selected.n} alleys already under contract and
          the {calibration.comparison.n} the City completed before this program. Median basement-flooding reports within{" "}
          {calibration.radiusM} m: <strong className="text-ink">{calibration.water.median}</strong> around the chosen alleys, versus{" "}
          <strong className="text-ink">{calibration.comparison.waterMedian}</strong> around the earlier ones — p &lt; 0.0001. Cave-ins
          run the other way.
        </p>
        <p>
          The plain reading is that the first round tracks collapsed pavement, which the City sees in its own asset records, rather
          than flooded basements, which residents report and which may never become a DWSD record. Four of seven districts have
          nothing yet, including District 4, which the City&rsquo;s own Action Plan named a priority.{" "}
          <Link href="/method" className="font-semibold text-brand underline">
            The full method and every caveat
          </Link>
          .
        </p>
      </Block>

      <Block eyebrow="What it refuses to do" title="Honest by design">
        <ul className="list-disc space-y-2 pl-5">
          <li>It never draws a guessed pipe. No public record locates a private sewer line; only a camera inspection does.</li>
          <li>
            It never predicts DWSD&rsquo;s decision. The deciding evidence — a camera inspection of your connection — is not public,
            and the report says so on every address. A missing lookup stays unknown, never a no.
          </li>
          <li>
            It never writes a cause into your letter. Saying something in writing that later turns out to be wrong is worse than saying
            you do not know.
          </li>
          <li>
            It does not decide eligibility. It shows the rules, including where the City&apos;s own documents contradict each other.
          </li>
        </ul>
      </Block>

      <Block eyebrow="What is not proven" title="Read this before you trust it">
        <p>
          The public evidence that this problem exists is strong, and the finding above is checkable by anyone. The evidence that this{" "}
          <em>tool</em> changes an outcome is not: no resident has been observed using it to decide, no agency has agreed to receive
          anything it produces, and this is the first round of a four-year program that may yet even out. Those are the next things
          to find out, not things to claim.
        </p>
        <p>
          Program rules move, and the mailing address for a claim has moved before. Confirm anything you are about to rely on with the
          department that runs it. <Link href="/sources" className="font-semibold text-brand underline">Every source is listed</Link>,
          with the date it was checked.
        </p>
      </Block>

      <Block eyebrow="Who built it" title="One Detroit resident, with AI assistance">
        <p>
          Built for the Venture 313 Buildathon 2026, free and open source. The app uses no AI at runtime: every statement comes from
          public data or a published rule, through code you can read. It is not a utility locate, an inspection, or legal advice.
        </p>
      </Block>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="inline-flex min-h-12 items-center rounded-xl bg-ink px-5 font-semibold text-white hover:bg-brand-ink">
          Start
        </Link>
        <Link href="/map" className="inline-flex min-h-12 items-center rounded-xl border-2 border-line-2 px-5 font-semibold hover:border-ink">
          See the citywide map
        </Link>
      </div>
    </div>
  );
}
