import type { Metadata } from "next";
import { getReport } from "@/lib/report";
import { slimReport } from "@/lib/case";
import { CaseView } from "@/components/case/case-view";
import { UnderHome } from "@/components/flow/under-home";

export const metadata: Metadata = { title: "Your case" };

export default async function CasePage(props: PageProps<"/case">) {
  const sp = await props.searchParams;
  const address = typeof sp.address === "string" && sp.address.trim() ? sp.address : undefined;
  const caseId = typeof sp.case === "string" && sp.case.trim() ? sp.case : undefined;
  const key = typeof sp.key === "string" ? sp.key : undefined;
  const result = address ? await getReport(address, "backup", key) : null;
  const report = result && !("error" in result) ? result : null;
  const error = result && "error" in result ? { message: result.message, outside: result.error === "outside-detroit" } : null;

  return (
    <CaseView
      caseId={caseId}
      queryAddress={address}
      report={report ? slimReport(report) : null}
      error={error}
      under={report ? <UnderHome r={report} situation="backup" street={report.address.split(",")[0]} /> : null}
    />
  );
}
