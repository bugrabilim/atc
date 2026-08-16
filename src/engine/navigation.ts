import { distance, normalizeHeading } from './math';
import type { Aircraft, GameEvent, RadarWorld, Vector2 } from './types';

const FIX_PASS_DISTANCE_NM = 0.55;

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
  if (!navigation || aircraft.approach?.status === 'captured') return { aircraft };
  const fixId = navigation.fixIds[navigation.currentLegIndex];
  const fix = world.fixes.find((item) => item.id === fixId);
  if (!fix) return { aircraft: { ...aircraft, navigation: undefined } };

  const fixDistance = distance(aircraft.position, fix.position);
  if (navigation.mode === 'hold' && navigation.holding) {
    return {
      aircraft: {
        ...aircraft,
        targetHeading: normalizeHeading(bearingTo(aircraft.position, fix.position) + 95),
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
