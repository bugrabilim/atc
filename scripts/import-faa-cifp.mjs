import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const CYCLE = '2608';
const EFFECTIVE_FROM = '2026-08-06';
const EFFECTIVE_TO = '2026-09-03';
const PACK_VERSION = '2026.08.3';
const SOURCE_URL = 'https://aeronav.faa.gov/Upload_313-d/cifp/CIFP_260806.zip';
const DEFAULT_OUTPUT = 'src/engine/generated/faaCifpProcedures.ts';

const SELECTED_AIRPORTS = [
  {
    airportId: 'dfw', icao: 'KDFW',
    arrivals: [
      { id: 'BEREE3', transition: 'OUTLN' },
      { id: 'BRDJE5', transition: 'AXXEE' },
      { id: 'JOVEM6', transition: 'RBUKL' },
      { id: 'SHMPP3', transition: 'KIILO' },
    ],
  },
  {
    airportId: 'ord', icao: 'KORD',
    arrivals: [
      { id: 'BENKY6', transition: 'BFORD' },
      { id: 'ERNNY8', transition: 'CHDRR' },
      { id: 'ESSPO5', transition: 'WATSN' },
      { id: 'FYTTE7', transition: 'CHMPN' },
    ],
  },
  {
    airportId: 'den', icao: 'KDEN',
    arrivals: [
      { id: 'AALLE4', transition: 'BBOTL' },
      { id: 'CLASH5', transition: 'OATHE' },
      { id: 'FLATI5', transition: 'FOLSM' },
      { id: 'SSKII4', transition: 'HAMIC' },
    ],
  },
  {
    airportId: 'mco', icao: 'KMCO',
    arrivals: [
      { id: 'ALYNA4', transition: 'GRDON' },
      { id: 'GRNCH5', transition: 'COAXE' },
      { id: 'JOKRS4', transition: 'FAZES' },
      { id: 'MUNGI1', transition: 'SPIFF' },
    ],
  },
  {
    airportId: 'mia', icao: 'KMIA',
    arrivals: [
      { id: 'BNFSH3', transition: 'MUNRO' },
      { id: 'FROGZ5', transition: 'MARCI' },
      { id: 'SNDBR3', transition: 'PAMPR' },
      { id: 'VIICE2', transition: 'ZEGEE' },
    ],
  },
  {
    airportId: 'las', icao: 'KLAS',
    arrivals: [
      { id: 'CHOWW4', transition: 'STEWW' },
      { id: 'COKTL4', transition: 'GIINN' },
      { id: 'RKSTR4', transition: 'ELLDA' },
      { id: 'RNDRZ4', transition: 'MISEN' },
    ],
  },
  {
    airportId: 'sfo', icao: 'KSFO',
    arrivals: [
      { id: 'ALWYS3', transition: 'INYOE' },
      { id: 'BDEGA4', transition: 'MLBEC' },
      { id: 'PIRAT3', transition: 'PASIF' },
      { id: 'RISTI1', transition: 'ORRCA' },
    ],
  },
  {
    airportId: 'clt', icao: 'KCLT',
    arrivals: [
      { id: 'BANKR7', transition: 'PONZE' },
      { id: 'CHSLY8', transition: 'SDAIL' },
      { id: 'FILPZ6', transition: 'COMDY' },
      { id: 'MLLET5', transition: 'TORQD' },
    ],
  },
  {
    airportId: 'sea', icao: 'KSEA',
    arrivals: [
      { id: 'HAWKZ8', transition: 'KRIEG' },
      { id: 'MARNR8', transition: 'BUHNR' },
    ],
  },
  {
    airportId: 'phx', icao: 'KPHX',
    arrivals: [
      { id: 'DSERT2', transition: 'FLG' },
      { id: 'EAGUL6', transition: 'GUP' },
      { id: 'HYDRR1', transition: 'SALOM' },
      { id: 'PINNG1', transition: 'HOTTT' },
    ],
  },
  {
    airportId: 'iah', icao: 'KIAH',
    arrivals: [
      { id: 'BAZBL1', transition: 'HOMRN' },
      { id: 'GESNR2', transition: 'CARPR' },
      { id: 'HTOWN3', transition: 'LMEDA' },
      { id: 'LINKK1', transition: 'MULLT' },
    ],
  },
];

function usage() {
  return 'Usage: node scripts/import-faa-cifp.mjs /path/to/FAACIFP18 [--output path]';
}

function parseArguments(arguments_) {
  const input = arguments_[0];
  if (!input || input.startsWith('--')) throw new Error(usage());
  const outputFlag = arguments_.indexOf('--output');
  return {
    input: resolve(input),
    output: resolve(outputFlag >= 0 ? arguments_[outputFlag + 1] ?? DEFAULT_OUTPUT : DEFAULT_OUTPUT),
  };
}

function parseCoordinate(record) {
  const latitude = record.slice(32, 41);
  const longitude = record.slice(41, 51);
  if (!/^[NS]\d{8}$/.test(latitude) || !/^[EW]\d{9}$/.test(longitude)) return null;
  const decimal = (value, degreeDigits) => {
    const sign = value[0] === 'S' || value[0] === 'W' ? -1 : 1;
    const digits = value.slice(1);
    const degrees = Number(digits.slice(0, degreeDigits));
    const minutes = Number(digits.slice(degreeDigits, degreeDigits + 2));
    const seconds = Number(digits.slice(degreeDigits + 2, degreeDigits + 4));
    const hundredths = Number(digits.slice(degreeDigits + 4));
    return sign * (degrees + minutes / 60 + (seconds + hundredths / 100) / 3600);
  };
  return { latitude: decimal(latitude, 2), longitude: decimal(longitude, 3) };
}

function distanceAndBearing(from, to) {
  const radians = (value) => value * Math.PI / 180;
  const earthRadiusNm = 3440.065;
  const latitude1 = radians(from.latitude);
  const latitude2 = radians(to.latitude);
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
  const distanceNm = 2 * earthRadiusNm * Math.asin(Math.sqrt(haversine));
  const y = Math.sin(longitudeDelta) * Math.cos(latitude2);
  const x = Math.cos(latitude1) * Math.sin(latitude2)
    - Math.sin(latitude1) * Math.cos(latitude2) * Math.cos(longitudeDelta);
  return { distanceNm, bearing: (Math.atan2(y, x) * 180 / Math.PI + 360) % 360 };
}

function parseAltitude(value) {
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (/^FL\d{3}$/.test(normalized)) return Number(normalized.slice(2)) * 100;
  if (/^\d{5}$/.test(normalized)) return Number(normalized);
  return undefined;
}

function crossingConstraints(record) {
  const descriptor = record[82];
  const altitude1 = parseAltitude(record.slice(84, 89));
  const altitude2 = parseAltitude(record.slice(89, 94));
  const maximumSpeedKt = /^\d{3}$/.test(record.slice(99, 102)) ? Number(record.slice(99, 102)) : undefined;
  const constraints = {};
  if (descriptor === '+' && altitude1 !== undefined) constraints.minimumAltitudeFt = altitude1;
  else if (descriptor === '-' && altitude1 !== undefined) constraints.maximumAltitudeFt = altitude1;
  else if (descriptor === 'B' && altitude1 !== undefined && altitude2 !== undefined) {
    constraints.minimumAltitudeFt = Math.min(altitude1, altitude2);
    constraints.maximumAltitudeFt = Math.max(altitude1, altitude2);
  } else if (descriptor === ' ' && altitude1 !== undefined) {
    constraints.minimumAltitudeFt = altitude1;
    constraints.maximumAltitudeFt = altitude1;
  }
  if (maximumSpeedKt !== undefined) constraints.maximumSpeedKt = maximumSpeedKt;
  return constraints;
}

function buildIndexes(records) {
  const airports = new Map();
  const terminalFixes = new Map();
  const globalFixes = new Map();
  for (const record of records) {
    const coordinate = parseCoordinate(record);
    if (!coordinate) continue;
    if (record[4] === 'P' && record[12] === 'A') airports.set(record.slice(6, 10), coordinate);
    const fixId = record.slice(13, 18).trim();
    if (!fixId) continue;
    if (record[4] === 'P' && record[12] === 'C') {
      terminalFixes.set(`${record.slice(6, 10)}:${fixId}`, coordinate);
    }
    if (!globalFixes.has(fixId)) globalFixes.set(fixId, coordinate);
  }
  return { airports, terminalFixes, globalFixes };
}

function uniqueRouteRecords(records) {
  const output = [];
  for (const record of records) {
    const fixId = record.slice(29, 34).trim();
    if (!fixId || output.at(-1)?.slice(29, 34).trim() === fixId) continue;
    output.push(record);
  }
  return output;
}

function runwayIdsForAirport(records, icao) {
  return records
    .filter((record) => record[4] === 'P' && record.slice(6, 10) === icao && record[12] === 'G')
    .map((record) => record.slice(13, 18).trim().replace(/^RW/, ''))
    .filter(Boolean);
}

function compatibleRunwayIds(procedureRecords, allRunwayIds) {
  if (procedureRecords.some((record) => record[19] === '5' && record.slice(20, 25).trim() === 'ALL')) {
    return allRunwayIds;
  }
  const transitions = [...new Set(procedureRecords
    .filter((record) => record[19] === '6')
    .map((record) => record.slice(20, 25).trim())
    .filter((value) => value.startsWith('RW')))];
  if (transitions.length === 0) return allRunwayIds;
  const compatible = new Set();
  for (const transition of transitions) {
    const runway = transition.slice(2);
    if (runway.endsWith('B')) {
      const number = runway.slice(0, -1);
      for (const id of allRunwayIds) if (id.startsWith(number)) compatible.add(id);
    } else if (allRunwayIds.includes(runway)) compatible.add(runway);
  }
  return compatible.size > 0 ? [...compatible] : allRunwayIds;
}

function buildProcedure(records, indexes, airport, selection) {
  const primary = records.filter((record) => (
    record[4] === 'P'
    && record.slice(6, 10) === airport.icao
    && record[12] === 'E'
    && record.slice(13, 19).trim() === selection.id
    && record[38] === '0'
  ));
  const transition = primary
    .filter((record) => record[19] === '4' && record.slice(20, 25).trim() === selection.transition)
    .sort((first, second) => Number(first.slice(26, 29)) - Number(second.slice(26, 29)));
  const common = primary
    .filter((record) => record[19] === '5')
    .sort((first, second) => Number(first.slice(26, 29)) - Number(second.slice(26, 29)));
  if (transition.length === 0) {
    throw new Error(`${airport.icao} ${selection.id}/${selection.transition}: route segment missing`);
  }
  const airportCoordinate = indexes.airports.get(airport.icao);
  if (!airportCoordinate) throw new Error(`${airport.icao}: airport coordinate missing`);
  const route = uniqueRouteRecords([...transition, ...common])
    .filter((record) => record.slice(29, 34).trim() !== airport.icao)
    .map((record) => {
      const id = record.slice(29, 34).trim();
      const coordinate = indexes.terminalFixes.get(`${airport.icao}:${id}`) ?? indexes.globalFixes.get(id);
      if (!coordinate) throw new Error(`${airport.icao} ${selection.id}: coordinate missing for ${id}`);
      return { id, ...distanceAndBearing(airportCoordinate, coordinate), ...crossingConstraints(record) };
    });
  if (route.length < 2) throw new Error(`${airport.icao} ${selection.id}: route is too short`);
  const distances = route.map((fix) => fix.distanceNm);
  const minimumDistance = Math.min(...distances);
  const maximumDistance = Math.max(...distances);
  const tacticalDistance = (distanceNm) => {
    if (maximumDistance <= 40) return Math.max(6, distanceNm);
    if (maximumDistance === minimumDistance) return 40;
    return 8 + (distanceNm - minimumDistance) / (maximumDistance - minimumDistance) * 32;
  };
  const allRunwayIds = runwayIdsForAirport(records, airport.icao);
  if (allRunwayIds.length === 0) throw new Error(`${airport.icao}: runway records missing`);
  return {
    id: selection.id,
    kind: 'arrival',
    compatibleRunwayIds: compatibleRunwayIds(primary, allRunwayIds),
    entryTransition: selection.transition,
    fixes: route.map(({ id, bearing, distanceNm, ...constraints }) => ({
      id,
      bearing: Number(bearing.toFixed(1)),
      distanceNm: Number(tacticalDistance(distanceNm).toFixed(1)),
      ...constraints,
    })),
  };
}

function generate(records) {
  const indexes = buildIndexes(records);
  return SELECTED_AIRPORTS.map((airport) => ({
    airportId: airport.airportId,
    packVersion: PACK_VERSION,
    referenceCycle: `FAA CIFP ${CYCLE} · ${EFFECTIVE_FROM}–${EFFECTIVE_TO}`,
    effectiveFrom: EFFECTIVE_FROM,
    effectiveTo: EFFECTIVE_TO,
    generatedFrom: 'FAA CIFP · ARINC 424-18',
    procedures: airport.arrivals.map((selection) => buildProcedure(records, indexes, airport, selection)),
    sources: [{
      publisher: 'FAA',
      title: `Coded Instrument Flight Procedures, cycle ${CYCLE}`,
      url: SOURCE_URL,
      purpose: 'Machine-readable STAR identifiers, transition order, runway compatibility and crossing constraints',
      accessedOn: '2026-08-24',
    }],
    gameOnlyNotice: 'Published route order and represented constraints are retained; coordinates are projected into a compact tactical sector and are not for navigation.',
  }));
}

function render(packs) {
  const json = JSON.stringify(packs, null, 2);
  return `/* This file is generated by scripts/import-faa-cifp.mjs. Do not edit manually. */\n`
    + `import type { PublishedProcedurePack } from '../airportOperations';\n\n`
    + `export const FAA_CIFP_PROCEDURE_PACKS: PublishedProcedurePack[] = ${json};\n`;
}

const { input, output } = parseArguments(process.argv.slice(2));
const contents = await readFile(input, 'utf8');
const records = contents.split(/\r?\n/).filter(Boolean);
if (records.length === 0 || records.some((record) => record.length !== 132)) {
  throw new Error('Expected non-empty 132-column FAA CIFP records');
}
const packs = generate(records);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, render(packs), 'utf8');
console.log(`Generated ${packs.reduce((sum, pack) => sum + pack.procedures.length, 0)} STARs for ${packs.length} airports -> ${output}`);
