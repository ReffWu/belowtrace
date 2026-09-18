import type { Metadata } from "next";
import Link from "next/link";
import { getReport, parseSituation } from "@/lib/report";
import { atAGlance, type GlanceItem } from "@/lib/glance";
import { buildPlan } from "@/lib/plan";
import type { Report, Situation } from "@/lib/types";
import { AddressSearch } from "@/components/address-search";
import { SITUATION_OPTIONS } from "@/lib/situations";
import { EvidenceBadge, SourceLine } from "@/components/evidence-badge";
import { OwnershipDiagram } from "@/components/report/ownership-diagram";
import { ProgramCard, UnavailableList } from "@/components/report/program-card";
import { PsrpScreener } from "@/components/report/psrp-screener";
import { ActionPlan } from "@/components/report/action-plan";
import { RecordsMap } from "@/components/report/records-map";
import { PrintButton } from "@/components/report/print-button";
import { PHONES, SOURCES } from "@/lib/facts";

export async function generateMetadata(props: PageProps<"/report">): Promise<Metadata> {
  const { address } = await props.searchParams;
  return { title: typeof address === "string" ? address : "Report" };
}

export default async function ReportPage(props: PageProps<"/report">) {
  const sp = await props.searchParams;
  const address = typeof sp.address === "string" ? sp.address : "";
  const situation = parseSituation(sp.situation);
  const key = typeof sp.key === "string" ? sp.key : undefined;

  if (!address) return <ErrorState message="Enter an address to get started." />;
  const report = await getReport(address, situation, key);
  if ("error" in report) return <ErrorState message={report.message} address={address} situation={situation} />;
  return <ReportView r={report} situation={situation} />;
}

function ErrorState({ message, address, situation }: { message: string; address?: string; situation?: Situation }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Let&apos;s try that again</h1>
      <p className="mt-3 text-lg text-ink-2" role="alert">
        {message}
      </p>
      <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
        <AddressSearch defaultAddress={address} defaultSituation={situation} />
      </div>
    </div>
  );
}

const UNAVAILABLE = ["bbpp", "habitat", "zero-loan"];

const TONE: Record<GlanceItem["tone"], { dot: string; label: string }> = {
  act: { dot: "bg-stop", label: "Do this" },
  good: { dot: "bg-go", label: "Good news" },
  warn: { dot: "bg-warn", label: "Heads up" },
  info: { dot: "bg-brand", label: "Good to know" },
};

function Section({ id, eyebrow, title, children, intro }: { id: string; eyebrow: string; title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-4 border-t border-line py-10">
      <p className="text-sm font-bold uppercase tracking-[0.12em] text-own">{eyebrow}</p>
      <h2 id={`${id}-title`} className="mt-1 text-[1.75rem] font-extrabold leading-tight tracking-tight">
        {title}
      </h2>
      {intro && <div className="mt-2 max-w-3xl text-lg text-ink-2">{intro}</div>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ReportView({ r, situation }: { r: Report; situation: Situation }) {
  const glance = atAGlance(r, situation);
  const steps = buildPlan(r, situation);
  const programCards = r.programs.filter((c) => !UNAVAILABLE.includes(c.id));
  const unavailable = r.programs.filter((c) => UNAVAILABLE.includes(c.id));
  const p = r.parcel;
  const generated = new Date(r.generatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Detroit" });
  const residential = p?.propertyClass ? /RESIDENTIAL/i.test(p.propertyClass) : null;

  return (
    <article className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
      <div className="only-print border-b border-ink pb-3 pt-2 text-sm">
        <strong>BelowTrace Detroit</strong> — sewer help report · generated {generated}. Not a utility locate, inspection, or legal advice.
      </div>

      <header className="pb-8 pt-8">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-md font-semibold text-brand hover:underline">
            <span aria-hidden="true">←</span> Check another address
          </Link>
          <PrintButton />
        </div>
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-ink-3">Sewer help report</p>
        <h1 className="mt-1 text-[2rem] font-extrabold leading-tight tracking-tight sm:text-[2.6rem]">{r.address.replace(/, MI \d{5}$/, "")}</h1>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {r.psrpNeighborhood.name && <Chip>{r.psrpNeighborhood.name}</Chip>}
          {p?.yearBuilt && <Chip>Built {p.yearBuilt}</Chip>}
          {p?.style && <Chip>{p.style}</Chip>}
          {p && <Chip>Parcel {p.id}</Chip>}
          {r.cached && <Chip>Saved copy — live data unavailable</Chip>}
        </ul>

        {r.warnings.length > 0 && (
          <div className="mt-5 rounded-xl border border-warn/40 bg-warn-tint px-4 py-3 text-[0.95rem] text-[#6b3d00]" role="note">
            {r.warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </div>
        )}

        <nav className="no-print mt-6" aria-label="Choose your situation">
          <p className="mb-2 text-sm font-semibold text-ink-2">Steps tailored for:</p>
          <div className="flex flex-wrap gap-2">
            {SITUATION_OPTIONS.map((o) => (
              <Link
                key={o.value}
                href={`/report?${new URLSearchParams({ address: r.query, situation: o.value })}`}
                aria-current={o.value === situation ? "true" : undefined}
                scroll={false}
                className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold ${
                  o.value === situation ? "border-ink bg-ink text-white" : "border-line-2 bg-surface text-ink hover:border-ink"
                }`}
              >
                {o.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="mt-8 rounded-2xl border border-line bg-surface p-5 shadow-[0_12px_32px_-20px_rgb(21_33_43/0.35)] sm:p-6">
          <h2 className="text-xl font-extrabold tracking-tight">At a glance</h2>
          <ul className="mt-4 divide-y divide-line">
            {glance.map((g) => (
              <li key={g.text} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${TONE[g.tone].dot}`} aria-hidden="true" />
                <p className="text-[1.05rem] leading-relaxed">
                  <span className="sr-only">{TONE[g.tone].label}: </span>
                  {g.text}{" "}
                  <a href={g.href} className="no-print whitespace-nowrap font-semibold text-brand underline decoration-brand/30 hover:decoration-brand">
                    More
                  </a>
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div className="only-print mt-3 rounded-md border border-ink p-3">
          <p className="font-bold">Keep these numbers</p>
          <ul className="mt-1 grid grid-cols-2 gap-x-6 gap-y-0.5 text-sm">
            <li>DWSD Customer Service (backups, claims, alley repairs): <strong className="whitespace-nowrap">{PHONES.dwsd.number}</strong></li>
            <li>Housing &amp; Revitalization (PSRP, Critical Home Repair): <strong className="whitespace-nowrap">{PHONES.hrd.number}</strong></li>
            <li>Wayne Metro (HOPE property tax help): <strong className="whitespace-nowrap">{PHONES.wayneMetro.number}</strong></li>
            <li>Apply online: <strong>portal.neighborlysoftware.com/cityofdetroitmi</strong></li>
          </ul>
        </div>
      </header>

      <Section
        id="responsibility"
        eyebrow="Whose pipe is it?"
        title="The line from your house to the alley is yours"
        intro="In Detroit, property owners are responsible for the private sewer line from where it leaves the house all the way to the connection at the city sewer — usually in the alley. The City owns and maintains the sewer under the alley and street."
      >
        <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
          <OwnershipDiagram main={r.nearestMain} />
        </div>
        <div className="mt-4 rounded-xl border-l-4 border-brand bg-brand-tint/60 px-4 py-3 text-[0.95rem] text-ink-2">
          <strong className="text-ink">Told the sewer “isn&apos;t on the City&apos;s records”?</strong> It has happened: in April 2026 DWSD told
          an 86-year-old resident it didn&apos;t know whose sewer served his home, then checked deeds and easements.{" "}
          <a href={SOURCES.beasley.url} target="_blank" rel="noreferrer" className="font-semibold text-brand underline">
            Read the story
          </a>
          . Ask DWSD to check the deed for an easement before you pay.
        </div>
        <p className="mt-3">
          <SourceLine evidence={{ level: "recorded", source: SOURCES.maintenance.label, url: SOURCES.maintenance.url }} />
        </p>
      </Section>

      <Section
        id="programs"
        eyebrow="Will anyone help pay?"
        title="Programs checked against your address"
        intro="Ordered for your situation. Each card says what we could check for this address, and what only the program can tell you."
      >
        <div className="space-y-4">
          {programCards.map((c) => (
            <ProgramCard key={c.id} card={c}>
              {c.id === "psrp" && r.psrpNeighborhood.inProgram && !r.floodZone.isSFHA && (
                <PsrpScreener
                  auto={{
                    inNeighborhood: r.psrpNeighborhood.inProgram,
                    neighborhoodName: r.psrpNeighborhood.name,
                    isSFHA: r.floodZone.isSFHA,
                    residential,
                  }}
                />
              )}
            </ProgramCard>
          ))}
          <UnavailableList cards={unavailable} />
        </div>
      </Section>

      <Section id="next-steps" eyebrow="What do I do first?" title="Your next steps">
        <ActionPlan steps={steps} askFoundDate={situation === "backup"} />
      </Section>

      <Section
        id="records"
        eyebrow="What do the records show?"
        title="Public records near this address"
        intro="Only what's actually on record. Tap the lines and dots on the map for details."
      >
        <div className="no-print">
          <RecordsMap center={r.lngLat} parcel={p?.geometry} mains={r.mainsNearby} projects={r.projects} points={r.reports311.points} />
        </div>
        <p className="only-print text-sm text-ink-3">Interactive map available in the online version of this report.</p>

        <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-surface">
          <Fact label="Nearest city sewer on record" badge={r.nearestMain ? r.mainEvidence : { level: "unknown", source: r.mainEvidence.source, url: r.mainEvidence.url }}>
            {r.nearestMain ? (
              <>
                Laid in <strong>{r.nearestMain.installYear ?? "an unknown year"}</strong>
                {r.nearestMain.sizeIn ? `, ${r.nearestMain.sizeIn}-inch` : ""} {r.nearestMain.materialLabel ?? (r.nearestMain.material ? `(material code ${r.nearestMain.material})` : "")} pipe
                {r.nearestMain.systemLabel ? `, ${r.nearestMain.systemLabel}` : ""}
                {r.nearestMain.depthFt ? `, about ${r.nearestMain.depthFt} ft deep` : ""}. {r.nearestMain.distanceM} m from this property
                {r.nearestMain.street ? ` near ${r.nearestMain.street}` : ""}.
                {r.nearestMain.lastWorkDate && (
                  <span className="block text-sm text-ink-3">
                    Last DWSD work order: {r.nearestMain.lastWork} ({r.nearestMain.lastWorkDate}).
                  </span>
                )}
              </>
            ) : (
              <>The public DWSD data we use has no record of the sewer behind this home. It covers only part of the city — DWSD&apos;s own maps are more complete.</>
            )}
          </Fact>
          <Fact label="Sewer work nearby" badge={r.projectEvidence}>
            {r.projects.length ? (
              <ul className="space-y-1.5">
                {r.projects.slice(0, 5).map((pr, i) => (
                  <li key={`${pr.name}-${i}`}>
                    <strong>{pr.name}</strong> — {pr.phase === "Construction" ? "under construction" : pr.phase === "Procurement" ? "being bid" : "finished"}
                    {pr.startYear ? ` (${[pr.startYear, pr.endYear].filter(Boolean).join("–")})` : ""}, {pr.distanceM} m away
                  </li>
                ))}
              </ul>
            ) : (
              "No DWSD sewer capital projects on record within 400 m."
            )}
          </Fact>
          <Fact label={`311 reports within ${r.reports311.radiusM} m since 2023`} badge={r.reports311.evidence}>
            <strong>{r.reports311.waterInBasement}</strong> water in basement · <strong>{r.reports311.sewerCaveIns}</strong> cave-ins over the sewer ·{" "}
            <strong>{r.reports311.otherCaveIns}</strong> other cave-ins or sinkholes
          </Fact>
          <Fact label="Property" badge={p?.evidence ?? { level: "unknown", source: SOURCES.parcels.label }}>
            {p ? (
              <>
                {p.address} · {p.propertyClass?.toLowerCase() ?? "class unknown"}
                {p.yearBuilt ? ` · built ${p.yearBuilt}` : ""}
                {typeof p.homesteadPct === "number" && ` · ${p.homesteadPct >= 100 ? "owner-occupied (homestead on file)" : p.homesteadPct > 0 ? `${p.homesteadPct}% homestead` : "no homestead exemption on file"}`}
                {p.taxStatus ? ` · tax status: ${p.taxStatus.toLowerCase()}` : ""}
              </>
            ) : (
              "City parcel records were unavailable."
            )}
          </Fact>
          <Fact label="Flood zone" badge={r.floodZone.evidence}>
            {r.floodZone.zone === null && r.floodZone.isSFHA === null
              ? "FEMA's service didn't respond."
              : r.floodZone.isSFHA
                ? `Zone ${r.floodZone.zone} — inside FEMA's Special Flood Hazard Area.`
                : `${r.floodZone.zone ? `Zone ${r.floodZone.zone} — ` : ""}outside FEMA's Special Flood Hazard Area.`}
          </Fact>
          <Fact label="Area income" badge={r.lmi?.evidence ?? { level: "unknown", source: SOURCES.hudLmi.label, url: SOURCES.hudLmi.url }}>
            {r.lmi ? `${Math.round(r.lmi.lowModPct * 100)}% of residents are low or moderate income (${r.lmi.blockGroup}).` : "HUD's service didn't respond."}
          </Fact>
          <Fact label="Private Sewer Repair area" badge={r.psrpNeighborhood.evidence}>
            {r.psrpNeighborhood.inProgram ? `Yes — ${r.psrpNeighborhood.name}.` : "No — outside the 97 program neighborhoods."}
          </Fact>
        </dl>
      </Section>

      <Section id="unknowns" eyebrow="What nobody can tell you yet" title="Unknowns, and who can answer them">
        <ul className="grid gap-3 sm:grid-cols-2">
          {r.unknowns.map((u) => (
            <li key={u.what} className="print-break-avoid rounded-2xl border border-dashed border-ink-3/60 bg-surface p-5">
              <EvidenceBadge evidence={{ level: "unknown", source: "No public record" }} />
              <h3 className="mt-2 font-bold leading-snug">{u.what}</h3>
              <p className="mt-1 text-[0.95rem] text-ink-2">{u.why}</p>
              <p className="mt-2 text-[0.95rem]">
                <span className="font-semibold">Ask: </span>
                {u.whereToAsk}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <p className="border-t border-line pt-6 text-sm text-ink-3">
        Report generated {generated}. Program rules checked {r.programs[0]?.verifiedOn}. City open-data snapshot {r.mainEvidence.asOf}.{" "}
        <Link href="/sources" className="underline">
          How this works
        </Link>
        .
      </p>
    </article>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <li className="rounded-full border border-line bg-surface px-3 py-1 font-medium text-ink-2">{children}</li>;
}

function Fact({ label, badge, children }: { label: string; badge: Report["mainEvidence"]; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-4 py-4 sm:grid-cols-[13rem_1fr] sm:gap-4 sm:px-5">
      <dt className="font-semibold text-ink">
        {label}
        <span className="ml-2">
          <EvidenceBadge evidence={badge} />
        </span>
      </dt>
      <dd className="text-ink-2">{children}</dd>
    </div>
  );
}
