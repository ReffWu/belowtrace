import type { Metadata } from "next";
import Link from "next/link";
import stats from "@/data/citywide-stats.json";
import { SOURCES } from "@/lib/facts";
import calibration from "@/data/asrp-calibration.json";
import { ComparisonChart, DistrictChart, Pull, Shot, VerdictPair } from "@/components/about-visuals";
import { SplitMap } from "@/components/split-map";
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
        If a contract reaches your alley, the repair is free. If it never does, you pay $5,000 to 25,000 yourself. Nobody can apply,
        there is no list, and nobody is told either way, so a household staring at a quote cannot answer the only question that
        matters: wait, or pay? BelowTrace answers it from one address.
      </p>

      <div className="mt-8 rounded-3xl border-2 border-own/35 bg-surface p-5 sm:p-6">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-own">Rise Higher Detroit pillar</p>
        <p className="mt-1.5 text-[1.2rem] font-extrabold tracking-[-0.02em]">
          Reliable Transportation, Infrastructure &amp; Sustainability
        </p>
        <p className="mt-2 leading-relaxed text-ink-2">
          Detroit&rsquo;s sewer system is the infrastructure in question, and the repair money is already appropriated. What is missing
          is any way for the household on top of it to see where that money is going.
        </p>
      </div>

      <Block eyebrow="Who this is for" title="The household with a $15,000 quote and no way to decide">
        <p>
          Not &ldquo;Detroit residents.&rdquo; A specific person: a homeowner whose basement has backed up, holding a plumber&rsquo;s
          quote for $5,000 to 25,000, who has been told the City has a program but cannot find out whether it applies to their alley.
        </p>
        <p>
          By DWSD&rsquo;s own director, about <strong className="text-ink">one in three Detroit homes</strong> has a failing sewer
          connection. Detroit 311 has taken <strong className="text-ink">336 water-in-basement reports a month</strong> for 42 straight
          months. The City&rsquo;s three repair programs can reach roughly <strong className="text-ink">11,500 homes</strong>, which
          leaves about <strong className="text-ink">68,000</strong> that no program will reach, and no way for any of them to know
          which group they are in.
        </p>
        <p>
          A contractor put it plainly on r/Detroit in November 2025: &ldquo;It can take 20 or more appointments before I find a
          homeowner who can afford to fix this… I&rsquo;ve called the city, I&rsquo;ve emailed… and never got a reply.&rdquo; Fifty-five
          people replied. Not one produced a working answer.
        </p>
        <Shot
          src="/press/reddit-basement.jpg"
          alt="A Detroit basement floor covered in sewage, photographed by a contractor on a service call."
          caption="What the contractor was photographing. He posted it asking, publicly, whether anyone knew of a program he could send these families to."
          credit="u/MarcRocket, r/Detroit"
          url="https://www.reddit.com/r/Detroit/comments/1oxsd72/sewage_on_the_floor_and_nobody_to_fix_it/"
          tall
        />
        <Pull
          who="A foundation-repair contractor"
          where="r/Detroit"
          when="November 2025"
          url="https://www.reddit.com/r/Detroit/comments/1oxsd72/sewage_on_the_floor_and_nobody_to_fix_it/"
        >
          &ldquo;I go to homes with children&rsquo;s bedrooms in one corner of the basement and feces in the floor in the opposite
          corner… I&rsquo;ve called the city, I&rsquo;ve emailed Rebuilding Detroit and other offices and never got a reply.&rdquo;
        </Pull>
      </Block>

      <Block eyebrow="The problem" title="A basement full of sewage, and a $15,000 quote">
        <p>
          Detroiters asked the City to investigate water in their basements{" "}
          <strong className="text-ink">{stats.total.toLocaleString("en-US")} times</strong> between January 2023 and {stats.snapshot}.
          DWSD says about one in three private sewer connections is clogged, offset, or has fallen off the City&apos;s sewer. When the
          problem is on the homeowner&apos;s side, a repair runs $5,000 to $20,000.
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
          Detroit&rsquo;s money is not organised by what happened to you. It is organised by <em>which part of the pipe broke</em>, and
          each segment has a different owner, a different symptom and an entirely different funding source. No page anywhere lays them
          side by side, so that is what the report is.
        </p>
        <p>
          The segment that matters is the fourth: the connection between your lateral and the main under the alley. Legally it is
          yours, physically it sits under public ground, and it is what the ${(ASRP.total / 1_000_000).toFixed(0)}M program repairs
          for free, if it reaches you.
        </p>
        <p>Two real Detroit addresses, three miles apart, both with a city main on record:</p>
        <VerdictPair />
        <p className="text-[0.95rem] text-ink-3">
          Same question, opposite answers, and today there is nowhere either household could find that out.
        </p>
      </Block>

      <Block eyebrow="The finding" title="The first round is not going where the basements flood">
        <Shot
          src="/press/dwsd-asrp.jpg"
          alt="The City of Detroit announcing the $184M Alley Sewer Repair Program."
          caption="July 2026: the City announces $184M to repair about 9,000 residential sewer connections. Residents cannot apply, and the list of alleys is not published."
          credit="City of Detroit"
          url="https://detroitmi.gov/news/mayor-sheffield-dwsd-announce-184m-alley-sewer-repair-program-fix-9000-private-residential-sewer"
        />
        <p>
          DWSD publishes its selection criteria but not its list. I queried all 782 feature services on the City&rsquo;s ArcGIS
          organization: for sewers, only catch basins and gravity mains are public. The{" "}
          {ASRP.knownDefectPoints.toLocaleString("en-US")}+ failed-connection data points the City says it holds are in none of them.
        </p>
        <p>
          So I measured the criteria that do have open data, against the {calibration.selected.n} alleys already under contract and
          the {calibration.comparison.n} the City completed before this program. Median basement-flooding reports within{" "}
          {calibration.radiusM} m: <strong className="text-ink">{calibration.water.median}</strong> around the chosen alleys, versus{" "}
          <strong className="text-ink">{calibration.comparison.waterMedian}</strong> around the earlier ones, p &lt; 0.0001. Cave-ins
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
        <div className="grid gap-4 sm:grid-cols-2">
          <ComparisonChart />
          <DistrictChart />
        </div>
        <figure className="overflow-hidden rounded-2xl border border-line">
          <SplitMap height="clamp(17rem, 44vw, 24rem)" />
          <figcaption className="border-t border-line bg-surface px-4 py-3 text-[0.9rem] text-ink-2">
            Blue: 14,115 basement-flooding reports since 2023. Orange: the {calibration.selected.n} alleys in the first round of
            contracts. 1.0% of the reports fall within 200 m of one.
          </figcaption>
        </figure>
      </Block>

      <Block eyebrow="Why it is still unsolved" title="Three departments, two logics, one invisible list">
        <p>
          The $184M Alley Sewer Repair Program is <strong className="text-ink">supply-driven</strong>: the City picks, nobody applies,
          nobody is notified. The Private Sewer Repair Program is <strong className="text-ink">demand-driven</strong>: you apply, and
          you must prove the June 2021 flood damaged your home, five years later. They sit in different departments, on different
          pages, and the City&rsquo;s own guide states two different income limits for the same program on pages 3 to 4 and page 10.
        </p>
        <p>
          The cruelest rule is the sequencing one: <strong className="text-ink">PSRP cannot pay for work that has already started.</strong>{" "}
          Acting sensibly in an emergency disqualifies you from up to $30,000. That is written in the policy, and it is not surfaced at
          the moment anyone needs it.
        </p>
        <Shot
          src="/press/wdiv-beasley.jpg"
          alt="A Detroit couple outside their home, from a WDIV Local 4 report on fifty years of basement flooding."
          caption="Fifty years of flooding. The couple called the City repeatedly and got nowhere; the City arrived within thirty minutes of a TV crew, and the fix was clearing a manhole and snaking the line."
          credit="WDIV Local 4"
          url="https://www.clickondetroit.com/news/local/2026/05/02/5-decades-of-basement-flooding-but-no-record-of-sewer-line-a-michigan-couples-story/"
        />
        <Pull
          who="Sam Smalley, DWSD deputy director, to a family flooded for 50 years"
          where="WDIV Local 4"
          when="May 2026"
          url="https://www.clickondetroit.com/news/local/2026/05/02/5-decades-of-basement-flooding-but-no-record-of-sewer-line-a-michigan-couples-story/"
        >
          &ldquo;This sewer is not on our records, it&rsquo;s not on our maps. We don&rsquo;t know whose sewer it is.&rdquo;
        </Pull>
        <p>
          The city cleared that line within days of the broadcast. I sampled 1,500 flooding reports and asked whether any city sewer
          main appears within 120 m in the published data: <strong className="text-ink">29% do</strong>. For the other 71%, a household
          looking up its own block finds nothing at all.
        </p>
      </Block>

      <Block eyebrow="Why it repeats" title="Not a form you fill once">
        <p>
          A backup is not a single event. It returns with every heavy storm, the alley programme rolls out over four years in phases
          nobody publishes, and program rounds open and close. The same household checks again after the next storm, after a
          neighbour&rsquo;s alley is dug up, before signing a contract, and before a sale. Each check is a decision worth $15,000 to 30,000.
        </p>
        <p>
          The people who touch the most households are not homeowners at all, they are the plumbers, waterproofers, block clubs and
          district staff who stand in these basements weekly. One page that answers &ldquo;wait or pay&rdquo; from an address is a tool
          they can use on every visit.
        </p>
      </Block>

      <Block eyebrow="Impact, if adopted" title="What actually changes, and for whom">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-ink">For the ~11,500 households the City will reach:</strong> they stop paying $5,000 to 25,000 for a
            repair that was already contracted. The City budgets about $20,400 per connection; paying for one privately a month before
            the contractor arrives is money that never comes back.
          </li>
          <li>
            <strong className="text-ink">For the ~68,000 it will not:</strong> they stop waiting. Years of sewage, mold and falling
            property value accumulate while a household waits for a notification that is never sent.
          </li>
          <li>
            <strong className="text-ink">For the City:</strong> the same measurement is a public check on a $184M program that has
            three years and most of its budget still to allocate. Publishing it now is the only moment it can change anything.
          </li>
          <li>
            <strong className="text-ink">Beyond Detroit:</strong> homeowners own their sewer laterals in most American cities, and the
            same three public datasets, 311 requests, capital project phases, and census income, exist almost everywhere. The
            selection criteria and the neighborhood rules are configuration; the method travels. What does not travel is Detroit&rsquo;s
            particular program mix, which is why I say &ldquo;City of Detroit only&rdquo; rather than pretending otherwise.
          </li>
        </ul>
      </Block>

      <Block eyebrow="How it sustains itself" title="It costs almost nothing to keep running">
        <p>
          Every input is public open data, the app runs as static pages with no AI at runtime, and there are no accounts to
          administer. The honest answer to &ldquo;how does this make money&rdquo; is that it does not need to in order to survive ,
          which for a civic tool is a feature.
        </p>
        <p>
          Where revenue could come from, in order of how much evidence there is: the City&rsquo;s PSRP policy already contracts
          community organizations, for a fee, to do outreach and application intake, so a pre-screening tool has a buyer-shaped hole
          to fill. <strong className="text-ink">Nobody has agreed to buy it.</strong> I deliberately refuse the obvious one, selling
          leads to contractors, because the advice &ldquo;do not pay for this yet&rdquo; is only worth anything if nobody is paid when
          you do.
        </p>
      </Block>

      <Block eyebrow="What it refuses to do" title="Honest by design">
        <ul className="list-disc space-y-2 pl-5">
          <li>It never draws a guessed pipe. No public record locates a private sewer line; only a camera inspection does.</li>
          <li>
            It never predicts DWSD&rsquo;s decision. The deciding evidence, a camera inspection of your connection, is not public,
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
