import { distance } from './math';
import { activeFixId } from './navigation';
import type { Aircraft, RadarWorld, Runway, Vector2 } from './types';
import { runwayWindComponents } from './weather';

export interface ArrivalAdvice {
  runwayId: string;
  sequence: number;
  etaSeconds: number;
  distanceNm: number;
  recommendedAltitude: number;
  shouldDescend: boolean;
  crosswindKt: number;
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
      return [{ aircraft: item, runway, distanceNm, etaSeconds, recommendedAltitude }];
    });
  const advice = new Map<string, ArrivalAdvice>();
  for (const runwayId of new Set(candidates.map((item) => item.runway.id))) {
    const runwayCandidates = candidates.filter((item) => item.runway.id === runwayId).sort((first, second) => first.etaSeconds - second.etaSeconds);
    runwayCandidates.forEach((item, index) => {
      advice.set(item.aircraft.callsign, {
        runwayId,
        sequence: index + 1,
        etaSeconds: item.etaSeconds,
        distanceNm: item.distanceNm,
        recommendedAltitude: item.recommendedAltitude,
        shouldDescend: item.aircraft.altitude > item.recommendedAltitude + 600,
        crosswindKt: runwayWindComponents(world, item.runway).crosswindKt,
      });
    });
  }
  return advice;
}
