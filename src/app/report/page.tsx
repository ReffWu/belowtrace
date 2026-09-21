import type { Metadata } from "next";
import Link from "next/link";
import { getReport } from "@/lib/report";
import { assessAsrp } from "@/lib/asrp";
import { anatomy, verdictLine } from "@/lib/anatomy";
import { AnatomyReport } from "@/components/report/anatomy-report";
import { StartSearch } from "@/components/start-search";

export async function generateMetadata(props: PageProps<"/report">): Promise<Metadata> {
  const { address } = await props.searchParams;
  return { title: typeof address === "string" ? address.split(",")[0] : "Report" };
}

export default async function ReportPage(props: PageProps<"/report">) {
  const sp = await props.searchParams;
  const address = typeof sp.address === "string" ? sp.address.trim() : "";
  const key = typeof sp.key === "string" ? sp.key : undefined;
  if (!address) return <Empty />;

  const r = await getReport(address, "backup", key);
  if ("error" in r) return <Failed message={r.message} outside={r.error === "outside-detroit"} />;

  const asrp = assessAsrp({
    district: r.asrp.district,
    caveIns500: r.asrp.caveIns500,
    water500: r.asrp.water500,
    nearestWorkM: r.asrp.nearestWorkM,
    lowModPct: r.lmi?.lowModPct ?? null,
  });
  const inPsrp = r.psrpNeighborhood.inProgram && r.floodZone.isSFHA !== true;

  return <AnatomyReport report={r} asrp={asrp} segments={anatomy(r, asrp)} verdict={verdictLine(asrp, inPsrp)} />;
}

function Empty() {
  return (
    <div className="mx-auto max-w-xl px-5 pb-20 pt-12">
      <h1 className="text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.03em]">Which house?</h1>
      <p className="mt-3 text-[1.1rem] text-ink-2">Everything on the report comes from this one address.</p>
      <div className="mt-7">
        <StartSearch />
      </div>
    </div>
  );
}

function Failed({ message, outside }: { message: string; outside: boolean }) {
  return (
    <div className="mx-auto max-w-xl px-5 pb-20 pt-12">
      <h1 className="text-[2rem] font-extrabold leading-tight tracking-[-0.03em]">
        {outside ? "That address is outside Detroit." : "Let's try that again."}
      </h1>
      <p className="mt-3 text-[1.1rem] text-ink-2" role="alert">
        {message}
      </p>
      {outside && (
        <p className="mt-5 rounded-2xl bg-sunk/70 p-5 leading-relaxed text-ink-2">
          In most American cities the line from the house to the public main still belongs to the owner. Call your own water or public
          works department before paying for a repair, and ask whether they run a lateral repair or backwater-valve program.
        </p>
      )}
      <div className="mt-7">
        <StartSearch />
      </div>
      <Link href="/" className="mt-6 inline-block min-h-11 font-semibold text-brand underline">
        ← Back
      </Link>
    </div>
  );
}
