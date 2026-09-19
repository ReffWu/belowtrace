// Every rule, phone number and date shown to residents lives here, with its source.
// Update VERIFIED_ON whenever these are re-checked.

export const VERIFIED_ON = "2026-09-18";

export const PHONES = {
  dwsd: { label: "DWSD Customer Service", number: "313-267-8000" },
  hrd: { label: "Housing & Revitalization Dept.", number: "313-224-6380" },
  habitat: { label: "Habitat for Humanity Detroit", number: "313-521-6691" },
  wayneMetro: { label: "Wayne Metro (HOPE help)", number: "866-313-2520" },
  missDig: { label: "MISS DIG 811", number: "811" },
} as const;

export const SOURCES = {
  asrp: {
    label: "DWSD — Alley Sewer Repair Program",
    url: "https://detroitmi.gov/departments/detroit-water-and-sewerage-department/dwsd-resources/alley-sewer-repair-program",
  },
  asrpNews: {
    label: "City of Detroit — $184M ASRP announcement",
    url: "https://detroitmi.gov/news/mayor-sheffield-dwsd-announce-184m-alley-sewer-repair-program-fix-9000-private-residential-sewer",
  },
  psrp: {
    label: "HRD — CDBG-DR Private Sewer Repair Program",
    url: "https://detroitmi.gov/departments/housing-and-revitalization-department/hud-programming-and-information/cdbg-disaster-recovery/cdbg-dr-private-sewer-repair-program",
  },
  psrpGuide: {
    label: "PSRP Program Guide (amended 9/1/2025)",
    url: "https://detroitmi.gov/sites/detroitmi.localhost/files/2025-09/CDBG-DR_PSRP_Program_Guide_9.5.25.pdf",
  },
  psrpPolicy: {
    label: "PSRP Policy & Procedure (4/13/2026)",
    url: "https://detroitmi.gov/sites/detroitmi.localhost/files/2026-04/Policy&Procedure_PSRP_2026.04.13_0.pdf",
  },
  neighborly: {
    label: "City of Detroit Neighborly portal",
    url: "https://portal.neighborlysoftware.com/cityofdetroitmi/participant",
  },
  chr: {
    label: "HRD — Critical Home Repair Program",
    url: "https://detroitmi.gov/departments/housing-and-revitalization-department/homeowners/critical-home-repair-program",
  },
  claims: {
    label: "DWSD — Damage Claims & Sewage Backups",
    url: "https://detroitmi.gov/departments/water-and-sewerage-department/dwsd-customer-service/dwsd-damage-claims-sewage-backups",
  },
  bbpp: {
    label: "DWSD — Basement Backup and Flood Protection",
    url: "https://detroitmi.gov/departments/water-and-sewerage-department/dwsd-resources/basement-backup-and-flood-protection",
  },
  habitat: { label: "Habitat Detroit — Critical Home Repair", url: "https://habitatdetroit.org/critical-home-repair/" },
  handbook: {
    label: "DWSD Basement Backup & Flooding Handbook (2023)",
    url: "https://detroitmi.gov/sites/detroitmi.localhost/files/2023-07/DWSD%20Basement%20Backup%20&%20Flooding%20Handbook%20-%20Version%202023-1.pdf",
  },
  glwaClaims: {
    label: "Planet Detroit — GLWA denies all 2021 flood claims (July 2022)",
    url: "https://planetdetroit.org/2022/07/glwa-denies-all-flood-claims-from-2021-lawsuits-will-continue/",
  },
  hope: {
    label: "City of Detroit — HOPE property tax exemption",
    url: "https://detroitmi.gov/government/mayors-office/chief-financial-officer/homeowners-property-exemption-hope",
  },
  zeroLoan: { label: "Detroit 0% Interest Home Repair Loans", url: "https://www.detroithomeloans.org/" },
  maintenance: {
    label: "DWSD — Water and Sewer Maintenance/Emergencies",
    url: "https://detroitmi.gov/departments/water-and-sewerage-department/dwsd-customer-service/water-and-sewer-maintenanceemergencies",
  },
  beasley: {
    label: "WDIV — Detroit couple battles basement flooding; city has no record of sewer line (Apr 2026)",
    url: "https://www.clickondetroit.com/news/local/2026/04/27/detroit-couple-battles-basement-flooding-for-decades-city-says-they-have-no-record-of-sewer-line/",
  },
  incomeLimits: {
    label: "MSHDA Income Limits, effective May 1, 2026 (Wayne County)",
    url: "https://www.michigan.gov/mshda/rental/property-managers/compliance/income_rent_and_utility_limits",
  },
  parcels: { label: "City of Detroit — Parcels (current)", url: "https://data.detroitmi.gov/" },
  improveDetroit: { label: "Improve Detroit 311 requests", url: "https://data.detroitmi.gov/" },
  dwsdMains: {
    label: "DWSD sewer cleaning dashboard (gravity mains, partial coverage)",
    url: "https://services2.arcgis.com/qvkbeam7Wirps6zC/arcgis/rest/services/Sewer_Cleaning_Dashboard_DEV/FeatureServer/7",
  },
  dwsdCip: {
    label: "DWSD Capital Improvement Projects (public view)",
    url: "https://utility.arcgis.com/usrsvcs/servers/afe480be72214d84b1ac283f4c3681b3/rest/services/DWSD_Capital_Improvement_Projects_Public_View/FeatureServer",
  },
  psrpMap: {
    label: "City of Detroit — PSRP neighborhoods",
    url: "https://services2.arcgis.com/qvkbeam7Wirps6zC/arcgis/rest/services/Neighborhoods_CDBG_DR_Private_Sewer_Repair_Program/FeatureServer/0",
  },
  fema: { label: "FEMA National Flood Hazard Layer", url: "https://www.fema.gov/flood-maps/national-flood-hazard-layer" },
  hudLmi: {
    label: "HUD Low/Mod Income by Block Group (ACS 2016–2020)",
    url: "https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/LOW_MOD_INCOME_BY_BG/FeatureServer",
  },
} as const;

// What things cost, from the DWSD Basement Backup & Flooding Handbook (2023): p. 16 for snaking and
// lateral repair; p. 26 for the most DWSD's own backup program paid for a camera inspection.
export const COSTS = { snaking: "$75–$150", lateral: "$5,000–$20,000", camera: "~$400" };

// Wayne County, MSHDA income limits effective May 1, 2026. Index 0 = 1 person … index 7 = 8 people.
export const INCOME_LIMITS = {
  veryLow50: [36700, 41950, 47200, 52400, 56600, 60800, 65000, 69200],
  low80: [58700, 67100, 75500, 83850, 90600, 97300, 104000, 110700],
};

// City of Detroit Critical Home Repair pre-application window (2026 fall round).
export const CHR_CLOSES = "2026-09-22T17:00:00-04:00";
// DWSD Alley Sewer Repair Program construction start.
export const ASRP_STARTS = "2026-10";
// HOPE property tax exemption 2026 application deadline.
export const HOPE_DEADLINE = "2026-11-06T16:30:00-05:00";

// DWSD material codes we can decode with confidence; anything else is shown as the raw code.
export const MATERIALS: Record<string, string> = {
  VCP: "vitrified clay",
  CP: "concrete",
  RCP: "reinforced concrete",
  BR: "brick",
  PVC: "PVC plastic",
};

export const SYSTEMS: Record<string, string> = {
  CB: "combined (sewage + stormwater)",
  SS: "sanitary (sewage only)",
  SW: "storm",
};
