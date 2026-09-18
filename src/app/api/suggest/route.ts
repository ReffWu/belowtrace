import type { NextRequest } from "next/server";
import { suggestAddresses } from "@/lib/sources";

export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (text.length < 3) return Response.json([]);
  try {
    return Response.json(await suggestAddresses(text));
  } catch {
    return Response.json([]);
  }
}
