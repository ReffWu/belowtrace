import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getReport, parseSituation } from "@/lib/report";
import { whoCanPay } from "@/lib/guide";
import type { Report } from "@/lib/types";
import { AddressSearch } from "@/components/address-search";
import { PayOptions } from "@/components/flow/pay-options";
import { UnderHome } from "@/components/flow/under-home";

export async function generateMetadata(props: PageProps<"/plan">): Promise<Metadata> {
  const { address } = await props.searchParams;
  return { title: typeof address === "string" ? address : "What's under a home" };
}

// "Just checking": what's under a home, and who could help if something goes wrong.
// A backup or a plumber's quote belongs in a case, so those links move there.
export default async function PlanPage(props: PageProps<"/plan">) {
  const sp = await props.searchParams;
  const address = typeof sp.address === "string" ? sp.address : "";
  if (parseSituation(sp.situation) !== "checking") redirect(address ? `/case?${new URLSearchParams({ address })}` : "/backup");
  const key = typeof sp.key === "string" ? sp.key : undefined;

  const report = address ? await getReport(address, "checking", key) : null;
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
          <AddressSearch defaultAddress={outside ? "" : address} defaultSituation="checking" target="/plan" params={{}} cta="Show me" />
        </div>
      </div>
    );
  }
  return <Checking r={report} />;
}

function Checking({ r }: { r: Report }) {
  const { fits, checked } = whoCanPay(r, "checking");
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
      <div className="h-8" />
      <UnderHome r={r} situation="checking" street={r.address.split(",")[0]} lead />
      <Block eyebrow="Before you buy" title="Get a sewer camera inspection first.">
        <p className="max-w-2xl text-[1.15rem] leading-relaxed text-ink-2">
          It costs a few hundred dollars and can reveal a $5,000–$20,000 repair. The line from the house to the city sewer is the owner&apos;s to fix.
        </p>
      </Block>
      <Block eyebrow="If something goes wrong here" title="Who could help pay">
        <PayOptions fits={fits} checked={checked} report={r} />
      </Block>
    </article>
  );
}

function Block({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rise rise-2 mx-auto max-w-3xl px-5 py-10">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-own">{eyebrow}</p>
      <h2 className="mb-6 mt-1 text-[1.9rem] font-extrabold leading-tight tracking-[-0.03em]">{title}</h2>
      {children}
    </section>
  );
}
