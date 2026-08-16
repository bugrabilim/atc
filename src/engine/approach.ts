import { normalizeHeading } from './math';
import { approachLateralToleranceNm, stabilizedApproachSpeedKt } from './weather';
import type { Aircraft, GameEvent, RadarWorld, Runway, Vector2 } from './types';

export const GLIDESLOPE_FEET_PER_NM = 318;
const MAX_CAPTURE_DISTANCE_NM = 18;
const MAX_INTERCEPT_ANGLE_DEG = 60;

export interface ApproachGeometry {
  distanceToThreshold: number;
  lateralDistance: number;
  signedCrossTrack: number;
}

function inboundVector(heading: number): Vector2 {
  const radians = (heading * Math.PI) / 180;
  return { x: Math.sin(radians), y: -Math.cos(radians) };
}

export function angularDifference(first: number, second: number) {
  return Math.abs(((first - second + 540) % 360) - 180);
}

export function approachGeometry(aircraft: Pick<Aircraft, 'position'>, runway: Runway): ApproachGeometry {
  const inbound = inboundVector(runway.heading);
  const relative = {
    x: aircraft.position.x - runway.center.x,
    y: aircraft.position.y - runway.center.y,
  };
  const distanceToThreshold = -(relative.x * inbound.x + relative.y * inbound.y);
  const signedCrossTrack = relative.x * inbound.y - relative.y * inbound.x;
  return { distanceToThreshold, lateralDistance: Math.abs(signedCrossTrack), signedCrossTrack };
}

export function glideslopeAltitude(distanceToThreshold: number) {
  return Math.max(40, distanceToThreshold * GLIDESLOPE_FEET_PER_NM + 40);
}

function localizerCorridorNm(distanceToThreshold: number, weatherTolerance: number) {
  const angularCorridor = Math.max(0.22, distanceToThreshold * Math.tan(5.5 * Math.PI / 180));
  return Math.min(weatherTolerance, angularCorridor);
}

export interface ApproachGuidance {
  aircraft: Aircraft;
  event?: GameEvent;
  towerHandoff?: boolean;
  goAround?: boolean;
}

export function guideApproach(aircraft: Aircraft, world: RadarWorld, elapsedSeconds: number): ApproachGuidance {
  if (!aircraft.approach) return { aircraft };
  const runway = world.runways.find((item) => item.id === aircraft.approach?.runwayId);
  if (!runway || runway.operation === 'inactive') return { aircraft: { ...aircraft, approach: undefined } };

  const geometry = approachGeometry(aircraft, runway);
  const approach = aircraft.approach;
  const corridor = localizerCorridorNm(geometry.distanceToThreshold, approachLateralToleranceNm(world, runway));
  const interceptAngle = angularDifference(aircraft.heading, runway.heading);

  if (approach.status === 'armed') {
    const canCaptureLocalizer = geometry.distanceToThreshold >= 1.2
      && geometry.distanceToThreshold <= MAX_CAPTURE_DISTANCE_NM
      && geometry.lateralDistance <= corridor
      && interceptAngle <= MAX_INTERCEPT_ANGLE_DEG;
    if (!canCaptureLocalizer) return { aircraft };
    return {
      aircraft: {
        ...aircraft,
        approach: { ...approach, status: 'localizer', capturedAt: elapsedSeconds },
        targetHeading: runway.heading,
        turnDirection: 'shortest',
      },
      event: {
        id: `loc-${aircraft.callsign}-${Math.round(elapsedSeconds * 10)}`,
        type: 'success',
        message: `${aircraft.callsign} · ${runway.id} localizer yakalandı`,
      },
    };
  }

  const localizerCorrection = Math.max(-18, Math.min(18, geometry.signedCrossTrack * 7));
  let guided: Aircraft = {
    ...aircraft,
    targetHeading: normalizeHeading(runway.heading + localizerCorrection),
    turnDirection: 'shortest',
  };

  if (geometry.distanceToThreshold < -0.3 || geometry.lateralDistance > 2.4) {
    return { aircraft: guided, goAround: true };
  }

  if (approach.status === 'localizer') {
    if (approach.localizerOnly) return { aircraft: guided };
    const glideAltitude = glideslopeAltitude(geometry.distanceToThreshold);
    const capturesFromBelow = aircraft.altitude <= glideAltitude + 140
      && aircraft.altitude >= glideAltitude - 900;
    if (geometry.distanceToThreshold <= 14 && geometry.distanceToThreshold >= 1.4 && capturesFromBelow) {
      guided = {
        ...guided,
        approach: { ...approach, status: 'glideslope', capturedAt: elapsedSeconds },
        targetAltitude: glideAltitude,
      };
      return {
        aircraft: guided,
        event: {
          id: `gs-${aircraft.callsign}-${Math.round(elapsedSeconds * 10)}`,
          type: 'success',
          message: `${aircraft.callsign} · glideslope aşağıdan yakalandı`,
        },
      };
    }
    if (geometry.distanceToThreshold < 1.25) return { aircraft: guided, goAround: true };
    return { aircraft: guided };
  }

  const glideAltitude = glideslopeAltitude(geometry.distanceToThreshold);
  guided = {
    ...guided,
    targetAltitude: glideAltitude,
    targetSpeed: stabilizedApproachSpeedKt(world, runway, aircraft.performance.finalApproachSpeed),
  };

  if (approach.status === 'glideslope') {
    const establishedForSeconds = elapsedSeconds - (approach.capturedAt ?? elapsedSeconds);
    if (establishedForSeconds >= 3 || geometry.distanceToThreshold <= 9.5) {
      return {
        aircraft: {
          ...guided,
          approach: { ...approach, status: 'tower', towerHandoffAt: elapsedSeconds },
        },
        towerHandoff: true,
        event: {
          id: `tower-${aircraft.callsign}-${Math.round(elapsedSeconds * 10)}`,
          type: 'success',
          message: `${aircraft.callsign} · ${runway.id} üzerinde established, kuleye devredildi`,
        },
      };
    }
  }

  return { aircraft: guided };
}

export function completedLanding(aircraft: Aircraft, world: RadarWorld) {
  if (aircraft.approach?.status !== 'tower') return false;
  const runway = world.runways.find((item) => item.id === aircraft.approach?.runwayId);
  if (!runway) return false;
  const geometry = approachGeometry(aircraft, runway);
  return geometry.distanceToThreshold <= 0.18
    && geometry.distanceToThreshold >= -0.7
    && geometry.lateralDistance <= 0.24
    && aircraft.altitude <= 170
    && angularDifference(aircraft.heading, runway.heading) <= 7;
}

export function initiateGoAround(aircraft: Aircraft, world: RadarWorld, elapsedSeconds: number): Aircraft {
  const runway = world.runways.find((item) => item.id === aircraft.approach?.runwayId);
  return {
    ...aircraft,
    approach: undefined,
    targetHeading: runway?.heading ?? aircraft.heading,
    targetAltitude: Math.max(3000, aircraft.altitude),
    targetSpeed: Math.max(210, aircraft.speed),
    speedMode: 'normal',
    expedite: true,
    turnDirection: 'shortest',
    goAroundGraceUntil: elapsedSeconds + 45,
  };
}

