import type { Metadata } from "next";
import { SOURCES, VERIFIED_ON, INCOME_LIMITS } from "@/lib/facts";
import { DATA_SNAPSHOT, PERMIT_WINDOW } from "@/lib/geo";
import calibration from "@/data/asrp-calibration.json";

export const metadata: Metadata = { title: "Data & method" };

const LIVE = [
  { name: "Address search", source: "Esri World Geocoder (US Census Geocoder as backup)", use: "Turns your address into a location. Nothing is stored." },
  { name: "Property details", source: SOURCES.parcels.label, url: SOURCES.parcels.url, use: "Parcel, year built, property class, homestead, tax status." },
  { name: "Flood zone", source: SOURCES.fema.label, url: SOURCES.fema.url, use: "PSRP excludes homes in FEMA's Special Flood Hazard Area." },
  {
    name: "Area income",
    source: SOURCES.hudLmi.label,
    url: SOURCES.hudLmi.url,
    use: "The Alley Sewer Repair Program prioritizes areas where more than 50% of residents are low or moderate income.",
  },
];

const SNAPSHOT = [
  { name: "City sewer mains", fetched: DATA_SNAPSHOT, source: SOURCES.dwsdMains.label, url: SOURCES.dwsdMains.url, use: "5,220 main segments with install year, material, size and depth. Partial coverage: only mains with DWSD cleaning work orders." },
  { name: "Sewer construction", fetched: DATA_SNAPSHOT, source: SOURCES.dwsdCip.label, url: SOURCES.dwsdCip.url, use: "2,074 project segments with phase (construction, bidding, finished) and years." },
  { name: "PSRP neighborhoods", fetched: DATA_SNAPSHOT, source: SOURCES.psrpMap.label, url: SOURCES.psrpMap.url, use: "The 97 neighborhoods where the Private Sewer Repair Program accepts applications." },
  {
    name: "Private sewer permits", fetched: "2026-09-21",
    source: SOURCES.permits.label,
    url: SOURCES.permits.url,
    use: "2,722 plumbing permits for sewer, lateral, cleanout and backwater-valve work since 2019, by address. The closest public record of a private line's history — it never shows where the line runs.",
  },
  {
    name: "Council districts", fetched: "2026-09-21",
    source: SOURCES.districts.label,
    url: SOURCES.districts.url,
    use: "Which district an address sits in, and how many alleys in that district are in the first round of contracts.",
  },
  { name: "311 reports", fetched: DATA_SNAPSHOT, source: SOURCES.improveDetroit.label, url: SOURCES.improveDetroit.url, use: "Water-in-basement investigations and cave-ins since January 2023, counted within 200 m." },
];

const RULES = [
  SOURCES.asrp,
  SOURCES.asrpNews,
  SOURCES.psrp,
  SOURCES.psrpGuide,
  SOURCES.psrpPolicy,
  SOURCES.chr,
  SOURCES.claims,
  SOURCES.handbook,
  SOURCES.floodSafety,
  SOURCES.bbpp,
  SOURCES.habitat,
  SOURCES.hope,
  SOURCES.zeroLoan,
  SOURCES.maintenance,
  SOURCES.incomeLimits,
];

export default function SourcesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-[0.12em] text-own">Data &amp; method</p>
      <h1 className="mt-1 text-4xl font-extrabold tracking-tight">How BelowTrace works</h1>
      <p className="mt-4 text-lg text-ink-2">
        BelowTrace combines public records and published program rules for one Detroit address. It never guesses where a private sewer
        line runs, and it labels every fact by how much we actually know.
      </p>

      <h2 className="mt-12 text-2xl font-bold">Three kinds of facts</h2>
      <dl className="mt-4 space-y-4">
        <div className="rounded-xl border border-line bg-surface p-4">
          <dt className="font-bold">
            <span className="rounded-md bg-ink px-1.5 py-0.5 text-sm text-white">Recorded</span> — straight from a public record
          </dt>
          <dd className="mt-1 text-ink-2">A City, DWSD, FEMA or HUD dataset, or a published program document. We link the source and date.</dd>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <dt className="font-bold">
            <span className="rounded-md border border-warn px-1.5 py-0.5 text-sm text-warn">Estimated</span> — worked out from records
          </dt>
          <dd className="mt-1 text-ink-2">
            For example: your census block group&apos;s income share compared with the test the City uses to choose alleys. Only the
            program can confirm it.
          </dd>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <dt className="font-bold">
            <span className="rounded-md border border-dashed border-ink-3 px-1.5 py-0.5 text-sm text-ink-3">Unknown</span> — not in any
            public record
          </dt>
          <dd className="mt-1 text-ink-2">
            Where your private line runs, its condition, DWSD&apos;s camera inspection results, and the alley repair schedule. We say who
            can answer.
          </dd>
        </div>
      </dl>

      <h2 className="mt-12 text-2xl font-bold">Checked live for each address</h2>
      <SourceTable rows={LIVE} />

      <h2 className="mt-12 text-2xl font-bold">City open data</h2>
      <p className="mt-2 text-ink-2">
        The repository keeps a small, reviewable{" "}
        <a href="https://github.com/ReffWu/belowtrace/blob/main/data/manifest.json" target="_blank" rel="noreferrer" className="text-brand underline decoration-brand/30 hover:decoration-brand">
          source receipt
        </a>
        {" "}for this snapshot: each public query, record count and raw-file SHA-256. The large raw downloads can be recreated from those public services.
        Each dataset carries the day it was pulled — the sewer and 311 snapshots are from {DATA_SNAPSHOT}, and the permit, district and
        calibration data were added on 2026-09-21.
      </p>
      <SourceTable rows={SNAPSHOT} />

      <h2 className="mt-12 text-2xl font-bold">Program rules &amp; official guidance (checked {VERIFIED_ON})</h2>
      <p className="mt-2 text-ink-2">
        The PSRP screener applies the City&apos;s published rules. The program guide lists an income limit of 80% of area median income
        on pages 3–4 and 50% on page 10; the 2026 policy repeats both. We show incomes between the two as “might qualify” rather than
        deciding for the City. Income limits are MSHDA&apos;s Wayne County limits effective May 1, 2026 — for a household of four,{" "}
        {`$${INCOME_LIMITS.veryLow50[3].toLocaleString("en-US")}`} (50%) and {`$${INCOME_LIMITS.low80[3].toLocaleString("en-US")}`} (80%).
      </p>
      <ul className="mt-4 space-y-2">
        {RULES.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer" className="text-brand underline decoration-brand/30 hover:decoration-brand">
              {s.label}
            </a>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-2xl font-bold">Derived from the above (2026-09-21)</h2>
      <p className="mt-2 text-ink-2">
        Three measurements this site makes itself. Each is reproducible by running{" "}
        <code className="rounded bg-sunk px-1.5 py-0.5 text-[0.9em]">scripts/calibrate-asrp.mjs</code> and{" "}
        <code className="rounded bg-sunk px-1.5 py-0.5 text-[0.9em]">scripts/fetch-permits.mjs</code> against the snapshots above.{" "}
        <a href="/method" className="text-brand underline decoration-brand/30 hover:decoration-brand">Full method and caveats</a>.
      </p>
      <dl className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface px-5">
        {[
          [
            "Alley program calibration",
            `${calibration.selected.n} alleys under contract (${calibration.selected.construction} in construction, ${calibration.selected.procurement} in procurement) measured against ${calibration.comparison.n} earlier alley projects at ${calibration.radiusM} m. Median basement-flooding reports: ${calibration.water.median} vs ${calibration.comparison.waterMedian}.`,
          ],
          [
            "District distribution",
            `Alleys in the first round by council district: ${[1, 2, 3, 4, 5, 6, 7].map((n) => `D${n} ${(calibration.districtCounts as Record<string, number>)[String(n)] ?? 0}`).join(" · ")}.`,
          ],
          [
            "Private repair permits",
            `${PERMIT_WINDOW.total.toLocaleString("en-US")} permits, ${PERMIT_WINDOW.from}–${PERMIT_WINDOW.to}, of which 1,288 are backwater valves. Median basement-flooding reports within 500 m of a permitted address: 38.`,
          ],
          [
            "Public record coverage",
            "A random sample of 1,500 basement-flooding reports: 29% have a city sewer main on public record within 120 m; 71% have none.",
          ],
        ].map(([k, v]) => (
          <div key={k} className="py-3">
            <dt className="font-semibold">{k}</dt>
            <dd className="mt-1 text-ink-2">{v}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-12 text-2xl font-bold">Limits</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-2">
        <li>The public sewer-main data covers only part of Detroit. When a main isn&apos;t on record, we say so instead of drawing one.</li>
        <li>BelowTrace is not a utility locate. MISS DIG 811 does not mark private sewer lines. Only a camera inspection shows your line.</li>
        <li>Eligibility screening is a guide. Only the program decides.</li>
        <li>Program deadlines and statuses change. Each one shows the date we last checked it.</li>
      </ul>

      <h2 className="mt-12 text-2xl font-bold">Privacy</h2>
      <p className="mt-2 text-ink-2">
        No accounts, no tracking. Addresses are sent to the address service and public data services to build the report, and cached on
        the server for up to a day so repeat lookups are fast. Screener answers never leave your browser.
      </p>
    </div>
  );
}

function SourceTable({ rows }: { rows: { name: string; source: string; url?: string; use: string; fetched?: string }[] }) {
  return (
    <div className="mt-4 divide-y divide-line rounded-xl border border-line bg-surface">
      {rows.map((r) => (
        <div key={r.name} className="grid gap-1 p-4 sm:grid-cols-[11rem_1fr] sm:gap-4">
          <p className="font-semibold">
            {r.name}
            {r.fetched && <span className="mt-0.5 block text-sm font-normal tabular-nums text-ink-3">pulled {r.fetched}</span>}
          </p>
          <div>
            <p className="text-ink-2">{r.use}</p>
            <p className="mt-1 text-sm">
              {r.url ? (
                <a href={r.url} target="_blank" rel="noreferrer" className="text-brand underline decoration-brand/30">
                  {r.source}
                </a>
              ) : (
                <span className="text-ink-3">{r.source}</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
