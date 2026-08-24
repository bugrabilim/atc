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

export const INTERNATIONAL_PUBLISHED_PROCEDURE_PACKS: PublishedProcedurePack[] = [delhi];
