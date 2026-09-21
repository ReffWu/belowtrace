export type EvidenceLevel = "recorded" | "estimated" | "unknown";

export type Evidence = {
  level: EvidenceLevel;
  source: string;
  url?: string;
  asOf?: string;
  note?: string;
};

export type LngLat = [number, number];

export type PropertySite = {
  streetPoint: LngLat | null;
  streetName: string;
  buildings: {
    id: string;
    parcelId: string | null;
    kind: string | null;
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  }[];
  roads: { name: string; parts: LngLat[][] }[];
  buildingsAvailable: boolean;
  roadsAvailable: boolean;
  fetchedAt: string;
};

export type Situation = "backup" | "broken-line" | "checking";

export type Parcel = {
  id: string;
  address: string;
  zip?: string;
  propertyClass?: string;
  useCode?: string;
  taxStatus?: string;
  homesteadPct?: number;
  yearBuilt?: number;
  style?: string;
  floorArea?: number;
  frontageFt?: number;
  depthFt?: number;
  match: "exact" | "nearest";
  geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  evidence: Evidence;
};

export type SewerMain = {
  id: string;
  distanceM: number;
  installYear: number | null;
  material: string | null;
  materialLabel: string | null;
  system: string | null;
  systemLabel: string | null;
  depthFt: number | null;
  sizeIn: number | null;
  street: string | null;
  lastWork: string | null;
  lastWorkDate: string | null;
  nearestPoint: LngLat;
  parts: LngLat[][];
};

export type SewerProject = {
  name: string;
  description: string;
  phase: "Construction" | "Procurement" | "Closed" | string;
  startYear: number | null;
  endYear: number | null;
  distanceM: number;
  isAlley: boolean;
  parts: LngLat[][];
};

export type Report311 = { lngLat: LngLat; type: "w" | "s" | "c"; date: string };

export type ProgramStatus = "open" | "closing-soon" | "upcoming" | "paused" | "closed" | "always";

export type ProgramVerdict = "likely" | "possible" | "check" | "unlikely" | "not-applicable" | "info";

export type ProgramCard = {
  id: string;
  name: string;
  shortName: string;
  status: ProgramStatus;
  statusLabel: string;
  amount: string;
  verdict: ProgramVerdict;
  headline: string;
  reasons: { text: string; evidence: Evidence }[];
  actions: { label: string; href: string; kind: "phone" | "link" | "screener" }[];
  deadline?: { label: string; date: string };
  source: { label: string; url: string };
  verifiedOn: string;
};

export type Unknown = { what: string; why: string; whereToAsk: string };

export type Report = {
  query: string;
  address: string;
  lngLat: LngLat;
  generatedAt: string;
  parcel: Parcel | null;
  site?: PropertySite;
  psrpNeighborhood: { name: string | null; inProgram: boolean; evidence: Evidence };
  floodZone: { zone: string | null; isSFHA: boolean | null; evidence: Evidence };
  lmi: { blockGroup: string; lowModPct: number; meetsAsrpIncomeTest: boolean; evidence: Evidence } | null;
  nearestMain: SewerMain | null;
  // Which side of the lot the nearest recorded main runs on, judged from the street-facing point.
  mainSide?: "rear" | "front" | "side" | null;
  mainsNearby: SewerMain[];
  mainEvidence: Evidence;
  projects: SewerProject[];
  projectEvidence: Evidence;
  reports311: {
    radiusM: number;
    since: string;
    waterInBasement: number;
    sewerCaveIns: number;
    otherCaveIns: number;
    points: Report311[];
    evidence: Evidence;
  };
  programs: ProgramCard[];
  permits: {
    here: { on: string; kind: string; what: string; by: string | null; addr: string; distanceM: number }[];
    nearby: number;
    valvesNearby: number;
    radiusM: number;
    since: string;
  };
  asrp: {
    district: number | null;
    caveIns500: number;
    water500: number;
    nearestWorkM: number | null;
  };
  unknowns: Unknown[];
  warnings: string[];
  cached?: boolean;
};

export type ReportError = { error: "not-found" | "outside-detroit" | "upstream"; message: string };
