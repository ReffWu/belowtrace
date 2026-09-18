export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6" aria-busy="true" aria-live="polite">
      <p className="sr-only">Checking City, DWSD, HUD and FEMA records for this address…</p>
      <div className="h-4 w-40 animate-pulse rounded bg-line" />
      <div className="mt-3 h-10 w-3/4 animate-pulse rounded-lg bg-line" />
      <div className="mt-4 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-7 w-28 animate-pulse rounded-full bg-line" />
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
        <p className="font-semibold text-ink-2">Checking City, DWSD, HUD and FEMA records for this address…</p>
        <div className="mt-5 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-sunk" style={{ width: `${92 - i * 11}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
