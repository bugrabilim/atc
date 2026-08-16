import { distance, moveToward, turnToward } from './math';
import { guideNavigation } from './navigation';
import { spawnTraffic } from './scenario';
import type { Aircraft, Conflict, GameEvent, GameState, RadarWorld, Runway, Trend, Vector2 } from './types';

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;
const GLIDESLOPE_FEET_PER_NM = 318;
const APPROACH_CAPTURE_DISTANCE_NM = 16;
const APPROACH_CAPTURE_LATERAL_NM = 2.2;

interface ApproachGeometry {
  distanceToThreshold: number;
  lateralDistance: number;
}

export function aircraftTrend(aircraft: Aircraft): Trend {
  if (aircraft.targetAltitude > aircraft.altitude + 50) return 'climb';
  if (aircraft.targetAltitude < aircraft.altitude - 50) return 'descend';
  return 'level';
}

function inboundVector(heading: number): Vector2 {
  const radians = (heading * Math.PI) / 180;
  return { x: Math.sin(radians), y: -Math.cos(radians) };
}

function angularDifference(first: number, second: number) {
  return Math.abs(((first - second + 540) % 360) - 180);
}

function getApproachGeometry(aircraft: Aircraft, runway: Runway): ApproachGeometry {
  const inbound = inboundVector(runway.heading);
  const relative = {
    x: aircraft.position.x - runway.center.x,
    y: aircraft.position.y - runway.center.y,
  };
  const distanceToThreshold = -(relative.x * inbound.x + relative.y * inbound.y);
  const lateralDistance = Math.abs(relative.x * inbound.y - relative.y * inbound.x);
  return { distanceToThreshold, lateralDistance };
}

function guideApproach(aircraft: Aircraft, world: RadarWorld): Aircraft {
  if (!aircraft.approach) return aircraft;
  const runway = world.runways.find((item) => item.id === aircraft.approach?.runwayId);
  if (!runway || runway.operation === 'inactive') return { ...aircraft, approach: undefined };

  const geometry = getApproachGeometry(aircraft, runway);
  const canCapture = geometry.distanceToThreshold > 0
    && geometry.distanceToThreshold <= APPROACH_CAPTURE_DISTANCE_NM
    && geometry.lateralDistance <= APPROACH_CAPTURE_LATERAL_NM
    && angularDifference(aircraft.heading, runway.heading) <= 35;

  if (aircraft.approach.status === 'armed' && !canCapture) return aircraft;
  const glideslopeAltitude = Math.max(0, geometry.distanceToThreshold * GLIDESLOPE_FEET_PER_NM + 40);
  const targetAltitude = aircraft.approach.landingCleared ? glideslopeAltitude : Math.max(1200, glideslopeAltitude);
  const targetSpeed = Math.max(aircraft.performance.minSpeed + 5, 145);
  return {
    ...aircraft,
    approach: { ...aircraft.approach, status: 'captured' },
    targetHeading: runway.heading,
    targetAltitude,
    targetSpeed,
    turnDirection: 'shortest',
  };
}

function stepAircraft(aircraft: Aircraft, dt: number): Aircraft {
  const heading = turnToward(
    aircraft.heading,
    aircraft.targetHeading,
    aircraft.performance.turnRateDegPerSecond * dt,
    aircraft.turnDirection,
  );
  const altitudeRate = aircraft.targetAltitude >= aircraft.altitude
    ? aircraft.performance.climbRateFpm
    : aircraft.performance.descentRateFpm;
  const altitude = moveToward(aircraft.altitude, aircraft.targetAltitude, (altitudeRate / SECONDS_PER_MINUTE) * dt);
  const speed = moveToward(
    aircraft.speed,
    aircraft.targetSpeed,
    aircraft.performance.accelerationKtPerSecond * dt,
  );
  const radians = (heading * Math.PI) / 180;
  const distanceNm = (speed * dt) / SECONDS_PER_HOUR;
  const position = {
    x: aircraft.position.x + Math.sin(radians) * distanceNm,
    y: aircraft.position.y - Math.cos(radians) * distanceNm,
  };
  return { ...aircraft, heading, altitude, speed, position };
}

function completedLanding(aircraft: Aircraft, world: RadarWorld) {
  if (aircraft.approach?.status !== 'captured') return false;
  const runway = world.runways.find((item) => item.id === aircraft.approach?.runwayId);
  if (!runway) return false;
  const geometry = getApproachGeometry(aircraft, runway);
  return aircraft.approach.landingCleared
    && geometry.distanceToThreshold <= 0.18
    && geometry.distanceToThreshold >= -0.65
    && geometry.lateralDistance <= 0.22
    && aircraft.altitude <= 160
    && angularDifference(aircraft.heading, runway.heading) <= 5;
}

function missedApproach(aircraft: Aircraft, world: RadarWorld) {
  if (aircraft.approach?.status !== 'captured' || aircraft.approach.landingCleared) return false;
  const runway = world.runways.find((item) => item.id === aircraft.approach?.runwayId);
  return runway ? getApproachGeometry(aircraft, runway).distanceToThreshold < -0.25 : false;
}

function initiateGoAround(aircraft: Aircraft): Aircraft {
  return {
    ...aircraft,
    approach: undefined,
    targetHeading: (aircraft.heading + 180) % 360,
    targetAltitude: Math.max(3000, aircraft.altitude),
    targetSpeed: Math.max(210, aircraft.speed),
    turnDirection: 'shortest',
  };
}

function appendEvent(events: GameEvent[], event: GameEvent) {
  return [...events, event].slice(-4);
}

export function detectConflicts(aircraft: readonly Aircraft[]): Conflict[] {
  const conflicts: Conflict[] = [];
  for (let i = 0; i < aircraft.length; i += 1) {
    for (let j = i + 1; j < aircraft.length; j += 1) {
      const first = aircraft[i];
      const second = aircraft[j];
      const horizontalNm = distance(first.position, second.position);
      const verticalFt = Math.abs(first.altitude - second.altitude);
      if (horizontalNm < 5 && verticalFt < 1500) {
        conflicts.push({
          pair: [first.callsign, second.callsign],
          horizontalNm,
          verticalFt,
          severity: horizontalNm < 3 && verticalFt < 1000 ? 'loss' : 'warning',
        });
      }
    }
  }
  return conflicts;
}

export function stepGame(state: GameState, _world: RadarWorld, dt: number): GameState {
  if (state.paused) return state;
  const boundedDt = Math.min(dt, 0.1) * state.timeScale;
  const navigationResults = state.aircraft.map((item) => guideNavigation(guideApproach(item, _world), _world));
  const movedAircraft = navigationResults.map((item) => stepAircraft(item.aircraft, boundedDt));
  const landedAircraft = movedAircraft.filter((item) => completedLanding(item, _world));
  const missedAircraft = movedAircraft.filter((item) => missedApproach(item, _world));
  const recoveredAircraft = movedAircraft.map((item) => missedAircraft.includes(item) ? initiateGoAround(item) : item);
  const handedOffAircraft = recoveredAircraft.filter((item) => (
    item.phase === 'departure'
    && distance(item.position, { x: 0, y: 0 }) > _world.rangeNm + 2
  ));
  let aircraft = recoveredAircraft.filter((item) => !landedAircraft.includes(item) && !handedOffAircraft.includes(item));
  let spawned = state.spawned;
  let nextTrafficAt = state.nextTrafficAt;
  let eventLog = navigationResults.reduce<GameEvent[]>((events, result) => (
    result.event ? appendEvent(events, result.event) : events
  ), state.eventLog);
  const elapsedSeconds = state.elapsedSeconds + boundedDt;

  if (landedAircraft.length > 0) {
    eventLog = appendEvent(eventLog, {
      id: `landing-${Math.round(elapsedSeconds * 10)}`,
      type: 'success',
      message: `${landedAircraft.map((item) => item.callsign).join(', ')} · iniş tamamlandı (+100)`,
    });
  }

  if (missedAircraft.length > 0) {
    eventLog = appendEvent(eventLog, {
      id: `go-around-${Math.round(elapsedSeconds * 10)}`,
      type: 'warning',
      message: `${missedAircraft.map((item) => item.callsign).join(', ')} · iniş izni yok, go-around`,
    });
  }

  if (handedOffAircraft.length > 0) {
    eventLog = appendEvent(eventLog, {
      id: `handoff-${Math.round(elapsedSeconds * 10)}`,
      type: 'success',
      message: `${handedOffAircraft.map((item) => item.callsign).join(', ')} · sahadan çıktı, handoff tamamlandı (+50)`,
    });
  }

  if (elapsedSeconds >= nextTrafficAt && aircraft.length < 5) {
    const incoming = spawnTraffic(spawned);
    if (!aircraft.some((item) => item.callsign === incoming.callsign)) {
      aircraft = [...aircraft, incoming];
      spawned += 1;
      eventLog = appendEvent(eventLog, {
        id: `traffic-${spawned}`,
        type: 'info',
        message: `${incoming.callsign} sahaya girdi · geliş trafiği`,
      });
    }
    nextTrafficAt += 48;
  }

  const conflicts = detectConflicts(aircraft);
  const lossPairs = conflicts
    .filter((item) => item.severity === 'loss')
    .map((item) => [...item.pair].sort().join('-'));
  const newLossPairs = lossPairs.filter((item) => !state.activeLossPairs.includes(item));
  if (newLossPairs.length > 0) {
    eventLog = appendEvent(eventLog, {
      id: `loss-${Math.round(elapsedSeconds * 10)}`,
      type: 'danger',
      message: `AYIRMA KAYBI · ${newLossPairs.join(', ')} (-250)`,
    });
  }

  return {
    ...state,
    elapsedSeconds,
    aircraft,
    conflicts,
    landed: state.landed + landedAircraft.length,
    score: Math.max(0, state.score + landedAircraft.length * 100 + handedOffAircraft.length * 50 - newLossPairs.length * 250),
    spawned,
    nextTrafficAt,
    eventLog,
    activeLossPairs: lossPairs,
    handoffs: state.handoffs + handedOffAircraft.length,
  };
}
