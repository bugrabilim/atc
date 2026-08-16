import { distance, normalizeHeading } from './math';
import type { Aircraft, GameEvent, RadarWorld, Vector2 } from './types';

const FIX_PASS_DISTANCE_NM = 0.55;
const HOLD_RADIUS_NM = 1.6;

export function bearingTo(from: Vector2, to: Vector2) {
  return normalizeHeading((Math.atan2(to.x - from.x, -(to.y - from.y)) * 180) / Math.PI);
}

function eventFor(aircraft: Aircraft, message: string): GameEvent {
  return {
    id: `nav-${aircraft.callsign}-${aircraft.navigation?.currentLegIndex ?? 0}-${Math.round(aircraft.position.x * 10)}-${Math.round(aircraft.position.y * 10)}`,
    type: 'info',
    message,
  };
}

export function guideNavigation(aircraft: Aircraft, world: RadarWorld): { aircraft: Aircraft; event?: GameEvent } {
  const navigation = aircraft.navigation;
  if (!navigation || (aircraft.approach && aircraft.approach.status !== 'armed')) return { aircraft };
  const fixId = navigation.fixIds[navigation.currentLegIndex];
  const fix = world.fixes.find((item) => item.id === fixId);
  if (!fix) return { aircraft: { ...aircraft, navigation: undefined } };

  const fixDistance = distance(aircraft.position, fix.position);
  if (navigation.mode === 'hold' && navigation.holding) {
    // A stable right-hand orbit gives HOLD a predictable controller tool instead
    // of repeatedly steering straight at the fix. The small radial correction
    // keeps the aircraft near a usable holding radius as wind changes its track.
    const radial = bearingTo(fix.position, aircraft.position);
    const radiusError = fixDistance - HOLD_RADIUS_NM;
    const radialCorrection = Math.max(-32, Math.min(42, radiusError * 28));
    const targetHeading = fixDistance < 0.35
      ? normalizeHeading(aircraft.heading + 90)
      : normalizeHeading(radial + 90 + radialCorrection);
    return {
      aircraft: {
        ...aircraft,
        targetHeading,
        turnDirection: 'shortest',
      },
    };
  }

  if (fixDistance <= FIX_PASS_DISTANCE_NM) {
    if (navigation.mode === 'hold') {
      return {
        aircraft: { ...aircraft, navigation: { ...navigation, holding: true } },
        event: eventFor(aircraft, `${aircraft.callsign} · ${fixId} üzerinde hold başladı`),
      };
    }
    if (navigation.mode === 'direct' || navigation.currentLegIndex >= navigation.fixIds.length - 1) {
      return {
        aircraft: { ...aircraft, navigation: undefined },
        event: eventFor(aircraft, `${aircraft.callsign} · ${fixId} geçildi, serbest vektör`),
      };
    }
    const nextLegIndex = navigation.currentLegIndex + 1;
    return {
      aircraft: {
        ...aircraft,
        navigation: { ...navigation, currentLegIndex: nextLegIndex },
      },
      event: eventFor(aircraft, `${aircraft.callsign} · ${fixId} geçildi, sonraki nokta ${navigation.fixIds[nextLegIndex]}`),
    };
  }

  return {
    aircraft: {
      ...aircraft,
      targetHeading: bearingTo(aircraft.position, fix.position),
      turnDirection: 'shortest',
    },
  };
}

export function activeFixId(aircraft: Aircraft) {
  return aircraft.navigation?.fixIds[aircraft.navigation.currentLegIndex] ?? null;
}
