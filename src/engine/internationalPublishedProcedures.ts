import type {
  ProcedureFixTemplate,
  PublishedProcedurePack,
  PublishedProcedureTemplate,
} from './airportOperations';
import { DOHA_PUBLISHED_PROCEDURE_PACK } from './dohaPublishedProcedures';
import { MUMBAI_PUBLISHED_PROCEDURE_PACK } from './mumbaiPublishedProcedures';

const ACCESSED_ON = '2026-08-24';

type RunwayVariant = {
  runwayId: string;
  suffix: string;
};

const EAST_RUNWAY_VARIANTS: RunwayVariant[] = [
  { runwayId: '09', suffix: 'E' },
  { runwayId: '10', suffix: 'F' },
  { runwayId: '11L', suffix: 'G' },
  { runwayId: '11R', suffix: 'H' },
];

const WEST_RUNWAY_VARIANTS: RunwayVariant[] = [
  { runwayId: '27', suffix: 'A' },
  { runwayId: '28', suffix: 'B' },
  { runwayId: '29R', suffix: 'C' },
  { runwayId: '29L', suffix: 'D' },
];

function arrivalVariants(
  entry: string,
  variants: RunwayVariant[],
  fixes: ProcedureFixTemplate[],
): PublishedProcedureTemplate[] {
  return variants.map(({ runwayId, suffix }) => ({
    id: `${entry}6${suffix}`,
    kind: 'arrival',
    compatibleRunwayIds: [runwayId],
    entryTransition: entry,
    fixes: fixes.map((fix) => ({ ...fix })),
  }));
}

/*
 * AIM India publishes the route order, WGS-84 waypoint coordinates and
 * restrictions independently. Bearings below are calculated from the VIDP
 * ARP. Distances are uniformly projected within each non-overlapping route
 * family into the compact 8-40 NM tactical sector.
 */
const spEastFixes: ProcedureFixTemplate[] = [
  { id: 'SP', bearing: 10.9, distanceNm: 31.7 },
  { id: 'ISREL', bearing: 1.2, distanceNm: 20.2, minimumAltitudeFt: 15000, maximumSpeedKt: 250 },
  { id: 'VILUT', bearing: 347.9, distanceNm: 14.6, minimumAltitudeFt: 12000, maximumSpeedKt: 230 },
  { id: 'SAM', bearing: 314.5, distanceNm: 10.6, maximumAltitudeFt: 6000, maximumSpeedKt: 210 },
  { id: 'FN911', bearing: 300.5, distanceNm: 8, minimumAltitudeFt: 4000, maximumSpeedKt: 190 },
];

const elkuxEastFixes: ProcedureFixTemplate[] = [
  { id: 'ELKUX', bearing: 312.7, distanceNm: 40 },
  { id: 'ASUKO', bearing: 313.1, distanceNm: 23.4, minimumAltitudeFt: 15000, maximumSpeedKt: 250 },
  { id: 'EPDON', bearing: 313.4, distanceNm: 17, minimumAltitudeFt: 12000, maximumSpeedKt: 230 },
  { id: 'SAM', bearing: 314.5, distanceNm: 10.6, maximumAltitudeFt: 6000, maximumSpeedKt: 210 },
  { id: 'FN911', bearing: 300.5, distanceNm: 8, minimumAltitudeFt: 4000, maximumSpeedKt: 190 },
];

const bavoxWestFixes: ProcedureFixTemplate[] = [
  { id: 'BAVOX', bearing: 177.8, distanceNm: 40 },
  { id: 'SURGO', bearing: 178.4, distanceNm: 20.5, minimumAltitudeFt: 18000 },
  { id: 'SAPLO', bearing: 178.6, distanceNm: 18.1, minimumAltitudeFt: 15000, maximumSpeedKt: 250 },
  { id: 'DP505', bearing: 171.7, distanceNm: 13, maximumAltitudeFt: 10000, maximumSpeedKt: 230 },
  { id: 'FS711', bearing: 138, distanceNm: 8, minimumAltitudeFt: 3000, maximumSpeedKt: 190 },
];

const posigWestFixes: ProcedureFixTemplate[] = [
  { id: 'POSIG', bearing: 162.8, distanceNm: 25.3 },
  { id: 'SAPLO', bearing: 178.6, distanceNm: 18.1, minimumAltitudeFt: 15000, maximumSpeedKt: 250 },
  { id: 'DP505', bearing: 171.7, distanceNm: 13, maximumAltitudeFt: 10000, maximumSpeedKt: 230 },
  { id: 'FS711', bearing: 138, distanceNm: 8, minimumAltitudeFt: 3000, maximumSpeedKt: 190 },
];

const delhi: PublishedProcedurePack = {
  airportId: 'del',
  packVersion: '2026.08.4',
  referenceCycle: 'AIM India AIP AMDT 07/2026 · effective 2026-08-06',
  effectiveFrom: '2026-08-06',
  effectiveTo: '2026-09-02',
  generatedFrom: 'AIM India eAIP · RNAV 1 STAR tables and WGS-84 waypoint data',
  procedures: [
    ...arrivalVariants('SP', EAST_RUNWAY_VARIANTS, spEastFixes),
    ...arrivalVariants('ELKUX', EAST_RUNWAY_VARIANTS, elkuxEastFixes),
    ...arrivalVariants('BAVOX', WEST_RUNWAY_VARIANTS, bavoxWestFixes),
    ...arrivalVariants('POSIG', WEST_RUNWAY_VARIANTS, posigWestFixes),
  ],
  sources: [
    {
      publisher: 'Airports Authority of India',
      title: 'eAIP India AIP AMDT 07/2026',
      url: 'https://aim-india.aai.aero/eaip/eaip-v2-08-2026/index-en-GB.html',
      purpose: 'Current issue and effective-date reference',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Airports Authority of India',
      title: 'VIDP AD 2 aerodrome, runway and WGS-84 waypoint data',
      url: 'https://aim-india.aai.aero/eaip/eaip-v2-07-2026/eAIP/IN-AD%202.1VIDP-en-GB.html',
      purpose: 'Airport reference point, runway identifiers and published waypoint coordinates',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Airports Authority of India',
      title: 'VIDP ELKUX/SP 6E-6H RNAV 1 STAR tabular description',
      url: 'https://aim-india.aai.aero/eaip/eaip-v2-07-2026/eAIP/VIDP-STAR-RNAV1-GNSS-RWY-09-10-11L-11R-ELKUX-SP-6-E-F-G-H-TABLE.pdf',
      purpose: 'Easterly-flow route order, runway variants and altitude/speed restrictions',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Airports Authority of India',
      title: 'VIDP BAVOX/POSIG 6A-6D RNAV 1 STAR tabular description',
      url: 'https://aim-india.aai.aero/eaip/eaip-v2-07-2026/eAIP/VIDP-STAR-RNAV1-GNSS-RWY-27-28-29R-29L-BAVOX-POSIG-6-A-B-C-D-TABLE.pdf',
      purpose: 'Westerly-flow route order, runway variants and altitude/speed restrictions',
      accessedOn: ACCESSED_ON,
    },
  ],
  gameOnlyNotice: 'Published route identity, order and represented restrictions are retained; WGS-84 geometry is projected into a compact tactical sector and is not for navigation.',
};

/*
 * The Republic of Korea coding tables publish WGS-84 coordinates for every
 * waypoint. Bearings below are calculated from the RKSI ARP (372745N
 * 1262621E). A single global projection (8 NM + 45% of chart distance, capped
 * at 40 NM) preserves the route shape while fitting the 60+ NM entry feeds on
 * the tactical scope. Intermediate fixes are intentionally sampled in chart
 * order so the radar remains readable at phone scale.
 */
const incheonGukdo2HFixes: ProcedureFixTemplate[] = [
  { id: 'GUKDO', bearing: 114.5, distanceNm: 36.5, minimumAltitudeFt: 18000 },
  { id: 'NODUN', bearing: 110.8, distanceNm: 28.8, maximumSpeedKt: 250 },
  { id: 'SEL', bearing: 97, distanceNm: 18.6, minimumAltitudeFt: 13000 },
  { id: 'GH034', bearing: 175.1, distanceNm: 13.4, minimumAltitudeFt: 12000 },
  { id: 'SANLA', bearing: 197.9, distanceNm: 14.7 },
  { id: 'DH034', bearing: 221.4, distanceNm: 16.2 },
  { id: 'POMIM', bearing: 234.2, distanceNm: 15.9, minimumAltitudeFt: 3000, maximumSpeedKt: 210 },
  { id: 'DH030', bearing: 247, distanceNm: 16.1, maximumSpeedKt: 210 },
  { id: 'DH021', bearing: 280.2, distanceNm: 15.5, maximumSpeedKt: 210 },
  { id: 'DH024', bearing: 253, distanceNm: 13.5, maximumSpeedKt: 210 },
  { id: 'DH023', bearing: 233.4, distanceNm: 10.6, maximumSpeedKt: 210 },
  { id: 'MUNAN', bearing: 299.2, distanceNm: 13.9, minimumAltitudeFt: 2000, maximumAltitudeFt: 4000 },
];

const incheonKarbu2HFixes: ProcedureFixTemplate[] = [
  { id: 'KARBU', bearing: 85.5, distanceNm: 34.3, minimumAltitudeFt: 18000 },
  { id: 'UPSOM', bearing: 88.5, distanceNm: 26.8, maximumSpeedKt: 250 },
  { id: 'KC066', bearing: 109.2, distanceNm: 26.6, maximumSpeedKt: 250 },
  ...incheonGukdo2HFixes.slice(2).map((fix) => ({ ...fix })),
];

const incheonGukdo2EFixes: ProcedureFixTemplate[] = [
  { id: 'GUKDO', bearing: 114.5, distanceNm: 36.5, minimumAltitudeFt: 18000 },
  { id: 'KAKSO', bearing: 112.3, distanceNm: 31.4, maximumSpeedKt: 250 },
  { id: 'GE046', bearing: 110.4, distanceNm: 28.1 },
  { id: 'ELMAP', bearing: 107.6, distanceNm: 24.9, minimumAltitudeFt: 13000, maximumSpeedKt: 250 },
  { id: 'TESIK', bearing: 116.9, distanceNm: 19.3, minimumAltitudeFt: 10000, maximumSpeedKt: 210 },
  { id: 'GE023', bearing: 111.6, distanceNm: 16.9, maximumSpeedKt: 210 },
  { id: 'GE022', bearing: 106.2, distanceNm: 15.2, maximumSpeedKt: 210 },
  { id: 'GE016', bearing: 120, distanceNm: 14.2, maximumSpeedKt: 210 },
  { id: 'GE024', bearing: 131.5, distanceNm: 19.3, maximumSpeedKt: 210 },
  { id: 'GE028', bearing: 133.3, distanceNm: 21.1, maximumSpeedKt: 210 },
  { id: 'GE027', bearing: 143.2, distanceNm: 20.9, maximumSpeedKt: 210 },
  { id: 'ENPIL', bearing: 142.8, distanceNm: 18.2, minimumAltitudeFt: 7000 },
];

const incheonKarbu2EFixes: ProcedureFixTemplate[] = [
  { id: 'KARBU', bearing: 85.5, distanceNm: 34.3, minimumAltitudeFt: 18000 },
  { id: 'EGOBA', bearing: 87.8, distanceNm: 28.2, maximumSpeedKt: 250 },
  { id: 'KE044', bearing: 97.1, distanceNm: 26.9, minimumAltitudeFt: 13000 },
  ...incheonGukdo2EFixes.slice(3).map((fix) => ({ ...fix })),
];

const incheon: PublishedProcedurePack = {
  airportId: 'icn',
  packVersion: '2026.08.5',
  referenceCycle: 'Korea AIM eAIP 2026-08-20 · linked AIRAC AIP AMDT 9/25 STAR package',
  effectiveFrom: '2025-10-01',
  generatedFrom: 'Republic of Korea eAIP · RNAV 1 STAR charts and coding tables',
  procedures: [
    {
      id: 'GUKDO2H',
      kind: 'arrival',
      compatibleRunwayIds: ['15L', '15R', '16L', '16R'],
      entryTransition: 'GUKDO',
      fixes: incheonGukdo2HFixes,
    },
    {
      id: 'KARBU2H',
      kind: 'arrival',
      compatibleRunwayIds: ['15L', '15R', '16L', '16R'],
      entryTransition: 'KARBU',
      fixes: incheonKarbu2HFixes,
    },
    {
      id: 'GUKDO2E',
      kind: 'arrival',
      compatibleRunwayIds: ['33L', '33R', '34L', '34R'],
      entryTransition: 'GUKDO',
      fixes: incheonGukdo2EFixes,
    },
    {
      id: 'KARBU2E',
      kind: 'arrival',
      compatibleRunwayIds: ['33L', '33R', '34L', '34R'],
      entryTransition: 'KARBU',
      fixes: incheonKarbu2EFixes,
    },
  ],
  sources: [
    {
      publisher: 'Office of Civil Aviation, Republic of Korea',
      title: 'RKSI AD 2 aerodrome data and assignment of STAR',
      url: 'https://aim.koca.go.kr/eaipPub/Package/2026-08-20/html/eAIP/KR-AD-2.RKSI-en-GB.html?amdt=show',
      purpose: 'Current airport reference point, runway identifiers and H24 STAR assignments',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Office of Civil Aviation, Republic of Korea',
      title: 'RKSI AD CHART 2-42 to 2-45 RNAV STAR package, AIRAC AIP AMDT 9/25',
      url: 'https://aim.koca.go.kr/eaipPub/Package/2025-10-01-AIRAC/pdf/AD/RKSI/%282-42%29%20STAR_1755755557.pdf',
      purpose: 'Published route order, WGS-84 coding tables and represented altitude/speed restrictions',
      accessedOn: ACCESSED_ON,
    },
  ],
  gameOnlyNotice: 'Published STAR identifiers, sampled waypoint order and represented restrictions are retained; WGS-84 geometry is projected into a compact tactical sector and is not for navigation.',
};

/*
 * UAE GCAA publishes the OMDB RNAV 1 FMS coding tables and the WGS-84
 * significant-point catalogue separately. Bearings below are calculated from
 * the OMDB ARP (251510N 0552152E). A single global projection (8 NM + 60% of
 * chart distance, capped at 40 NM) preserves the downwind geometry inside the
 * tactical scope. Intermediate fixes are sampled in published order so all
 * four primary, time-independent feeds remain readable on a phone display.
 */
const dubaiImped3EFixes: ProcedureFixTemplate[] = [
  { id: 'IMPED', bearing: 113.5, distanceNm: 33.1, maximumAltitudeFt: 12000, maximumSpeedKt: 230 },
  { id: 'DB520', bearing: 109.4, distanceNm: 28.7, maximumAltitudeFt: 11000, maximumSpeedKt: 230 },
  { id: 'DB517', bearing: 99.2, distanceNm: 21.8, maximumAltitudeFt: 10000 },
  { id: 'DB423', bearing: 97.3, distanceNm: 14.1, minimumAltitudeFt: 8000 },
  { id: 'DB407', bearing: 245.6, distanceNm: 9.4, maximumAltitudeFt: 6000, maximumSpeedKt: 210 },
  { id: 'DB403', bearing: 287.3, distanceNm: 17.6 },
  { id: 'SOLIL', bearing: 290.9, distanceNm: 20.5, maximumSpeedKt: 185 },
  { id: 'DB414', bearing: 302, distanceNm: 22.7 },
  { id: 'REREK', bearing: 302.2, distanceNm: 17.9 },
];

const dubaiPuval2EFixes: ProcedureFixTemplate[] = [
  { id: 'PUVAL', bearing: 42.4, distanceNm: 24.9, maximumAltitudeFt: 11000, maximumSpeedKt: 230 },
  { id: 'MIVUR', bearing: 51.1, distanceNm: 22 },
  { id: 'OVADI', bearing: 62, distanceNm: 16.8 },
  { id: 'SERSA', bearing: 61.7, distanceNm: 13.8 },
  { id: 'DB406', bearing: 61.6, distanceNm: 10.9, maximumAltitudeFt: 7000 },
  { id: 'DB407', bearing: 245.6, distanceNm: 9.4, maximumAltitudeFt: 6000, maximumSpeedKt: 210 },
  { id: 'DB403', bearing: 287.3, distanceNm: 17.6 },
  { id: 'SOLIL', bearing: 290.9, distanceNm: 20.5, maximumSpeedKt: 185 },
  { id: 'DB414', bearing: 302, distanceNm: 22.7 },
  { id: 'REREK', bearing: 302.2, distanceNm: 17.9 },
];

const dubaiImped3CFixes: ProcedureFixTemplate[] = [
  { id: 'IMPED', bearing: 113.5, distanceNm: 33.1, maximumAltitudeFt: 12000, maximumSpeedKt: 230 },
  { id: 'DB520', bearing: 109.4, distanceNm: 28.7, maximumAltitudeFt: 11000, maximumSpeedKt: 230 },
  { id: 'DB518', bearing: 102.4, distanceNm: 24, maximumAltitudeFt: 10000 },
  { id: 'VUTON', bearing: 94.7, distanceNm: 19.6, maximumAltitudeFt: 8000 },
  { id: 'DB515', bearing: 88.1, distanceNm: 17.5, maximumSpeedKt: 210 },
  { id: 'DB514', bearing: 74.9, distanceNm: 15.2, maximumAltitudeFt: 6000 },
  { id: 'DB513', bearing: 94.5, distanceNm: 13.6 },
  { id: 'GIRGO', bearing: 103.9, distanceNm: 16.4 },
  { id: 'RIDEV', bearing: 110.3, distanceNm: 21 },
  { id: 'DB508', bearing: 112, distanceNm: 23.4, maximumSpeedKt: 185 },
  { id: 'DB506', bearing: 121.5, distanceNm: 25.6 },
  { id: 'ULDOT', bearing: 121.5, distanceNm: 18.4 },
];

const dubaiPuval5CFixes: ProcedureFixTemplate[] = [
  { id: 'PUVAL', bearing: 42.4, distanceNm: 24.9, maximumAltitudeFt: 11000, maximumSpeedKt: 230 },
  { id: 'KEBOG', bearing: 16.5, distanceNm: 19.3 },
  { id: 'KUPOR', bearing: 10.9, distanceNm: 16.5, minimumAltitudeFt: 8000, maximumSpeedKt: 210 },
  { id: 'DB526', bearing: 32.7, distanceNm: 13.1 },
  { id: 'DB530', bearing: 80.2, distanceNm: 11.8, maximumAltitudeFt: 7000 },
  { id: 'DB513', bearing: 94.5, distanceNm: 13.6 },
  { id: 'GIRGO', bearing: 103.9, distanceNm: 16.4 },
  { id: 'RIDEV', bearing: 110.3, distanceNm: 21 },
  { id: 'DB508', bearing: 112, distanceNm: 23.4, maximumSpeedKt: 185 },
  { id: 'DB506', bearing: 121.5, distanceNm: 25.6 },
  { id: 'ULDOT', bearing: 121.5, distanceNm: 18.4 },
];

const dubai: PublishedProcedurePack = {
  airportId: 'dxb',
  packVersion: '2026.08.6',
  referenceCycle: 'UAE GCAA AIRAC AIP AMDT 09/2026 · published 2026-07-23 · effective 2026-09-03',
  effectiveFrom: '2026-09-03',
  generatedFrom: 'UAE GCAA eAIP · RNAV 1 STAR FMS coding tables and ENR 4.4 WGS-84 waypoint data',
  procedures: [
    {
      id: 'IMPED3E',
      kind: 'arrival',
      compatibleRunwayIds: ['12L', '12R'],
      entryTransition: 'IMPED',
      fixes: dubaiImped3EFixes,
    },
    {
      id: 'PUVAL2E',
      kind: 'arrival',
      compatibleRunwayIds: ['12L', '12R'],
      entryTransition: 'PUVAL',
      fixes: dubaiPuval2EFixes,
    },
    {
      id: 'IMPED3C',
      kind: 'arrival',
      compatibleRunwayIds: ['30L', '30R'],
      entryTransition: 'IMPED',
      fixes: dubaiImped3CFixes,
    },
    {
      id: 'PUVAL5C',
      kind: 'arrival',
      compatibleRunwayIds: ['30L', '30R'],
      entryTransition: 'PUVAL',
      fixes: dubaiPuval5CFixes,
    },
  ],
  sources: [
    {
      publisher: 'UAE General Civil Aviation Authority',
      title: 'UAE AIRAC AIP AMDT 09/2026 package cover',
      url: 'https://www.gcaa.gov.ae/en/ais/AIPHtmlFiles/AIP/Current/AIRACs/2026-P08/html/cover-en-GB.html',
      purpose: 'Official publication identity and publication date',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'UAE General Civil Aviation Authority',
      title: 'GEN 0.2 record of AIP amendments',
      url: 'https://www.gcaa.gov.ae/en/ais/AIPHtmlFiles/AIP/Current/AIRACs/2026-P08/html/eAIP/GEN-0.2-en-GB.html',
      purpose: 'Official amendment effective date',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'UAE General Civil Aviation Authority',
      title: 'OMDB AD 2 aerodrome data and STAR FMS coding tables',
      url: 'https://www.gcaa.gov.ae/en/ais/AIPHtmlFiles/AIP/Current/AIRACs/2026-P08/html/eAIP/AD-2.OMDB-en-GB.html',
      purpose: 'Airport reference point, runway compatibility, route order and altitude/speed restrictions',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'UAE General Civil Aviation Authority',
      title: 'ENR 4.4 name-code designators for significant points',
      url: 'https://www.gcaa.gov.ae/en/ais/AIPHtmlFiles/AIP/Current/AIRACs/2026-P08/html/eAIP/ENR-4.4-en-GB.html',
      purpose: 'Official WGS-84 coordinates for represented STAR fixes',
      accessedOn: ACCESSED_ON,
    },
  ],
  gameOnlyNotice: 'Published STAR identifiers, sampled waypoint order and represented restrictions are retained; the pre-published 03 September 2026 geometry is projected into a compact tactical sector and is not for navigation.',
};

/*
 * France SIA publishes the LFPG STAR coding tables, chart families and WGS-84
 * significant-point catalogue independently. Bearings below are calculated
 * from the LFPG ARP (490035N 0023252E). A single global projection (8 NM +
 * 25% of chart distance, capped at 40 NM) retains the four sector feeds while
 * fitting TINIL's 130+ NM transition on the tactical scope. The selected
 * procedures are standard, time-independent feeds with disjoint waypoint sets,
 * so their east/west crossing constraints remain route-specific at runtime.
 */
const parisMatix9EFixes: ProcedureFixTemplate[] = [
  { id: 'MATIX', bearing: 38.6, distanceNm: 29.1, maximumSpeedKt: 300 },
  { id: 'VAKOS', bearing: 58.9, distanceNm: 24.6 },
  { id: 'ENORI', bearing: 59.5, distanceNm: 21.9 },
  { id: 'DEVIM', bearing: 57.7, distanceNm: 20.5, maximumAltitudeFt: 16000 },
  { id: 'LORNI', bearing: 54.9, distanceNm: 18.8, minimumAltitudeFt: 11000, maximumAltitudeFt: 15000, maximumSpeedKt: 300 },
];

const parisLukip9EFixes: ProcedureFixTemplate[] = [
  { id: 'LUKIP', bearing: 283.6, distanceNm: 28.6, maximumAltitudeFt: 24000, maximumSpeedKt: 280 },
  { id: 'KOLIV', bearing: 294.8, distanceNm: 18.5, minimumAltitudeFt: 10000, maximumAltitudeFt: 11000, maximumSpeedKt: 250 },
  { id: 'MOPAR', bearing: 298.9, distanceNm: 16.9, minimumAltitudeFt: 8000, maximumAltitudeFt: 10000, maximumSpeedKt: 250 },
];

const parisTinil9WFixes: ProcedureFixTemplate[] = [
  { id: 'TINIL', bearing: 129, distanceNm: 40 },
  { id: 'FF302', bearing: 128.1, distanceNm: 38.4, maximumAltitudeFt: 28000, maximumSpeedKt: 280 },
  { id: 'NANOP', bearing: 123.1, distanceNm: 28.2 },
  { id: 'FF301', bearing: 122.6, distanceNm: 26.2, maximumAltitudeFt: 16000, maximumSpeedKt: 250 },
  { id: 'URELO', bearing: 120.7, distanceNm: 21.7, maximumAltitudeFt: 12000 },
  { id: 'OKIPA', bearing: 120.4, distanceNm: 19.7, minimumAltitudeFt: 7000, maximumAltitudeFt: 11000 },
];

const parisRomgo9PFixes: ProcedureFixTemplate[] = [
  { id: 'ROMGO', bearing: 240.1, distanceNm: 27.6, maximumSpeedKt: 300 },
  { id: 'FF501', bearing: 239.7, distanceNm: 25.5, minimumAltitudeFt: 19000, maximumAltitudeFt: 19000 },
  { id: 'NERKI', bearing: 238.8, distanceNm: 22.2, minimumAltitudeFt: 14000, maximumAltitudeFt: 14000 },
  { id: 'BANOX', bearing: 238, distanceNm: 20.2, minimumAltitudeFt: 14000, maximumAltitudeFt: 14000, maximumSpeedKt: 300 },
];

const parisCharlesDeGaulle: PublishedProcedurePack = {
  airportId: 'cdg',
  packVersion: '2026.08.7',
  referenceCycle: 'France SIA eAIP 06 AUG 2026 · LFPG STAR AMDT 06/26',
  effectiveFrom: '2026-08-06',
  effectiveTo: '2026-09-02',
  generatedFrom: 'France SIA eAIP · RNAV STAR coding tables, charts and ENR 4.4 WGS-84 waypoint data',
  procedures: [
    {
      id: 'MATIX9E',
      kind: 'arrival',
      compatibleRunwayIds: ['08L', '08R', '09L', '09R'],
      entryTransition: 'MATIX',
      fixes: parisMatix9EFixes,
    },
    {
      id: 'LUKIP9E',
      kind: 'arrival',
      compatibleRunwayIds: ['08L', '08R', '09L', '09R'],
      entryTransition: 'LUKIP',
      fixes: parisLukip9EFixes,
    },
    {
      id: 'TINIL9W',
      kind: 'arrival',
      compatibleRunwayIds: ['26L', '26R', '27L', '27R'],
      entryTransition: 'TINIL',
      fixes: parisTinil9WFixes,
    },
    {
      id: 'ROMGO9P',
      kind: 'arrival',
      compatibleRunwayIds: ['26L', '26R', '27L', '27R'],
      entryTransition: 'ROMGO',
      fixes: parisRomgo9PFixes,
    },
  ],
  sources: [
    {
      publisher: 'Service de l’information aéronautique, France',
      title: 'LFPG AD 2 — Paris Charles de Gaulle, eAIP issue 06 AUG 2026',
      url: 'https://www.sia.aviation-civile.gouv.fr/media/dvd/eAIP_06_AUG_2026/FRANCE/AIRAC-2026-08-06/html/eAIP/FR-AD-2.LFPG-fr-FR.html',
      purpose: 'Current issue, airport reference point, runway identifiers, operating concept and official chart index',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Service de l’information aéronautique, France',
      title: 'LFPG RWY EAST RNAV STAR — MATIX/MOPIL/ENORI/VEDUS 9E/9H',
      url: 'https://www.sia.aviation-civile.gouv.fr/media/dvd/eAIP_06_AUG_2026/FRANCE/AIRAC-2026-08-06/html/eAIP/Cartes/LFPG/AD_2_LFPG_STAR_RWY_EAST_RNAV_MATIX_MOPIL_ENORI_VEDUS_9E_9H.pdf',
      purpose: 'MATIX 9E route family, east-runway configuration and chart restrictions',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Service de l’information aéronautique, France',
      title: 'LFPG RWY EAST RNAV STAR — BIBAX/LUKIP 9E/9D',
      url: 'https://www.sia.aviation-civile.gouv.fr/media/dvd/eAIP_06_AUG_2026/FRANCE/AIRAC-2026-08-06/html/eAIP/Cartes/LFPG/AD_2_LFPG_STAR_RWY_EAST_RNAV_BIBAX_LUKIP_9E_9D.pdf',
      purpose: 'LUKIP 9E route family, east-runway configuration and chart restrictions',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Service de l’information aéronautique, France',
      title: 'LFPG RWY WEST RNAV STAR — EPL/RLP/TINIL/DJL/PIBAT/MOU/TRO 9W/9P',
      url: 'https://www.sia.aviation-civile.gouv.fr/media/dvd/eAIP_06_AUG_2026/FRANCE/AIRAC-2026-08-06/html/eAIP/Cartes/LFPG/AD_2_LFPG_STAR_RWY_WEST_RNAV_EPL_RLP_TINIL_DJL_PIBAT_MOU_TRO_9W_9P.pdf',
      purpose: 'TINIL 9W route family, west-runway configuration and chart restrictions',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Service de l’information aéronautique, France',
      title: 'LFPG RWY WEST RNAV STAR — KEPER/KOVAK/SABLE/ROMGO 9W/9P',
      url: 'https://www.sia.aviation-civile.gouv.fr/media/dvd/eAIP_06_AUG_2026/FRANCE/AIRAC-2026-08-06/html/eAIP/Cartes/LFPG/AD_2_LFPG_STAR_RWY_WEST_RNAV_KEPER_KOVAK_SABLE_ROMGO_9W_9P.pdf',
      purpose: 'ROMGO 9P route family, west-runway configuration and chart restrictions',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Service de l’information aéronautique, France',
      title: 'ENR 4.4 name-code designators for significant points',
      url: 'https://www.sia.aviation-civile.gouv.fr/media/dvd/eAIP_06_AUG_2026/FRANCE/AIRAC-2026-08-06/pdf/FR-ENR-4.4-fr-FR.pdf',
      purpose: 'Official WGS-84 coordinates for represented LFPG STAR fixes',
      accessedOn: ACCESSED_ON,
    },
  ],
  gameOnlyNotice: 'Published STAR identifiers, complete represented waypoint order and crossing restrictions are retained; WGS-84 geometry is projected into a compact tactical sector and is not for navigation.',
};

/*
 * CAAS publishes complete formal/tabular RNAV-1 STAR descriptions beside the
 * current WSSS AD 2 record. Bearings are calculated from the official Changi
 * ARP (012133.16N 1035921.57E). The same 8 NM + 25% projection used for the
 * other long international feeds preserves the east/west/south entry sectors
 * without pretending that the compact game scope is navigation-grade.
 */
const singaporeArama1AFixes: ProcedureFixTemplate[] = [
  { id: 'ARAMA', bearing: 286.4, distanceNm: 21.6, maximumSpeedKt: 250 },
  { id: 'BOBAG', bearing: 237.1, distanceNm: 16.8, minimumAltitudeFt: 10000, maximumSpeedKt: 220 },
  { id: 'BOKIP', bearing: 222, distanceNm: 13.8, minimumAltitudeFt: 6000 },
  { id: 'SAMKO', bearing: 201.9, distanceNm: 12.3, minimumAltitudeFt: 4000, maximumSpeedKt: 190 },
];

const singaporeKarto2AFixes: ProcedureFixTemplate[] = [
  { id: 'TOMAN', bearing: 89.9, distanceNm: 35 },
  { id: 'KARTO', bearing: 96.1, distanceNm: 31.7 },
  { id: 'GUNUD', bearing: 99.2, distanceNm: 25, maximumSpeedKt: 250 },
  { id: 'KEXAS', bearing: 102.9, distanceNm: 20.6, maximumAltitudeFt: 16000, maximumSpeedKt: 220 },
  { id: 'VIMAL', bearing: 115.8, distanceNm: 14.8, minimumAltitudeFt: 10000 },
  { id: 'IGNON', bearing: 133.2, distanceNm: 12.7, minimumAltitudeFt: 7000 },
  { id: 'SANAT', bearing: 179.4, distanceNm: 11.4, minimumAltitudeFt: 4000, maximumSpeedKt: 190 },
];

const singaporeRepov2BFixes: ProcedureFixTemplate[] = [
  { id: 'REPOV', bearing: 176.8, distanceNm: 24.3, maximumAltitudeFt: 21000, maximumSpeedKt: 250 },
  { id: 'REMES', bearing: 182.7, distanceNm: 17.5, maximumSpeedKt: 220 },
  { id: 'BITAM', bearing: 147.2, distanceNm: 12, minimumAltitudeFt: 7000 },
  { id: 'DOVAN', bearing: 98.1, distanceNm: 11.4, minimumAltitudeFt: 4000 },
  { id: 'BIPOP', bearing: 48.1, distanceNm: 11.7, minimumAltitudeFt: 3000, maximumSpeedKt: 190 },
];

const singaporeTebun1BFixes: ProcedureFixTemplate[] = [
  { id: 'TEBUN', bearing: 261.3, distanceNm: 19, maximumSpeedKt: 250 },
  { id: 'VAMPO', bearing: 235.9, distanceNm: 18.3, minimumAltitudeFt: 10000, maximumSpeedKt: 220 },
  { id: 'IBASU', bearing: 226.7, distanceNm: 16.7 },
  { id: 'VEXEL', bearing: 216.2, distanceNm: 15 },
  { id: 'ABVIP', bearing: 202.4, distanceNm: 13.8 },
  { id: 'AGROT', bearing: 183.4, distanceNm: 13.1 },
  { id: 'BITAM', bearing: 147.2, distanceNm: 12, minimumAltitudeFt: 7000 },
  { id: 'DOVAN', bearing: 98.1, distanceNm: 11.4, minimumAltitudeFt: 4000 },
  { id: 'BIPOP', bearing: 48.1, distanceNm: 11.7, minimumAltitudeFt: 3000, maximumSpeedKt: 190 },
];

const singaporeChangi: PublishedProcedurePack = {
  airportId: 'sin',
  packVersion: '2026.08.8',
  referenceCycle: 'Singapore AIP AMDT 04/2026 · valid 09 JUL 2026',
  effectiveFrom: '2026-07-09',
  effectiveTo: '2026-09-02',
  generatedFrom: 'CAAS AIM-SG · WSSS AD 2 and formal/tabular RNAV-1 STAR descriptions',
  procedures: [
    {
      id: 'ARAMA1A',
      kind: 'arrival',
      compatibleRunwayIds: ['02L', '02C'],
      entryTransition: 'ARAMA',
      fixes: singaporeArama1AFixes,
    },
    {
      id: 'KARTO2A',
      kind: 'arrival',
      compatibleRunwayIds: ['02L', '02C'],
      entryTransition: 'TOMAN',
      fixes: singaporeKarto2AFixes,
    },
    {
      id: 'REPOV2B',
      kind: 'arrival',
      compatibleRunwayIds: ['20R', '20C'],
      entryTransition: 'REPOV',
      fixes: singaporeRepov2BFixes,
    },
    {
      id: 'TEBUN1B',
      kind: 'arrival',
      compatibleRunwayIds: ['20R', '20C'],
      entryTransition: 'TEBUN',
      fixes: singaporeTebun1BFixes,
    },
  ],
  sources: [
    {
      publisher: 'Civil Aviation Authority of Singapore',
      title: 'WSSS AD 2 — Singapore Changi Intl, valid 09 JUL 2026',
      url: 'https://aim-sg.caas.gov.sg/aim-content/uploads/aip/28-JUL-2026/AIP/2026-07-09-000000/html/eAIP/SG-AD-2-WSSS-en-GB.html',
      purpose: 'Current AIP identity, official ARP, runway inventory, RNAV-1 requirements and chart index',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Civil Aviation Authority of Singapore',
      title: 'WSSS ARAMA 1A RNAV (GNSS) STAR — RWY 02L/C/R',
      url: 'https://aim-sg.caas.gov.sg/aim-content/uploads/aip/28-JUL-2026/AIP/2026-07-09-000000/pdf/SG-AD-2-WSSS-AD-2-WSSS-STAR-1-to-1.1.pdf',
      purpose: 'ARAMA 1A waypoint order and represented crossing restrictions',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Civil Aviation Authority of Singapore',
      title: 'WSSS KARTO 2A RNAV (GNSS) STAR — RWY 02L/C/R',
      url: 'https://aim-sg.caas.gov.sg/aim-content/uploads/aip/28-JUL-2026/AIP/2026-07-09-000000/pdf/SG-AD-2-WSSS-AD-2-WSSS-STAR-7-to-7.1.pdf',
      purpose: 'KARTO 2A waypoint order and represented crossing restrictions',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Civil Aviation Authority of Singapore',
      title: 'WSSS REPOV 2B RNAV (GNSS) STAR — RWY 20R/C/L',
      url: 'https://aim-sg.caas.gov.sg/aim-content/uploads/aip/28-JUL-2026/AIP/2026-07-09-000000/pdf/SG-AD-2-WSSS-AD-2-WSSS-STAR-15-to-15.1.pdf',
      purpose: 'REPOV 2B waypoint order and represented crossing restrictions',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Civil Aviation Authority of Singapore',
      title: 'WSSS TEBUN 1B RNAV (GNSS) STAR — RWY 20R/C/L',
      url: 'https://aim-sg.caas.gov.sg/aim-content/uploads/aip/28-JUL-2026/AIP/2026-07-09-000000/pdf/SG-AD-2-WSSS-AD-2-WSSS-STAR-17-to-17.1.pdf',
      purpose: 'TEBUN 1B waypoint order and represented crossing restrictions',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Civil Aviation Authority of Singapore',
      title: 'AIC 02/2025 — Singapore AIRAC schedule for 2025/2026',
      url: 'https://aim-sg.caas.gov.sg/aim-content/uploads/aip/30-JUN-2026/AIP/2026-05-14-000000/html/eAIC/SG-eAIC-2025-02-en-GB.html',
      purpose: 'Official validity window and next AIP amendment date',
      accessedOn: ACCESSED_ON,
    },
  ],
  gameOnlyNotice: 'Published RNAV-1 STAR identifiers, complete represented waypoint order and coded restrictions are retained; WGS-84 geometry is projected into a compact tactical sector and is not for navigation.',
};

/*
 * LVNL publishes Schiphol's daytime RNAV-1 STARs as runway-independent feeds
 * to the ARTIP, SUGOL and RIVER IAFs. Bearings below are calculated from the
 * EHAM ARP (521829N 0044551E) using the official ENR 4.4 WGS-84 catalogue.
 * The common 8 NM + 25% projection preserves all four represented entry
 * sectors while fitting the roughly 85 NM REDFA feed on the tactical scope.
 */
const schipholRunwayIds = [
  '04', '22', '06', '24', '09', '27',
  '18C', '36C', '18L', '36R', '18R', '36L',
];

const schipholArtipRestriction: ProcedureFixTemplate = {
  id: 'ARTIP', bearing: 67.2, distanceNm: 16, minimumAltitudeFt: 7000, maximumAltitudeFt: 10000, maximumSpeedKt: 250,
};

const schipholSugolRestriction: ProcedureFixTemplate = {
  id: 'SUGOL', bearing: 294.4, distanceNm: 16, minimumAltitudeFt: 7000, maximumAltitudeFt: 10000, maximumSpeedKt: 250,
};

const schipholRiverRestriction: ProcedureFixTemplate = {
  id: 'RIVER', bearing: 224.7, distanceNm: 16.3, minimumAltitudeFt: 7000, maximumAltitudeFt: 10000, maximumSpeedKt: 250,
};

const schipholBlufa1AFixes: ProcedureFixTemplate[] = [
  { id: 'BLUFA', bearing: 60.4, distanceNm: 24.4 },
  { ...schipholArtipRestriction },
];

const schipholNorku2AFixes: ProcedureFixTemplate[] = [
  { id: 'NORKU', bearing: 93, distanceNm: 28.4, minimumAltitudeFt: 20000, maximumAltitudeFt: 28000 },
  { id: 'SONSA', bearing: 88.1, distanceNm: 26.2 },
  { id: 'ROBIS', bearing: 80.5, distanceNm: 23.8 },
  { id: 'OSKUR', bearing: 76.2, distanceNm: 19.9 },
  { ...schipholArtipRestriction },
];

const schipholRedfa1AFixes: ProcedureFixTemplate[] = [
  { id: 'REDFA', bearing: 263, distanceNm: 29.1, maximumAltitudeFt: 23000 },
  { id: 'SULUT', bearing: 280.2, distanceNm: 20.5 },
  { ...schipholSugolRestriction },
];

const schipholDenut3AFixes: ProcedureFixTemplate[] = [
  { id: 'DENUT', bearing: 213, distanceNm: 27.1, maximumAltitudeFt: 24000 },
  { id: 'YENZO', bearing: 230, distanceNm: 21.6 },
  { ...schipholRiverRestriction },
];

const amsterdamSchiphol: PublishedProcedurePack = {
  airportId: 'ams',
  packVersion: '2026.08.9',
  referenceCycle: 'Netherlands eAIP AIRAC AMDT 08/2026 · effective 2026-08-06',
  effectiveFrom: '2026-08-06',
  effectiveTo: '2026-09-02',
  generatedFrom: 'LVNL eAIP · EHAM standard STAR chart and ENR 4.4 WGS-84 waypoint data',
  procedures: [
    {
      id: 'BLUFA1A',
      kind: 'arrival',
      compatibleRunwayIds: [...schipholRunwayIds],
      entryTransition: 'BLUFA',
      fixes: schipholBlufa1AFixes,
    },
    {
      id: 'NORKU2A',
      kind: 'arrival',
      compatibleRunwayIds: [...schipholRunwayIds],
      entryTransition: 'NORKU',
      fixes: schipholNorku2AFixes,
    },
    {
      id: 'REDFA1A',
      kind: 'arrival',
      compatibleRunwayIds: [...schipholRunwayIds],
      entryTransition: 'REDFA',
      fixes: schipholRedfa1AFixes,
    },
    {
      id: 'DENUT3A',
      kind: 'arrival',
      compatibleRunwayIds: [...schipholRunwayIds],
      entryTransition: 'DENUT',
      fixes: schipholDenut3AFixes,
    },
  ],
  sources: [
    {
      publisher: 'Luchtverkeersleiding Nederland',
      title: 'eAIP Netherlands AIRAC AMDT 08/2026 — current issue',
      url: 'https://eaip.lvnl.nl/web/eaip/AIRAC%20AMDT%2008-2026_2026_08_06/index.html',
      purpose: 'Current issue identity, effective date and validity window',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Luchtverkeersleiding Nederland',
      title: 'EHAM AD 2 — Amsterdam/Schiphol',
      url: 'https://eaip.lvnl.nl/web/eaip/AIRAC%20AMDT%2008-2026_2026_08_06/eAIP/EH-AD%202%20EHAM%201-en-GB.html',
      purpose: 'Official airport reference point, runway inventory and arrival operating procedures',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Luchtverkeersleiding Nederland',
      title: 'EHAM standard arrival chart — instrument',
      url: 'https://eaip.lvnl.nl/web/eaip/AIRAC%20AMDT%2008-2026_2026_08_06/documents/Root_WePub/Charts/AD/EHAM/EHAM-STAR.pdf',
      purpose: 'BLUFA 1A, NORKU 2A, REDFA 1A and DENUT 3A route order, IAF assignment and chart restrictions',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Luchtverkeersleiding Nederland',
      title: 'ENR 4.4 — name-code designators for significant points',
      url: 'https://eaip.lvnl.nl/web/eaip/AIRAC%20AMDT%2007-2026_2026_07_09/eAIP/EH-ENR%204.4-en-GB.html',
      purpose: 'Official WGS-84 coordinates for every represented EHAM STAR fix',
      accessedOn: ACCESSED_ON,
    },
  ],
  gameOnlyNotice: 'Published RNAV-1 STAR identifiers, complete represented waypoint order and chart restrictions are retained; WGS-84 geometry is projected into a compact tactical sector and is not for navigation.',
};

/*
 * ENAIRE publishes Madrid's RNAV-1 STARs in separate west/east chart families
 * for the south (RWY 18L/R) and north (RWY 32L/R) configurations. Bearings
 * below are calculated from the current LEMD ARP (402820N 0033339W). The
 * common 8 NM + 25% projection preserves the chart geometry while fitting the
 * roughly 103 NM RIDAV feed into the tactical scope. One west and one east
 * route are retained for each landing configuration so random traffic has
 * distinct, runway-compatible entry sectors.
 */
const madridRidav3AFixes: ProcedureFixTemplate[] = [
  { id: 'RIDAV', bearing: 272.8, distanceNm: 33.7, minimumAltitudeFt: 24500 },
  { id: 'MD400', bearing: 292.9, distanceNm: 29.2, minimumAltitudeFt: 24000 },
  { id: 'USATI', bearing: 301.9, distanceNm: 22, minimumAltitudeFt: 20000, maximumSpeedKt: 250 },
  { id: 'SECQO', bearing: 296.6, distanceNm: 16.9, minimumAltitudeFt: 12000, maximumSpeedKt: 220 },
  { id: 'RILKO', bearing: 340.6, distanceNm: 16.1, minimumAltitudeFt: 11000, maximumSpeedKt: 220 },
];

const madridAduxo7BFixes: ProcedureFixTemplate[] = [
  { id: 'ADUXO', bearing: 87.5, distanceNm: 25.1, minimumAltitudeFt: 15000 },
  { id: 'MD505', bearing: 91.5, distanceNm: 22.3, minimumAltitudeFt: 15000, maximumSpeedKt: 250 },
  { id: 'NOSKO', bearing: 71.7, distanceNm: 16.9, minimumAltitudeFt: 10000, maximumSpeedKt: 220 },
  { id: 'RBO', bearing: 31.9, distanceNm: 14.8, maximumAltitudeFt: 9000, maximumSpeedKt: 220 },
  { id: 'LULER', bearing: 17.3, distanceNm: 14.9, minimumAltitudeFt: 8000, maximumSpeedKt: 220 },
];

const madridRidav5CFixes: ProcedureFixTemplate[] = [
  { id: 'RIDAV', bearing: 272.8, distanceNm: 33.7 },
  { id: 'MD455', bearing: 254.7, distanceNm: 23.8, minimumAltitudeFt: 24000 },
  { id: 'TLD', bearing: 229.9, distanceNm: 19.7, minimumAltitudeFt: 15000, maximumAltitudeFt: 21000 },
  { id: 'MD445', bearing: 214.1, distanceNm: 19.5 },
  { id: 'BUREX', bearing: 203.8, distanceNm: 18.8, minimumAltitudeFt: 12000, maximumAltitudeFt: 14000, maximumSpeedKt: 290 },
  { id: 'MD440', bearing: 197.9, distanceNm: 16.7, minimumAltitudeFt: 8000 },
  { id: 'YUNYE', bearing: 186.9, distanceNm: 14.5, minimumAltitudeFt: 7000 },
  { id: 'MD420', bearing: 177.3, distanceNm: 13.4, minimumAltitudeFt: 6000 },
  { id: 'FAFEQ', bearing: 165.8, distanceNm: 12.7, minimumAltitudeFt: 5000, maximumAltitudeFt: 6000, maximumSpeedKt: 220 },
];

const madridAduxo3DFixes: ProcedureFixTemplate[] = [
  { id: 'ADUXO', bearing: 87.5, distanceNm: 25.1, maximumAltitudeFt: 21000 },
  { id: 'MD001', bearing: 94.5, distanceNm: 22.2, minimumAltitudeFt: 15000 },
  { id: 'SIRGU', bearing: 105.8, distanceNm: 19.4, minimumAltitudeFt: 10000, maximumAltitudeFt: 14000 },
  { id: 'RUDBI', bearing: 123.3, distanceNm: 13.8, minimumAltitudeFt: 8000, maximumSpeedKt: 220 },
];

const madridBarajas: PublishedProcedurePack = {
  airportId: 'mad',
  packVersion: '2026.08.10',
  referenceCycle: 'ENAIRE AIP España 06 AUG 2026 · AIRAC AMDT 07/26',
  effectiveFrom: '2026-08-06',
  effectiveTo: '2026-09-02',
  generatedFrom: 'ENAIRE AIP España · LEMD AD 2 and RNAV-1 STAR chart coding tables',
  procedures: [
    {
      id: 'RIDAV3A',
      kind: 'arrival',
      compatibleRunwayIds: ['18L', '18R'],
      entryTransition: 'RIDAV',
      fixes: madridRidav3AFixes,
    },
    {
      id: 'ADUXO7B',
      kind: 'arrival',
      compatibleRunwayIds: ['18L', '18R'],
      entryTransition: 'ADUXO',
      fixes: madridAduxo7BFixes,
    },
    {
      id: 'RIDAV5C',
      kind: 'arrival',
      compatibleRunwayIds: ['32L', '32R'],
      entryTransition: 'RIDAV',
      fixes: madridRidav5CFixes,
    },
    {
      id: 'ADUXO3D',
      kind: 'arrival',
      compatibleRunwayIds: ['32L', '32R'],
      entryTransition: 'ADUXO',
      fixes: madridAduxo3DFixes,
    },
  ],
  sources: [
    {
      publisher: 'ENAIRE AIS España',
      title: 'AIP Spain — current issue 06 AUG 2026',
      url: 'https://aip.enaire.es/aip/aip-en.html',
      purpose: 'Current issue identity, amendment status and official LEMD chart index',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'ENAIRE AIS España',
      title: 'LEMD AD 2 — Madrid/Adolfo Suárez Madrid-Barajas',
      url: 'https://aip.enaire.es/aip/contenido_AIP/AD/AD2/LEMD/LE_AD_2_LEMD_en.html',
      purpose: 'Current airport reference point, elevation, runway inventory and operating information',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'ENAIRE AIS España',
      title: 'LEMD STAR 1 — RNAV-1 RWY 18L/18R west arrivals',
      url: 'https://aip.enaire.es/aip/contenido_AIP/AD/AD2/LEMD/LE_AD_2_LEMD_STAR_1_en.pdf',
      purpose: 'RIDAV 3A route order, WGS-84 waypoint coordinates and coded restrictions',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'ENAIRE AIS España',
      title: 'LEMD STAR 2 — RNAV-1 RWY 18L/18R east arrivals',
      url: 'https://aip.enaire.es/aip/contenido_AIP/AD/AD2/LEMD/LE_AD_2_LEMD_STAR_2_en.pdf',
      purpose: 'ADUXO 7B route order, WGS-84 waypoint coordinates and coded restrictions',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'ENAIRE AIS España',
      title: 'LEMD STAR 3 — RNAV-1 RWY 32L/32R west arrivals',
      url: 'https://aip.enaire.es/aip/contenido_AIP/AD/AD2/LEMD/LE_AD_2_LEMD_STAR_3_en.pdf',
      purpose: 'RIDAV 5C route order, WGS-84 waypoint coordinates and coded restrictions',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'ENAIRE AIS España',
      title: 'LEMD STAR 4 — RNAV-1 RWY 32L/32R east arrivals',
      url: 'https://aip.enaire.es/aip/contenido_AIP/AD/AD2/LEMD/LE_AD_2_LEMD_STAR_4_en.pdf',
      purpose: 'ADUXO 3D route order, WGS-84 waypoint coordinates and coded restrictions',
      accessedOn: ACCESSED_ON,
    },
  ],
  gameOnlyNotice: 'Published RNAV-1 STAR identifiers, complete represented waypoint order and coded restrictions are retained; WGS-84 geometry is projected into a compact tactical sector and is not for navigation.',
};

/*
 * CAAM's permanent WMKK point-merge operation assigns KAKAK/PULIP/SAROX
 * traffic to PMS East (STAR 1G) for RWY 14L/14R/32L/32R and
 * NIREN/PUGER/SALAX/GUPTA traffic to PMS West (STAR 1H) for RWY 15/33.
 * Bearings below are calculated from the published WMKK ARP (024436N
 * 1014153E). The common 8 NM + 25% projection preserves both merge arcs and
 * the relative entry geometry while keeping the 80+ NM feeds readable on a
 * phone-sized tactical scope. Current CAAM charts remain the source of record;
 * the open Endless ATC Lumpur sector is retained only as an independent
 * coordinate/transcription cross-check.
 */
const kualaLumpurKakak1GFixes: ProcedureFixTemplate[] = [
  { id: 'KAKAK', bearing: 335.5, distanceNm: 24.9 },
  { id: 'LIBKI', bearing: 6.8, distanceNm: 16 },
  { id: 'RITLO', bearing: 29.6, distanceNm: 14.8, minimumAltitudeFt: 19000, maximumSpeedKt: 250 },
  { id: 'KK811', bearing: 38.4, distanceNm: 15.1 },
  { id: 'KK812', bearing: 47.1, distanceNm: 15.3 },
  { id: 'KK813', bearing: 55.8, distanceNm: 15.3 },
  { id: 'KK814', bearing: 64.6, distanceNm: 15.3 },
  { id: 'KK815', bearing: 73.3, distanceNm: 15.1 },
  { id: 'KK816', bearing: 82.2, distanceNm: 14.8, maximumSpeedKt: 250 },
  { id: 'EGURI', bearing: 55.8, distanceNm: 11.1, minimumAltitudeFt: 15000, maximumSpeedKt: 230 },
];

const kualaLumpurSarox1GFixes: ProcedureFixTemplate[] = [
  { id: 'SAROX', bearing: 86.6, distanceNm: 22.6, minimumAltitudeFt: 23000 },
  { id: 'VEKTO', bearing: 94.4, distanceNm: 16.4, minimumAltitudeFt: 17000 },
  { id: 'NUKPA', bearing: 82.9, distanceNm: 15, minimumAltitudeFt: 17000, maximumSpeedKt: 250 },
  { id: 'KK804', bearing: 73.8, distanceNm: 15.3 },
  { id: 'KK805', bearing: 64.8, distanceNm: 15.5 },
  { id: 'KK806', bearing: 55.8, distanceNm: 15.6 },
  { id: 'KK807', bearing: 46.9, distanceNm: 15.5 },
  { id: 'KK808', bearing: 38, distanceNm: 15.4 },
  { id: 'KK809', bearing: 29, distanceNm: 15.1, maximumSpeedKt: 250 },
  { id: 'EGURI', bearing: 55.8, distanceNm: 11.1, minimumAltitudeFt: 15000, maximumSpeedKt: 230 },
];

const kualaLumpurNiren1HFixes: ProcedureFixTemplate[] = [
  { id: 'NIREN', bearing: 303.5, distanceNm: 28.6 },
  { id: 'AKESO', bearing: 289.9, distanceNm: 24 },
  { id: 'KK871', bearing: 284.8, distanceNm: 20.4 },
  { id: 'KADKU', bearing: 277.6, distanceNm: 14.9, maximumSpeedKt: 230 },
  { id: 'PAPGO', bearing: 268.3, distanceNm: 13.7, minimumAltitudeFt: 14000, maximumSpeedKt: 230 },
  { id: 'KK872', bearing: 257.4, distanceNm: 14.1 },
  { id: 'KK873', bearing: 246.6, distanceNm: 14.4 },
  { id: 'KK874', bearing: 235.8, distanceNm: 14.6 },
  { id: 'KK875', bearing: 225.1, distanceNm: 14.5 },
  { id: 'KK876', bearing: 214.4, distanceNm: 14.2 },
  { id: 'KK877', bearing: 203.6, distanceNm: 13.7, maximumSpeedKt: 230 },
  { id: 'MESUP', bearing: 235.8, distanceNm: 11.1, minimumAltitudeFt: 8000, maximumSpeedKt: 230 },
];

const kualaLumpurGupta1HFixes: ProcedureFixTemplate[] = [
  { id: 'GUPTA', bearing: 121.6, distanceNm: 24.6 },
  { id: 'PANKA', bearing: 186.5, distanceNm: 15, minimumAltitudeFt: 11000, maximumSpeedKt: 230 },
  { id: 'LULKI', bearing: 202.5, distanceNm: 13.9, minimumAltitudeFt: 11000, maximumSpeedKt: 230 },
  { id: 'KK881', bearing: 213.7, distanceNm: 14.4 },
  { id: 'KK882', bearing: 224.8, distanceNm: 14.7 },
  { id: 'KK883', bearing: 235.8, distanceNm: 14.8 },
  { id: 'KK884', bearing: 246.9, distanceNm: 14.7 },
  { id: 'KK885', bearing: 258.1, distanceNm: 14.4 },
  { id: 'KK886', bearing: 269.4, distanceNm: 13.9, maximumSpeedKt: 230 },
  { id: 'MESUP', bearing: 235.8, distanceNm: 11.1, minimumAltitudeFt: 8000, maximumSpeedKt: 230 },
];

const kualaLumpurInternational: PublishedProcedurePack = {
  airportId: 'kul',
  packVersion: '2026.08.11',
  referenceCycle: 'CAAM eAIP Malaysia 11 AUG 2026 · WMKK PMS STAR charts / SUP 50/25',
  effectiveFrom: '2026-08-11',
  generatedFrom: 'CAAM eAIP Malaysia · WMKK AD 2, PMS STAR charts and permanent three-runway operating supplement',
  procedures: [
    {
      id: 'KAKAK1G',
      kind: 'arrival',
      compatibleRunwayIds: ['14L', '14R', '32L', '32R'],
      entryTransition: 'KAKAK',
      fixes: kualaLumpurKakak1GFixes,
    },
    {
      id: 'SAROX1G',
      kind: 'arrival',
      compatibleRunwayIds: ['14L', '14R', '32L', '32R'],
      entryTransition: 'SAROX',
      fixes: kualaLumpurSarox1GFixes,
    },
    {
      id: 'NIREN1H',
      kind: 'arrival',
      compatibleRunwayIds: ['15', '33'],
      entryTransition: 'NIREN',
      fixes: kualaLumpurNiren1HFixes,
    },
    {
      id: 'GUPTA1H',
      kind: 'arrival',
      compatibleRunwayIds: ['15', '33'],
      entryTransition: 'GUPTA',
      fixes: kualaLumpurGupta1HFixes,
    },
  ],
  sources: [
    {
      publisher: 'Civil Aviation Authority of Malaysia',
      title: 'WMKK AD 2 — Kuala Lumpur International',
      url: 'https://aip.caam.gov.my/aip/eAIP/2026-08-11/html/eAIP/WM-AD-2.WMKK-en-MS.html',
      purpose: 'Current airport reference point, runway inventory, chart index and point-merge operating description',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Civil Aviation Authority of Malaysia',
      title: 'WMKK permanent three-runway and point-merge implementation — SUP 50/25',
      url: 'https://aip.caam.gov.my/aip/eAIP/2025-10-02-AIRAC/html/eSUP/WM-eSUP-25-50-en-MS.html',
      purpose: 'Operational assignment of STAR 1G to RWY 14L/14R/32L/32R and STAR 1H to RWY 15/33',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Civil Aviation Authority of Malaysia',
      title: 'WMKK AD 2-WMKK-7-1 — PMS East STAR chart',
      url: 'https://aip.caam.gov.my/aip/eAIP/2026-08-11/graphics/305936.pdf',
      purpose: 'Current PMS East route geometry and procedure identity',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Civil Aviation Authority of Malaysia',
      title: 'WMKK AD 2-WMKK-7-2 — PMS East tabular description 1',
      url: 'https://aip.caam.gov.my/aip/eAIP/2026-08-11/graphics/208302.pdf',
      purpose: 'PMS East waypoint order, WGS-84 positions and represented restrictions',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Civil Aviation Authority of Malaysia',
      title: 'WMKK AD 2-WMKK-7-3 — PMS East tabular description 2',
      url: 'https://aip.caam.gov.my/aip/eAIP/2026-08-11/graphics/208304.pdf',
      purpose: 'KAKAK 1G and SAROX 1G route-table continuation',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Civil Aviation Authority of Malaysia',
      title: 'WMKK AD 2-WMKK-7-7 — PMS West STAR chart',
      url: 'https://aip.caam.gov.my/aip/eAIP/2026-08-11/graphics/306651.pdf',
      purpose: 'Current PMS West route geometry and procedure identity',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Civil Aviation Authority of Malaysia',
      title: 'WMKK AD 2-WMKK-7-9 — PMS West tabular description 2',
      url: 'https://aip.caam.gov.my/aip/eAIP/2026-08-11/graphics/208309.pdf',
      purpose: 'NIREN 1H waypoint order, WGS-84 positions and represented restrictions',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Civil Aviation Authority of Malaysia',
      title: 'WMKK AD 2-WMKK-7-10 — PMS West tabular description 3',
      url: 'https://aip.caam.gov.my/aip/eAIP/2026-08-11/graphics/208310.pdf',
      purpose: 'GUPTA 1H waypoint order, WGS-84 positions and represented restrictions',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'BestBearrr / Endless ATC community',
      title: 'Lumpur TMA v1.1 sector transcription',
      url: 'https://github.com/BestBearrr/Airport-Sectors-for-Endless-ATC/blob/85d99c5e6816a494e715bd215cb711047476a6a5/WMKK/WMKK.txt',
      purpose: 'Independent route-coordinate transcription cross-check only; CAAM remains the source of record',
      accessedOn: ACCESSED_ON,
    },
  ],
  gameOnlyNotice: 'Published RNAV STAR identities, point-merge arc order and represented restrictions are retained; WGS-84 geometry is projected into a compact tactical sector and is not for navigation.',
};

/*
 * CAAT publishes one common RNAV 1 arrival family for each VTBS runway
 * direction. The route tables below retain all ten current common STARs and
 * their coded crossing restrictions. Bearings are calculated from the
 * published VTBS ARP (134109N 1004456E). An 8 NM + 35% projection preserves
 * the long feeder geometry and both radar-vectoring tails inside the compact
 * tactical scope; transition legs before the named STAR entry are omitted.
 */
const bangkokEaste1DFixes: ProcedureFixTemplate[] = [
  { id: 'EASTE', bearing: 39.8, distanceNm: 25.1, maximumAltitudeFt: 18000, maximumSpeedKt: 280 },
  { id: 'BS417', bearing: 40.1, distanceNm: 20.1 },
  { id: 'BS416', bearing: 40.6, distanceNm: 16.1, maximumAltitudeFt: 13000, maximumSpeedKt: 250 },
  { id: 'MUMUP', bearing: 42, distanceNm: 12.2 },
  { id: 'BS415', bearing: 60.7, distanceNm: 10.7, minimumAltitudeFt: 11000 },
  { id: 'BS411', bearing: 105, distanceNm: 9.9, maximumSpeedKt: 220 },
  { id: 'BS410', bearing: 170.7, distanceNm: 12.7 },
  { id: 'ENKAA', bearing: 177.2, distanceNm: 14.3, minimumAltitudeFt: 3000 },
];

const bangkokLebim1DFixes: ProcedureFixTemplate[] = [
  { id: 'LEBIM', bearing: 204.2, distanceNm: 21.8, maximumAltitudeFt: 18000, maximumSpeedKt: 280 },
  { id: 'MENUT', bearing: 192.6, distanceNm: 18.1, maximumAltitudeFt: 14000 },
  { id: 'ISRAM', bearing: 151.8, distanceNm: 14.4, maximumSpeedKt: 250 },
  { id: 'BS412', bearing: 105.1, distanceNm: 12.4, minimumAltitudeFt: 11000 },
  { id: 'BS411', bearing: 105, distanceNm: 9.9, maximumSpeedKt: 220 },
  { id: 'BS410', bearing: 170.7, distanceNm: 12.7 },
  { id: 'ENKAA', bearing: 177.2, distanceNm: 14.3, minimumAltitudeFt: 3000 },
];

const bangkokNorta1DFixes: ProcedureFixTemplate[] = [
  { id: 'NORTA', bearing: 354.1, distanceNm: 29.8, maximumAltitudeFt: 22000, maximumSpeedKt: 280 },
  { id: 'IRTIS', bearing: 358.3, distanceNm: 23.8 },
  { id: 'LAVAT', bearing: 359.9, distanceNm: 19.5, minimumAltitudeFt: 16000 },
  { id: 'BS421', bearing: 1.5, distanceNm: 17.1, maximumSpeedKt: 250 },
  { id: 'BS420', bearing: 350.9, distanceNm: 13.1, minimumAltitudeFt: 11000 },
  {
    id: 'BS419', bearing: 285.1, distanceNm: 10,
    minimumAltitudeFt: 7000, maximumAltitudeFt: 9000, maximumSpeedKt: 220,
  },
  { id: 'BS418', bearing: 219.9, distanceNm: 12.7 },
  { id: 'BOGAS', bearing: 213.1, distanceNm: 14.4, minimumAltitudeFt: 4000 },
];

const bangkokTumga1DFixes: ProcedureFixTemplate[] = [
  { id: 'TUMGA', bearing: 127, distanceNm: 19.6, maximumAltitudeFt: 18000, maximumSpeedKt: 280 },
  { id: 'BS414', bearing: 105.1, distanceNm: 17.3, maximumSpeedKt: 250 },
  { id: 'BS413', bearing: 105.1, distanceNm: 13.8 },
  { id: 'BS412', bearing: 105.1, distanceNm: 12.4, minimumAltitudeFt: 11000 },
  { id: 'BS411', bearing: 105, distanceNm: 9.9, maximumSpeedKt: 220 },
  { id: 'BS410', bearing: 170.7, distanceNm: 12.7 },
  { id: 'ENKAA', bearing: 177.2, distanceNm: 14.3, minimumAltitudeFt: 3000 },
];

const bangkokWilla1DFixes: ProcedureFixTemplate[] = [
  { id: 'WILLA', bearing: 317.2, distanceNm: 28.6, maximumAltitudeFt: 22000, maximumSpeedKt: 280 },
  { id: 'NIMEG', bearing: 324.3, distanceNm: 25.4 },
  { id: 'ISDEX', bearing: 341.4, distanceNm: 21.3 },
  { id: 'LAVAT', bearing: 359.9, distanceNm: 19.5, minimumAltitudeFt: 16000 },
  { id: 'BS421', bearing: 1.5, distanceNm: 17.1, maximumSpeedKt: 250 },
  { id: 'BS420', bearing: 350.9, distanceNm: 13.1, minimumAltitudeFt: 11000 },
  {
    id: 'BS419', bearing: 285.1, distanceNm: 10,
    minimumAltitudeFt: 7000, maximumAltitudeFt: 9000, maximumSpeedKt: 220,
  },
  { id: 'BS418', bearing: 219.9, distanceNm: 12.7 },
  { id: 'BOGAS', bearing: 213.1, distanceNm: 14.4, minimumAltitudeFt: 4000 },
];

const bangkokEaste1CFixes: ProcedureFixTemplate[] = [
  { id: 'EASTE', bearing: 39.8, distanceNm: 25.1, maximumAltitudeFt: 18000, maximumSpeedKt: 280 },
  {
    id: 'SOVKI', bearing: 40.1, distanceNm: 18.2,
    minimumAltitudeFt: 11000, maximumAltitudeFt: 14000, maximumSpeedKt: 250,
  },
  { id: 'TERIB', bearing: 45.9, distanceNm: 16.5 },
  { id: 'BS507', bearing: 53.5, distanceNm: 15 },
  { id: 'BS505', bearing: 64.4, distanceNm: 13.7 },
  { id: 'MUMUP', bearing: 42, distanceNm: 12.2, maximumSpeedKt: 220 },
  { id: 'BS501', bearing: 34.2, distanceNm: 13.8 },
  { id: 'ESGEN', bearing: 29.7, distanceNm: 15.5, minimumAltitudeFt: 5000 },
];

const bangkokLebim1CFixes: ProcedureFixTemplate[] = [
  { id: 'LEBIM', bearing: 204.2, distanceNm: 21.8, maximumAltitudeFt: 18000, maximumSpeedKt: 280 },
  { id: 'SAGAP', bearing: 198.7, distanceNm: 17.3, maximumAltitudeFt: 14000 },
  { id: 'BS521', bearing: 187, distanceNm: 13.6, minimumAltitudeFt: 11000 },
  { id: 'DUDER', bearing: 156.4, distanceNm: 11.1, maximumSpeedKt: 250 },
  { id: 'BS520', bearing: 127.8, distanceNm: 10.1, minimumAltitudeFt: 9000, maximumAltitudeFt: 11000 },
  { id: 'MUMUP', bearing: 42, distanceNm: 12.2, maximumSpeedKt: 220 },
  { id: 'BS501', bearing: 34.2, distanceNm: 13.8 },
  { id: 'ESGEN', bearing: 29.7, distanceNm: 15.5, minimumAltitudeFt: 5000 },
];

const bangkokNorta1CFixes: ProcedureFixTemplate[] = [
  { id: 'NORTA', bearing: 354.1, distanceNm: 29.8, maximumAltitudeFt: 18000, maximumSpeedKt: 280 },
  { id: 'BS519', bearing: 355.9, distanceNm: 26.8, minimumAltitudeFt: 16000 },
  { id: 'BS518', bearing: 358.1, distanceNm: 24, maximumSpeedKt: 250 },
  { id: 'MEPIN', bearing: 352.4, distanceNm: 20, minimumAltitudeFt: 11000 },
  { id: 'BS515', bearing: 335.4, distanceNm: 15.1, minimumAltitudeFt: 9000, maximumSpeedKt: 220 },
  { id: 'BS514', bearing: 354.1, distanceNm: 13.9 },
  { id: 'ATKIN', bearing: 358.7, distanceNm: 15.5, minimumAltitudeFt: 6000 },
];

const bangkokTumga1CFixes: ProcedureFixTemplate[] = [
  { id: 'TUMGA', bearing: 127, distanceNm: 19.6, maximumAltitudeFt: 18000, maximumSpeedKt: 280 },
  { id: 'ISRAM', bearing: 151.8, distanceNm: 14.4, minimumAltitudeFt: 11000 },
  { id: 'DUDER', bearing: 156.4, distanceNm: 11.1, maximumSpeedKt: 250 },
  { id: 'BS520', bearing: 127.8, distanceNm: 10.1, minimumAltitudeFt: 9000, maximumAltitudeFt: 11000 },
  { id: 'MUMUP', bearing: 42, distanceNm: 12.2, maximumSpeedKt: 220 },
  { id: 'BS501', bearing: 34.2, distanceNm: 13.8 },
  { id: 'ESGEN', bearing: 29.7, distanceNm: 15.5, minimumAltitudeFt: 5000 },
];

const bangkokWilla1CFixes: ProcedureFixTemplate[] = [
  { id: 'WILLA', bearing: 317.2, distanceNm: 28.6, maximumAltitudeFt: 18000, maximumSpeedKt: 280 },
  { id: 'BAROK', bearing: 321.8, distanceNm: 26.4 },
  { id: 'BS517', bearing: 328.6, distanceNm: 24, minimumAltitudeFt: 14000, maximumAltitudeFt: 15000 },
  { id: 'BS516', bearing: 336.4, distanceNm: 22.1, maximumSpeedKt: 250 },
  { id: 'MEPIN', bearing: 352.4, distanceNm: 20, minimumAltitudeFt: 11000 },
  { id: 'BS515', bearing: 335.4, distanceNm: 15.1, minimumAltitudeFt: 9000, maximumSpeedKt: 220 },
  { id: 'BS514', bearing: 354.1, distanceNm: 13.9 },
  { id: 'ATKIN', bearing: 358.7, distanceNm: 15.5, minimumAltitudeFt: 6000 },
];

const bangkokSuvarnabhumi: PublishedProcedurePack = {
  airportId: 'bkk',
  packVersion: '2026.08.12',
  referenceCycle: 'CAAT eAIP Thailand 06 AUG 2026 · AIRAC AIP AMDT 08/26',
  effectiveFrom: '2026-08-06',
  effectiveTo: '2026-09-02',
  generatedFrom: 'CAAT eAIP Thailand · VTBS AD 2, RNAV 1 STAR tables and WGS-84 waypoint lists',
  procedures: [
    { id: 'EASTE1D', kind: 'arrival', compatibleRunwayIds: ['01', '02L', '02R'], entryTransition: 'EASTE', fixes: bangkokEaste1DFixes },
    { id: 'LEBIM1D', kind: 'arrival', compatibleRunwayIds: ['01', '02L', '02R'], entryTransition: 'LEBIM', fixes: bangkokLebim1DFixes },
    { id: 'NORTA1D', kind: 'arrival', compatibleRunwayIds: ['01', '02L', '02R'], entryTransition: 'NORTA', fixes: bangkokNorta1DFixes },
    { id: 'TUMGA1D', kind: 'arrival', compatibleRunwayIds: ['01', '02L', '02R'], entryTransition: 'TUMGA', fixes: bangkokTumga1DFixes },
    { id: 'WILLA1D', kind: 'arrival', compatibleRunwayIds: ['01', '02L', '02R'], entryTransition: 'WILLA', fixes: bangkokWilla1DFixes },
    { id: 'EASTE1C', kind: 'arrival', compatibleRunwayIds: ['19', '20L', '20R'], entryTransition: 'EASTE', fixes: bangkokEaste1CFixes },
    { id: 'LEBIM1C', kind: 'arrival', compatibleRunwayIds: ['19', '20L', '20R'], entryTransition: 'LEBIM', fixes: bangkokLebim1CFixes },
    { id: 'NORTA1C', kind: 'arrival', compatibleRunwayIds: ['19', '20L', '20R'], entryTransition: 'NORTA', fixes: bangkokNorta1CFixes },
    { id: 'TUMGA1C', kind: 'arrival', compatibleRunwayIds: ['19', '20L', '20R'], entryTransition: 'TUMGA', fixes: bangkokTumga1CFixes },
    { id: 'WILLA1C', kind: 'arrival', compatibleRunwayIds: ['19', '20L', '20R'], entryTransition: 'WILLA', fixes: bangkokWilla1CFixes },
  ],
  sources: [
    {
      publisher: 'Civil Aviation Authority of Thailand',
      title: 'Thailand eAIP — effective issue 06 AUG 2026',
      url: 'https://aip.caat.or.th/2026-08-06-AIRAC/html/index-en-GB.html',
      purpose: 'Current AIRAC issue and effective-date reference',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Civil Aviation Authority of Thailand',
      title: 'VTBS AD 2 — Bangkok/Suvarnabhumi International',
      url: 'https://aip.caat.or.th/2026-08-06-AIRAC/html/eAIP/VT-AD-2.VTBS-en-GB.html',
      purpose: 'ARP, elevation, runway geometry, three-runway use and official chart index',
      accessedOn: ACCESSED_ON,
    },
    ...[
      ['AD 2-VTBS-7-1 · RNAV RWY 01/02L/02R STAR chart', '299109', 'North-flow route geometry and chart restrictions'],
      ['AD 2-VTBS-7-4 · EASTE 1D table', '287789', 'EASTE 1D waypoint order and coded restrictions'],
      ['AD 2-VTBS-7-5 · LEBIM 1D table', '287790', 'LEBIM 1D waypoint order and coded restrictions'],
      ['AD 2-VTBS-7-6 · NORTA 1D table', '287791', 'NORTA 1D waypoint order and coded restrictions'],
      ['AD 2-VTBS-7-7/8 · TUMGA 1D table', '287792', 'TUMGA 1D transitions and route order'],
      ['AD 2-VTBS-7-8 · TUMGA 1D continuation', '287793', 'TUMGA 1D common-route restrictions'],
      ['AD 2-VTBS-7-9 · WILLA 1D table', '287794', 'WILLA 1D waypoint order and coded restrictions'],
      ['AD 2-VTBS-7-10 · RWY 01/02 waypoint list', '280039', 'North-flow WGS-84 waypoint coordinates'],
      ['AD 2-VTBS-7-11 · RNAV RWY 19/20L/20R STAR chart', '299110', 'South-flow route geometry and chart restrictions'],
      ['AD 2-VTBS-7-14 · EASTE 1C table', '287796', 'EASTE 1C waypoint order and coded restrictions'],
      ['AD 2-VTBS-7-15 · LEBIM 1C table', '287797', 'LEBIM 1C waypoint order and coded restrictions'],
      ['AD 2-VTBS-7-16 · NORTA 1C table', '287799', 'NORTA 1C waypoint order and coded restrictions'],
      ['AD 2-VTBS-7-17/18 · TUMGA 1C table', '287800', 'TUMGA 1C transitions and route order'],
      ['AD 2-VTBS-7-18 · TUMGA 1C continuation', '287801', 'TUMGA 1C common-route restrictions'],
      ['AD 2-VTBS-7-19 · WILLA 1C table', '287802', 'WILLA 1C waypoint order and coded restrictions'],
      ['AD 2-VTBS-7-20 · RWY 19/20 waypoint list', '280050', 'South-flow WGS-84 waypoint coordinates'],
    ].map(([title, graphicId, purpose]) => ({
      publisher: 'Civil Aviation Authority of Thailand',
      title,
      url: `https://aip.caat.or.th/2026-08-06-AIRAC/graphics/${graphicId}.pdf`,
      purpose,
      accessedOn: ACCESSED_ON,
    })),
  ],
  gameOnlyNotice: 'All ten current RNAV 1 STAR identities, common waypoint orders and represented coded restrictions are retained; feeder transitions and navigation-grade geometry are outside the compact game scope.',
};

/*
 * Hong Kong CAD publishes both the FMC coding tables and WGS-84 waypoint
 * lists on each current STAR chart. Bearings below are calculated from the
 * VHHH ARP (221832N 1135453E). A single global projection (8 NM + 45% of
 * real ARP distance, capped at 40 NM) retains the relative geometry of every
 * route while keeping the 61 NM BETTY feed readable on the tactical scope.
 */
const hongKongFixGeometry = {
  ABBEY: { bearing: 92.2, distanceNm: 33.3 },
  MUSEL: { bearing: 93, distanceNm: 29.7 },
  HH512: { bearing: 116.5, distanceNm: 25.3 },
  HH511: { bearing: 148.3, distanceNm: 21.2 },
  HH622: { bearing: 125.7, distanceNm: 24.4 },
  HH623: { bearing: 148.7, distanceNm: 22.2 },
  LIMES: { bearing: 212.6, distanceNm: 14.5 },
  TEDUR: { bearing: 105, distanceNm: 20.5 },
  RIVMI: { bearing: 76.1, distanceNm: 18.4 },
  BETTY: { bearing: 143.9, distanceNm: 35.5 },
  MANGO: { bearing: 141.2, distanceNm: 32.1 },
  CANTO: { bearing: 196.4, distanceNm: 26.5 },
  MURRY: { bearing: 189.9, distanceNm: 23.1 },
  SILVA: { bearing: 181.4, distanceNm: 20.4 },
  SIERA: { bearing: 226.2, distanceNm: 20.6 },
  BORDA: { bearing: 217.4, distanceNm: 28.9 },
  ROCCA: { bearing: 201.8, distanceNm: 30.6 },
  LUDLA: { bearing: 118.6, distanceNm: 12.6 },
  HH631: { bearing: 132.3, distanceNm: 15.2 },
  HH632: { bearing: 138, distanceNm: 17.7 },
  HH633: { bearing: 143.2, distanceNm: 22.3 },
  HH634: { bearing: 141.1, distanceNm: 20 },
  HH635: { bearing: 154.6, distanceNm: 21.5 },
} satisfies Record<string, Omit<ProcedureFixTemplate, 'id'>>;

type HongKongFixId = keyof typeof hongKongFixGeometry;
type HongKongFixRestrictions = Pick<
  ProcedureFixTemplate,
  'minimumAltitudeFt' | 'maximumAltitudeFt' | 'maximumSpeedKt'
>;

function hongKongFix(
  id: HongKongFixId,
  restrictions: HongKongFixRestrictions = {},
): ProcedureFixTemplate {
  return { id, ...hongKongFixGeometry[id], ...restrictions };
}

const hongKong07Runways = ['07L', '07C', '07R'];
const hongKong25Runways = ['25L', '25C', '25R'];

const hongKongAbbey4AFixes: ProcedureFixTemplate[] = [
  hongKongFix('ABBEY'),
  hongKongFix('MUSEL', { minimumAltitudeFt: 11000, maximumAltitudeFt: 11000, maximumSpeedKt: 280 }),
  hongKongFix('HH512', { maximumAltitudeFt: 9000 }),
  hongKongFix('HH511'),
  hongKongFix('LIMES', { minimumAltitudeFt: 3000, maximumAltitudeFt: 6000 }),
];

const hongKongAbbey3BFixes: ProcedureFixTemplate[] = [
  hongKongFix('ABBEY'),
  hongKongFix('MUSEL', { minimumAltitudeFt: 11000, maximumAltitudeFt: 11000, maximumSpeedKt: 280 }),
  hongKongFix('TEDUR', { maximumAltitudeFt: 6000 }),
  hongKongFix('RIVMI', { minimumAltitudeFt: 4500, maximumAltitudeFt: 6000 }),
];

const hongKongBetty3AFixes: ProcedureFixTemplate[] = [
  hongKongFix('BETTY'),
  hongKongFix('MANGO', { minimumAltitudeFt: 13000, maximumAltitudeFt: 13000, maximumSpeedKt: 280 }),
  hongKongFix('HH511'),
  hongKongFix('LIMES', { minimumAltitudeFt: 3000, maximumAltitudeFt: 6000 }),
];

const hongKongBetty3BFixes: ProcedureFixTemplate[] = [
  hongKongFix('BETTY'),
  hongKongFix('MANGO', { minimumAltitudeFt: 13000, maximumAltitudeFt: 13000, maximumSpeedKt: 280 }),
  hongKongFix('TEDUR', { maximumAltitudeFt: 9000 }),
  hongKongFix('RIVMI', { minimumAltitudeFt: 4500, maximumAltitudeFt: 6000 }),
];

const hongKongCanto07Fixes: ProcedureFixTemplate[] = [
  hongKongFix('CANTO', { minimumAltitudeFt: 13000, maximumSpeedKt: 280 }),
  hongKongFix('MURRY', { minimumAltitudeFt: 11000, maximumAltitudeFt: 13000 }),
  hongKongFix('SILVA'),
  hongKongFix('LIMES', { minimumAltitudeFt: 3000, maximumAltitudeFt: 6000 }),
];

const hongKongCanto25Fixes: ProcedureFixTemplate[] = [
  hongKongFix('CANTO', { minimumAltitudeFt: 13000, maximumSpeedKt: 280 }),
  hongKongFix('MURRY', { minimumAltitudeFt: 11000, maximumAltitudeFt: 13000 }),
  hongKongFix('SILVA'),
  hongKongFix('HH623'),
  hongKongFix('HH622'),
  hongKongFix('TEDUR', { maximumAltitudeFt: 6000 }),
  hongKongFix('RIVMI', { minimumAltitudeFt: 4500, maximumAltitudeFt: 6000 }),
];

function hongKongSieraFixes(
  viaBorda: boolean,
  runway25: boolean,
): ProcedureFixTemplate[] {
  return [
    hongKongFix('SIERA', { maximumSpeedKt: 280 }),
    ...(viaBorda ? [
      hongKongFix('BORDA', { maximumSpeedKt: 250 }),
      hongKongFix('ROCCA'),
    ] : []),
    hongKongFix('CANTO', { minimumAltitudeFt: 13000 }),
    hongKongFix('MURRY', { minimumAltitudeFt: 11000, maximumAltitudeFt: 13000 }),
    hongKongFix('SILVA'),
    ...(runway25 ? [
      hongKongFix('HH623'),
      hongKongFix('HH622'),
      hongKongFix('TEDUR', { maximumAltitudeFt: 6000 }),
      hongKongFix('RIVMI', { minimumAltitudeFt: 4500, maximumAltitudeFt: 6000 }),
    ] : [
      hongKongFix('LIMES', { minimumAltitudeFt: 3000, maximumAltitudeFt: 6000 }),
    ]),
  ];
}

const hongKongAbbey2GFixes: ProcedureFixTemplate[] = [
  hongKongFix('ABBEY'),
  hongKongFix('MUSEL', { minimumAltitudeFt: 11000, maximumAltitudeFt: 11000, maximumSpeedKt: 280 }),
  hongKongFix('TEDUR', { maximumAltitudeFt: 6000 }),
  hongKongFix('HH631', { minimumAltitudeFt: 5000, maximumAltitudeFt: 6000, maximumSpeedKt: 210 }),
  hongKongFix('LUDLA', { minimumAltitudeFt: 4500, maximumAltitudeFt: 4500 }),
];

const hongKongBetty2GFixes: ProcedureFixTemplate[] = [
  hongKongFix('BETTY'),
  hongKongFix('MANGO', { minimumAltitudeFt: 13000, maximumAltitudeFt: 13000, maximumSpeedKt: 280 }),
  hongKongFix('HH633', { maximumAltitudeFt: 9000 }),
  hongKongFix('HH632', { maximumAltitudeFt: 8000 }),
  hongKongFix('HH631', { minimumAltitudeFt: 5000, maximumAltitudeFt: 6000, maximumSpeedKt: 210 }),
  hongKongFix('LUDLA', { minimumAltitudeFt: 4500, maximumAltitudeFt: 4500 }),
];

function hongKongCanto2GFixes(fromSiera: boolean): ProcedureFixTemplate[] {
  return [
    ...(fromSiera ? [hongKongFix('SIERA')] : []),
    hongKongFix('CANTO', { minimumAltitudeFt: 13000, maximumSpeedKt: 280 }),
    hongKongFix('MURRY', { minimumAltitudeFt: 11000, maximumAltitudeFt: 13000 }),
    hongKongFix('SILVA'),
    hongKongFix('HH635', { maximumAltitudeFt: 9000 }),
    hongKongFix('HH634'),
    hongKongFix('HH632', { maximumAltitudeFt: 8000 }),
    hongKongFix('HH631', { minimumAltitudeFt: 5000, maximumAltitudeFt: 6000, maximumSpeedKt: 210 }),
    hongKongFix('LUDLA', { minimumAltitudeFt: 4500, maximumAltitudeFt: 4500 }),
  ];
}

const hongKongInternational: PublishedProcedurePack = {
  airportId: 'hkg',
  packVersion: '2026.08.13',
  referenceCycle: 'Hong Kong CAD eAIP 06 AUG 2026 · Amendment 7/26 STAR charts',
  effectiveFrom: '2026-08-06',
  effectiveTo: '2026-09-02',
  generatedFrom: 'Hong Kong CAD eAIP · VHHH AD 1.1/AD 2 and FMC STAR coding tables',
  procedures: [
    { id: 'ABBEY4A', kind: 'arrival', compatibleRunwayIds: hongKong07Runways, entryTransition: 'ABBEY', fixes: hongKongAbbey4AFixes },
    { id: 'ABBEY3B', kind: 'arrival', compatibleRunwayIds: hongKong25Runways, entryTransition: 'ABBEY', fixes: hongKongAbbey3BFixes },
    { id: 'BETTY3A', kind: 'arrival', compatibleRunwayIds: hongKong07Runways, entryTransition: 'BETTY', fixes: hongKongBetty3AFixes },
    { id: 'BETTY3B', kind: 'arrival', compatibleRunwayIds: hongKong25Runways, entryTransition: 'BETTY', fixes: hongKongBetty3BFixes },
    { id: 'CANTO3A', kind: 'arrival', compatibleRunwayIds: hongKong07Runways, entryTransition: 'CANTO', fixes: hongKongCanto07Fixes },
    { id: 'CANTO3B', kind: 'arrival', compatibleRunwayIds: hongKong25Runways, entryTransition: 'CANTO', fixes: hongKongCanto25Fixes },
    { id: 'SIERA7A', kind: 'arrival', compatibleRunwayIds: hongKong07Runways, entryTransition: 'SIERA', fixes: hongKongSieraFixes(false, false) },
    { id: 'SIERA7B', kind: 'arrival', compatibleRunwayIds: hongKong25Runways, entryTransition: 'SIERA', fixes: hongKongSieraFixes(false, true) },
    { id: 'SIERA7C', kind: 'arrival', compatibleRunwayIds: hongKong07Runways, entryTransition: 'SIERA', fixes: hongKongSieraFixes(true, false) },
    { id: 'SIERA7D', kind: 'arrival', compatibleRunwayIds: hongKong25Runways, entryTransition: 'SIERA', fixes: hongKongSieraFixes(true, true) },
    { id: 'ABBEY2G', kind: 'arrival', compatibleRunwayIds: hongKong25Runways, entryTransition: 'ABBEY', fixes: hongKongAbbey2GFixes },
    { id: 'BETTY2G', kind: 'arrival', compatibleRunwayIds: hongKong25Runways, entryTransition: 'BETTY', fixes: hongKongBetty2GFixes },
    { id: 'CANTO2G', kind: 'arrival', compatibleRunwayIds: hongKong25Runways, entryTransition: 'CANTO', fixes: hongKongCanto2GFixes(false) },
    { id: 'SIERA2G', kind: 'arrival', compatibleRunwayIds: hongKong25Runways, entryTransition: 'SIERA', fixes: hongKongCanto2GFixes(true) },
  ],
  sources: [
    {
      publisher: 'Civil Aviation Department Hong Kong',
      title: 'Hong Kong eAIP — effective issue 06 AUG 2026',
      url: 'https://www.ais.gov.hk/eaip_20260806/2026-08-06-000000/html/index-en-US.html',
      purpose: 'Current issue and effective-date reference',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Civil Aviation Department Hong Kong',
      title: 'AD 1.1 — Parallel runway operations',
      url: 'https://www.ais.gov.hk/eaip_20260806/2026-08-06-000000/html/eAIP/VH-AD-1.1-en-US.html',
      purpose: 'Published three-runway and dual-runway arrival/departure assignments',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'Civil Aviation Department Hong Kong',
      title: 'VHHH AD 2 — Hong Kong International',
      url: 'https://www.ais.gov.hk/eaip_20260806/2026-08-06-000000/html/eAIP/VH-AD-2-VHHH-en-US.html',
      purpose: 'ARP, elevation, runway geometry, STAR rules, waypoint catalogue and chart index',
      accessedOn: ACCESSED_ON,
    },
    ...[
      ['RNAV ABBEY 4A / 3B STAR', 'VH-AD-2-VHHH-STAR-ABBEY.pdf', 'ABBEY route order, restrictions and WGS-84 waypoint coordinates'],
      ['RNAV BETTY 3A / 3B STAR', 'VH-AD-2-VHHH-STAR-BETTY.pdf', 'BETTY route order, restrictions and WGS-84 waypoint coordinates'],
      ['RNAV CANTO 3A STAR', 'VH-AD-2-VHHH-STAR-CANTO-A.pdf', 'CANTO runway 07 route order, restrictions and coordinates'],
      ['RNAV CANTO 3B STAR', 'VH-AD-2-VHHH-STAR-CANTO-B.pdf', 'CANTO runway 25 route order, restrictions and coordinates'],
      ['RNAV SIERA 7A / 7C STAR', 'VH-AD-2-VHHH-STAR-SIERA-AC.pdf', 'SIERA runway 07 route variants, restrictions and coordinates'],
      ['RNAV SIERA 7B / 7D STAR', 'VH-AD-2-VHHH-STAR-SIERA-BD.pdf', 'SIERA runway 25 route variants, restrictions and coordinates'],
      ['RNAV(GNSS) ABBEY / BETTY / CANTO / SIERA 2G STAR', 'VH-AD-2-VHHH-STAR-G.pdf', 'RNP AR runway 25 route orders, restrictions and coordinates'],
    ].map(([title, filename, purpose]) => ({
      publisher: 'Civil Aviation Department Hong Kong',
      title,
      url: `https://www.ais.gov.hk/eaip_20260806/2026-08-06-000000/pdf/${filename}`,
      purpose,
      accessedOn: ACCESSED_ON,
    })),
  ],
  gameOnlyNotice: 'All fourteen current RNAV STAR identities, chart waypoint orders and represented constraints are retained; WGS-84 geometry is uniformly projected into the compact tactical sector and is not for navigation.',
};

/*
 * ENAIRE publishes the LEBL STAR route order, WGS-84 coordinates and tabular
 * altitude/speed constraints. Bearings below are calculated from the current
 * LEBL ARP (411749N 0020442E). Real distances are projected as 8 NM + 38%,
 * capped at 40 NM, so the complete terminal structure fits the game scope.
 */
const barcelonaFixGeometry: Record<string, [number, number]> = {
  ALBER: [25.7, 37.3], BCN: [65.3, 8.6], BERGA: [357.8, 28.0], BGR: [52.0, 32.3],
  BISBA: [55.1, 39.9], BL459: [334.7, 15.1], BL461: [331.0, 14.6], BL462: [115.3, 21.0],
  BL465: [33.9, 21.3], BL468: [95.5, 23.0], BL469: [41.1, 23.4], BL573: [10.2, 16.9],
  BL645: [147.7, 11.4], BL670: [273.8, 20.9], BL678: [272.1, 24.7], BOLQE: [318.0, 21.4],
  CASPE: [269.5, 40.0], CLE: [50.4, 20.3], CUTXE: [30.9, 30.3], ELLIH: [6.8, 27.2],
  ENJUC: [11.2, 19.0], GRAUS: [298.8, 40.0], INCAH: [266.5, 33.6], ISWIQ: [143.4, 16.0],
  KANWU: [234.5, 29.6], LESBA: [95.3, 18.1], LOBAR: [289.5, 39.8], LRD: [283.9, 33.2],
  MAMUK: [359.5, 20.3], MARTA: [212.9, 33.5], MATEX: [242.2, 40.0], MECUH: [282.3, 25.6],
  NEMUM: [53.6, 35.7], NEPAL: [190.9, 22.0], OSTUR: [129.7, 26.3], PAPOS: [215.3, 26.8],
  PEKIS: [296.6, 26.2], PIJUH: [250.7, 29.4], PUMAL: [357.2, 32.4], RAVAX: [178.9, 16.6],
  RES: [257.8, 24.1],
  RUBOT: [221.1, 17.8], RULOS: [128.0, 12.4], SADEM: [95.6, 26.9], SLL: [6.0, 13.1],
  TAQOH: [218.6, 20.4], TIRGO: [304.7, 27.7], TOTKI: [238.1, 15.0], UCREQ: [1.2, 17.0],
  ULKAL: [246.6, 17.2], USSOF: [63.0, 26.2], UTHAN: [20.8, 22.4], VERSO: [96.0, 37.0],
  VIBIM: [156.8, 13.6], VIBOK: [300.2, 19.4], VLA: [276.7, 17.1], XAMUR: [79.6, 21.8],
};

type BarcelonaFixSpec = [
  id: string,
  minimumAltitudeFt?: number,
  maximumAltitudeFt?: number,
  maximumSpeedKt?: number,
];

function barcelonaFix([id, minimumAltitudeFt, maximumAltitudeFt, maximumSpeedKt]: BarcelonaFixSpec): ProcedureFixTemplate {
  const geometry = barcelonaFixGeometry[id];
  if (!geometry) throw new Error(`Missing Barcelona geometry for ${id}`);
  return {
    id,
    bearing: geometry[0],
    distanceNm: geometry[1],
    ...(minimumAltitudeFt === undefined ? {} : { minimumAltitudeFt }),
    ...(maximumAltitudeFt === undefined ? {} : { maximumAltitudeFt }),
    ...(maximumSpeedKt === undefined ? {} : { maximumSpeedKt }),
  };
}

function barcelonaArrival(
  id: string,
  compatibleRunwayIds: string[],
  fixes: BarcelonaFixSpec[],
): PublishedProcedureTemplate {
  return {
    id,
    kind: 'arrival',
    compatibleRunwayIds,
    entryTransition: fixes[0]![0],
    fixes: fixes.map(barcelonaFix),
  };
}

const barcelonaRunway02 = ['02'];
const barcelonaRunway06 = ['06L', '06R'];
const barcelonaRunway24 = ['24L', '24R'];

const barcelonaRunway02Arrivals: PublishedProcedureTemplate[] = [
  barcelonaArrival('ALBER3N', barcelonaRunway02, [
    ['ALBER', 11000, 25000, 280], ['CUTXE'], ['UTHAN'], ['ENJUC', 8000],
    ['SLL', 6000], ['BCN', undefined, 9000, 250], ['BL645'], ['VIBIM', 4000, undefined, 220],
  ]),
  barcelonaArrival('BISBA5N', barcelonaRunway02, [
    ['BISBA', 12000, 27000, 280], ['NEMUM', 10000], ['BGR'], ['ENJUC', 8000],
    ['SLL', 6000], ['BCN', undefined, 9000, 250], ['BL645'], ['VIBIM', 4000, undefined, 220],
  ]),
  barcelonaArrival('CASPE4N', barcelonaRunway02, [
    ['CASPE', undefined, 25000, 280], ['BL678', 16000], ['BL670'], ['VLA'],
    ['ULKAL', 6000, 9000, 250], ['TOTKI', 4000, undefined, 220],
  ]),
  barcelonaArrival('GRAUS3N', barcelonaRunway02, [
    ['GRAUS', undefined, 25000, 280], ['LRD', 11000], ['VLA'],
    ['ULKAL', 6000, 9000, 250], ['TOTKI', 4000, undefined, 220],
  ]),
  barcelonaArrival('LOBAR3N', barcelonaRunway02, [
    ['LOBAR', undefined, 25000, 280], ['LRD', 16000], ['VLA'],
    ['ULKAL', 6000, 9000, 250], ['TOTKI', 4000, undefined, 220],
  ]),
  barcelonaArrival('MAMUK1N', barcelonaRunway02, [
    ['MAMUK', 8000], ['SLL', 6000], ['BCN', undefined, 9000, 250],
    ['BL645'], ['VIBIM', 4000, undefined, 220],
  ]),
  barcelonaArrival('MARTA4N', barcelonaRunway02, [
    ['MARTA', undefined, 20000, 280], ['PAPOS', 16000], ['TAQOH'],
    ['ULKAL', 6000, 9000, 250], ['TOTKI', 4000, undefined, 220],
  ]),
  barcelonaArrival('MATEX4N', barcelonaRunway02, [
    ['MATEX', undefined, 25000, 280], ['KANWU', 16000], ['TAQOH'],
    ['ULKAL', 6000, 9000, 250], ['TOTKI', 4000, undefined, 220],
  ]),
  barcelonaArrival('NEPAL4N', barcelonaRunway02, [
    ['NEPAL', 10000, 16000, 280], ['TAQOH'],
    ['ULKAL', 6000, 9000, 250], ['TOTKI', 4000, undefined, 220],
  ]),
  barcelonaArrival('OSTUR2N', barcelonaRunway02, [
    ['OSTUR', 10000, 20000, 280], ['ISWIQ', undefined, 9000, 250],
    ['VIBIM', 4000, undefined, 220],
  ]),
  barcelonaArrival('PUMAL5N', barcelonaRunway02, [
    ['PUMAL', 13000, 25000, 280], ['BERGA', 12000], ['BOLQE', 9000],
    ['VIBOK'], ['VLA'], ['ULKAL', 6000, 9000, 250], ['TOTKI', 4000, undefined, 220],
  ]),
  barcelonaArrival('VERSO2N', barcelonaRunway02, [
    ['VERSO', undefined, 25000, 280], ['OSTUR', 16000, 20000],
    ['ISWIQ', undefined, 9000, 250], ['VIBIM', 4000, undefined, 220],
  ]),
  barcelonaArrival('VIBOK1N', barcelonaRunway02, [
    ['VIBOK'], ['VLA'], ['ULKAL', 6000, 9000, 250], ['TOTKI', 4000, undefined, 220],
  ]),
];

const barcelonaRunway06Arrivals: PublishedProcedureTemplate[] = [
  barcelonaArrival('ALBER2E', barcelonaRunway06, [
    ['ALBER', 11000, 25000, 280], ['CUTXE'], ['UTHAN'], ['ENJUC', 8000],
    ['BL573', undefined, 10000, 250], ['SLL', 6000],
  ]),
  barcelonaArrival('BISBA2E', barcelonaRunway06, [
    ['BISBA', 12000, 27000, 280], ['NEMUM', 10000], ['BGR'], ['ENJUC', 8000],
    ['BL573', undefined, 10000, 250], ['SLL', 6000],
  ]),
  barcelonaArrival('CASPE3E', barcelonaRunway06, [
    ['CASPE', undefined, 25000, 280], ['INCAH', 16000], ['PIJUH'],
    ['TAQOH', 6000, 10000, 250], ['RUBOT', 4000],
  ]),
  barcelonaArrival('GRAUS1E', barcelonaRunway06, [
    ['GRAUS', undefined, 25000, 280], ['LRD', 11000], ['RES'],
    ['TAQOH', 6000, 10000, 250], ['RUBOT', 4000],
  ]),
  barcelonaArrival('LOBAR1E', barcelonaRunway06, [
    ['LOBAR', undefined, 25000, 280], ['LRD', 16000], ['RES'],
    ['TAQOH', 6000, 10000, 250], ['RUBOT', 4000],
  ]),
  barcelonaArrival('MAMUK1E', barcelonaRunway06, [
    ['MAMUK', 8000, 11000, 240], ['UCREQ', undefined, 10000], ['SLL', 6000],
  ]),
  barcelonaArrival('MARTA3E', barcelonaRunway06, [
    ['MARTA', undefined, 20000, 280], ['PAPOS', 16000],
    ['TAQOH', 6000, 10000, 250], ['RUBOT', 4000],
  ]),
  barcelonaArrival('MATEX3E', barcelonaRunway06, [
    ['MATEX', undefined, 25000, 280], ['KANWU', 16000],
    ['TAQOH', 6000, 10000, 250], ['RUBOT', 4000],
  ]),
  barcelonaArrival('NEPAL3E', barcelonaRunway06, [
    ['NEPAL', 10000, 16000, 280], ['TAQOH', 6000, 10000, 250], ['RUBOT', 4000],
  ]),
  barcelonaArrival('OSTUR2E', barcelonaRunway06, [
    ['OSTUR', 10000, 20000, 280], ['ISWIQ', undefined, 10000, 250], ['VIBIM', 4000],
  ]),
  barcelonaArrival('PUMAL1E', barcelonaRunway06, [
    ['PUMAL', 13000, 25000, 280], ['BERGA', 12000], ['BOLQE', 9000],
    ['VIBOK', undefined, 10000, 250], ['VLA', 6000],
  ]),
  barcelonaArrival('VERSO3E', barcelonaRunway06, [
    ['VERSO', undefined, 25000, 280], ['OSTUR', 16000, 20000],
    ['ISWIQ', undefined, 10000, 250], ['VIBIM', 4000],
  ]),
  barcelonaArrival('VIBOK1E', barcelonaRunway06, [
    ['VIBOK', undefined, 10000, 250], ['VLA', 6000],
  ]),
];

const barcelonaRunway24Arrivals: PublishedProcedureTemplate[] = [
  barcelonaArrival('ALBER2W', barcelonaRunway24, [
    ['ALBER', 11000, 25000, 280], ['CUTXE'],
    ['BL469', undefined, 10000, 250], ['CLE', 8000],
  ]),
  barcelonaArrival('BISBA2W', barcelonaRunway24, [
    ['BISBA', undefined, 25000, 280], ['USSOF', 16000],
    ['XAMUR', undefined, 10000, 250], ['LESBA', 4000],
  ]),
  barcelonaArrival('CASPE2W', barcelonaRunway24, [
    ['CASPE', undefined, 28000, 280], ['MECUH', 16000, 20000], ['VIBOK', undefined, 15000],
    ['BL461', undefined, 10000, 250], ['SLL', 6000],
  ]),
  barcelonaArrival('GRAUS2W', barcelonaRunway24, [
    ['GRAUS', undefined, 28000, 280], ['TIRGO', 11000, 20000],
    ['BL459', undefined, 10000, 250], ['SLL', 6000],
  ]),
  barcelonaArrival('LOBAR2W', barcelonaRunway24, [
    ['LOBAR', undefined, 28000, 280], ['PEKIS', 16000, 20000],
    ['BL461', undefined, 10000, 250], ['SLL', 6000],
  ]),
  barcelonaArrival('MAMUK1W', barcelonaRunway24, [
    ['MAMUK', 8000, 11000, 240], ['UCREQ', undefined, 10000], ['SLL', 6000],
  ]),
  barcelonaArrival('MARTA2W', barcelonaRunway24, [
    ['MARTA', undefined, 24000, 280], ['NEPAL', 16000, 17000],
    ['RAVAX', undefined, 10000, 250], ['RULOS', 4000],
  ]),
  barcelonaArrival('MATEX2W', barcelonaRunway24, [
    ['MATEX', undefined, 28000, 280], ['KANWU', 16000], ['TAQOH', 6000],
    ['RAVAX', undefined, 10000, 250], ['RULOS', 4000],
  ]),
  barcelonaArrival('NEPAL2W', barcelonaRunway24, [
    ['NEPAL', 10000, 17000, 280], ['RAVAX', undefined, 10000, 250], ['RULOS', 4000],
  ]),
  barcelonaArrival('OSTUR2W', barcelonaRunway24, [
    ['OSTUR', 10000, 16000, 280], ['BL462', undefined, 10000, 250], ['LESBA', 4000],
  ]),
  barcelonaArrival('PUMAL2W', barcelonaRunway24, [
    ['PUMAL', 13000, 25000, 280], ['ELLIH', 12000],
    ['BL465', undefined, 10000, 250], ['CLE', 8000],
  ]),
  barcelonaArrival('VERSO2W', barcelonaRunway24, [
    ['VERSO', undefined, 20000, 280], ['SADEM', 10000],
    ['BL468', undefined, 10000, 250], ['LESBA', 4000],
  ]),
  barcelonaArrival('VIBOK1W', barcelonaRunway24, [
    ['VIBOK', undefined, 15000], ['BL461', undefined, 10000, 250], ['SLL', 6000],
  ]),
];

const barcelonaElPrat: PublishedProcedurePack = {
  airportId: 'bcn',
  packVersion: '2026.08.14',
  referenceCycle: 'ENAIRE AIP España 06 AUG 2026 · AIRAC AMDT 07/26 · current LEBL STAR pages',
  effectiveFrom: '2026-08-06',
  effectiveTo: '2026-09-02',
  generatedFrom: 'ENAIRE AIP España · LEBL AD 2 preferential configurations and RNAV1 STAR tabular descriptions',
  procedures: [
    ...barcelonaRunway02Arrivals,
    ...barcelonaRunway06Arrivals,
    ...barcelonaRunway24Arrivals,
  ],
  sources: [
    {
      publisher: 'ENAIRE',
      title: 'AIP Spain — issue in force 06 AUG 2026',
      url: 'https://aip.enaire.es/aip/aip-en.html',
      purpose: 'Current AIRAC issue and effective-date reference',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'ENAIRE',
      title: 'LEBL AD 2 — Barcelona/Josep Tarradellas Barcelona-El Prat',
      url: 'https://aip.enaire.es/aip/contenido_AIP/AD/AD2/LEBL/LE_AD_2_LEBL_en.html',
      purpose: 'ARP, elevation, runway geometry and published daytime/night-time runway configurations',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'ENAIRE',
      title: 'LEBL RNAV1 STAR — runway 02',
      url: 'https://aip.enaire.es/aip/contenido_AIP/AD/AD2/LEBL/LE_AD_2_LEBL_STAR_1_en.pdf',
      purpose: 'Runway 02 planable STAR identities, waypoint order, WGS-84 coordinates and constraints',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'ENAIRE',
      title: 'LEBL RNAV1 STAR — runways 06L/06R',
      url: 'https://aip.enaire.es/aip/contenido_AIP/AD/AD2/LEBL/LE_AD_2_LEBL_STAR_2_en.pdf',
      purpose: 'Runway 06 planable STAR identities, waypoint order, WGS-84 coordinates and constraints',
      accessedOn: ACCESSED_ON,
    },
    {
      publisher: 'ENAIRE',
      title: 'LEBL RNAV1 STAR — runways 24L/24R',
      url: 'https://aip.enaire.es/AIP/contenido_AIP/AD/AD2/LEBL/LE_AD_2_LEBL_STAR_3_en.pdf',
      purpose: 'Runway 24 planable STAR identities, waypoint order, WGS-84 coordinates and constraints',
      accessedOn: ACCESSED_ON,
    },
  ],
  gameOnlyNotice: 'All 39 current planable RNAV1 STAR identities, chart waypoint orders and represented constraints are retained. ENAIRE procedures explicitly marked tactical-use-only and unplannable are excluded; WGS-84 geometry is uniformly projected into the compact tactical sector and is not for navigation.',
};

export const INTERNATIONAL_PUBLISHED_PROCEDURE_PACKS: PublishedProcedurePack[] = [
  delhi, incheon, dubai, parisCharlesDeGaulle, singaporeChangi, amsterdamSchiphol, madridBarajas,
  kualaLumpurInternational, bangkokSuvarnabhumi, hongKongInternational, barcelonaElPrat,
  MUMBAI_PUBLISHED_PROCEDURE_PACK, DOHA_PUBLISHED_PROCEDURE_PACK,
];
