import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

describe("/api/locate endpoint", () => {
  it("rejects requests missing lat or lng with 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/locate");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Missing");
  });

  it("handles valid Detroit parcel response gracefully", async () => {
    const mockParcelResponse = {
      features: [
        {
          attributes: {
            address: "16776 PREVOST",
            zip_code: 48235,
            parcel_number: "22074837.",
          },
        },
      ],
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockParcelResponse,
    }) as unknown as typeof fetch;

    const req = new NextRequest("http://localhost:3000/api/locate?lat=42.4132&lng=-83.1974");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.inDetroit).toBe(true);
    expect(json.address).toContain("16776 Prevost");

    globalThis.fetch = originalFetch;
  });
});
