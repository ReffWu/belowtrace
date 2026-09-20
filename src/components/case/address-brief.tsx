import Link from "next/link";
import { SOURCES } from "@/lib/facts";
import type { CaseReport } from "@/lib/case";

function Source({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-brand underline decoration-brand/30 hover:decoration-brand">{children} ↗</a>;
}

export function AddressBrief({ report }: { report: CaseReport | null }) {
  if (!report) return null;
  const activeProject = report.projects.find((project) => project.phase !== "Closed");
  const area = report.psrpNeighborhood.inProgram;
  const reportHref = `/report?${new URLSearchParams({ address: report.query, situation: "backup" })}`;
  return (
    <section className="rounded-3xl border border-line bg-surface p-5 shadow-[0_12px_32px_-24px_rgb(21_33_43/0.45)] sm:p-6" aria-labelledby="address-facts-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-own">Your address, right now</p>
          <h2 id="address-facts-title" className="mt-1 text-2xl font-extrabold tracking-tight">What the public records can and cannot tell you</h2>
        </div>
        <Link href={reportHref} className="min-h-11 rounded-xl border-2 border-line-2 px-4 py-2 font-bold text-brand hover:border-brand">Full address report</Link>
      </div>
      <p className="mt-3 max-w-3xl text-ink-2">These are address records, not a finding about today&apos;s backup, a promise of funding, or a utility locate.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-brand-tint/55 p-4">
          <p className="font-bold">Private Sewer Repair Program</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">
            {area
              ? `This address is in ${report.psrpNeighborhood.name}, one of the current program areas.`
              : "This address does not match the current 97-neighborhood program map."}
          </p>
          <p className="mt-2 text-sm text-ink-2">{area ? "This is only an address screen. Income, home type, 2021 flood impact, floodplain and duplication-of-benefits rules still apply." : "This does not decide other City help or a damage claim."}</p>
          <p className="mt-2 text-sm"><Source href={SOURCES.psrp.url}>Official PSRP conditions</Source></p>
        </div>
        <div className="rounded-2xl bg-sunk p-4">
          <p className="font-bold">Nearby public records</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">
            {activeProject
              ? `A DWSD capital project is recorded ${activeProject.distanceM} m away: ${activeProject.name} (${activeProject.phase.toLowerCase()}).`
              : "No active DWSD capital project is recorded within this report's search area."}
          </p>
          <p className="mt-2 text-sm text-ink-2">{report.waterInBasement} historical “water in basement” 311 requests are recorded near this address since 2023. Neither record proves the cause of this event.</p>
          <p className="mt-2 text-sm"><Source href={SOURCES.dwsdCip.url}>Project source</Source> · <Source href={SOURCES.improveDetroit.url}>311 source</Source></p>
        </div>
      </div>
      <p className="mt-4 text-sm text-ink-3">Use the facts while you wait for a response. The official investigation, an inspection, and program review decide what happens next.</p>
    </section>
  );
}
