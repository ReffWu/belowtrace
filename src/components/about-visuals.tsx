// Figures for the About page.
//
// No press photographs and no screenshots of other people's forums: those belong to whoever made
// them. Instead these render the actual product surfaces and the actual measurements, so what a
// reader sees on this page is the same thing the app computes — and quotes appear as attributed
// text with a link to the source, the way a newspaper prints them.
import calibration from "@/data/asrp-calibration.json";

const DISTRICTS = [1, 2, 3, 4, 5, 6, 7];

/** The verdict band, exactly as the report renders it, for two real addresses. */
export function VerdictPair() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <MiniVerdict
        tone="go"
        mark="✓"
        label="Covered"
        address="7806 Mettetal St"
        meta="District 7 · contracted work 213 m away"
        headline="Do not pay for this yet."
      />
      <MiniVerdict
        tone="stop"
        mark="✕"
        label="Not coming"
        address="5017 W Outer Dr"
        meta="District 2 · no alley in the first round"
        headline="Plan as if you are on your own."
      />
    </div>
  );
}

const BAND = {
  go: "bg-go",
  stop: "bg-stop",
} as const;

function MiniVerdict({
  tone,
  mark,
  label,
  address,
  meta,
  headline,
}: {
  tone: keyof typeof BAND;
  mark: string;
  label: string;
  address: string;
  meta: string;
  headline: string;
}) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-surface">
      <figcaption className="border-b border-line px-4 py-2.5">
        <p className="font-bold">{address}</p>
        <p className="text-[0.88rem] text-ink-3">{meta}</p>
      </figcaption>
      <div className={`flex items-start gap-3 p-4 text-white ${BAND[tone]}`}>
        <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20 text-[1.25rem] font-black leading-none">
          {mark}
        </span>
        <span className="min-w-0">
          <span className="block text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/70">$184M alley program · {label}</span>
          <span className="mt-1 block text-[1.15rem] font-extrabold leading-tight tracking-[-0.02em]">{headline}</span>
        </span>
      </div>
    </figure>
  );
}

/** Three comparison groups, measured the same way. The point is that one of them is the outlier. */
export function ComparisonChart() {
  const rows = [
    { label: "Alleys chosen for the $184M program", n: calibration.water.median, note: `n=${calibration.selected.n}`, hot: true },
    { label: "Addresses where a household paid privately", n: 38, note: "n=800 sample" },
    { label: "Alley projects the City finished before this", n: calibration.comparison.waterMedian, note: `n=${calibration.comparison.n}` },
  ];
  const max = Math.max(...rows.map((r) => r.n));
  return (
    <figure className="rounded-2xl border border-line bg-surface p-5">
      <figcaption className="text-[0.8rem] font-bold uppercase tracking-[0.12em] text-ink-3">
        Basement-flooding reports within 500 m · median
      </figcaption>
      <div className="mt-4 grid gap-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className={`text-[0.95rem] leading-snug ${r.hot ? "font-bold text-ink" : "text-ink-2"}`}>{r.label}</span>
              <span className="shrink-0 text-[1.1rem] font-extrabold tabular-nums">{r.n}</span>
            </div>
            <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-sunk">
              <div className={`h-full rounded-full ${r.hot ? "bg-stop" : "bg-ink-3/45"}`} style={{ width: `${(r.n / max) * 100}%` }} />
            </div>
            <span className="mt-1 block text-[0.8rem] text-ink-3">{r.note}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-line pt-3 text-[0.9rem] leading-relaxed text-ink-2">
        Two independent comparison groups sit at 38–45. The new program sits at {calibration.water.median}. Permutation test on the
        gap: p &lt; 0.0001.
      </p>
    </figure>
  );
}

/** Where the first round of contracts actually went. Four districts have nothing. */
export function DistrictChart() {
  const counts = calibration.districtCounts as Record<string, number>;
  const max = Math.max(...DISTRICTS.map((d) => counts[String(d)] ?? 0));
  return (
    <figure className="rounded-2xl border border-line bg-surface p-5">
      <figcaption className="text-[0.8rem] font-bold uppercase tracking-[0.12em] text-ink-3">
        Alleys in the first round of contracts, by council district
      </figcaption>
      <div className="mt-5 flex items-end justify-between gap-2" style={{ height: "9rem" }}>
        {DISTRICTS.map((d) => {
          const n = counts[String(d)] ?? 0;
          return (
            <div key={d} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
              <span className={`text-[0.85rem] font-extrabold tabular-nums ${n === 0 ? "text-stop" : "text-ink"}`}>{n}</span>
              <div
                className={`w-full rounded-t ${n === 0 ? "bg-stop/25" : "bg-own"}`}
                style={{ height: n === 0 ? "3px" : `${Math.max((n / max) * 100, 6)}%` }}
              />
              <span className="text-[0.8rem] text-ink-3">D{d}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 border-t border-line pt-3 text-[0.9rem] leading-relaxed text-ink-2">
        The City&rsquo;s CDBG-DR Action Plan named Districts 4, 6 and 7 as priorities. District 4 has none.
      </p>
    </figure>
  );
}

/** A quote, printed the way a newspaper prints one: attributed, dated, linked. */
export function Pull({
  children,
  who,
  where,
  when,
  url,
}: {
  children: React.ReactNode;
  who: string;
  where: string;
  when: string;
  url: string;
}) {
  return (
    <figure className="rounded-2xl border-l-4 border-own bg-surface p-5">
      <blockquote className="text-[1.12rem] font-semibold leading-snug text-ink">{children}</blockquote>
      <figcaption className="mt-3 text-[0.9rem] text-ink-3">
        {who} ·{" "}
        <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-brand underline decoration-brand/30">
          {where}
        </a>
        , {when}
      </figcaption>
    </figure>
  );
}

/**
 * A photograph from a source, credited where anyone can check it.
 * Used sparingly, and never without the line underneath saying whose it is.
 */
export function Shot({
  src,
  alt,
  caption,
  credit,
  url,
  tall = false,
}: {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  url: string;
  tall?: boolean;
}) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-surface">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className={`w-full bg-sunk object-cover ${tall ? "max-h-[26rem]" : "max-h-[17rem]"}`} />
      <figcaption className="px-4 py-3">
        <p className="leading-snug text-ink-2">{caption}</p>
        <p className="mt-1.5 text-[0.85rem] text-ink-3">
          Photo:{" "}
          <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-brand underline decoration-brand/30">
            {credit}
          </a>
        </p>
      </figcaption>
    </figure>
  );
}
