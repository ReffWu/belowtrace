import type { Metadata } from "next";
import Link from "next/link";
import stats from "@/data/citywide-stats.json";
import { CitywideMap } from "@/components/citywide-map";

export const metadata: Metadata = {
  title: "Where the basements flood",
  description: "14,115 Detroit water-in-basement reports since 2023, mapped against where sewer repair money can go.",
};

const pct = (n: number) => Math.round((n / stats.total) * 100);

export default function MapPage() {
  const years = Object.entries(stats.byYear);
  const peak = Math.max(...years.map(([, n]) => n));
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-[0.12em] text-own">Citywide</p>
      <h1 className="mt-1 max-w-4xl text-[2.2rem] font-extrabold leading-tight tracking-tight sm:text-[3rem]">
        Where Detroit&apos;s basements flood — and where the repair money can&apos;t go
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-ink-2">
        Every dot below is a Detroiter asking the City to investigate water in their basement. The green outlines are the 97
        neighborhoods where the Private Sewer Repair Program can pay up to $40,000 to fix a broken private sewer line.
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <dt className="text-sm font-semibold text-ink-2">Water-in-basement investigations since 2023</dt>
          <dd className="mt-1 text-4xl font-extrabold tracking-tight">{stats.total.toLocaleString("en-US")}</dd>
        </div>
        <div className="rounded-2xl border-2 border-own bg-own-tint p-5">
          <dt className="text-sm font-semibold text-[#8a4700]">Filed outside every PSRP neighborhood</dt>
          <dd className="mt-1 text-4xl font-extrabold tracking-tight text-[#8a4700]">
            {stats.outsidePsrp.toLocaleString("en-US")} <span className="text-2xl">({pct(stats.outsidePsrp)}%)</span>
          </dd>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <dt className="text-sm font-semibold text-ink-2">DWSD sewer projects under way or being bid</dt>
          <dd className="mt-1 text-4xl font-extrabold tracking-tight">{stats.activeProjects.toLocaleString("en-US")}</dd>
        </div>
      </dl>

      <div className="mt-8">
        <CitywideMap />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <NeighborhoodTable
          title="Most reports, outside the PSRP area"
          note="These households can't get PSRP's $40,000. Their options: the free Alley Sewer Repair Program (if DWSD picks their alley), Critical Home Repair, or paying themselves."
          rows={stats.topOutside}
          tone="own"
        />
        <NeighborhoodTable title="Most reports, inside the PSRP area" note="Eligible homeowners here can apply now — but first they have to find the program." rows={stats.topInside} tone="go" />
      </div>

      <section className="mt-10 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-xl font-bold">Reports by year</h2>
        <ul className="mt-4 space-y-2">
          {years.map(([year, n]) => (
            <li key={year} className="grid grid-cols-[4rem_1fr_4.5rem] items-center gap-3 text-sm">
              <span className="font-semibold">{year}</span>
              <span className="h-5 rounded bg-sunk">
                <span className="block h-5 rounded bg-own/80" style={{ width: `${(n / peak) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums">{n.toLocaleString("en-US")}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-3">
          The 311 category started in 2023. 2026 is through {stats.snapshot}.
        </p>
      </section>

      <div className="mt-10 flex flex-col items-start gap-3 rounded-2xl bg-ink p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg font-semibold">What does this mean for your address?</p>
        <Link href="/" className="inline-flex min-h-12 items-center rounded-xl bg-white px-5 font-semibold text-ink hover:bg-paper">
          Check my address
        </Link>
      </div>

      <p className="mt-6 text-sm text-ink-3">
        Sources: Improve Detroit 311 (“Water In Basement Investigation”, Jan 2023–{stats.snapshot}); City of Detroit PSRP neighborhoods;
        DWSD Capital Improvement Projects. A report inside a PSRP neighborhood doesn&apos;t mean the household qualifies — income, ownership
        and 2021-flood rules also apply. <Link href="/sources" className="underline">Method</Link>.
      </p>
    </div>
  );
}

function NeighborhoodTable({
  title,
  note,
  rows,
  tone,
}: {
  title: string;
  note: string;
  rows: { name: string; reports: number }[];
  tone: "own" | "go";
}) {
  const max = rows[0]?.reports ?? 1;
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-ink-2">{note}</p>
      <ol className="mt-4 space-y-2">
        {rows.map((r) => (
          <li key={r.name} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
            <span>
              <span className="font-semibold">{r.name}</span>
              <span className="mt-1 block h-2 rounded bg-sunk">
                <span className={`block h-2 rounded ${tone === "own" ? "bg-own" : "bg-go"}`} style={{ width: `${(r.reports / max) * 100}%` }} />
              </span>
            </span>
            <span className="tabular-nums text-ink-2">{r.reports}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
