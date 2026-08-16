import { distance, moveToward, turnToward } from './math';
import type { Aircraft, Conflict, GameState, RadarWorld, Trend } from './types';

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;

export function aircraftTrend(aircraft: Aircraft): Trend {
  if (aircraft.targetAltitude > aircraft.altitude + 50) return 'climb';
  if (aircraft.targetAltitude < aircraft.altitude - 50) return 'descend';
  return 'level';
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
  const aircraft = state.aircraft.map((item) => stepAircraft(item, boundedDt));
  return {
    ...state,
    elapsedSeconds: state.elapsedSeconds + boundedDt,
    aircraft,
    conflicts: detectConflicts(aircraft),
  };
}

