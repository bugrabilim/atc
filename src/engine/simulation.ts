import { distance, moveToward, turnToward } from './math';
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
  const targetAltitude = Math.max(0, geometry.distanceToThreshold * GLIDESLOPE_FEET_PER_NM + 40);
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
  return geometry.distanceToThreshold <= 0.18
    && geometry.distanceToThreshold >= -0.65
    && geometry.lateralDistance <= 0.22
    && aircraft.altitude <= 160
    && angularDifference(aircraft.heading, runway.heading) <= 5;
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
  const guidedAircraft = state.aircraft.map((item) => guideApproach(item, _world));
  const movedAircraft = guidedAircraft.map((item) => stepAircraft(item, boundedDt));
  const landedAircraft = movedAircraft.filter((item) => completedLanding(item, _world));
  let aircraft = movedAircraft.filter((item) => !landedAircraft.includes(item));
  let spawned = state.spawned;
  let nextTrafficAt = state.nextTrafficAt;
  let eventLog = state.eventLog;
  const elapsedSeconds = state.elapsedSeconds + boundedDt;

  if (landedAircraft.length > 0) {
    eventLog = appendEvent(eventLog, {
      id: `landing-${Math.round(elapsedSeconds * 10)}`,
      type: 'success',
      message: `${landedAircraft.map((item) => item.callsign).join(', ')} · iniş tamamlandı (+100)`,
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

  return {
    ...state,
    elapsedSeconds,
    aircraft,
    conflicts: detectConflicts(aircraft),
    landed: state.landed + landedAircraft.length,
    score: state.score + landedAircraft.length * 100,
    spawned,
    nextTrafficAt,
    eventLog,
  };
}
