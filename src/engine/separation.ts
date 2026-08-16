import { angularDifference, approachGeometry } from './approach';
import { distance } from './math';
import { requiredWakeSeparationNm } from './wake';
import type { Aircraft, Conflict, RadarWorld } from './types';

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;

function independentParallelApproach(first: Aircraft, second: Aircraft, world?: RadarWorld) {
  if (!world || !first.approach || !second.approach || first.approach.runwayId === second.approach.runwayId) return false;
  if (first.approach.status === 'armed' || second.approach.status === 'armed') return false;
  const firstRunway = world.runways.find((item) => item.id === first.approach?.runwayId);
  const secondRunway = world.runways.find((item) => item.id === second.approach?.runwayId);
  return Boolean(firstRunway && secondRunway && angularDifference(firstRunway.heading, secondRunway.heading) <= 10);
}

function divergingDepartures(first: Aircraft, second: Aircraft) {
  return first.phase === 'departure'
    && second.phase === 'departure'
    && angularDifference(first.track, second.track) >= 15
    && Math.max(Math.hypot(first.position.x, first.position.y), Math.hypot(second.position.x, second.position.y)) <= 12;
}

function wakeConflict(first: Aircraft, second: Aircraft, world?: RadarWorld): Conflict | null {
  if (!world || !first.approach || !second.approach || first.approach.runwayId !== second.approach.runwayId) return null;
  if (first.approach.status === 'armed' || second.approach.status === 'armed') return null;
  const runway = world.runways.find((item) => item.id === first.approach?.runwayId);
  if (!runway) return null;
  const firstDistance = approachGeometry(first, runway).distanceToThreshold;
  const secondDistance = approachGeometry(second, runway).distanceToThreshold;
  const leader = firstDistance < secondDistance ? first : second;
  const follower = leader === first ? second : first;
  const longitudinalSpacing = Math.abs(firstDistance - secondDistance);
  const required = requiredWakeSeparationNm(leader, follower);
  if (longitudinalSpacing >= required || Math.abs(first.altitude - second.altitude) >= 1200) return null;
  return {
    pair: [first.callsign, second.callsign],
    horizontalNm: distance(first.position, second.position),
    verticalFt: Math.abs(first.altitude - second.altitude),
    severity: longitudinalSpacing < Math.max(2.5, required - 1) ? 'loss' : 'warning',
    reason: 'wake',
  };
}

export function detectConflicts(aircraft: readonly Aircraft[], world?: RadarWorld, elapsedSeconds = 0): Conflict[] {
  const conflicts: Conflict[] = [];
  for (let i = 0; i < aircraft.length; i += 1) {
    for (let j = i + 1; j < aircraft.length; j += 1) {
      const first = aircraft[i];
      const second = aircraft[j];
      if ((first.goAroundGraceUntil ?? 0) > elapsedSeconds || (second.goAroundGraceUntil ?? 0) > elapsedSeconds) continue;
      if (independentParallelApproach(first, second, world) || divergingDepartures(first, second)) continue;

      const wake = wakeConflict(first, second, world);
      if (wake) {
        conflicts.push(wake);
        continue;
      }

      const horizontalNm = distance(first.position, second.position);
      const verticalFt = Math.abs(first.altitude - second.altitude);
      if (horizontalNm < 5 && verticalFt < 1500) {
        conflicts.push({
          pair: [first.callsign, second.callsign],
          horizontalNm,
          verticalFt,
          severity: horizontalNm < 3 && verticalFt < 1000 ? 'loss' : 'warning',
          reason: 'separation',
        });
        continue;
      }

      const firstHeading = first.track * Math.PI / 180;
      const secondHeading = second.track * Math.PI / 180;
      const firstVelocity = { x: Math.sin(firstHeading) * first.groundSpeed / SECONDS_PER_HOUR, y: -Math.cos(firstHeading) * first.groundSpeed / SECONDS_PER_HOUR };
      const secondVelocity = { x: Math.sin(secondHeading) * second.groundSpeed / SECONDS_PER_HOUR, y: -Math.cos(secondHeading) * second.groundSpeed / SECONDS_PER_HOUR };
      const relativePosition = { x: first.position.x - second.position.x, y: first.position.y - second.position.y };
      const relativeVelocity = { x: firstVelocity.x - secondVelocity.x, y: firstVelocity.y - secondVelocity.y };
      const relativeSpeedSquared = relativeVelocity.x ** 2 + relativeVelocity.y ** 2;
      if (relativeSpeedSquared === 0) continue;
      const timeSeconds = -((relativePosition.x * relativeVelocity.x) + (relativePosition.y * relativeVelocity.y)) / relativeSpeedSquared;
      if (timeSeconds <= 0 || timeSeconds > 120) continue;
      const closestHorizontal = Math.hypot(
        relativePosition.x + relativeVelocity.x * timeSeconds,
        relativePosition.y + relativeVelocity.y * timeSeconds,
      );
      const closestVertical = Math.abs(
        (first.altitude + first.verticalSpeed / SECONDS_PER_MINUTE * timeSeconds)
        - (second.altitude + second.verticalSpeed / SECONDS_PER_MINUTE * timeSeconds),
      );
      if (closestHorizontal < 3 && closestVertical < 1000) {
        conflicts.push({
          pair: [first.callsign, second.callsign],
          horizontalNm,
          verticalFt,
          severity: 'warning',
          reason: 'separation',
          predicted: { timeSeconds, horizontalNm: closestHorizontal },
        });
      }
    }
  }
  return conflicts;
}

