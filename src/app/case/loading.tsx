// Looking up a new address takes a few seconds (parcel, flood zone, income, buildings), so say what's happening.
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-16" aria-busy="true" aria-live="polite">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-own">One moment</p>
      <h1 className="mt-3 text-[2.3rem] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[3rem]">Opening your case…</h1>
      <ul className="mt-8 grid gap-3 text-lg text-ink-2">
        {["City parcel records", "Repair program areas and deadlines", "DWSD sewer records and nearby 311 reports"].map((t, i) => (
          <li key={t} className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-own" style={{ animationDelay: `${i * 0.25}s` }} aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
