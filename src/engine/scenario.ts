import type { Aircraft, GameMode, GameState, RadarWorld } from './types';
import { planTraffic } from './trafficDirector';
import { createAircraft, HEAVY_PERFORMANCE, JET_PERFORMANCE } from './aircraftData';
import { profileForSkill } from './skill';
import { difficultyConfig, modeTrafficProfile } from './difficulty';

export interface GameScenario {
  id: 'alpha' | 'coastal' | 'metro' | 'highland';
  label: string;
  briefing: string;
  focus: string;
  world: RadarWorld;
  initialAircraft: Aircraft[];
}

const alphaWorld: RadarWorld = {
  airport: 'ISTANBUL AIRPORT', sectorName: 'APPROACH · IST NORTH SECTOR', rangeNm: 42,
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

const metroWorld: RadarWorld = {
  airport: 'METRO GATEWAY', sectorName: 'APPROACH · METRO SECTOR', rangeNm: 34,
  runways: [
    { id: '22', reciprocal: '04', center: { x: -0.9, y: 0.4 }, heading: 220, lengthNm: 1.86, active: true, operation: 'arrival' },
    { id: '27', reciprocal: '09', center: { x: 1.8, y: -1.8 }, heading: 270, lengthNm: 1.54, active: true, operation: 'departure' },
  ],
  fixes: [
    { id: 'NORTH', position: { x: -8, y: -25 } }, { id: 'EAST', position: { x: 24, y: 8 } },
    { id: 'SOUTH', position: { x: 9, y: 24 } }, { id: 'WEST', position: { x: -24, y: 6 } },
    { id: 'FINAL22', position: { x: 11, y: -10 } }, { id: 'EXIT27', position: { x: -22, y: -2 } },
  ],
  procedures: [
    { id: 'NORTH-METRO', kind: 'arrival', runwayId: '22', fixIds: ['NORTH', 'FINAL22'] },
    { id: 'EAST-METRO', kind: 'arrival', runwayId: '22', fixIds: ['EAST', 'FINAL22'] },
    { id: 'SOUTH-METRO', kind: 'arrival', runwayId: '22', fixIds: ['SOUTH', 'FINAL22'] },
    { id: 'EXIT27-METRO', kind: 'departure', fixIds: ['EXIT27'] },
  ],
  trafficEntries: [
    { id: 'NORTH', position: { x: -8, y: -25 }, procedureId: 'NORTH-METRO', compatibleRunwayIds: ['22'] },
    { id: 'EAST', position: { x: 24, y: 8 }, procedureId: 'EAST-METRO', compatibleRunwayIds: ['22'] },
    { id: 'SOUTH', position: { x: 9, y: 24 }, procedureId: 'SOUTH-METRO', compatibleRunwayIds: ['22'] },
  ],
  trafficExits: [{ id: 'EXIT27', procedureId: 'EXIT27-METRO' }],
  flowConfigurations: [
    { id: 'metro-standard', label: 'METRO · STANDART', arrivalRunwayIds: ['22'], departureRunwayIds: ['27'], windDirection: 225, windSpeedKt: 8, visibilityNm: 10, qnh: 1017 },
    { id: 'metro-lowvis', label: 'METRO · DÜŞÜK GÖRÜŞ', arrivalRunwayIds: ['22'], departureRunwayIds: ['27'], windDirection: 215, windSpeedKt: 16, visibilityNm: 4, qnh: 1005 },
  ],
};

const highlandWorld: RadarWorld = {
  airport: 'HIGHLAND INTERNATIONAL', sectorName: 'APPROACH · HIGHLAND SECTOR', rangeNm: 38,
  runways: [
    { id: '14', reciprocal: '32', center: { x: -1.4, y: 0.8 }, heading: 140, lengthNm: 1.78, active: true, operation: 'arrival' },
    { id: '15', reciprocal: '33', center: { x: 2.1, y: -1.7 }, heading: 150, lengthNm: 1.71, active: true, operation: 'departure' },
  ],
  fixes: [
    { id: 'RIDGE', position: { x: -23, y: -15 } }, { id: 'VALLEY', position: { x: 24, y: -12 } },
    { id: 'PASS', position: { x: -17, y: 18 } }, { id: 'FINAL14', position: { x: -10, y: 10 } },
    { id: 'EXIT15', position: { x: 23, y: 17 } },
  ],
  procedures: [
    { id: 'RIDGE-HIGH', kind: 'arrival', runwayId: '14', fixIds: ['RIDGE', 'FINAL14'] },
    { id: 'VALLEY-HIGH', kind: 'arrival', runwayId: '14', fixIds: ['VALLEY', 'FINAL14'] },
    { id: 'PASS-HIGH', kind: 'arrival', runwayId: '14', fixIds: ['PASS', 'FINAL14'] },
    { id: 'EXIT15-HIGH', kind: 'departure', fixIds: ['EXIT15'] },
  ],
  trafficEntries: [
    { id: 'RIDGE', position: { x: -23, y: -15 }, procedureId: 'RIDGE-HIGH', compatibleRunwayIds: ['14'] },
    { id: 'VALLEY', position: { x: 24, y: -12 }, procedureId: 'VALLEY-HIGH', compatibleRunwayIds: ['14'] },
    { id: 'PASS', position: { x: -17, y: 18 }, procedureId: 'PASS-HIGH', compatibleRunwayIds: ['14'] },
  ],
  trafficExits: [{ id: 'EXIT15', procedureId: 'EXIT15-HIGH' }],
  flowConfigurations: [
    { id: 'highland-calm', label: 'HIGHLAND · SAKİN HAVA', arrivalRunwayIds: ['14'], departureRunwayIds: ['15'], windDirection: 135, windSpeedKt: 7, visibilityNm: 12, qnh: 1019 },
    { id: 'highland-front', label: 'HIGHLAND · HAVA CEPHESİ', arrivalRunwayIds: ['14'], departureRunwayIds: ['15'], windDirection: 185, windSpeedKt: 24, visibilityNm: 5, qnh: 997 },
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

const metroAircraft: Aircraft[] = [
  createAircraft({ callsign: 'MG104', type: 'A320', phase: 'arrival', position: { x: 12, y: -16 }, heading: 310, altitude: 7000, speed: 230, targetHeading: 310, targetAltitude: 7000, targetSpeed: 230, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '22' }),
  createAircraft({ callsign: 'MG602', type: 'B738', phase: 'arrival', position: { x: -9, y: -25 }, heading: 18, altitude: 9000, speed: 250, targetHeading: 18, targetAltitude: 9000, targetSpeed: 250, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '22' }),
  createAircraft({ callsign: 'MG711', type: 'A330', phase: 'departure', position: { x: 2, y: -1.8 }, heading: 270, altitude: 3000, speed: 205, targetHeading: 270, targetAltitude: 11000, targetSpeed: 275, turnDirection: 'shortest', performance: HEAVY_PERFORMANCE, navigation: { mode: 'route', fixIds: ['EXIT27'], currentLegIndex: 0, procedure: 'EXIT27-METRO' } }),
];

const highlandAircraft: Aircraft[] = [
  createAircraft({ callsign: 'HL208', type: 'A21N', phase: 'arrival', position: { x: -11, y: 12 }, heading: 140, altitude: 3100, speed: 185, targetHeading: 140, targetAltitude: 3100, targetSpeed: 185, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '14' }),
  createAircraft({ callsign: 'HL431', type: 'B738', phase: 'arrival', position: { x: 24, y: -12 }, heading: 285, altitude: 9500, speed: 255, targetHeading: 285, targetAltitude: 9500, targetSpeed: 255, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '14' }),
  createAircraft({ callsign: 'HL777', type: 'B77W', phase: 'departure', position: { x: 2.5, y: -2 }, heading: 150, altitude: 3200, speed: 205, targetHeading: 150, targetAltitude: 12000, targetSpeed: 280, turnDirection: 'shortest', performance: HEAVY_PERFORMANCE, navigation: { mode: 'route', fixIds: ['EXIT15'], currentLegIndex: 0, procedure: 'EXIT15-HIGH' } }),
];

export const scenarioCatalog: GameScenario[] = [
  {
    id: 'alpha', label: 'IST · PARALEL AKIŞ',
    briefing: 'Çift yaklaşma pistinde gelişleri dağıt; kalkışları güvenli şekilde sektörden çıkar.',
    focus: 'Paralel final, wake aralığı ve kalkış handoff’u', world: alphaWorld, initialAircraft: alphaAircraft,
  },
  {
    id: 'coastal', label: 'COASTAL · ÇAPRAZ RÜZGÂR',
    briefing: 'Çapraz rüzgâr altında iki finali yönet. Hız kontrolü, son yaklaşma aralığını belirler.',
    focus: 'Hız yönetimi ve rüzgâr telafisi', world: coastalWorld, initialAircraft: coastalAircraft,
  },
  {
    id: 'metro', label: 'METRO · TEK PİST',
    briefing: 'Tek iniş pisti, sınırlı kapasite. Sıralamayı erken kur; gerekirse HOLD ve go-around kullan.',
    focus: 'Sıralama, holding ve pist kapasitesi', world: metroWorld, initialAircraft: metroAircraft,
  },
  {
    id: 'highland', label: 'HIGHLAND · HAVA CEPHESİ',
    briefing: 'Tek piste gelen akışı, yaklaşan hava cephesi ve düşen görüş altında koru.',
    focus: 'Düşük görüş, rüzgâr ve erken yaklaşma kararı', world: highlandWorld, initialAircraft: highlandAircraft,
  },
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

export function createInitialState(scenario: GameScenario = defaultScenario, mode: GameMode = 'normal'): GameState {
  const config = difficultyConfig(mode);
  const initialAircraft = structuredClone(scenario.initialAircraft.slice(0, config.initialAircraft));
  const trainingAircraft = initialAircraft.find((item) => item.phase === 'arrival');
  const flowId = scenario.world.flowConfigurations[0]?.id ?? 'default';
  const initialProfile = modeTrafficProfile(mode, profileForSkill(config.initialSkill));
  const welcome = { id: 'welcome', type: 'info' as const, message: `Radar contact: ${trainingAircraft?.callsign ?? 'ilk geliş'}. Heading, irtifa ve hızla ${trainingAircraft?.assignedRunway ?? ''} finaline vektörle; sonra ILS'i silahlandır.` };
  return {
    mode, elapsedSeconds: 0, paused: false, timeScale: config.timeScale, aircraft: initialAircraft, conflicts: [],
    selectedCallsign: trainingAircraft?.callsign ?? null, skill: config.initialSkill, peakSkill: config.initialSkill, targetAircraft: initialProfile.targetAircraft,
    score: Math.round(config.initialSkill * 10), landed: 0, spawned: 0, trafficLevel: initialProfile.level, nextTrafficAt: initialProfile.spawnInterval,
    runwayAvailableAt: {}, eventLog: [welcome],
    activeLossPairs: [], handoffs: 0, flowId,
    trackHistory: Object.fromEntries(initialAircraft.map((item) => [item.callsign, [{ ...item.position }]])),
    lastTrackAt: 0, pendingInstructions: [],
    metrics: { separationLosses: 0, goArounds: 0, missedHandoffs: 0, expiredPriorities: 0, unmanagedArrivals: 0, wakeViolations: 0 },
    eventTimeline: [welcome], seed: 73421, commandHistory: [],
  };
}

export const initialState = createInitialState();

export function spawnTraffic(index: number, activeWorld: RadarWorld = world): Aircraft {
  return planTraffic(index, [], activeWorld).aircraft;
}
