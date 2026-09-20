import type { Checked, Fit } from "@/lib/guide";
import type { Report } from "@/lib/types";
import { PsrpScreener } from "@/components/report/psrp-screener";
import { PHONES } from "@/lib/facts";

const detroitDay = (d: Date) => new Date(`${d.toLocaleDateString("en-CA", { timeZone: "America/Detroit" })}T00:00:00Z`).getTime();

const closes = (iso: string, now = new Date()) => {
  const d = new Date(iso);
  const days = Math.round((detroitDay(d) - detroitDay(now)) / 86_400_000);
  const when = d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", timeZone: "America/Detroit" });
  return `Closes ${when} · ${days === 0 ? "today" : days === 1 ? "tomorrow" : `${days} days left`}`;
};

export function PayOptions({ fits, checked, report }: { fits: Fit[]; checked: Checked[]; report: Pick<Report, "address" | "psrpNeighborhood" | "floodZone"> & { parcel: { propertyClass?: string } | null } }) {
  const residential = report.parcel?.propertyClass ? /RESIDENTIAL/i.test(report.parcel.propertyClass) : null;
  return (
    <div className="grid gap-4">
      {fits.length === 0 && <NoFit />}
      {fits.map((f) => (
        <article key={f.id} id={f.id} className="scroll-mt-6 rounded-3xl border border-line bg-surface p-6 sm:p-7">
          <p className="font-semibold text-ink-3">{f.name}</p>
          <p className="mt-1 text-[2.2rem] font-extrabold leading-none tracking-[-0.03em] text-go">{f.amount}</p>
          <p className="mt-4 text-[1.1rem] leading-relaxed text-ink-2">{f.why}</p>
          {f.deadline && <p className="mt-3 w-fit rounded-lg bg-stop-tint px-3 py-1.5 text-sm font-bold text-stop">{closes(f.deadline)}</p>}
          {f.screener ? (
            <PsrpScreener
              auto={{ inNeighborhood: true, neighborhoodName: report.psrpNeighborhood.name, isSFHA: report.floodZone.isSFHA, residential }}
              address={report.address}
            />
          ) : (
            <a
              href={f.action.href}
              {...(f.action.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
              className="mt-5 inline-flex min-h-12 items-center rounded-xl border-2 border-ink px-5 font-bold transition hover:bg-ink hover:text-white"
            >
              {f.action.label}
            </a>
          )}
        </article>
      ))}

      <details className="group rounded-3xl border border-line bg-surface/60 px-6 py-5 sm:px-7">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink-2">
          {fits.length ? `We also checked ${checked.length} other programs. Here's why they don't fit.` : `Why each of the ${checked.length} programs doesn't fit`}
          <span aria-hidden="true" className="transition group-open:rotate-45">
            +
          </span>
        </summary>
        <ul className="mt-4 divide-y divide-line">
          {checked.map((c) => (
            <li key={c.name} className="py-3">
              <a href={c.href} target="_blank" rel="noreferrer" className="font-semibold text-ink hover:underline">
                {c.name}
              </a>
              <p className="text-ink-2">{c.reason}</p>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

// When no City program fits, say so plainly, then give the steps that still save money.
function NoFit() {
  const tel = `tel:${PHONES.dwsd.number.replace(/\D/g, "")}`;
  return (
    <article className="rounded-3xl border border-line bg-surface p-6 sm:p-7">
      <p className="text-[1.6rem] font-extrabold leading-tight tracking-[-0.02em]">No listed City repair program matches the address facts we could verify.</p>
      <p className="mt-2 text-[1.1rem] text-ink-2">Review the requirements below with the program if any fact is missing or wrong. What can still save money:</p>
      <ol className="mt-5 grid gap-3 text-[1.05rem]">
        <li>
          <strong>Call DWSD before you pay.</strong> <span className="text-ink-2">If the break is on the City&apos;s side, the City fixes it.</span>{" "}
          <a href={tel} className="whitespace-nowrap font-semibold text-brand underline">
            {PHONES.dwsd.number}
          </a>
        </li>
        <li>
          <strong>Check your home insurance.</strong> <span className="text-ink-2">Ask whether your policy covers sewer backup.</span>
        </li>
        <li>
          <strong>Get two written quotes.</strong> <span className="text-ink-2">From licensed plumbers who pull a City permit, with the camera video.</span>
        </li>
      </ol>
    </article>
  );
}
