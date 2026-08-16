import type { Aircraft, GameState, RadarWorld } from './types';
import { planTraffic } from './trafficDirector';
import { createAircraft, HEAVY_PERFORMANCE, JET_PERFORMANCE } from './aircraftData';
import { INITIAL_SKILL, profileForSkill } from './skill';

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
  createAircraft({ callsign: 'AR101', type: 'A321', phase: 'arrival', position: { x: -1.65, y: 6 }, heading: 354, altitude: 1200, speed: 170, targetHeading: 354, targetAltitude: 1200, targetSpeed: 170, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '34L' }),
  createAircraft({ callsign: 'NX204', type: 'B738', phase: 'arrival', position: { x: 20, y: -17 }, heading: 316, altitude: 8000, speed: 260, targetHeading: 316, targetAltitude: 8000, targetSpeed: 260, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '34L' }),
  createAircraft({ callsign: 'VX810', type: 'B77W', phase: 'departure', position: { x: 5.7, y: 3.5 }, heading: 354, altitude: 3200, speed: 210, targetHeading: 354, targetAltitude: 12000, targetSpeed: 280, turnDirection: 'shortest', performance: HEAVY_PERFORMANCE, navigation: { mode: 'route', fixIds: ['EXIT1'], currentLegIndex: 0, procedure: 'EXIT1-DEPARTURE' } }),
];

const coastalAircraft: Aircraft[] = [
  createAircraft({ callsign: 'CF101', type: 'A320', phase: 'arrival', position: { x: -8, y: 0.6 }, heading: 90, altitude: 1500, speed: 170, targetHeading: 90, targetAltitude: 1500, targetSpeed: 170, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '09L' }),
  createAircraft({ callsign: 'OR330', type: 'E190', phase: 'arrival', position: { x: 18, y: -20 }, heading: 316, altitude: 7000, speed: 250, targetHeading: 316, targetAltitude: 7000, targetSpeed: 250, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '09L' }),
  createAircraft({ callsign: 'SK721', type: 'A330', phase: 'departure', position: { x: 3.8, y: 1.8 }, heading: 180, altitude: 3000, speed: 205, targetHeading: 180, targetAltitude: 11000, targetSpeed: 275, turnDirection: 'shortest', performance: HEAVY_PERFORMANCE, navigation: { mode: 'route', fixIds: ['EXIT1'], currentLegIndex: 0, procedure: 'EXIT1-COAST' } }),
];

export const scenarioCatalog: GameScenario[] = [
  { id: 'alpha', label: 'ALPHA · PARALLEL', world: alphaWorld, initialAircraft: alphaAircraft },
  { id: 'coastal', label: 'COASTAL · CROSSWIND', world: coastalWorld, initialAircraft: coastalAircraft },
];

export const defaultScenario = scenarioCatalog[0];
export const world = defaultScenario.world;

export function worldWithFlow(world: RadarWorld, flowId: string, skill?: number): RadarWorld {
  const flow = world.flowConfigurations.find((item) => item.id === flowId) ?? world.flowConfigurations[0];
  if (!flow) return world;
  const availableArrivalRunways = skill !== undefined && skill < 7.5
    ? flow.arrivalRunwayIds.slice(0, 1)
    : flow.arrivalRunwayIds;
  return {
    ...world,
    activeFlowId: flow.id,
    runways: world.runways.map((runway) => {
      const arrival = availableArrivalRunways.includes(runway.id);
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
  const initialProfile = profileForSkill(INITIAL_SKILL);
  const welcome = { id: 'welcome', type: 'info' as const, message: `Radar contact: ${trainingAircraft?.callsign ?? 'ilk geliş'}. Heading, irtifa ve hızla ${trainingAircraft?.assignedRunway ?? ''} finaline vektörle; sonra ILS'i silahlandır.` };
  return {
    elapsedSeconds: 0, paused: false, timeScale: 2, aircraft: structuredClone(scenario.initialAircraft), conflicts: [],
    selectedCallsign: trainingAircraft?.callsign ?? null, skill: INITIAL_SKILL, peakSkill: INITIAL_SKILL, targetAircraft: initialProfile.targetAircraft,
    score: Math.round(INITIAL_SKILL * 10), landed: 0, spawned: 0, trafficLevel: initialProfile.level, nextTrafficAt: initialProfile.spawnInterval,
    runwayAvailableAt: {}, eventLog: [welcome],
    activeLossPairs: [], handoffs: 0, flowId,
    trackHistory: Object.fromEntries(scenario.initialAircraft.map((item) => [item.callsign, [{ ...item.position }]])),
    lastTrackAt: 0, pendingInstructions: [],
    metrics: { separationLosses: 0, goArounds: 0, missedHandoffs: 0, expiredPriorities: 0, unmanagedArrivals: 0, wakeViolations: 0 },
    eventTimeline: [welcome], seed: 73421, commandHistory: [],
  };
}

export const initialState = createInitialState();

export function spawnTraffic(index: number, activeWorld: RadarWorld = world): Aircraft {
  return planTraffic(index, [], activeWorld).aircraft;
}
