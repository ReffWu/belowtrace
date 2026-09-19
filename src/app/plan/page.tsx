import type { Metadata } from "next";
import Link from "next/link";
import { getReport, parseSituation } from "@/lib/report";
import { parseBreak, whoCanPay, type BreakAt } from "@/lib/guide";
import { SOURCES } from "@/lib/facts";
import type { Report, Situation } from "@/lib/types";
import { AddressSearch } from "@/components/address-search";
import { ClaimCard } from "@/components/flow/claim-card";
import { PayOptions } from "@/components/flow/pay-options";
import { UnderHome } from "@/components/flow/under-home";
import stats from "@/data/citywide-stats.json";

export async function generateMetadata(props: PageProps<"/plan">): Promise<Metadata> {
  const { address } = await props.searchParams;
  return { title: typeof address === "string" ? address : "Your plan" };
}

export default async function PlanPage(props: PageProps<"/plan">) {
  const sp = await props.searchParams;
  const address = typeof sp.address === "string" ? sp.address : "";
  const situation = parseSituation(sp.situation);
  const breakAt = parseBreak(sp.break);
  const key = typeof sp.key === "string" ? sp.key : undefined;
  const params: Record<string, string> = situation === "broken-line" ? { break: breakAt } : {};

  const report = address ? await getReport(address, situation, key) : null;
  if (!report || "error" in report) {
    const outside = report && "error" in report && report.error === "outside-detroit";
    return (
      <div className="mx-auto max-w-xl px-5 pb-20 pt-12">
        <h1 className="text-[2.4rem] font-extrabold leading-tight tracking-[-0.035em]">{outside ? "That's outside Detroit." : "Let's try that again."}</h1>
        <p className="mt-3 text-lg text-ink-2" role="alert">
          {report && "error" in report ? report.message : "Enter a Detroit street address."}
        </p>
        {outside && (
          <p className="mt-4 text-ink-2">
            In most cities the line from your house to the public sewer is still yours. Call your city&apos;s water department before you pay for a
            repair, and ask if they have a repair program.
          </p>
        )}
        <div className="mt-8">
          <AddressSearch defaultAddress={outside ? "" : address} defaultSituation={situation} target="/plan" params={params} cta="Show me" />
        </div>
      </div>
    );
  }

  const street = report.address.split(",")[0];
  return <Plan r={report} situation={situation} breakAt={breakAt} street={street} />;
}

function Plan({ r, situation, breakAt, street }: { r: Report; situation: Situation; breakAt: BreakAt; street: string }) {
  const { fits, checked } = whoCanPay(r, situation, breakAt);
  const pay = <PayOptions fits={fits} checked={checked} report={r} />;
  const under = <UnderHome r={r} situation={situation} street={street} lead={situation === "checking"} />;

  return (
    <article>
      <header className="mx-auto max-w-3xl px-5 pt-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-semibold text-ink-2 hover:text-ink">
            <span aria-hidden="true">←</span> Start over
          </Link>
          <span className="truncate text-sm font-semibold text-ink-3">{r.address.replace(/, MI \d{5}$/, "")}</span>
        </div>
        {r.warnings.length > 0 && (
          <div className="mt-4 rounded-xl bg-warn-tint px-4 py-3 text-[0.95rem] text-[#6b3d00]" role="note">
            {r.warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </div>
        )}
      </header>

      {situation === "backup" && (
        <>
          <Intro title="Here's what happens next." lead={`For ${street}. Your claim deadline is saved on this device.`} />
          <Block>
            <ClaimCard claimsUrl={SOURCES.claims.url} />
            <Timeline />
          </Block>
          <Block id="pay" eyebrow="If it's your line" title={`Who can help pay for ${street}`}>
            {pay}
          </Block>
          {under}
        </>
      )}

      {situation === "broken-line" && (
        <>
          <Intro
            title={breakAt === "alley" ? "A break at the alley may be fixed for free." : "Here's who can help pay."}
            lead={`Checked against every City repair program for ${street}.`}
          />
          <Block>{pay}</Block>
          {under}
        </>
      )}

      {situation === "checking" && (
        <>
          <div className="h-8" />
          {under}
          <Block eyebrow="Before you buy" title="Get a sewer camera inspection first.">
            <p className="max-w-2xl text-[1.15rem] leading-relaxed text-ink-2">
              It costs a few hundred dollars and can reveal a $10,000–$25,000 repair. The line from the house to the city sewer is the owner&apos;s to fix.
            </p>
          </Block>
          <Block eyebrow="If something goes wrong here" title="Who could help pay">
            {pay}
          </Block>
        </>
      )}
    </article>
  );
}

function Intro({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-10">
      <h1 className="rise text-[2.5rem] font-extrabold leading-[1.04] tracking-[-0.035em] sm:text-[3.3rem]">{title}</h1>
      <p className="rise rise-1 mt-3 text-[1.2rem] text-ink-2">{lead}</p>
    </div>
  );
}

function Block({ id, eyebrow, title, children }: { id?: string; eyebrow?: string; title?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="rise rise-2 mx-auto max-w-3xl scroll-mt-4 px-5 py-10">
      {eyebrow && <p className="text-sm font-bold uppercase tracking-[0.14em] text-own">{eyebrow}</p>}
      {title && <h2 className="mb-6 mt-1 text-[1.9rem] font-extrabold leading-tight tracking-[-0.03em]">{title}</h2>}
      {children}
    </section>
  );
}

// The one fork every backup reaches: DWSD's answer decides who fixes it and who pays.
function Timeline() {
  return (
    <ol className="mt-10 grid gap-8">
      <li className="grid grid-cols-[2.5rem_1fr] gap-4">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-ink font-bold text-white">1</span>
        <div>
          <h3 className="text-xl font-bold">DWSD checks the city sewer</h3>
          <p className="mt-1 text-[1.05rem] text-ink-2">
            Over the past year, DWSD closed {stats.response.within48Pct}% of requests like yours within 2 days. Closed means the visit is done, not
            always that the problem is fixed.
          </p>
        </div>
      </li>
      <li className="grid grid-cols-[2.5rem_1fr] gap-4">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-ink font-bold text-white">2</span>
        <div>
          <h3 className="text-xl font-bold">You&apos;ll hear one of two answers</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-brand-tint p-5">
              <p className="font-bold text-brand-ink">&ldquo;It&apos;s the city sewer.&rdquo;</p>
              <p className="mt-1 text-ink-2">DWSD fixes it at no cost to you. File your damage claim before the deadline above.</p>
            </div>
            <a href="#pay" className="group rounded-2xl bg-own-tint p-5 transition hover:ring-2 hover:ring-own">
              <p className="font-bold text-[#6b3a06]">&ldquo;It&apos;s your line.&rdquo;</p>
              <p className="mt-1 text-ink-2">
                The repair is yours to arrange. Get a camera inspection before anyone digs, then see who can help pay.{" "}
                <span aria-hidden="true" className="font-bold text-own">↓</span>
              </p>
            </a>
          </div>
        </div>
      </li>
    </ol>
  );
}
