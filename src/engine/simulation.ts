import { distance, moveToward, turnToward } from './math';
import { guideNavigation } from './navigation';
import { spawnTraffic } from './scenario';
import type { Aircraft, Conflict, GameEvent, GameState, RadarWorld, Runway, Trend, Vector2 } from './types';

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;
const GLIDESLOPE_FEET_PER_NM = 318;
const APPROACH_CAPTURE_DISTANCE_NM = 16;
const APPROACH_CAPTURE_LATERAL_NM = 2.2;
const RUNWAY_TURNAROUND_SECONDS = 45;

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

export function trafficProfile(spawned: number) {
  const level = Math.min(5, 1 + Math.floor(spawned / 3));
  return {
    level,
    spawnInterval: [18, 16, 13, 11, 9][level - 1],
    maxAircraft: [5, 6, 7, 8, 9][level - 1],
  };
}

export function requiredFinalSeparationNm(leadingAircraft: Aircraft) {
  if (['B77W', 'A330'].includes(leadingAircraft.type)) return 5.5;
  if (['A321', 'A21N', 'B738', 'B39M'].includes(leadingAircraft.type)) return 4.5;
  return 4;
}

function createPriorityTraffic(aircraft: Aircraft, elapsedSeconds: number): Aircraft {
  if (aircraft.phase !== 'arrival') return aircraft;
  const kind = aircraft.callsign.endsWith('2') || aircraft.callsign.endsWith('9') ? 'minimumFuel' : 'medical';
  return {
    ...aircraft,
    priority: {
      kind,
      deadlineAt: elapsedSeconds + (kind === 'minimumFuel' ? 155 : 210),
      alertRaised: false,
    },
  };
}

export function landingClearanceStatus(state: GameState, callsign: string, world: RadarWorld) {
  const aircraft = state.aircraft.find((item) => item.callsign === callsign);
  if (!aircraft?.approach) return { ok: false, message: 'Önce bir ILS yaklaşması başlatmalısın.' };
  const runway = world.runways.find((item) => item.id === aircraft.approach?.runwayId);
  if (!runway) return { ok: false, message: 'Atanmış pist bulunamadı.' };
  const availableAt = state.runwayAvailableAt[runway.id] ?? 0;
  if (availableAt > state.elapsedSeconds) {
    return { ok: false, message: `${runway.id} pist işgali nedeniyle ${Math.ceil(availableAt - state.elapsedSeconds)} sn daha müsait değil.` };
  }

  const candidateDistance = getApproachGeometry(aircraft, runway).distanceToThreshold;
  const leadOnFinal = state.aircraft.find((item) => {
    if (item.callsign === aircraft.callsign || item.approach?.runwayId !== runway.id || !item.approach.landingCleared) return false;
    const leadDistance = getApproachGeometry(item, runway).distanceToThreshold;
    return leadDistance >= 0
      && leadDistance < candidateDistance
      && candidateDistance - leadDistance < requiredFinalSeparationNm(item);
  });
  if (leadOnFinal) {
    return { ok: false, message: `${leadOnFinal.callsign} aynı pistte önde. Bu ${leadOnFinal.type} için en az ${requiredFinalSeparationNm(leadOnFinal)} NM final aralığı bırak.` };
  }
  return { ok: true, message: `${runway.id} iniş izni verilebilir.` };
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
        continue;
      }

      const firstHeading = (first.heading * Math.PI) / 180;
      const secondHeading = (second.heading * Math.PI) / 180;
      const firstVelocity = { x: Math.sin(firstHeading) * first.speed / SECONDS_PER_HOUR, y: -Math.cos(firstHeading) * first.speed / SECONDS_PER_HOUR };
      const secondVelocity = { x: Math.sin(secondHeading) * second.speed / SECONDS_PER_HOUR, y: -Math.cos(secondHeading) * second.speed / SECONDS_PER_HOUR };
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
      const firstVerticalRate = first.targetAltitude > first.altitude ? first.performance.climbRateFpm / SECONDS_PER_MINUTE : first.targetAltitude < first.altitude ? -first.performance.descentRateFpm / SECONDS_PER_MINUTE : 0;
      const secondVerticalRate = second.targetAltitude > second.altitude ? second.performance.climbRateFpm / SECONDS_PER_MINUTE : second.targetAltitude < second.altitude ? -second.performance.descentRateFpm / SECONDS_PER_MINUTE : 0;
      const closestVertical = Math.abs((first.altitude + firstVerticalRate * timeSeconds) - (second.altitude + secondVerticalRate * timeSeconds));
      if (closestHorizontal < 3 && closestVertical < 1000) {
        conflicts.push({
          pair: [first.callsign, second.callsign],
          horizontalNm,
          verticalFt,
          severity: 'warning',
          predicted: { timeSeconds, horizontalNm: closestHorizontal },
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
  const leavingAircraft = recoveredAircraft.filter((item) => (
    item.phase === 'departure'
    && distance(item.position, { x: 0, y: 0 }) > _world.rangeNm + 2
  ));
  const handedOffAircraft = leavingAircraft.filter((item) => item.handoffCleared);
  const missedHandoffAircraft = leavingAircraft.filter((item) => !item.handoffCleared);
  let aircraft = recoveredAircraft.filter((item) => !landedAircraft.includes(item) && !leavingAircraft.includes(item));
  let spawned = state.spawned;
  let nextTrafficAt = state.nextTrafficAt;
  let runwayAvailableAt = state.runwayAvailableAt;
  let eventLog = navigationResults.reduce<GameEvent[]>((events, result) => (
    result.event ? appendEvent(events, result.event) : events
  ), state.eventLog);
  const elapsedSeconds = state.elapsedSeconds + boundedDt;
  const priorityLanded = landedAircraft.filter((item) => item.priority);

  if (landedAircraft.length > 0) {
    runwayAvailableAt = { ...runwayAvailableAt };
    for (const item of landedAircraft) {
      if (item.approach) runwayAvailableAt[item.approach.runwayId] = elapsedSeconds + RUNWAY_TURNAROUND_SECONDS;
    }
    eventLog = appendEvent(eventLog, {
      id: `landing-${Math.round(elapsedSeconds * 10)}`,
      type: 'success',
      message: `${landedAircraft.map((item) => item.callsign).join(', ')} · iniş tamamlandı (+${100 + (priorityLanded.length > 0 ? 150 : 0)})`,
    });
  }

  if (priorityLanded.length > 0) {
    eventLog = appendEvent(eventLog, {
      id: `priority-landing-${Math.round(elapsedSeconds * 10)}`,
      type: 'success',
      message: `${priorityLanded.map((item) => item.callsign).join(', ')} · öncelikli trafik güvenle indirildi (+150)`,
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

  if (missedHandoffAircraft.length > 0) {
    eventLog = appendEvent(eventLog, {
      id: `missed-handoff-${Math.round(elapsedSeconds * 10)}`,
      type: 'danger',
      message: `${missedHandoffAircraft.map((item) => item.callsign).join(', ')} · koordinasyonsuz sektör çıkışı (-100)`,
    });
  }

  const profile = trafficProfile(spawned);
  if (elapsedSeconds >= nextTrafficAt && aircraft.length < profile.maxAircraft) {
    const incoming = spawnTraffic(spawned, _world);
    const scheduledIncoming = spawned > 0 && spawned % 6 === 0 ? createPriorityTraffic(incoming, elapsedSeconds) : incoming;
    if (!aircraft.some((item) => item.callsign === scheduledIncoming.callsign)) {
      aircraft = [...aircraft, scheduledIncoming];
      spawned += 1;
      eventLog = appendEvent(eventLog, {
        id: `traffic-${spawned}`,
        type: scheduledIncoming.priority ? 'warning' : 'info',
        message: scheduledIncoming.priority
          ? `${scheduledIncoming.callsign} ÖNCELİKLİ · ${scheduledIncoming.priority.kind === 'minimumFuel' ? 'minimum yakıt' : 'tıbbi uçuş'} · inişe öncelik ver`
          : scheduledIncoming.phase === 'arrival'
            ? `${scheduledIncoming.callsign} sahaya girdi · planlanan pist ${scheduledIncoming.assignedRunway ?? 'ATC'}`
            : `${scheduledIncoming.callsign} sahaya girdi · kalkış trafiği`,
      });
    }
    nextTrafficAt += profile.spawnInterval;
  }

  const nextTrafficLevel = trafficProfile(spawned).level;
  if (nextTrafficLevel > state.trafficLevel) {
    eventLog = appendEvent(eventLog, {
      id: `traffic-level-${nextTrafficLevel}`,
      type: 'warning',
      message: `SEKTÖR YOĞUNLUĞU ${nextTrafficLevel}/5 · daha sık trafik ve daha dar kapasite`,
    });
  }

  const expiredPriority = aircraft.filter((item) => item.priority && !item.priority.alertRaised && item.priority.deadlineAt <= elapsedSeconds);
  if (expiredPriority.length > 0) {
    aircraft = aircraft.map((item) => (
      expiredPriority.includes(item) && item.priority
        ? { ...item, priority: { ...item.priority, alertRaised: true } }
        : item
    ));
    eventLog = appendEvent(eventLog, {
      id: `priority-expired-${Math.round(elapsedSeconds * 10)}`,
      type: 'danger',
      message: `${expiredPriority.map((item) => item.callsign).join(', ')} · öncelik süresi aşıldı (-150)`,
    });
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
    score: Math.max(0, state.score + landedAircraft.length * 100 + priorityLanded.length * 150 + handedOffAircraft.length * 50 - missedHandoffAircraft.length * 100 - newLossPairs.length * 250 - expiredPriority.length * 150),
    spawned,
    trafficLevel: nextTrafficLevel,
    nextTrafficAt,
    runwayAvailableAt,
    eventLog,
    activeLossPairs: lossPairs,
    handoffs: state.handoffs + handedOffAircraft.length,
  };
}
