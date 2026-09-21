import Link from "next/link";
import stats from "@/data/citywide-stats.json";
import calibration from "@/data/asrp-calibration.json";
import { ASRP } from "@/lib/asrp";
import { StartSearch } from "@/components/start-search";
import { SplitMap } from "@/components/split-map";

// Two things on the first screen: a box to type an address into, and the picture that shows
// why it matters. Everything else on this site is downstream of one of those two.
export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-xl px-5 pb-12 pt-8 sm:pt-14">
        <p className="rise text-[0.8rem] font-bold uppercase tracking-[0.14em] text-own">Detroit · Free · No sign-up</p>
        <h1 className="rise rise-1 mt-4 text-[2.4rem] font-extrabold leading-[1.03] tracking-[-0.04em] sm:text-[3.1rem]">
          Detroit is spending ${(ASRP.total / 1_000_000).toFixed(0)}M fixing sewer connections.
          <span className="mt-2 block text-ink-3">It does not publish where.</span>
        </h1>
        <p className="rise rise-2 mt-5 text-[1.15rem] leading-relaxed text-ink-2">
          If a contract reaches your alley, the repair is free. If it never does, you pay $5,000–25,000 yourself. Nobody can apply,
          there is no list, and nobody is told either way.
        </p>
        <div className="rise rise-3 mt-8">
          <StartSearch />
        </div>
      </section>

      <section className="border-y border-line bg-deep text-white">
        <div className="mx-auto max-w-4xl px-5 py-12">
          <h2 className="text-[1.9rem] font-extrabold leading-tight tracking-[-0.03em] sm:text-[2.3rem]">
            The money is not going where the basements flood.
          </h2>
          <p className="mt-3 max-w-2xl text-[1.08rem] leading-relaxed text-white/70">
            Blue: every home that told the City it had water in the basement since 2023. Orange: the {calibration.selected.n} alleys in
            the first round of contracts.
          </p>

          <div className="mt-7 overflow-hidden rounded-3xl border border-white/10">
            <SplitMap />
          </div>

          <dl className="mt-8 grid gap-6 sm:grid-cols-3">
            <Stat n="1.0%" t={`of the ${stats.total.toLocaleString("en-US")} basement-flooding reports are within 200 m of a contracted alley`} />
            <Stat n="2.5×" t={`fewer flooding reports around the chosen alleys than around the City's earlier alley projects (p<0.0001)`} />
            <Stat n="0" t="alleys chosen so far in Districts 2, 3, 4 and 5 — including District 4, which the City's own plan named a priority" />
          </dl>

          <Link href="/method" className="mt-8 inline-flex min-h-12 items-center rounded-xl border border-white/25 px-5 font-semibold text-white hover:bg-white/10">
            How we worked this out ↗
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-xl px-5 py-12">
        <h2 className="text-[1.5rem] font-extrabold tracking-[-0.025em]">What you get for an address</h2>
        <ol className="mt-5 grid gap-4">
          {[
            ["A drawing of what is under your house", "Six segments, from the floor drain to the regional system."],
            ["Who owns each one", "The $15,000 lands on you or on the City depending on which segment broke."],
            ["Who might pay, and how likely", "Checked against every City program — and, for the alley connection, against the 138 alleys already chosen."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-4">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-[0.85rem] font-bold text-white">{i + 1}</span>
              <span>
                <span className="block font-bold">{t}</span>
                <span className="mt-0.5 block text-ink-2">{d}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-8 grid gap-2">
          <Quiet href="/now" title="Already flooded?" note="Repairing the pipe and paying for the damage are two different things" />
          <Quiet href="/map" title="The citywide map" note="Both layers, full screen" />
          <Quiet href="/method" title="Method and caveats" note="Every number on this page, and what it does not prove" />
        </div>
      </section>
    </>
  );
}

function Stat({ n, t }: { n: string; t: string }) {
  return (
    <div>
      <dt className="text-[2.6rem] font-extrabold leading-none tracking-[-0.04em] text-glow tabular-nums">{n}</dt>
      <dd className="mt-2 text-[0.98rem] leading-snug text-white/65">{t}</dd>
    </div>
  );
}

function Quiet({ href, title, note }: { href: string; title: string; note: string }) {
  return (
    <Link href={href} className="group flex min-h-14 items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-5 py-3 transition hover:border-ink">
      <span>
        <span className="block font-bold">{title}</span>
        <span className="text-[0.95rem] text-ink-3">{note}</span>
      </span>
      <span aria-hidden="true" className="text-ink-3 transition group-hover:translate-x-0.5 group-hover:text-ink">→</span>
    </Link>
  );
}
