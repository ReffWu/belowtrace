import Link from "next/link";
import stats from "@/data/citywide-stats.json";
import { ContinueCase } from "@/components/case/continue-case";

const CHOICES = [
  { href: "/backup", title: "Water or sewage is coming in", note: "Right now, or it just happened" },
  { href: "/quote", title: "A plumber quoted a big repair", note: "Before you sign anything" },
  { href: "/address?situation=checking", title: "I'm buying, or just curious", note: "See what's under a Detroit home" },
];

export default function Home() {
  const outsidePct = Math.round((stats.outsidePsrp / stats.total) * 100);
  return (
    <>
      <section className="mx-auto max-w-3xl px-5 pb-14 pt-12 sm:pt-20">
        <ContinueCase />
        <p className="rise text-sm font-bold uppercase tracking-[0.14em] text-own">Detroit · Free · No sign-up</p>
        <h1 className="rise rise-1 mt-4 text-[2.7rem] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-[4.2rem]">
          Sewage in the basement?
          <span className="block text-ink-3">We&apos;ll take it one step at a time.</span>
        </h1>

        <nav aria-label="What's happening" className="rise rise-2 mt-10 grid gap-3">
          <p className="text-lg font-semibold text-ink-2">What&apos;s happening at home?</p>
          {CHOICES.map((c, i) => (
            <Link
              key={c.href}
              href={c.href}
              className={`group flex min-h-20 items-center justify-between gap-4 rounded-2xl border-2 px-5 py-4 transition active:scale-[0.995] sm:px-6 ${
                i === 0 ? "border-ink bg-ink text-white hover:bg-brand-ink" : "border-line-2 bg-surface hover:border-ink"
              }`}
            >
              <span>
                <span className="block text-[1.25rem] font-bold leading-snug">{c.title}</span>
                <span className={`mt-0.5 block ${i === 0 ? "text-white/70" : "text-ink-3"}`}>{c.note}</span>
              </span>
              <span aria-hidden="true" className="text-2xl transition group-hover:translate-x-1">
                →
              </span>
            </Link>
          ))}
        </nav>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-16">
        <figure className="rise rise-3">
          <HouseLine />
          <figcaption className="mt-4 max-w-xl text-lg text-ink-2">
            In Detroit, <strong className="text-own">the line from your house to the city sewer is yours</strong>. The City owns the sewer
            under the alley. Knowing which side is broken decides who pays.
          </figcaption>
        </figure>
      </section>

      <section className="bg-deep text-white">
        <Link href="/map" className="group mx-auto grid max-w-3xl gap-6 px-5 py-14 sm:grid-cols-[auto_1fr] sm:items-end sm:gap-10">
          <span className="text-[4.5rem] font-extrabold leading-none tracking-[-0.05em] tabular-nums sm:text-[6rem]">
            {stats.total.toLocaleString("en-US")}
          </span>
          <span className="pb-2">
            <span className="block text-xl font-semibold leading-snug">times Detroiters reported water in the basement to the City since 2023.</span>
            <span className="mt-2 block text-white/65">
              {outsidePct}% of those reports came from neighborhoods the $40,000 repair program doesn&apos;t cover.{" "}
              <span className="whitespace-nowrap font-semibold text-glow group-hover:underline">See the map →</span>
            </span>
          </span>
        </Link>
      </section>
    </>
  );
}

// A schematic, not a record: it explains ownership, it doesn't locate anyone's pipe.
function HouseLine() {
  return (
    <svg viewBox="0 0 720 230" className="w-full" role="img" aria-label="Diagram: your sewer line runs from the house down to the city sewer under the alley.">
      <rect x="0" y="96" width="720" height="134" fill="var(--sunk)" />
      <rect x="560" y="90" width="160" height="8" fill="var(--line-2)" />
      <line x1="0" y1="96" x2="720" y2="96" stroke="var(--line-2)" strokeWidth="2" />
      <path d="M92 96V52l62-34 62 34v44" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="140" y="66" width="28" height="30" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
      <path
        className="trace"
        style={{ "--len": 520 } as React.CSSProperties}
        d="M184 96V132C184 140 190 146 198 146H598C611 146 622 157 622 170"
        fill="none"
        stroke="var(--own)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="640" cy="186" r="24" fill="var(--brand-tint)" stroke="var(--brand)" strokeWidth="4" />
      <circle cx="640" cy="186" r="12" fill="var(--brand)" opacity="0.2" />
      <text x="300" y="134" fill="var(--own)" fontSize="15" fontWeight="700">Your line</text>
      <text x="560" y="82" fill="var(--ink-3)" fontSize="13" fontWeight="600">Alley</text>
      <text x="520" y="222" fill="var(--brand-ink)" fontSize="15" fontWeight="700">City sewer</text>
    </svg>
  );
}
