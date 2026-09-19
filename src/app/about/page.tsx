import type { Metadata } from "next";
import Link from "next/link";
import stats from "@/data/citywide-stats.json";
import { SOURCES } from "@/lib/facts";

export const metadata: Metadata = { title: "About", description: "Why BelowTrace exists, who it serves, and how it keeps going." };

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
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-[0.12em] text-ink-3">About BelowTrace</p>
      <h1 className="mt-1 text-[2.3rem] font-extrabold leading-tight tracking-tight sm:text-[2.9rem]">
        Detroit has the money to fix broken sewer lines. Residents can&apos;t find it.
      </h1>
      <p className="mt-5 text-lg text-ink-2">
        BelowTrace turns one Detroit address into a clear answer: whose pipe it is, which program might pay, what to do by when, and
        what the public records actually show. Free, no sign-up, every fact sourced.
      </p>

      <Block eyebrow="The problem" title="A basement full of sewage, and a $15,000 quote">
        <p>
          Detroiters asked the City to investigate water in their basements{" "}
          <strong className="text-ink">{stats.total.toLocaleString("en-US")} times</strong> between January 2023 and {stats.snapshot}. DWSD
          says about one in three private sewer connections is clogged, offset, or has fallen off the City&apos;s sewer. When the
          problem is on the homeowner&apos;s side, a repair can cost $5,000–$20,000.
        </p>
        <p>
          The help is real but scattered: a $184M Alley Sewer Repair Program that starts in October 2026 with no application and no
          address lookup; a Private Sewer Repair Program worth up to $40,000 whose own guide lists two different income limits; a
          Critical Home Repair round that closes in days; a 45-day damage-claim clock. They live on different pages run by different
          departments.
        </p>
        <p>
          The result: in April 2026 an 86-year-old Detroiter was pumping his basement by hand every morning while the City said his
          sewer wasn&apos;t on its records (
          <a href={SOURCES.beasley.url} target="_blank" rel="noreferrer" className="text-brand underline">
            WDIV
          </a>
          ). A Detroit contractor told Reddit that it can take twenty appointments to find one homeowner who can afford the fix — and
          nobody could tell him where to send the rest.
        </p>
        <p>
          And the biggest private-line program doesn&apos;t reach everyone:{" "}
          <strong className="text-ink">
            {stats.outsidePsrp.toLocaleString("en-US")} of those reports ({Math.round((stats.outsidePsrp / stats.total) * 100)}%)
          </strong>{" "}
          came from outside its 97 neighborhoods. <Link href="/map" className="font-semibold text-brand underline">See the map</Link>.
        </p>
      </Block>

      <Block eyebrow="Who it serves" title="The resident — and everyone who helps them">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-ink">Homeowners and landlords</strong> with a backup, a broken line, or a scary quote. Plain language,
            big type, printable, works on a phone.
          </li>
          <li>
            <strong className="text-ink">Helpers</strong>: plumbers and waterproofers who meet these families first, block clubs, district
            managers, and the community organizations the City pays to do outreach and application intake for PSRP.
          </li>
          <li>
            <strong className="text-ink">The City</strong>: fewer calls asking “am I eligible?”, fewer incomplete applications (PSRP gives
            applicants only 5 days to send missing documents), and a clear picture of where the need sits outside current programs.
          </li>
        </ul>
      </Block>

      <Block eyebrow="Why people come back" title="Built around the moments that repeat">
        <p>
          Basement backups come back with every heavy storm. Deadlines arrive in sequence — the 45-day claim, program rounds, the HOPE
          tax deadline — and BelowTrace puts them on your calendar. Helpers use it on every visit: look up the address, print the page,
          hand it to the family. The report stays current as the City&apos;s data and program rules change.
        </p>
      </Block>

      <Block eyebrow="How it lasts" title="Free for residents, paid for by the institutions it saves time">
        <p>
          Residents never pay. The City already funds this work: its PSRP policy contracts community organizations, for a fee, to do
          outreach and application intake. BelowTrace is the intake pre-screen and outreach tool for those partners, for HRD and for DWSD
          call-takers — licensed as a hosted service, with the code open source so the public can check every rule.
        </p>
      </Block>

      <Block eyebrow="Beyond Detroit" title="One city's configuration, not a one-off">
        <p>
          Homeowners own their sewer laterals in most American cities, and older cities share Detroit&apos;s mix of aging pipes and
          scattered help. BelowTrace keeps each city&apos;s rules, deadlines and data connectors in configuration, so the next city is a data
          and policy job, not a rewrite.
        </p>
      </Block>

      <Block eyebrow="What we won't do" title="Honest by design">
        <ul className="list-disc space-y-2 pl-5">
          <li>We never draw a guessed pipe. No public record locates private sewer lines; only a camera inspection can.</li>
          <li>Every fact is labeled Recorded, Estimated or Unknown, with its source and date.</li>
          <li>We don&apos;t decide eligibility. We show the rules — including where the City&apos;s own documents disagree.</li>
        </ul>
      </Block>

      <Block eyebrow="Next" title="What would make it better">
        <ul className="list-disc space-y-2 pl-5">
          <li>DWSD publishing the Alley Sewer Repair Program schedule, so we can answer “is my alley on the list?” directly.</li>
          <li>Spanish and Arabic versions — the City already publishes its program materials in both.</li>
          <li>Text-message reminders for deadlines and new program rounds.</li>
        </ul>
      </Block>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/" className="inline-flex min-h-12 items-center rounded-xl bg-brand px-5 font-semibold text-white hover:bg-brand-ink">
          Check an address
        </Link>
        <Link href="/map" className="inline-flex min-h-12 items-center rounded-xl border-2 border-line-2 px-5 font-semibold hover:border-ink">
          See the citywide map
        </Link>
      </div>
    </div>
  );
}
