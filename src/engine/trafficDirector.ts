import type { Aircraft, AircraftPerformance, RadarWorld } from './types';
import { createAircraft, HEAVY_PERFORMANCE, JET_PERFORMANCE } from './aircraftData';

const jet: AircraftPerformance = JET_PERFORMANCE;
const heavy: AircraftPerformance = HEAVY_PERFORMANCE;
const arrivalFleet = [
  { type: 'A220', performance: jet },
  { type: 'A320', performance: jet },
  { type: 'A21N', performance: jet },
  { type: 'B738', performance: jet },
  { type: 'B39M', performance: jet },
  { type: 'E190', performance: jet },
  { type: 'B789', performance: heavy },
  { type: 'A330', performance: heavy },
  { type: 'B77W', performance: heavy },
  { type: 'A388', performance: heavy },
] as const;
const callsignPrefixes = ['AR', 'NX', 'OR', 'VX', 'SK', 'HL', 'CF'] as const;
const departureFleet = [
  { type: 'A320', performance: jet },
  { type: 'B738', performance: jet },
  { type: 'E190', performance: jet },
  { type: 'A330', performance: heavy },
  { type: 'B77W', performance: heavy },
] as const;

export interface TrafficPlan {
  aircraft: Aircraft;
  message: string;
}

function headingTo(from: { x: number; y: number }, to: { x: number; y: number }) {
  return (Math.atan2(to.x - from.x, -(to.y - from.y)) * 180 / Math.PI + 360) % 360;
}

/** Small deterministic mixer: replays stay identical without a random API. */
function trafficVariant(index: number, seed: number, salt = 0) {
  const value = Math.imul(index + 1 + salt * 17, 1103515245) + Math.imul(seed + 97, 12345);
  return Math.abs(value >>> 0);
}

function activeArrivalRunways(world: RadarWorld) {
  return world.runways.filter((runway) => runway.active && (runway.operation === 'arrival' || runway.operation === 'mixed'));
}

function arrivalLoad(aircraft: readonly Aircraft[], runwayId: string) {
  return aircraft.filter((item) => item.phase === 'arrival' && item.assignedRunway === runwayId).length;
}

function departureLoad(aircraft: readonly Aircraft[], runwayId: string) {
  return aircraft.filter((item) => item.phase === 'departure' && item.assignedRunway === runwayId).length;
}

function chooseArrivalRunway(aircraft: readonly Aircraft[], world: RadarWorld, index: number, seed: number) {
  const runways = activeArrivalRunways(world);
  if (runways.length === 0) throw new Error('Traffic director requires an active arrival runway');
  return [...runways].sort((first, second) => {
    const difference = arrivalLoad(aircraft, first.id) - arrivalLoad(aircraft, second.id);
    if (difference) return difference;
    const firstTieBreak = trafficVariant(index, seed, first.id.length) % 7;
    const secondTieBreak = trafficVariant(index, seed, second.id.length) % 7;
    return firstTieBreak - secondTieBreak || first.id.localeCompare(second.id);
  })[0];
}

function planArrival(index: number, activeAircraft: readonly Aircraft[], world: RadarWorld, callsign: string, seed: number): TrafficPlan {
  const runway = chooseArrivalRunway(activeAircraft, world, index, seed);
  const entriesForRunway = world.trafficEntries.filter((entry) => entry.compatibleRunwayIds.includes(runway.id));
  const fallbackEntries = world.trafficEntries;
  const entryPool = entriesForRunway.length > 0 ? entriesForRunway : fallbackEntries;
  const entry = entryPool[trafficVariant(index, seed, 1) % entryPool.length];
  if (!entry) throw new Error('Traffic director requires at least one boundary entry');

  const variant = trafficVariant(index, seed, 2);
  const fleet = arrivalFleet[variant % arrivalFleet.length];
  const altitude = 7000 + ((variant * 1100) % 7000);
  const speed = fleet.performance === heavy
    ? 240 + ((variant * 11) % 38)
    : 225 + ((variant * 17) % 68);
  const heading = (headingTo(entry.position, { x: 0, y: 0 }) + ((variant % 3) - 1) * 12 + 360) % 360;
  const aircraft = createAircraft({
    callsign,
    type: fleet.type,
    phase: 'arrival',
    position: { ...entry.position },
    heading,
    altitude,
    speed,
    targetHeading: heading,
    targetAltitude: altitude,
    targetSpeed: speed,
    turnDirection: 'shortest',
    performance: fleet.performance,
    assignedRunway: runway.id,
  });
  return {
    aircraft,
    message: `${callsign} ${fleet.type} · radar contact · ${entry.id} sınırı · ${Math.round(altitude / 100)} flight level · planlanan pist ${runway.id} · vektör bekliyor`,
  };
}

function planDeparture(index: number, activeAircraft: readonly Aircraft[], world: RadarWorld, callsign: string, seed: number): TrafficPlan | null {
  const runways = world.runways.filter((runway) => runway.active && (runway.operation === 'departure' || runway.operation === 'mixed'));
  const runway = [...runways].sort((first, second) => (
    departureLoad(activeAircraft, first.id) - departureLoad(activeAircraft, second.id)
      || trafficVariant(index, seed, first.id.length + 11) % 5 - trafficVariant(index, seed, second.id.length + 11) % 5
      || first.id.localeCompare(second.id)
  ))[0];
  const exit = world.trafficExits[trafficVariant(index, seed, 8) % world.trafficExits.length];
  const procedure = world.procedures.find((item) => item.id === exit?.procedureId);
  if (!runway || !procedure) return null;
  const variant = trafficVariant(index, seed, 9);
  const fleet = departureFleet[variant % departureFleet.length];
  const altitude = 8000 + (variant % 6) * 1000;
  const aircraft = createAircraft({
    callsign,
    type: fleet.type,
    phase: 'departure',
    position: { ...runway.center },
    heading: runway.heading,
    altitude: 2600,
    speed: 185,
    targetHeading: runway.heading,
    targetAltitude: altitude,
    targetSpeed: 285,
    turnDirection: 'shortest',
    performance: fleet.performance,
    assignedRunway: runway.id,
    navigation: { mode: 'route', fixIds: [...procedure.fixIds], currentLegIndex: 0, procedure: procedure.id },
  });
  return { aircraft, message: `${callsign} ${fleet.type} kalkış trafiği · ${runway.id} · ${procedure.id}` };
}

/** Plans one new flight against current runway capacity and arrival load. */
export function planTraffic(index: number, activeAircraft: readonly Aircraft[], world: RadarWorld, seed = 0): TrafficPlan {
  const variantIndex = index + Math.abs(seed % 17);
  const suffix = String(310 + index * 13).padStart(3, '0');
  const callsign = `${callsignPrefixes[index % callsignPrefixes.length]}${suffix}`;
  const activeArrivals = activeAircraft.filter((item) => item.phase === 'arrival').length;
  const targetArrivalBacklog = Math.max(2, activeArrivalRunways(world).length * 2);
  const departure = index % 5 === 3 || activeArrivals >= targetArrivalBacklog + 2
    ? planDeparture(variantIndex, activeAircraft, world, callsign, seed)
    : null;
  return departure ?? planArrival(variantIndex, activeAircraft, world, callsign, seed);
}

export function flowCapacity(world: RadarWorld) {
  const arrivalRunwayCount = activeArrivalRunways(world).length;
  return {
    arrivalRunwayCount,
    intervalAdjustment: arrivalRunwayCount <= 1 ? 4 : 0,
    aircraftAdjustment: arrivalRunwayCount <= 1 ? -1 : 0,
  };
}
