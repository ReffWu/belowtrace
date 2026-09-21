"use client";

// The timeline renders from the phone alone. This adds the one thing it cannot know offline ,
// whether the address sits inside a repair program's boundary, and never blocks on it.
import { useEffect, useState } from "react";

export type AddressContext = {
  state: "idle" | "loading" | "ready" | "failed";
  inPsrpArea?: boolean;
  psrpNeighborhood?: string | null;
  waterInBasement?: number;
  parcelId?: string;
};

type Result = AddressContext & { for: string };

export function useAddressContext(address?: string): AddressContext {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!address) return;
    let live = true;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12_000);
    fetch(`/api/report?address=${encodeURIComponent(address)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((r) => {
        if (!live) return;
        setResult({
          for: address,
          state: "ready",
          // Unknown stays unknown: a FEMA lookup that returned nothing is not a "no".
          inPsrpArea: Boolean(r.psrpNeighborhood?.inProgram) && r.floodZone?.isSFHA !== true,
          psrpNeighborhood: r.psrpNeighborhood?.name ?? null,
          waterInBasement: r.reports311?.waterInBasement,
          parcelId: r.parcel?.id,
        });
      })
      .catch(() => live && setResult({ for: address, state: "failed" }))
      .finally(() => clearTimeout(timer));
    return () => {
      live = false;
      ctrl.abort();
    };
  }, [address]);

  // Derived, not stored: a stale result for another address must never leak into this one.
  if (!address) return { state: "idle" };
  if (result?.for !== address) return { state: "loading" };
  return result;
}
