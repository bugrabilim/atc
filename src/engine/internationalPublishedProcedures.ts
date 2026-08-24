import type {
  ProcedureFixTemplate,
  PublishedProcedurePack,
  PublishedProcedureTemplate,
} from './airportOperations';

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

export const INTERNATIONAL_PUBLISHED_PROCEDURE_PACKS: PublishedProcedurePack[] = [delhi, incheon, dubai, parisCharlesDeGaulle];
