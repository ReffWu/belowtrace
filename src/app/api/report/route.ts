import type { NextRequest } from "next/server";
import { getReport, parseSituation } from "@/lib/report";

// GET /api/report?address=15888+Stansbury+St&situation=backup
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const address = params.get("address")?.trim();
  if (!address) return Response.json({ error: "bad-request", message: "Pass ?address=" }, { status: 400 });

  const report = await getReport(address, parseSituation(params.get("situation")), params.get("key") ?? undefined);
  const status = "error" in report ? (report.error === "upstream" ? 502 : 404) : 200;
  return Response.json(report, { status });
}
