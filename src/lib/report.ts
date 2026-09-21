import { DATA_SNAPSHOT, councilDistrict, findPsrpNeighborhood, inDetroit, mainsNear, metersToSelectedAlley, permitsAtParcel, permitsNear, projectsNear, reportCounts, reportsNear, sideOfLot, PERMIT_WINDOW } from "./geo";
import { SOURCES } from "./facts";
import { buildPrograms } from "./programs";
import { centroid, findParcel, floodZone, geocode, lowModIncome } from "./sources";
import type { Evidence, Report, ReportError, Situation, Unknown } from "./types";
import golden from "@/data/golden.json";
import { propertySite } from "./property-site-source";

const MAIN_RADIUS_M = 120; // alley behind a typical Detroit lot is 20–60 m from the front door, wide lots 80-110m
const MAP_MAIN_RADIUS_M = 250;
const PROJECT_RADIUS_M = 400;
const REPORT_RADIUS_M = 200;
const ASRP_RADIUS_M = 500; // matches scripts/calibrate-asrp.mjs
const PERMIT_RADIUS_M = 300;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type Core = Omit<Report, "programs">;
const cache = new Map<string, { at: number; core: Core }>();
const goldenReports = golden as unknown as Record<string, Core>;

export const normalizeQuery = (q: string) =>
  q.toLowerCase().replace(/,?\s*(detroit|mi|michigan|usa)\b/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const snapshot = (source: { label: string; url: string }, note?: string): Evidence => ({
  level: "recorded",
  source: source.label,
  url: source.url,
  asOf: DATA_SNAPSHOT,
  note,
});

async function settle<T>(p: Promise<T>): Promise<{ ok: true; value: T } | { ok: false }> {
  try {
    return { ok: true, value: await p };
  } catch (err) {
    console.warn("[belowtrace] live source failed:", (err as Error).message);
    return { ok: false };
  }
}

async function buildCore(query: string, magicKey?: string): Promise<Core | ReportError> {
  if (!/^\s*\d+/.test(query)) {
    return { error: "not-found", message: "Please include your house number, like “16776 Prevost St”. We need it to find your property." };
  }
  const geo = await settle(geocode(query, magicKey));
  if (!geo.ok) return { error: "upstream", message: "The address service didn't respond. Please try again in a moment." };
  if (!geo.value) return { error: "not-found", message: "We couldn't find that address. Check the house number and street name, like “16776 Prevost St”." };
  const g = geo.value;

  // Inside the city limits, or an exact match in Detroit's own parcel records, counts as Detroit.
  const parcelLookup = settle(findParcel(g));
  const [parcel, flood, lmi] = await Promise.all([parcelLookup, settle(floodZone(g.lngLat)), settle(lowModIncome(g.lngLat))]);
  const exactParcel = parcel.ok && parcel.value?.match === "exact";
  if (!inDetroit(g.lngLat) && !exactParcel) {
    return {
      error: "outside-detroit",
      message: `That address is in ${g.city || "another city"}, outside Detroit's city limits. BelowTrace covers the City of Detroit's programs only.`,
    };
  }
  const siteLookup = propertySite(g.lngLat, g.streetLngLat ?? null, [g.preDir, g.street].filter(Boolean).join(" "));
  const warnings: string[] = [];
  const mailingCity = g.city && !/^detroit$/i.test(g.city) ? g.city : null;
  if (mailingCity) {
    warnings.push(`This address has a ${mailingCity} mailing address, but the property is inside Detroit city limits, so Detroit's programs apply.`);
  }
  // The geocoder snaps to the street; the parcel's center is closer to the actual house and alley.
  const at = (parcel.ok && parcel.value?.match === "exact" && centroid(parcel.value.geometry ?? null)) || g.lngLat;

  const hood = findPsrpNeighborhood(at);
  const mainsNearby = mainsNear(at, MAP_MAIN_RADIUS_M);
  const nearestMain = mainsNearby.find((m) => m.distanceM <= MAIN_RADIUS_M) ?? null;
  // Only meaningful when we know both the lot's center and the street it faces.
  const mainSide = nearestMain && exactParcel && g.streetLngLat ? sideOfLot(at, g.streetLngLat, nearestMain.nearestPoint) : null;
  const projects = projectsNear(at, PROJECT_RADIUS_M);
  const points = reportsNear(at, REPORT_RADIUS_M);
  // The ASRP reading uses a 500 m radius because that is what the calibration against the
  // 138 already-contracted alleys was measured at.
  const asrpCounts = reportCounts(at, ASRP_RADIUS_M);
  // No public record maps a private lateral. A permit is the nearest thing: proof the line was
  // opened up, when, and by whom.
  const permitsHere = permitsAtParcel(parcel.ok ? parcel.value?.id : null, at).slice(0, 4);
  const permitsRound = permitsNear(at, PERMIT_RADIUS_M);
  const permits = {
    here: permitsHere.map(({ on, kind, what, by, addr, distanceM }) => ({ on, kind, what, by, addr, distanceM })),
    nearby: permitsRound.length,
    valvesNearby: permitsRound.filter((p) => p.kind === "valve").length,
    radiusM: PERMIT_RADIUS_M,
    since: PERMIT_WINDOW.from,
  };
  const asrp = {
    district: councilDistrict(at),
    caveIns500: asrpCounts.caveIns,
    water500: asrpCounts.water,
    nearestWorkM: metersToSelectedAlley(at),
  };

  if (!parcel.ok) warnings.push("City parcel records didn't respond, so property details are missing.");
  else if (parcel.value?.match === "nearest") warnings.push(`We couldn't match this exact address in City parcel records, so we show the closest parcel: ${parcel.value.address}.`);
  if (!flood.ok) warnings.push("FEMA's flood map service didn't respond; floodplain status is unknown.");
  if (!lmi.ok) warnings.push("HUD's income data service didn't respond; the Alley Sewer Repair income test is unknown.");

  const unknowns: Unknown[] = [
    {
      what: "Where your private sewer line runs, how deep it is, and what shape it's in",
      why: "No public record locates private sewer lines. Radar and MISS DIG can't reliably find them either.",
      whereToAsk: "A licensed plumber's camera (CCTV) inspection. PSRP pays for one if you qualify.",
    },
    {
      what: "Whether your alley is scheduled for the Alley Sewer Repair Program",
      why: "DWSD picks alleys from its own camera inspections and hasn't published the list.",
      whereToAsk: "DWSD Customer Service, 313-267-8000.",
    },
  ];
  if (!nearestMain) {
    unknowns.push({
      what: "Details of the city sewer behind this home",
      why: "The public DWSD data we use covers only part of Detroit's sewer system.",
      whereToAsk: "DWSD Customer Service, 313-267-8000.",
    });
  }

  return {
    query,
    address: mailingCity ? g.label.replace(mailingCity, "Detroit") : g.label,
    lngLat: at,
    generatedAt: new Date().toISOString(),
    parcel: parcel.ok ? parcel.value : null,
    site: await siteLookup,
    psrpNeighborhood: {
      name: hood?.name ?? null,
      inProgram: Boolean(hood),
      evidence: snapshot(SOURCES.psrpMap),
    },
    floodZone: flood.ok
      ? { zone: flood.value.zone, isSFHA: flood.value.isSFHA, evidence: { level: "recorded", source: SOURCES.fema.label, url: SOURCES.fema.url } }
      : { zone: null, isSFHA: null, evidence: { level: "unknown", source: SOURCES.fema.label, url: SOURCES.fema.url, note: "Service unavailable" } },
    lmi: lmi.ok && lmi.value
      ? {
          blockGroup: lmi.value.blockGroup,
          lowModPct: lmi.value.lowModPct,
          meetsAsrpIncomeTest: lmi.value.lowModPct > 0.5,
          evidence: { level: "estimated", source: SOURCES.hudLmi.label, url: SOURCES.hudLmi.url },
        }
      : null,
    nearestMain,
    mainSide,
    mainsNearby,
    mainEvidence: snapshot(SOURCES.dwsdMains, "Covers only mains with recent DWSD cleaning work orders"),
    projects,
    projectEvidence: snapshot(SOURCES.dwsdCip),
    reports311: {
      radiusM: REPORT_RADIUS_M,
      since: "2023-01-01",
      waterInBasement: points.filter((p) => p.type === "w").length,
      sewerCaveIns: points.filter((p) => p.type === "s").length,
      otherCaveIns: points.filter((p) => p.type === "c").length,
      points,
      evidence: snapshot(SOURCES.improveDetroit),
    },
    permits,
    asrp,
    unknowns,
    warnings,
  };
}

export async function getReport(query: string, situation: Situation, magicKey?: string): Promise<Report | ReportError> {
  const key = normalizeQuery(query);
  const hit = cache.get(key);
  let core: Core | ReportError;
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    core = hit.core;
  } else {
    core = await buildCore(query, magicKey);
    if ("error" in core && core.error === "upstream" && goldenReports[key]) {
      const saved = goldenReports[key];
      core = { ...saved, cached: true, site: await propertySite(saved.lngLat, null, saved.query.replace(/^\s*\d+\s+/, "").split(",")[0]) };
    }
    if (!("error" in core) && core.parcel) {
      cache.set(key, { at: Date.now(), core });
    }
  }
  if ("error" in core) return core;
  return { ...core, programs: buildPrograms(core, situation) };
}

export const SITUATIONS: Situation[] = ["backup", "broken-line", "checking"];
export const parseSituation = (s: unknown): Situation =>
  SITUATIONS.includes(s as Situation) ? (s as Situation) : "backup";
