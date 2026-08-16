import type { Aircraft, AircraftPerformance, RadarWorld } from './types';

const jet: AircraftPerformance = { turnRateDegPerSecond: 3, climbRateFpm: 2200, descentRateFpm: 1800, accelerationKtPerSecond: 2.2, minSpeed: 140, maxSpeed: 480 };
const heavy: AircraftPerformance = { turnRateDegPerSecond: 2.2, climbRateFpm: 1700, descentRateFpm: 1500, accelerationKtPerSecond: 1.4, minSpeed: 150, maxSpeed: 500 };
const aircraftTypes = ['A220', 'A320', 'A21N', 'B738', 'B39M', 'E190'] as const;
const callsignPrefixes = ['AR', 'NX', 'OR', 'VX', 'SK'] as const;

export interface TrafficPlan {
  aircraft: Aircraft;
  message: string;
}

function headingTo(from: { x: number; y: number }, to: { x: number; y: number }) {
  return (Math.atan2(to.x - from.x, -(to.y - from.y)) * 180 / Math.PI + 360) % 360;
}

function activeArrivalRunways(world: RadarWorld) {
  return world.runways.filter((runway) => runway.active && (runway.operation === 'arrival' || runway.operation === 'mixed'));
}

function arrivalLoad(aircraft: readonly Aircraft[], runwayId: string) {
  return aircraft.filter((item) => item.phase === 'arrival' && item.assignedRunway === runwayId).length;
}

function chooseArrivalRunway(aircraft: readonly Aircraft[], world: RadarWorld, index: number) {
  const runways = activeArrivalRunways(world);
  if (runways.length === 0) throw new Error('Traffic director requires an active arrival runway');
  return [...runways].sort((first, second) => {
    const difference = arrivalLoad(aircraft, first.id) - arrivalLoad(aircraft, second.id);
    return difference || ((index + first.id.length) % 3) - ((index + second.id.length) % 3);
  })[0];
}

function planArrival(index: number, activeAircraft: readonly Aircraft[], world: RadarWorld, callsign: string): TrafficPlan {
  const runway = chooseArrivalRunway(activeAircraft, world, index);
  const entriesForRunway = world.trafficEntries.filter((entry) => entry.compatibleRunwayIds.includes(runway.id));
  const fallbackEntries = world.trafficEntries;
  const entryPool = entriesForRunway.length > 0 ? entriesForRunway : fallbackEntries;
  const entry = entryPool[index % entryPool.length];
  const procedure = world.procedures.find((item) => item.id === entry.procedureId);
  const entryFix = world.fixes.find((fix) => fix.id === entry.id);
  if (!procedure || !entryFix) throw new Error(`Traffic director cannot resolve ${entry.id} procedure`);

  const altitude = 7000 + ((index * 1100) % 6000);
  const speed = 235 + ((index * 17) % 55);
  const heading = headingTo(entry.position, entryFix.position);
  const aircraft: Aircraft = {
    callsign,
    type: aircraftTypes[index % aircraftTypes.length],
    phase: 'arrival',
    position: { ...entry.position },
    heading,
    altitude,
    speed,
    targetHeading: heading,
    targetAltitude: altitude,
    targetSpeed: speed,
    turnDirection: 'shortest',
    performance: jet,
    assignedRunway: runway.id,
    navigation: { mode: 'route', fixIds: [...procedure.fixIds], currentLegIndex: 0, procedure: procedure.id },
  };
  return {
    aircraft,
    message: `${callsign} sahaya girdi · ${procedure.id} · planlanan pist ${runway.id} · ${arrivalLoad(activeAircraft, runway.id) + 1}. sıra`,
  };
}

function planDeparture(index: number, world: RadarWorld, callsign: string): TrafficPlan | null {
  const runways = world.runways.filter((runway) => runway.active && (runway.operation === 'departure' || runway.operation === 'mixed'));
  const runway = runways[index % runways.length];
  const exit = world.trafficExits[index % world.trafficExits.length];
  const procedure = world.procedures.find((item) => item.id === exit?.procedureId);
  if (!runway || !procedure) return null;
  const altitude = 9000 + (index % 4) * 1500;
  const aircraft: Aircraft = {
    callsign,
    type: index % 2 === 0 ? 'B77W' : 'A330',
    phase: 'departure',
    position: { ...runway.center },
    heading: runway.heading,
    altitude: 2600,
    speed: 185,
    targetHeading: runway.heading,
    targetAltitude: altitude,
    targetSpeed: 285,
    turnDirection: 'shortest',
    performance: heavy,
    navigation: { mode: 'route', fixIds: [...procedure.fixIds], currentLegIndex: 0, procedure: procedure.id },
  };
  return { aircraft, message: `${callsign} kalkış trafiği · ${runway.id} · ${procedure.id}` };
}

/** Plans one new flight against current runway capacity and arrival load. */
export function planTraffic(index: number, activeAircraft: readonly Aircraft[], world: RadarWorld): TrafficPlan {
  const suffix = String(310 + index * 13).padStart(3, '0');
  const callsign = `${callsignPrefixes[index % callsignPrefixes.length]}${suffix}`;
  const activeArrivals = activeAircraft.filter((item) => item.phase === 'arrival').length;
  const targetArrivalBacklog = Math.max(2, activeArrivalRunways(world).length * 2);
  const departure = index % 5 === 3 || activeArrivals >= targetArrivalBacklog + 2
    ? planDeparture(index, world, callsign)
    : null;
  return departure ?? planArrival(index, activeAircraft, world, callsign);
}

export function flowCapacity(world: RadarWorld) {
  const arrivalRunwayCount = activeArrivalRunways(world).length;
  return {
    arrivalRunwayCount,
    intervalAdjustment: arrivalRunwayCount <= 1 ? 4 : 0,
    aircraftAdjustment: arrivalRunwayCount <= 1 ? -1 : 0,
  };
}
