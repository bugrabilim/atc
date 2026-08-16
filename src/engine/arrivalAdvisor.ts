import { distance } from './math';
import { activeFixId } from './navigation';
import type { Aircraft, RadarWorld, Runway, Vector2 } from './types';
import { runwayWindComponents } from './weather';
import { bearingTo } from './navigation';
import { requiredWakeSeparationNm } from './wake';

export interface ArrivalAdvice {
  runwayId: string;
  sequence: number;
  etaSeconds: number;
  distanceNm: number;
  recommendedAltitude: number;
  shouldDescend: boolean;
  crosswindKt: number;
  recommendedHeading: number;
  leaderCallsign?: string;
  requiredSpacingNm?: number;
  spacingRisk: boolean;
  recommendedSpeed?: number;
}

function routeDistance(aircraft: Aircraft, runway: Runway, world: RadarWorld) {
  const points: Vector2[] = [];
  const activeFix = activeFixId(aircraft);
  if (activeFix) {
    const startingIndex = aircraft.navigation?.currentLegIndex ?? 0;
    for (const fixId of aircraft.navigation?.fixIds.slice(startingIndex) ?? []) {
      const fix = world.fixes.find((item) => item.id === fixId);
      if (fix) points.push(fix.position);
    }
  }
  points.push(runway.center);
  return points.reduce((total, point, index) => total + distance(index === 0 ? aircraft.position : points[index - 1], point), 0);
}

export function arrivalAdvice(aircraft: readonly Aircraft[], world: RadarWorld) {
  const candidates = aircraft
    .filter((item) => item.phase === 'arrival' && item.assignedRunway)
    .flatMap((item) => {
      const runway = world.runways.find((entry) => entry.id === item.assignedRunway && entry.active);
      if (!runway) return [];
      const distanceNm = routeDistance(item, runway, world);
      const etaSeconds = Math.max(1, Math.round(distanceNm / Math.max(120, item.speed) * 3600));
      const recommendedAltitude = Math.max(3000, Math.min(12000, Math.round((distanceNm * 318 + 50) / 100) * 100));
      const radians = runway.heading * Math.PI / 180;
      const finalIntercept = {
        x: runway.center.x - Math.sin(radians) * 9,
        y: runway.center.y + Math.cos(radians) * 9,
      };
      const recommendedHeading = Math.round(bearingTo(item.position, finalIntercept));
      return [{ aircraft: item, runway, distanceNm, etaSeconds, recommendedAltitude, recommendedHeading }];
    });
  const advice = new Map<string, ArrivalAdvice>();
  for (const runwayId of new Set(candidates.map((item) => item.runway.id))) {
    const runwayCandidates = candidates.filter((item) => item.runway.id === runwayId).sort((first, second) => first.etaSeconds - second.etaSeconds);
    runwayCandidates.forEach((item, index) => {
      const leader = runwayCandidates[index - 1];
      const requiredSpacingNm = leader ? requiredWakeSeparationNm(leader.aircraft, item.aircraft) : undefined;
      // At typical terminal speeds one NM is roughly 15–18 seconds. This is a
      // tactical early warning, deliberately before the hard separation model.
      const etaGapSeconds = leader ? item.etaSeconds - leader.etaSeconds : Infinity;
      const spacingRisk = Boolean(requiredSpacingNm && etaGapSeconds < requiredSpacingNm * 16);
      const recommendedSpeed = spacingRisk && leader
        ? Math.max(item.aircraft.performance.minSpeed, Math.min(item.aircraft.targetSpeed - 10, leader.aircraft.speed - 8))
        : undefined;
      advice.set(item.aircraft.callsign, {
        runwayId,
        sequence: index + 1,
        etaSeconds: item.etaSeconds,
        distanceNm: item.distanceNm,
        recommendedAltitude: item.recommendedAltitude,
        shouldDescend: item.aircraft.altitude > item.recommendedAltitude + 600,
        crosswindKt: runwayWindComponents(world, item.runway).crosswindKt,
        recommendedHeading: item.recommendedHeading,
        leaderCallsign: leader?.aircraft.callsign,
        requiredSpacingNm,
        spacingRisk,
        recommendedSpeed,
      });
    });
  }
  return advice;
}
