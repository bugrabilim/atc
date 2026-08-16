import type { Aircraft, GameState, RadarWorld } from './types';

const jet = {
  turnRateDegPerSecond: 3,
  climbRateFpm: 2200,
  descentRateFpm: 1800,
  accelerationKtPerSecond: 2.2,
  minSpeed: 140,
  maxSpeed: 480,
};

const heavy = {
  turnRateDegPerSecond: 2.2,
  climbRateFpm: 1700,
  descentRateFpm: 1500,
  accelerationKtPerSecond: 1.4,
  minSpeed: 150,
  maxSpeed: 500,
};

export const world: RadarWorld = {
  airport: 'NOVA INTERNATIONAL',
  sectorName: 'APPROACH · ALPHA SECTOR',
  rangeNm: 42,
  runways: [
    { id: '34R', reciprocal: '16L', center: { x: -3.8, y: 2 }, heading: 354, lengthNm: 2.03, active: false, operation: 'inactive' },
    { id: '34L', reciprocal: '16R', center: { x: -1.9, y: 1.7 }, heading: 354, lengthNm: 2.03, active: true, operation: 'arrival' },
    { id: '35R', reciprocal: '17L', center: { x: 1, y: 1.4 }, heading: 354, lengthNm: 2.21, active: true, operation: 'arrival' },
    { id: '35L', reciprocal: '17R', center: { x: 2.9, y: 1.1 }, heading: 354, lengthNm: 2.21, active: false, operation: 'inactive' },
    { id: '36', reciprocal: '18', center: { x: 5.7, y: 0.6 }, heading: 354, lengthNm: 1.65, active: true, operation: 'departure' },
  ],
  fixes: [
    { id: 'GATE1', position: { x: -24, y: -19 } },
    { id: 'GATE2', position: { x: 24, y: -17 } },
    { id: 'GATE3', position: { x: -29, y: 13 } },
    { id: 'EXIT1', position: { x: 27, y: 16 } },
    { id: 'FINAL1', position: { x: -8, y: -13 } },
    { id: 'FINAL2', position: { x: 8, y: -13 } },
  ],
};

const aircraft: Aircraft[] = [
  {
    callsign: 'AR101', type: 'A321', phase: 'arrival', position: { x: -1.65, y: 6 },
    heading: 354, altitude: 1500, speed: 160, targetHeading: 354, targetAltitude: 1500, targetSpeed: 160,
    turnDirection: 'shortest', performance: jet,
    assignedRunway: '34L',
  },
  {
    callsign: 'NX204', type: 'B738', phase: 'arrival', position: { x: 20, y: -17 },
    heading: 316, altitude: 8000, speed: 260, targetHeading: 316, targetAltitude: 8000, targetSpeed: 260,
    turnDirection: 'shortest', performance: jet,
    assignedRunway: '35R',
    navigation: { mode: 'route', fixIds: ['GATE2', 'FINAL2'], currentLegIndex: 0, procedure: 'GATE2 1K' },
  },
  {
    callsign: 'VX810', type: 'B77W', phase: 'departure', position: { x: 5.7, y: 3.5 },
    heading: 354, altitude: 3200, speed: 210, targetHeading: 354, targetAltitude: 12000, targetSpeed: 280,
    turnDirection: 'shortest', performance: heavy,
  },
];

export const initialState: GameState = {
  elapsedSeconds: 0,
  paused: false,
  timeScale: 1,
  aircraft,
  conflicts: [],
  selectedCallsign: 'AR101',
  score: 0,
  landed: 0,
  spawned: 0,
  trafficLevel: 1,
  nextTrafficAt: 42,
  runwayAvailableAt: {},
  eventLog: [
    { id: 'welcome', type: 'info', message: 'Eğitim: AR101 için ILS 34L yaklaşmasını başlat.' },
  ],
  activeLossPairs: [],
  handoffs: 0,
};

const arrivalLanes = [
  { position: { x: -25, y: -19 }, fixes: ['GATE1', 'FINAL1'], runway: '34L' },
  { position: { x: 25, y: -17 }, fixes: ['GATE2', 'FINAL2'], runway: '35R' },
  { position: { x: -29, y: 13 }, fixes: ['GATE3', 'FINAL1'], runway: '34L' },
  { position: { x: 29, y: 12 }, fixes: ['GATE2', 'FINAL2'], runway: '35R' },
] as const;

const aircraftTypes = ['A220', 'A320', 'A21N', 'B738', 'B39M', 'E190'] as const;
const callsignPrefixes = ['AR', 'NX', 'OR', 'VX', 'SK'] as const;

function headingTo(from: { x: number; y: number }, to: { x: number; y: number }) {
  return (Math.atan2(to.x - from.x, -(to.y - from.y)) * 180 / Math.PI + 360) % 360;
}

export function spawnTraffic(index: number): Aircraft {
  const suffix = String(310 + index * 13).padStart(3, '0');
  const callsign = `${callsignPrefixes[index % callsignPrefixes.length]}${suffix}`;

  if (index % 5 === 3) {
    const altitude = 9000 + (index % 4) * 1500;
    return {
      callsign,
      type: index % 2 === 0 ? 'B77W' : 'A330',
      phase: 'departure',
      position: { x: 5.7, y: 2 },
      heading: 354,
      altitude: 2600,
      speed: 185,
      targetHeading: 354,
      targetAltitude: altitude,
      targetSpeed: 285,
      turnDirection: 'shortest',
      performance: heavy,
      navigation: { mode: 'route', fixIds: ['EXIT1'], currentLegIndex: 0, procedure: 'EXIT1 1E' },
    };
  }

  const lane = arrivalLanes[index % arrivalLanes.length];
  const entryFix = world.fixes.find((fix) => fix.id === lane.fixes[0]);
  if (!entryFix) throw new Error(`Missing entry fix ${lane.fixes[0]}`);
  const altitude = 7000 + ((index * 1100) % 6000);
  const speed = 235 + ((index * 17) % 55);
  const heading = headingTo(lane.position, entryFix.position);
  return {
    callsign,
    type: aircraftTypes[index % aircraftTypes.length],
    phase: 'arrival',
    position: { ...lane.position },
    heading,
    altitude,
    speed,
    targetHeading: heading,
    targetAltitude: altitude,
    targetSpeed: speed,
    turnDirection: 'shortest',
    performance: jet,
    assignedRunway: lane.runway,
    navigation: {
      mode: 'route',
      fixIds: [...lane.fixes],
      currentLegIndex: 0,
      procedure: `${lane.fixes[0]} 1K`,
    },
  };
}
