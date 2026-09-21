import type { Metadata } from "next";
import Link from "next/link";
import calibration from "@/data/asrp-calibration.json";
import { ASRP } from "@/lib/asrp";
import { SOURCES } from "@/lib/facts";
import { DATA_SNAPSHOT } from "@/lib/geo";

export const metadata: Metadata = {
  title: "Method",
  description: "How the alley-program likelihood is worked out, what it is measured against, and what it does not prove.",
};

const districtRows = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
  n,
  count: (calibration.districtCounts as Record<string, number>)[String(n)] ?? 0,
}));

export default function MethodPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 pb-20 pt-8">
      <Link href="/" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-semibold text-ink-2 hover:text-ink">
        <span aria-hidden="true">←</span> Back
      </Link>

      <h1 className="mt-5 text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.035em]">Method, and what it does not prove.</h1>
      <p className="mt-4 text-[1.1rem] leading-relaxed text-ink-2">
        We do not predict DWSD&rsquo;s decisions. We measure the criteria DWSD publishes, using the data DWSD publishes, and report where an
        address sits relative to the {calibration.selected.n} alleys already under contract.
      </p>

      <Block title="What the City says it does">
        <p>
          DWSD selects alleys for the ${(ASRP.total / 1_000_000).toFixed(0)}M Alley Sewer Repair Program using closed-circuit camera
          inspections that confirm failed private connections, recorded alley cave-ins and sinkholes, and federal rules requiring
          block groups above 50% low-to-moderate income. Work is rolled out in phases, and residents cannot apply.
        </p>
        <p>
          In a 2025 public comment response the City stated it already holds{" "}
          <strong className="text-ink">over {ASRP.knownDefectPoints.toLocaleString("en-US")} data points</strong> showing where failed
          lateral connections are.
        </p>
      </Block>

      <Block title="What is actually public">
        <p>
          We queried all 782 feature services on the City of Detroit&rsquo;s ArcGIS organization. For sewers, exactly two layers are public:
          catch basins, and gravity mains with recent cleaning work orders. <strong className="text-ink">None of the 30,000+ failed-connection points are published.</strong>{" "}
          Neither is the list of selected alleys.
        </p>
        <p>So we used the criteria that do have open data behind them:</p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>Alley cave-ins and sinkholes, Improve Detroit 311, {DATA_SNAPSHOT} snapshot</li>
          <li>Water-in-basement reports, same source</li>
          <li>Low/moderate income share, HUD by block group, live</li>
          <li>Council district, City of Detroit 2026 boundaries</li>
          <li>Alleys already contracted, DWSD Capital Improvement Projects, phases Construction and Procurement</li>
        </ul>
      </Block>

      <Block title="The test">
        <p>
          We took the {calibration.selected.n} alley projects in the current program ({calibration.selected.construction} in
          construction, {calibration.selected.procurement} in procurement) and the {calibration.comparison.n} alley projects the City
          completed before it, and measured 311 density within {calibration.radiusM} m of each midpoint.
        </p>
        <Table
          head={["", "Water in basement", "Cave-ins"]}
          rows={[
            [`Alleys chosen for the program (n=${calibration.selected.n})`, String(calibration.water.median), String(calibration.caveIns.median)],
            [`Alley projects completed earlier (n=${calibration.comparison.n})`, String(calibration.comparison.waterMedian), "19"],
          ]}
          note="Median count within 500 m."
        />
        <p>
          A permutation test on the difference of medians gives <strong className="text-ink">p &lt; 0.0001</strong> for the
          basement-flooding gap and <strong className="text-ink">p = 0.0115</strong> for the cave-in gap. Across all{" "}
          {(14115).toLocaleString("en-US")} basement-flooding reports, <strong className="text-ink">1.0%</strong> fall within 200 m of a
          contracted alley and 7.2% within 800 m.
        </p>
        <p>
          The plain reading: the selection tracks <em>collapsed pavement</em>, which is a City asset liability it can see, rather than{" "}
          <em>flooded basements</em>, which residents report and which may never become a DWSD record.
        </p>
      </Block>

      <Block title="A third comparison: where households pay for it themselves">
        <p>
          BSEED trades permits record private sewer work by address: 2,722 permits since 2019, of which{" "}
          <strong className="text-ink">1,288 are backwater valve installations</strong>, households paying to protect themselves. We
          measured the same 500 m flooding density around those addresses.
        </p>
        <Table
          head={["", "Water in basement, median"]}
          rows={[
            ["Addresses where a household paid for the work (n=800 sample)", "38"],
            [`Alley projects the City completed before this program (n=${calibration.comparison.n})`, String(calibration.comparison.waterMedian)],
            [`Alleys chosen for this program (n=${calibration.selected.n})`, String(calibration.water.median)],
          ]}
          note="Same radius and method as the calibration above."
        />
        <p>
          Two independent comparison groups, private spending and the City&rsquo;s own earlier alley work, both sit at 38 to 45. The new
          program sits at {calibration.water.median}. That makes the gap harder to explain as noise in 311 reporting: the same data,
          measured the same way, puts everything else roughly twice as high.
        </p>
        <p>
          A permit also reflects who can afford to pull one, so this is not a clean measure of need. It is a third vantage point that
          points the same direction.
        </p>
      </Block>

      <Block title="A third gap: the map itself">
        <p>
          The public sewer dataset is DWSD&rsquo;s Sewer Cleaning Dashboard, mains that carry a recent cleaning work order. It is a
          record of maintenance activity being read as an asset map, and it is thin where it matters.
        </p>
        <p>
          We sampled 1,500 of the basement-flooding reports at random and asked whether any city sewer main appears within 120 m in
          the public data. <strong className="text-ink">432 did, 29%.</strong> For the other{" "}
          <strong className="text-ink">71%</strong>, a resident looking up their own block finds nothing at all.
        </p>
        <p>
          In May 2026 a Detroit couple told a TV station about fifty years of basement flooding. DWSD&rsquo;s deputy director said on
          camera: &ldquo;This sewer is not on our records, it&rsquo;s not on our maps.&rdquo; The city cleared the line within days of the
          broadcast. A gap in the published record is not proof that DWSD lacks the data internally, but it is why a household cannot
          check anything for itself, and it is why this report says &ldquo;no record&rdquo; rather than inventing a pipe.
        </p>
      </Block>

      <Block title="Where the first round went">
        <Table
          head={["District", "Alleys in the first round"]}
          rows={districtRows.map((d) => [`District ${d.n}`, d.count === 0 ? "none" : String(d.count)])}
          note="The City's CDBG-DR Action Plan named Districts 4, 6 and 7 as priorities. Budget was described publicly as being divided evenly among the districts."
        />
        <p>
          Four of seven districts have nothing in the first round, including District 4. There are three more years of the program,
          so this can change, and that is the reason to publish it now rather than afterwards.
        </p>
      </Block>

      <Block title="What this does not prove">
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong className="text-ink">This is the first round.</strong> {calibration.selected.n} alleys against roughly{" "}
            {ASRP.connections.toLocaleString("en-US")} connections planned over {ASRP.years} years. Field work starts {ASRP.fieldWorkStarts}.
          </li>
          <li>
            <strong className="text-ink">The camera evidence is invisible to us.</strong> DWSD may have sound engineering reasons we
            cannot see. Our report says so on every address.
          </li>
          <li>
            <strong className="text-ink">311 records are requests.</strong> Not confirmed incidents, not unique households. They
            reflect who calls the City, which is itself unequal.
          </li>
          <li>
            <strong className="text-ink">The comparison group is small</strong>, {calibration.comparison.n} earlier alley projects.
          </li>
          <li>
            <strong className="text-ink">This is correlation, not an audit.</strong> It is a reading of public data, offered so that
            residents and the City can check it.
          </li>
        </ul>
      </Block>

      <Block title="Reproduce it">
        <p>
          The calibration is one script, <code className="rounded bg-sunk px-1.5 py-0.5 text-[0.9em]">scripts/calibrate-asrp.mjs</code> ,
          run against the bundled snapshots, and it writes the numbers this page displays. The repository is open source.
        </p>
        <p>
          Sources: <A href={SOURCES.asrp.url}>DWSD Alley Sewer Repair Program</A> · <A href={SOURCES.asrpNews.url}>$184M announcement</A> ·{" "}
          <A href={SOURCES.dwsdCip.url}>Capital Improvement Projects</A> · <A href={SOURCES.improveDetroit.url}>Improve Detroit 311</A> ·{" "}
          <A href={SOURCES.hudLmi.url}>HUD low/mod income</A> · <Link href="/sources" className="font-semibold text-brand underline">full list</Link>
        </p>
      </Block>
    </article>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 border-t border-line pt-8">
      <h2 className="text-[1.4rem] font-extrabold tracking-[-0.025em]">{title}</h2>
      <div className="mt-4 space-y-4 text-[1.05rem] leading-relaxed text-ink-2">{children}</div>
    </section>
  );
}

function Table({ head, rows, note }: { head: string[]; rows: string[][]; note?: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="overflow-x-auto">
      <table className="w-full text-left text-[0.98rem]">
        <thead>
          <tr className="border-b border-line bg-sunk/50">
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-2.5 font-bold text-ink">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-line last:border-0">
              {r.map((c, i) => (
                <td key={i} className={`px-4 py-2.5 ${i === 0 ? "text-ink-2" : "font-bold tabular-nums"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {note && <figcaption className="border-t border-line bg-sunk/30 px-4 py-2.5 text-[0.9rem] text-ink-3">{note}</figcaption>}
    </figure>
  );
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-brand underline">
      {children}
    </a>
  );
}
