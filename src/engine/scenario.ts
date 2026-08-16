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
  procedures: [
    { id: 'GATE1-ALPHA', kind: 'arrival', runwayId: '34L', fixIds: ['GATE1', 'FINAL1'] },
    { id: 'GATE2-BRAVO', kind: 'arrival', runwayId: '35R', fixIds: ['GATE2', 'FINAL2'] },
    { id: 'GATE3-ALPHA', kind: 'arrival', runwayId: '34L', fixIds: ['GATE3', 'FINAL1'] },
    { id: 'EXIT1-DEPARTURE', kind: 'departure', fixIds: ['EXIT1'] },
  ],
  trafficEntries: [
    { id: 'GATE1', position: { x: -25, y: -19 }, procedureId: 'GATE1-ALPHA', compatibleRunwayIds: ['34L'] },
    { id: 'GATE2', position: { x: 25, y: -17 }, procedureId: 'GATE2-BRAVO', compatibleRunwayIds: ['35R'] },
    { id: 'GATE3', position: { x: -29, y: 13 }, procedureId: 'GATE3-ALPHA', compatibleRunwayIds: ['34L'] },
  ],
  trafficExits: [{ id: 'EXIT1', procedureId: 'EXIT1-DEPARTURE' }],
  flowConfigurations: [
    { id: 'north-parallel', label: 'KUZEY · PARALEL', arrivalRunwayIds: ['34L', '35R'], departureRunwayIds: ['36'], windDirection: 350, windSpeedKt: 10, visibilityNm: 10, qnh: 1016 },
    { id: 'north-single', label: 'KUZEY · TEK PİST', arrivalRunwayIds: ['34L'], departureRunwayIds: ['36'], windDirection: 340, windSpeedKt: 18, visibilityNm: 7, qnh: 1009 },
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
  procedures: [
    { id: 'GATE1-COAST', kind: 'arrival', runwayId: '09L', fixIds: ['GATE1', 'FINAL1'] },
    { id: 'GATE2-COAST', kind: 'arrival', runwayId: '09R', fixIds: ['GATE2', 'FINAL2'] },
    { id: 'GATE3-COAST', kind: 'arrival', runwayId: '09L', fixIds: ['GATE3', 'FINAL1'] },
    { id: 'EXIT1-COAST', kind: 'departure', fixIds: ['EXIT1'] },
  ],
  trafficEntries: [
    { id: 'GATE1', position: { x: -23, y: -18 }, procedureId: 'GATE1-COAST', compatibleRunwayIds: ['09L'] },
    { id: 'GATE2', position: { x: 22, y: -20 }, procedureId: 'GATE2-COAST', compatibleRunwayIds: ['09R'] },
    { id: 'GATE3', position: { x: -25, y: 15 }, procedureId: 'GATE3-COAST', compatibleRunwayIds: ['09L'] },
  ],
  trafficExits: [{ id: 'EXIT1', procedureId: 'EXIT1-COAST' }],
  flowConfigurations: [
    { id: 'east-crosswind', label: 'DOĞU · ÇAPRAZ RÜZGÂR', arrivalRunwayIds: ['09L', '09R'], departureRunwayIds: ['18'], windDirection: 145, windSpeedKt: 16, visibilityNm: 8, qnh: 1012 },
    { id: 'east-single', label: 'DOĞU · TEK PİST', arrivalRunwayIds: ['09L'], departureRunwayIds: ['18'], windDirection: 95, windSpeedKt: 9, visibilityNm: 10, qnh: 1018 },
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

export function worldWithFlow(world: RadarWorld, flowId: string): RadarWorld {
  const flow = world.flowConfigurations.find((item) => item.id === flowId) ?? world.flowConfigurations[0];
  if (!flow) return world;
  return {
    ...world,
    runways: world.runways.map((runway) => {
      const arrival = flow.arrivalRunwayIds.includes(runway.id);
      const departure = flow.departureRunwayIds.includes(runway.id);
      return {
        ...runway,
        active: arrival || departure,
        operation: arrival && departure ? 'mixed' : arrival ? 'arrival' : departure ? 'departure' : 'inactive',
      };
    }),
  };
}

export function createInitialState(scenario: GameScenario = defaultScenario): GameState {
  const trainingAircraft = scenario.initialAircraft.find((item) => item.phase === 'arrival');
  const flowId = scenario.world.flowConfigurations[0]?.id ?? 'default';
  return {
    elapsedSeconds: 0, paused: false, timeScale: 2, aircraft: structuredClone(scenario.initialAircraft), conflicts: [],
    selectedCallsign: trainingAircraft?.callsign ?? null, score: 0, landed: 0, spawned: 0, trafficLevel: 1, nextTrafficAt: 18,
    runwayAvailableAt: {}, eventLog: [{ id: 'welcome', type: 'info', message: `Eğitim: ${trainingAircraft?.callsign ?? 'ilk geliş'} için ILS ${trainingAircraft?.assignedRunway ?? ''} yaklaşmasını başlat.` }],
    activeLossPairs: [], handoffs: 0, flowId,
    trackHistory: Object.fromEntries(scenario.initialAircraft.map((item) => [item.callsign, [{ ...item.position }]])),
    lastTrackAt: 0, pendingInstructions: [],
    metrics: { separationLosses: 0, goArounds: 0, missedHandoffs: 0, expiredPriorities: 0 },
  };
}

export const initialState = createInitialState();

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
    const exit = activeWorld.trafficExits[index % activeWorld.trafficExits.length];
    const procedure = activeWorld.procedures.find((item) => item.id === exit?.procedureId);
    return { callsign, type: index % 2 === 0 ? 'B77W' : 'A330', phase: 'departure', position: { ...departureRunway.center }, heading: departureRunway.heading, altitude: 2600, speed: 185, targetHeading: departureRunway.heading, targetAltitude: altitude, targetSpeed: 285, turnDirection: 'shortest', performance: heavy, navigation: { mode: 'route', fixIds: [...(procedure?.fixIds ?? [])], currentLegIndex: 0, procedure: procedure?.id ?? 'DEPARTURE' } };
  }
  const entry = activeWorld.trafficEntries[index % activeWorld.trafficEntries.length];
  const procedure = activeWorld.procedures.find((item) => item.id === entry?.procedureId);
  const entryFix = activeWorld.fixes.find((fix) => fix.id === entry?.id);
  const arrivalRunways = activeWorld.runways.filter((runway) => runway.active && (runway.operation === 'arrival' || runway.operation === 'mixed'));
  if (!entry || !entryFix || !procedure || arrivalRunways.length === 0) throw new Error('Scenario must define entry fixes, procedures and active arrival runways');
  const compatibleRunways = arrivalRunways.filter((runway) => entry.compatibleRunwayIds.includes(runway.id));
  const runwayPool = compatibleRunways.length > 0 ? compatibleRunways : arrivalRunways;
  const altitude = 7000 + ((index * 1100) % 6000);
  const speed = 235 + ((index * 17) % 55);
  const heading = headingTo(entry.position, entryFix.position);
  return { callsign, type: aircraftTypes[index % aircraftTypes.length], phase: 'arrival', position: { ...entry.position }, heading, altitude, speed, targetHeading: heading, targetAltitude: altitude, targetSpeed: speed, turnDirection: 'shortest', performance: jet, assignedRunway: runwayPool[index % runwayPool.length].id, navigation: { mode: 'route', fixIds: [...procedure.fixIds], currentLegIndex: 0, procedure: procedure.id } };
}
