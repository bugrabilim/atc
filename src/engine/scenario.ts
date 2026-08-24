import type {
  Aircraft,
  FlowConfiguration,
  GameMode,
  GameState,
  RadarWorld,
  Runway,
  ScenarioId,
  Vector2,
} from './types';
import { planTraffic } from './trafficDirector';
import { createAircraft, HEAVY_PERFORMANCE, JET_PERFORMANCE } from './aircraftData';
import { profileForSkill } from './skill';
import { difficultyConfig, modeTrafficProfile } from './difficulty';
import { AIRPORT_DEFINITIONS, airportDefinitionById, type AirportDefinition, type AirportRunwayData } from './airportCatalog';
import { airportOperationsById, type BoundaryId } from './airportOperations';
import { publishedProcedurePackByAirportId } from './publishedProcedureCatalog';

export interface GameScenario {
  id: ScenarioId;
  rank: number;
  iata: string;
  icao: string;
  passengers2025: number;
  runwayCount: number;
  label: string;
  briefing: string;
  focus: string;
  world: RadarWorld;
  initialAircraft: Aircraft[];
}

const TRAFFIC_RANGE_NM = 42;
const BOUNDARY_DISTANCE_NM = 35;

function normalizeHeading(value: number) {
  return (value % 360 + 360) % 360;
}

function pointAtBearing(bearing: number, distance: number): Vector2 {
  const radians = bearing * Math.PI / 180;
  return { x: Math.sin(radians) * distance, y: -Math.cos(radians) * distance };
}

function runwayEnd(runway: AirportRunwayData, reverse = false) {
  return {
    id: reverse ? runway.highId : runway.lowId,
    reciprocal: reverse ? runway.lowId : runway.highId,
    heading: normalizeHeading(runway.heading + (reverse ? 180 : 0)),
  };
}

function finalPoint(runway: AirportRunwayData, reverse = false, distanceNm = 10): Vector2 {
  const end = runwayEnd(runway, reverse);
  const radians = end.heading * Math.PI / 180;
  return {
    x: runway.center.x - Math.sin(radians) * distanceNm,
    y: runway.center.y + Math.cos(radians) * distanceNm,
  };
}

function cardinal(heading: number) {
  const points = ['KUZEY', 'KUZEYDOĞU', 'DOĞU', 'GÜNEYDOĞU', 'GÜNEY', 'GÜNEYBATI', 'BATI', 'KUZEYBATI'];
  return points[Math.round(normalizeHeading(heading) / 45) % points.length];
}

function usableRunways(definition: AirportDefinition) {
  // The open runway feed also contains some heliport-size surfaces. They are
  // deliberately excluded from an airline terminal-area game.
  return definition.runways.filter((runway) => runway.lengthNm >= 0.6);
}

function flowForDirection(
  definition: AirportDefinition,
  runways: AirportRunwayData[],
  reverse: boolean,
  suffix: string,
  visibilityNm: number,
  windSpeedKt: number,
  singleRunway = false,
): FlowConfiguration {
  const arrivalPool = singleRunway ? runways.slice(0, 1) : runways.slice(0, Math.min(2, runways.length));
  const departurePool = runways.length > 2 ? runways.slice(2, 4) : runways.slice(-1);
  const arrivals = arrivalPool.map((runway) => runwayEnd(runway, reverse).id);
  const departures = departurePool.map((runway) => runwayEnd(runway, reverse).id);
  const referenceHeading = runwayEnd(runways[0]!, reverse).heading;
  return {
    id: `${definition.id}-${suffix}`,
    label: `${cardinal(referenceHeading)} · ${singleRunway ? 'DÜŞÜK GÖRÜŞ' : suffix === 'primary' ? 'ANA AKIŞ' : 'TERS AKIŞ'}`,
    arrivalRunwayIds: arrivals,
    departureRunwayIds: departures,
    windDirection: Math.round(referenceHeading),
    windSpeedKt,
    visibilityNm,
    qnh: suffix === 'lowvis' ? 1002 : suffix === 'reverse' ? 1009 : 1016,
  };
}

function makeRealAirportWorld(definition: AirportDefinition): RadarWorld {
  const runways = usableRunways(definition).sort((first, second) => second.lengthNm - first.lengthNm);
  if (runways.length === 0) throw new Error(`${definition.icao} has no usable runway data`);
  const operationsPack = airportOperationsById.get(definition.id);
  const procedurePack = publishedProcedurePackByAirportId.get(definition.id);

  const physicalRunways: Runway[] = runways.map((runway) => ({
    id: runway.lowId,
    reciprocal: runway.highId,
    center: { ...runway.center },
    heading: runway.heading,
    lengthNm: runway.lengthNm,
    active: false,
    operation: 'inactive',
  }));
  const boundaryFixes = ([
    ['NORTH', 0], ['EAST', 90], ['SOUTH', 180], ['WEST', 270],
  ] as const).map(([id, bearing]) => ({
    id,
    label: operationsPack?.boundaryLabels[id as BoundaryId] ?? id,
    position: pointAtBearing(bearing, BOUNDARY_DISTANCE_NM),
  }));
  const finalFixes = runways.flatMap((runway) => [
    { id: `FINAL${runway.lowId}`, position: finalPoint(runway) },
    { id: `FINAL${runway.highId}`, position: finalPoint(runway, true) },
  ]);
  const exitFixes = [
    { id: 'EXIT-NE', position: pointAtBearing(45, BOUNDARY_DISTANCE_NM + 2) },
    { id: 'EXIT-SW', position: pointAtBearing(225, BOUNDARY_DISTANCE_NM + 2) },
  ];
  const allRunwayIds = runways.flatMap((runway) => [runway.lowId, runway.highId]);
  const vectorProcedures = boundaryFixes.map((fix) => ({
    id: `${fix.id}-VECTOR`, kind: 'arrival' as const, fixIds: [fix.id],
  }));
  const approachProcedures = runways.flatMap((runway) => [
    { id: `ILS-${runway.lowId}`, kind: 'arrival' as const, runwayId: runway.lowId, fixIds: [`FINAL${runway.lowId}`] },
    { id: `ILS-${runway.highId}`, kind: 'arrival' as const, runwayId: runway.highId, fixIds: [`FINAL${runway.highId}`] },
  ]);
  const departureProcedures = [
    { id: `${definition.iata}-NE-DEPARTURE`, kind: 'departure' as const, fixIds: ['EXIT-NE'] },
    { id: `${definition.iata}-SW-DEPARTURE`, kind: 'departure' as const, fixIds: ['EXIT-SW'] },
  ];
  const publishedFixes = procedurePack?.procedures.flatMap((procedure) => procedure.fixes.map((fix) => ({
    id: fix.id,
    label: fix.id,
    position: pointAtBearing(fix.bearing, fix.distanceNm),
    minimumAltitudeFt: fix.minimumAltitudeFt,
    maximumAltitudeFt: fix.maximumAltitudeFt,
    maximumSpeedKt: fix.maximumSpeedKt,
  }))) ?? [];
  const uniquePublishedFixes = [...new Map(publishedFixes.map((fix) => [fix.id, fix])).values()];
  const publishedProcedures = procedurePack?.procedures.map((procedure) => ({
    id: procedure.id,
    kind: procedure.kind,
    fixIds: procedure.fixes.map((fix) => fix.id),
    compatibleRunwayIds: [...procedure.compatibleRunwayIds],
    source: 'published' as const,
  })) ?? [];
  const publishedArrivalEntries = publishedProcedures.filter((procedure) => procedure.kind === 'arrival').map((procedure) => {
    const entryFix = uniquePublishedFixes.find((fix) => fix.id === procedure.fixIds[0])!;
    return {
      id: entryFix.id,
      position: { ...entryFix.position },
      procedureId: procedure.id,
      compatibleRunwayIds: [...(procedure.compatibleRunwayIds ?? allRunwayIds)],
    };
  });
  const publishedDepartureExits = publishedProcedures.filter((procedure) => procedure.kind === 'departure').map((procedure) => ({
    id: procedure.fixIds.at(-1)!,
    procedureId: procedure.id,
    compatibleRunwayIds: [...(procedure.compatibleRunwayIds ?? allRunwayIds)],
  }));

  const flowConfigurations = operationsPack?.flows ?? [
      flowForDirection(definition, runways, false, 'primary', 12, 9),
      flowForDirection(definition, runways, true, 'reverse', 9, 15),
      flowForDirection(definition, runways, false, 'lowvis', 4, 20, true),
    ];
  const base: RadarWorld = {
    airport: `${definition.iata} · ${definition.name.toUpperCase()}`,
    sectorName: `${definition.icao} · ${definition.city.toUpperCase()} APPROACH`,
    rangeNm: definition.terrain === 'mountain' || definition.terrain === 'highland' || definition.terrain === 'desert' ? 46 : TRAFFIC_RANGE_NM,
    runways: physicalRunways,
    fixes: [...boundaryFixes, ...finalFixes, ...exitFixes, ...uniquePublishedFixes],
    procedures: [...publishedProcedures, ...vectorProcedures, ...approachProcedures, ...departureProcedures],
    trafficEntries: [...publishedArrivalEntries, ...boundaryFixes.map((fix) => ({
      id: fix.id,
      position: { ...fix.position },
      procedureId: `${fix.id}-VECTOR`,
      compatibleRunwayIds: allRunwayIds,
    }))],
    trafficExits: [
      ...publishedDepartureExits,
      { id: 'EXIT-NE', procedureId: `${definition.iata}-NE-DEPARTURE` },
      { id: 'EXIT-SW', procedureId: `${definition.iata}-SW-DEPARTURE` },
    ],
    flowConfigurations,
    operations: operationsPack ? {
      packVersion: operationsPack.packVersion,
      referenceCycle: operationsPack.referenceCycle,
      strategyLabel: operationsPack.strategyLabel,
      trafficPattern: [...operationsPack.trafficPattern],
      heavyArrivalEvery: operationsPack.heavyArrivalEvery,
      procedureReferences: [...operationsPack.procedureReferences],
      disruption: { ...operationsPack.disruption },
    } : undefined,
    environment: {
      terrain: definition.terrain,
      urbanDensity: definition.urbanDensity,
      cityBearing: definition.cityBearing,
      waterBearing: definition.waterBearing,
      mountainBearing: definition.mountainBearing,
      elevationFt: definition.elevationFt,
      city: definition.city,
      icao: definition.icao,
    },
  };
  return worldWithFlow(base, base.flowConfigurations[0]!.id, 10);
}

function makeInitialAircraft(definition: AirportDefinition, world: RadarWorld, flowId = world.flowConfigurations[0]!.id, skill = 10): Aircraft[] {
  const activeWorld = worldWithFlow(world, flowId, skill);
  const selectedFlow = activeWorld.flowConfigurations.find((flow) => flow.id === activeWorld.activeFlowId) ?? activeWorld.flowConfigurations[0]!;
  const arrivals = selectedFlow.arrivalRunwayIds
    .map((runwayId) => activeWorld.runways.find((runway) => runway.id === runwayId))
    .filter((runway): runway is Runway => Boolean(runway?.active && (runway.operation === 'arrival' || runway.operation === 'mixed')));
  const departures = activeWorld.runways.filter((runway) => runway.active && (runway.operation === 'departure' || runway.operation === 'mixed'));
  const arrivalRunway = arrivals[0] ?? activeWorld.runways[0]!;
  const secondRunway = definition.id === 'ist' ? arrivalRunway : arrivals[1] ?? arrivalRunway;
  const departureRunway = departures[0] ?? arrivalRunway;
  const prefix = definition.iata.slice(0, 2);
  const callsigns = definition.id === 'ist' ? ['AR101', 'NX204', 'VX810'] : [`${prefix}101`, `${prefix}204`, `${prefix}810`];
  const finalRadians = arrivalRunway.heading * Math.PI / 180;
  const firstPosition = {
    x: arrivalRunway.center.x - Math.sin(finalRadians) * 8,
    y: arrivalRunway.center.y + Math.cos(finalRadians) * 8,
  };
  const boundary = activeWorld.trafficEntries[1] ?? activeWorld.trafficEntries[0]!;
  const boundaryHeading = normalizeHeading(Math.atan2(-boundary.position.x, boundary.position.y) * 180 / Math.PI);
  const departureProcedure = activeWorld.procedures.find((procedure) => procedure.kind === 'departure')!;

  return [
    createAircraft({
      callsign: callsigns[0]!, type: 'A320', phase: 'arrival', position: firstPosition,
      heading: arrivalRunway.heading, altitude: 2200, speed: 175,
      targetHeading: arrivalRunway.heading, targetAltitude: 2200, targetSpeed: 175,
      turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: arrivalRunway.id,
    }),
    createAircraft({
      callsign: callsigns[1]!, type: 'B738', phase: 'arrival', position: { ...boundary.position },
      heading: boundaryHeading, altitude: 8500, speed: 250,
      targetHeading: boundaryHeading, targetAltitude: 8500, targetSpeed: 250,
      turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: secondRunway.id,
    }),
    createAircraft({
      callsign: callsigns[2]!, type: 'B77W', phase: 'departure', position: { ...departureRunway.center },
      heading: departureRunway.heading, altitude: 2800, speed: 195,
      targetHeading: departureRunway.heading, targetAltitude: 12000, targetSpeed: 285,
      turnDirection: 'shortest', performance: HEAVY_PERFORMANCE, assignedRunway: departureRunway.id,
      navigation: { mode: 'route', fixIds: [...departureProcedure.fixIds], currentLegIndex: 0, procedure: departureProcedure.id },
    }),
  ];
}

function terrainFocus(definition: AirportDefinition) {
  const terrain = {
    flat: 'düz arazi', rolling: 'dalgalı arazi', highland: 'yüksek meydan', mountain: 'dağ koridorları',
    desert: 'çöl ve sıcak hava', coastal: 'kıyı yaklaşmaları', island: 'ada ve su üstü yaklaşmaları',
  }[definition.terrain];
  return `${terrain}, ${usableRunways(definition).length} pist çifti ve yoğun terminal akışı`;
}

export const scenarioCatalog: GameScenario[] = AIRPORT_DEFINITIONS.map((definition, index) => {
  const world = makeRealAirportWorld(definition);
  const operationsPack = airportOperationsById.get(definition.id);
  const runwayCount = usableRunways(definition).length;
  return {
    id: definition.id,
    rank: index + 1,
    iata: definition.iata,
    icao: definition.icao,
    passengers2025: definition.passengers2025,
    runwayCount,
    label: `${definition.iata} · ${definition.city.toUpperCase()}`,
    briefing: operationsPack?.briefing ?? `${definition.name}: ${runwayCount} fiziksel pist çifti, gerçek pist yönleri ve ${definition.city} çevresine göre taktik sektör görünümü.`,
    focus: operationsPack?.focus ?? terrainFocus(definition),
    world,
    initialAircraft: makeInitialAircraft(definition, world),
  };
});

export const defaultScenario = scenarioCatalog[0]!;
export const world = defaultScenario.world;

/** Applies one runway configuration while retaining one physical line per
 * runway pair. Reciprocal use rotates and renames that same line. */
export function worldWithFlow(world: RadarWorld, flowId: string, skill?: number): RadarWorld {
  const flow = world.flowConfigurations.find((item) => item.id === flowId) ?? world.flowConfigurations[0];
  if (!flow) return world;
  const availableArrivalRunways = skill !== undefined && skill < 7.5
    ? flow.arrivalRunwayIds.slice(0, 1)
    : flow.arrivalRunwayIds;
  const activeIds = new Set([...availableArrivalRunways, ...flow.departureRunwayIds]);
  const operationOrder = [...availableArrivalRunways, ...flow.departureRunwayIds];
  const runways = world.runways.map((baseRunway) => {
    const useReciprocal = activeIds.has(baseRunway.reciprocal) && !activeIds.has(baseRunway.id);
    const runway = useReciprocal
      ? { ...baseRunway, id: baseRunway.reciprocal, reciprocal: baseRunway.id, heading: normalizeHeading(baseRunway.heading + 180) }
      : { ...baseRunway };
    const arrival = availableArrivalRunways.includes(runway.id);
    const departure = flow.departureRunwayIds.includes(runway.id);
    return {
      ...runway,
      active: arrival || departure,
      operation: arrival && departure ? 'mixed' as const : arrival ? 'arrival' as const : departure ? 'departure' as const : 'inactive' as const,
    };
  }).sort((first, second) => {
    const firstIndex = operationOrder.indexOf(first.id);
    const secondIndex = operationOrder.indexOf(second.id);
    return (firstIndex < 0 ? 999 : firstIndex) - (secondIndex < 0 ? 999 : secondIndex);
  });
  return {
    ...world,
    activeFlowId: flow.id,
    runways,
  };
}

export function createInitialState(scenario: GameScenario = defaultScenario, mode: GameMode = 'normal', requestedFlowId?: string): GameState {
  const config = difficultyConfig(mode);
  const flowId = scenario.world.flowConfigurations.some((flow) => flow.id === requestedFlowId)
    ? requestedFlowId!
    : scenario.world.flowConfigurations[0]?.id ?? 'default';
  const definition = airportDefinitionById.get(scenario.id);
  const sourceAircraft = definition
    ? makeInitialAircraft(definition, scenario.world, flowId, config.initialSkill)
    : scenario.initialAircraft;
  const initialAircraft = structuredClone(sourceAircraft.slice(0, config.initialAircraft));
  const trainingAircraft = initialAircraft.find((item) => item.phase === 'arrival');
  const initialProfile = modeTrafficProfile(mode, profileForSkill(config.initialSkill));
  const welcome = { id: 'welcome', type: 'info' as const, message: `Radar contact: ${trainingAircraft?.callsign ?? 'ilk geliş'}. Heading, irtifa ve hızla ${trainingAircraft?.assignedRunway ?? ''} finaline vektörle; sonra ILS'i silahlandır.` };
  return {
    mode, elapsedSeconds: 0, paused: false, timeScale: config.timeScale, aircraft: initialAircraft, conflicts: [],
    selectedCallsign: trainingAircraft?.callsign ?? null, skill: config.initialSkill, peakSkill: config.initialSkill, targetAircraft: initialProfile.targetAircraft,
    score: Math.round(config.initialSkill * 15), landed: 0, spawned: 0, trafficLevel: initialProfile.level, nextTrafficAt: initialProfile.spawnInterval,
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
