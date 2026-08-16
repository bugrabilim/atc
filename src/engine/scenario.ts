import type { Aircraft, GameState, RadarWorld } from './types';

const jet = { turnRateDegPerSecond: 3, climbRateFpm: 2200, descentRateFpm: 1800, accelerationKtPerSecond: 2.2, minSpeed: 140, maxSpeed: 480 };
const heavy = { turnRateDegPerSecond: 2.2, climbRateFpm: 1700, descentRateFpm: 1500, accelerationKtPerSecond: 1.4, minSpeed: 150, maxSpeed: 500 };

export interface GameScenario {
  id: 'alpha' | 'coastal';
  label: string;
  world: RadarWorld;
  initialAircraft: Aircraft[];
}

const alphaWorld: RadarWorld = {
  airport: 'NOVA INTERNATIONAL', sectorName: 'APPROACH · ALPHA SECTOR', rangeNm: 42,
  runways: [
    { id: '34R', reciprocal: '16L', center: { x: -3.8, y: 2 }, heading: 354, lengthNm: 2.03, active: false, operation: 'inactive' },
    { id: '34L', reciprocal: '16R', center: { x: -1.9, y: 1.7 }, heading: 354, lengthNm: 2.03, active: true, operation: 'arrival' },
    { id: '35R', reciprocal: '17L', center: { x: 1, y: 1.4 }, heading: 354, lengthNm: 2.21, active: true, operation: 'arrival' },
    { id: '35L', reciprocal: '17R', center: { x: 2.9, y: 1.1 }, heading: 354, lengthNm: 2.21, active: false, operation: 'inactive' },
    { id: '36', reciprocal: '18', center: { x: 5.7, y: 0.6 }, heading: 354, lengthNm: 1.65, active: true, operation: 'departure' },
  ],
  fixes: [
    { id: 'GATE1', position: { x: -24, y: -19 } }, { id: 'GATE2', position: { x: 24, y: -17 } },
    { id: 'GATE3', position: { x: -29, y: 13 } }, { id: 'EXIT1', position: { x: 27, y: 16 } },
    { id: 'FINAL1', position: { x: -8, y: -13 } }, { id: 'FINAL2', position: { x: 8, y: -13 } },
  ],
};

const coastalWorld: RadarWorld = {
  airport: 'COASTAL GATEWAY', sectorName: 'APPROACH · COASTAL SECTOR', rangeNm: 36,
  runways: [
    { id: '09L', reciprocal: '27R', center: { x: -1.8, y: 0.6 }, heading: 90, lengthNm: 1.9, active: true, operation: 'arrival' },
    { id: '09R', reciprocal: '27L', center: { x: 1.2, y: -1.4 }, heading: 90, lengthNm: 1.9, active: true, operation: 'arrival' },
    { id: '18', reciprocal: '36', center: { x: 3.8, y: 2.8 }, heading: 180, lengthNm: 1.55, active: true, operation: 'departure' },
  ],
  fixes: [
    { id: 'GATE1', position: { x: -23, y: -18 } }, { id: 'GATE2', position: { x: 22, y: -20 } },
    { id: 'GATE3', position: { x: -25, y: 15 } }, { id: 'EXIT1', position: { x: 21, y: 23 } },
    { id: 'FINAL1', position: { x: -12, y: -5 } }, { id: 'FINAL2', position: { x: -12, y: 5 } },
  ],
};

const alphaAircraft: Aircraft[] = [
  { callsign: 'AR101', type: 'A321', phase: 'arrival', position: { x: -1.65, y: 6 }, heading: 354, altitude: 1500, speed: 160, targetHeading: 354, targetAltitude: 1500, targetSpeed: 160, turnDirection: 'shortest', performance: jet, assignedRunway: '34L' },
  { callsign: 'NX204', type: 'B738', phase: 'arrival', position: { x: 20, y: -17 }, heading: 316, altitude: 8000, speed: 260, targetHeading: 316, targetAltitude: 8000, targetSpeed: 260, turnDirection: 'shortest', performance: jet, assignedRunway: '35R', navigation: { mode: 'route', fixIds: ['GATE2', 'FINAL2'], currentLegIndex: 0, procedure: 'GATE2 1K' } },
  { callsign: 'VX810', type: 'B77W', phase: 'departure', position: { x: 5.7, y: 3.5 }, heading: 354, altitude: 3200, speed: 210, targetHeading: 354, targetAltitude: 12000, targetSpeed: 280, turnDirection: 'shortest', performance: heavy },
];

const coastalAircraft: Aircraft[] = [
  { callsign: 'CF101', type: 'A320', phase: 'arrival', position: { x: -8, y: 0.6 }, heading: 90, altitude: 1600, speed: 165, targetHeading: 90, targetAltitude: 1600, targetSpeed: 165, turnDirection: 'shortest', performance: jet, assignedRunway: '09L' },
  { callsign: 'OR330', type: 'E190', phase: 'arrival', position: { x: 18, y: -20 }, heading: 316, altitude: 7000, speed: 250, targetHeading: 316, targetAltitude: 7000, targetSpeed: 250, turnDirection: 'shortest', performance: jet, assignedRunway: '09R', navigation: { mode: 'route', fixIds: ['GATE2', 'FINAL2'], currentLegIndex: 0, procedure: 'GATE2 2C' } },
  { callsign: 'SK721', type: 'A330', phase: 'departure', position: { x: 3.8, y: 1.8 }, heading: 180, altitude: 3000, speed: 205, targetHeading: 180, targetAltitude: 11000, targetSpeed: 275, turnDirection: 'shortest', performance: heavy },
];

export const scenarioCatalog: GameScenario[] = [
  { id: 'alpha', label: 'ALPHA · PARALLEL', world: alphaWorld, initialAircraft: alphaAircraft },
  { id: 'coastal', label: 'COASTAL · CROSSWIND', world: coastalWorld, initialAircraft: coastalAircraft },
];

export const defaultScenario = scenarioCatalog[0];
export const world = defaultScenario.world;

export function createInitialState(scenario: GameScenario = defaultScenario): GameState {
  const trainingAircraft = scenario.initialAircraft.find((item) => item.phase === 'arrival');
  return {
    elapsedSeconds: 0, paused: false, timeScale: 2, aircraft: structuredClone(scenario.initialAircraft), conflicts: [],
    selectedCallsign: trainingAircraft?.callsign ?? null, score: 0, landed: 0, spawned: 0, trafficLevel: 1, nextTrafficAt: 18,
    runwayAvailableAt: {}, eventLog: [{ id: 'welcome', type: 'info', message: `Eğitim: ${trainingAircraft?.callsign ?? 'ilk geliş'} için ILS ${trainingAircraft?.assignedRunway ?? ''} yaklaşmasını başlat.` }],
    activeLossPairs: [], handoffs: 0,
  };
}

export const initialState = createInitialState();

const arrivalLanes = [
  { position: { x: -25, y: -19 }, fixes: ['GATE1', 'FINAL1'] }, { position: { x: 25, y: -17 }, fixes: ['GATE2', 'FINAL2'] },
  { position: { x: -29, y: 13 }, fixes: ['GATE3', 'FINAL1'] }, { position: { x: 29, y: 12 }, fixes: ['GATE2', 'FINAL2'] },
] as const;
const aircraftTypes = ['A220', 'A320', 'A21N', 'B738', 'B39M', 'E190'] as const;
const callsignPrefixes = ['AR', 'NX', 'OR', 'VX', 'SK'] as const;

function headingTo(from: { x: number; y: number }, to: { x: number; y: number }) {
  return (Math.atan2(to.x - from.x, -(to.y - from.y)) * 180 / Math.PI + 360) % 360;
}

export function spawnTraffic(index: number, activeWorld: RadarWorld = world): Aircraft {
  const suffix = String(310 + index * 13).padStart(3, '0');
  const callsign = `${callsignPrefixes[index % callsignPrefixes.length]}${suffix}`;
  const departureRunway = activeWorld.runways.find((runway) => runway.active && runway.operation === 'departure');
  if (index % 5 === 3 && departureRunway) {
    const altitude = 9000 + (index % 4) * 1500;
    return { callsign, type: index % 2 === 0 ? 'B77W' : 'A330', phase: 'departure', position: { ...departureRunway.center }, heading: departureRunway.heading, altitude: 2600, speed: 185, targetHeading: departureRunway.heading, targetAltitude: altitude, targetSpeed: 285, turnDirection: 'shortest', performance: heavy, navigation: { mode: 'route', fixIds: ['EXIT1'], currentLegIndex: 0, procedure: 'EXIT1 1E' } };
  }
  const lane = arrivalLanes[index % arrivalLanes.length];
  const entryFix = activeWorld.fixes.find((fix) => fix.id === lane.fixes[0]);
  const arrivalRunways = activeWorld.runways.filter((runway) => runway.active && (runway.operation === 'arrival' || runway.operation === 'mixed'));
  if (!entryFix || arrivalRunways.length === 0) throw new Error('Scenario must define entry fixes and active arrival runways');
  const altitude = 7000 + ((index * 1100) % 6000);
  const speed = 235 + ((index * 17) % 55);
  const heading = headingTo(lane.position, entryFix.position);
  return { callsign, type: aircraftTypes[index % aircraftTypes.length], phase: 'arrival', position: { ...lane.position }, heading, altitude, speed, targetHeading: heading, targetAltitude: altitude, targetSpeed: speed, turnDirection: 'shortest', performance: jet, assignedRunway: arrivalRunways[index % arrivalRunways.length].id, navigation: { mode: 'route', fixIds: [...lane.fixes], currentLegIndex: 0, procedure: `${lane.fixes[0]} 1K` } };
}
