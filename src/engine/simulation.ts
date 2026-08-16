import { approachGeometry, completedLanding, guideApproach, initiateGoAround } from './approach';
import { stepAircraftDynamics } from './aircraftDynamics';
import { applyCommand } from './commands';
import { distance } from './math';
import { guideNavigation } from './navigation';
import { detectConflicts as detectOperationalConflicts } from './separation';
import { profileForSkill, updateSkill } from './skill';
import { difficultyConfig, limitSkillForMode, modeTrafficProfile } from './difficulty';
import { flowCapacity, planTraffic } from './trafficDirector';
import { requiredWakeSeparationNm } from './wake';
import type { Aircraft, Conflict, GameEvent, GameMode, GameState, RadarWorld, Trend } from './types';

const FIXED_STEP_SECONDS = 0.05;
const RUNWAY_TURNAROUND_SECONDS = 45;

export function aircraftTrend(aircraft: Aircraft): Trend {
  if (aircraft.verticalSpeed > 100 || aircraft.targetAltitude > aircraft.altitude + 50) return 'climb';
  if (aircraft.verticalSpeed < -100 || aircraft.targetAltitude < aircraft.altitude - 50) return 'descend';
  return 'level';
}

export function trafficProfile(skill: number, world?: RadarWorld, mode?: GameMode) {
  const capacity = world ? flowCapacity(world) : { intervalAdjustment: 0, aircraftAdjustment: 0 };
  const profile = profileForSkill(skill, capacity.aircraftAdjustment);
  const adjusted = {
    ...profile,
    spawnInterval: Math.max(6.5, profile.spawnInterval + capacity.intervalAdjustment),
  };
  return mode ? modeTrafficProfile(mode, adjusted) : adjusted;
}

export function requiredFinalSeparationNm(leadingAircraft: Aircraft, followingAircraft?: Aircraft) {
  return requiredWakeSeparationNm(leadingAircraft, followingAircraft ?? { wakeCategory: 'E' });
}

/** Kept for old callers; landing clearance is intentionally automatic in approach-control mode. */
export function landingClearanceStatus() {
  return {
    ok: false,
    message: 'LAND komutu kullanılmıyor. Localizer ve glideslope established olduğunda uçak kuleye otomatik devredilir.',
  };
}

function createPriorityTraffic(aircraft: Aircraft, elapsedSeconds: number): Aircraft {
  if (aircraft.phase !== 'arrival') return aircraft;
  const kind = aircraft.callsign.endsWith('2') || aircraft.callsign.endsWith('9') ? 'minimumFuel' : 'medical';
  return {
    ...aircraft,
    priority: {
      kind,
      deadlineAt: elapsedSeconds + (kind === 'minimumFuel' ? 210 : 260),
      alertRaised: false,
    },
  };
}

function appendEvent(events: GameEvent[], event: GameEvent) {
  return [...events, event].slice(-5);
}

function operationalFlowChange(state: GameState, world: RadarWorld, elapsedSeconds: number) {
  const config = difficultyConfig(state.mode);
  // Higher difficulties deliberately disrupt a comfortable runway setup once
  // per shift. This creates a real controller decision: preserve a sequence,
  // then absorb a reduced-capacity flow instead of repeating one static board.
  if (!config.showAdvancedCommands || elapsedSeconds < 210) return null;
  if (state.eventTimeline.some((event) => event.id.startsWith('flow-change-'))) return null;
  const current = world.flowConfigurations.find((item) => item.id === state.flowId);
  const alternatives = world.flowConfigurations.filter((item) => item.id !== state.flowId);
  const next = [...alternatives].sort((first, second) => {
    const firstCapacity = first.arrivalRunwayIds.length + first.departureRunwayIds.length;
    const secondCapacity = second.arrivalRunwayIds.length + second.departureRunwayIds.length;
    return firstCapacity - secondCapacity || first.visibilityNm - second.visibilityNm;
  })[0];
  if (!next || !current) return null;
  return {
    flowId: next.id,
    event: {
      id: `flow-change-${state.mode}-${Math.round(elapsedSeconds)}`,
      type: 'warning' as const,
      message: `OPERASYON DEĞİŞİKLİĞİ · ${current.label} → ${next.label} · yeni trafik ve pist kapasitesi bu akışa geçti`,
    },
  };
}

export function detectConflicts(aircraft: readonly Aircraft[], world?: RadarWorld, elapsedSeconds = 0): Conflict[] {
  return detectOperationalConflicts(aircraft, world, elapsedSeconds);
}

function stepFixed(state: GameState, world: RadarWorld, dt: number): GameState {
  const elapsedSeconds = state.elapsedSeconds + dt;
  const acknowledgedInstructions = state.pendingInstructions.filter((item) => item.executeAt <= elapsedSeconds);
  const pendingInstructions = state.pendingInstructions.filter((item) => item.executeAt > elapsedSeconds);
  const instructedAircraft = acknowledgedInstructions.reduce(
    (aircraft, instruction) => applyCommand(aircraft, instruction.command),
    state.aircraft,
  );

  const manualGoAroundAircraft = instructedAircraft.filter((item) => item.goAroundRequested && item.approach);
  const approachInputAircraft = instructedAircraft.map((item) => (
    item.goAroundRequested && item.approach ? initiateGoAround(item, world, elapsedSeconds) : item
  ));

  const approachResults = approachInputAircraft.map((item) => guideApproach(item, world, elapsedSeconds));
  const guidanceGoAroundAircraft = approachResults.filter((item) => item.goAround).map((item) => item.aircraft);
  const guidedResults = approachResults.map((result) => {
    const aircraft = result.goAround ? initiateGoAround(result.aircraft, world, elapsedSeconds) : result.aircraft;
    return guideNavigation(aircraft, world);
  });
  const initiallyMovedAircraft = guidedResults.map((item) => stepAircraftDynamics(item.aircraft, world, dt));
  const operationalGoAroundAircraft = initiallyMovedAircraft.filter((candidate) => {
    if (!candidate.approach || candidate.approach.status === 'armed' || candidate.approach.status === 'localizer') return false;
    const runway = world.runways.find((item) => item.id === candidate.approach?.runwayId);
    if (!runway) return false;
    const candidateDistance = approachGeometry(candidate, runway).distanceToThreshold;
    if (candidateDistance > 3.2 || candidateDistance < 0) return false;
    if ((state.runwayAvailableAt[runway.id] ?? 0) > elapsedSeconds) return true;
    return initiallyMovedAircraft.some((leader) => {
      if (leader.callsign === candidate.callsign || leader.approach?.runwayId !== runway.id || leader.approach.status === 'armed') return false;
      const leaderDistance = approachGeometry(leader, runway).distanceToThreshold;
      return leaderDistance >= 0
        && leaderDistance < candidateDistance
        && candidateDistance - leaderDistance < requiredWakeSeparationNm(leader, candidate);
    });
  });
  const operationalGoAroundCallsigns = new Set(operationalGoAroundAircraft.map((item) => item.callsign));
  const movedAircraft = initiallyMovedAircraft.map((item) => (
    operationalGoAroundCallsigns.has(item.callsign) ? initiateGoAround(item, world, elapsedSeconds) : item
  ));
  const goAroundAircraft = [...manualGoAroundAircraft, ...guidanceGoAroundAircraft, ...operationalGoAroundAircraft];
  const landedAircraft = movedAircraft.filter((item) => completedLanding(item, world));
  const leavingAircraft = movedAircraft.filter((item) => (
    item.phase === 'departure' && distance(item.position, { x: 0, y: 0 }) > world.rangeNm + 2
  ));
  const handedOffAircraft = leavingAircraft.filter((item) => item.handoffCleared);
  const missedHandoffAircraft = leavingAircraft.filter((item) => !item.handoffCleared);
  const unmanagedArrivalAircraft = movedAircraft.filter((item) => (
    item.phase === 'arrival'
    && item.approach?.status !== 'tower'
    && distance(item.position, { x: 0, y: 0 }) > world.rangeNm + 2
  ));

  let aircraft = movedAircraft.filter((item) => (
    !landedAircraft.includes(item)
    && !leavingAircraft.includes(item)
    && !unmanagedArrivalAircraft.includes(item)
  ));
  let spawned = state.spawned;
  let nextTrafficAt = state.nextTrafficAt;
  let runwayAvailableAt = state.runwayAvailableAt;
  let eventLog = state.eventLog;
  let flowId = state.flowId;

  for (const result of approachResults) if (result.event) eventLog = appendEvent(eventLog, result.event);
  for (const result of guidedResults) if (result.event) eventLog = appendEvent(eventLog, result.event);
  for (const instruction of acknowledgedInstructions) {
    eventLog = appendEvent(eventLog, {
      id: `readback-${instruction.id}`,
      type: 'info',
      message: `${instruction.command.callsign} · readback onaylandı: ${instruction.normalized}`,
    });
  }

  const towerHandoffs = approachResults.filter((item) => item.towerHandoff).length;
  if (landedAircraft.length > 0) {
    runwayAvailableAt = { ...runwayAvailableAt };
    for (const item of landedAircraft) {
      if (item.approach) runwayAvailableAt[item.approach.runwayId] = elapsedSeconds + RUNWAY_TURNAROUND_SECONDS;
    }
    eventLog = appendEvent(eventLog, {
      id: `landing-${Math.round(elapsedSeconds * 20)}`,
      type: 'success',
      message: `${landedAircraft.map((item) => item.callsign).join(', ')} · touchdown, pist terk ediliyor`,
    });
  }
  if (goAroundAircraft.length > 0) {
    eventLog = appendEvent(eventLog, {
      id: `go-around-${Math.round(elapsedSeconds * 20)}`,
      type: 'warning',
      message: `${goAroundAircraft.map((item) => item.callsign).join(', ')} · go-around prosedürü başlatıldı`,
    });
  }
  if (handedOffAircraft.length > 0) {
    eventLog = appendEvent(eventLog, {
      id: `handoff-${Math.round(elapsedSeconds * 20)}`,
      type: 'success',
      message: `${handedOffAircraft.map((item) => item.callsign).join(', ')} · sektör handoff tamamlandı`,
    });
  }
  if (missedHandoffAircraft.length > 0) {
    eventLog = appendEvent(eventLog, {
      id: `missed-handoff-${Math.round(elapsedSeconds * 20)}`,
      type: 'danger',
      message: `${missedHandoffAircraft.map((item) => item.callsign).join(', ')} · koordinasyonsuz sektör çıkışı`,
    });
  }
  if (unmanagedArrivalAircraft.length > 0) {
    eventLog = appendEvent(eventLog, {
      id: `unmanaged-arrival-${Math.round(elapsedSeconds * 20)}`,
      type: 'warning',
      message: `${unmanagedArrivalAircraft.map((item) => item.callsign).join(', ')} · yaklaşma yönetilmeden sektörden çıktı`,
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
      id: `priority-expired-${Math.round(elapsedSeconds * 20)}`,
      type: 'danger',
      message: `${expiredPriority.map((item) => item.callsign).join(', ')} · öncelik süresi aşıldı`,
    });
  }

  const conflictsBeforeSpawn = detectOperationalConflicts(aircraft, world, elapsedSeconds);
  const lossKeys = conflictsBeforeSpawn
    .filter((item) => item.severity === 'loss')
    .map((item) => `${[...item.pair].sort().join('-')}:${item.reason ?? 'separation'}`);
  const newLossKeys = lossKeys.filter((item) => !state.activeLossPairs.includes(item));
  const newWakeLosses = newLossKeys.filter((item) => item.endsWith(':wake')).length;
  if (newLossKeys.length > 0) {
    eventLog = appendEvent(eventLog, {
      id: `loss-${Math.round(elapsedSeconds * 20)}`,
      type: 'danger',
      message: newWakeLosses > 0 ? `WAKE / AYIRMA KAYBI · ${newLossKeys.join(', ')}` : `AYIRMA KAYBI · ${newLossKeys.join(', ')}`,
    });
  }

  const skill = limitSkillForMode(state.mode, updateSkill(state.skill, {
    towerHandoffs,
    departureHandoffs: handedOffAircraft.length,
    separationLosses: newLossKeys.length,
    wakeViolations: newWakeLosses,
    goArounds: goAroundAircraft.length,
    missedHandoffs: missedHandoffAircraft.length,
    unmanagedArrivals: unmanagedArrivalAircraft.length,
    expiredPriorities: expiredPriority.length,
  }));
  const peakSkill = Math.max(state.peakSkill, skill);
  const profile = trafficProfile(skill, world, state.mode);

  if (elapsedSeconds >= nextTrafficAt) {
    if (aircraft.length < profile.targetAircraft) {
      const plannedTraffic = planTraffic(spawned, aircraft, world, state.seed);
      const incoming = difficultyConfig(state.mode).allowPriorityTraffic && spawned > 0 && spawned % 7 === 0
        ? createPriorityTraffic(plannedTraffic.aircraft, elapsedSeconds)
        : plannedTraffic.aircraft;
      if (!aircraft.some((item) => item.callsign === incoming.callsign)) {
        aircraft = [...aircraft, incoming];
        spawned += 1;
        eventLog = appendEvent(eventLog, {
          id: `traffic-${spawned}`,
          type: incoming.priority ? 'warning' : 'info',
          message: incoming.priority
            ? `${incoming.callsign} ÖNCELİKLİ · ${incoming.priority.kind === 'minimumFuel' ? 'minimum yakıt' : 'tıbbi uçuş'}`
            : plannedTraffic.message,
        });
      }
      nextTrafficAt = elapsedSeconds + profile.spawnInterval;
    } else {
      nextTrafficAt = elapsedSeconds + 2;
    }
  }

  if (profile.level !== state.trafficLevel) {
    eventLog = appendEvent(eventLog, {
      id: `traffic-level-${profile.level}-${Math.round(elapsedSeconds)}`,
      type: profile.level > state.trafficLevel ? 'warning' : 'info',
      message: `İŞ YÜKÜ ${profile.level}/5 · canlı skill ${skill.toFixed(1)} · hedef trafik ${profile.targetAircraft}`,
    });
  }

  const flowChange = operationalFlowChange(state, world, elapsedSeconds);
  if (flowChange) {
    flowId = flowChange.flowId;
    eventLog = appendEvent(eventLog, flowChange.event);
  }

  const conflicts = detectOperationalConflicts(aircraft, world, elapsedSeconds);
  const shouldSampleTrack = elapsedSeconds - state.lastTrackAt >= 1;
  const trackHistory = shouldSampleTrack
    ? Object.fromEntries(aircraft.map((item) => [
      item.callsign,
      [...(state.trackHistory[item.callsign] ?? []), { ...item.position }].slice(-60),
    ]))
    : state.trackHistory;
  const timelineUpdates = eventLog.filter((event) => !state.eventLog.some((previous) => previous.id === event.id));
  const activeCallsigns = new Set(aircraft.map((item) => item.callsign));
  const selectedCallsign = state.selectedCallsign && activeCallsigns.has(state.selectedCallsign)
    ? state.selectedCallsign
    : aircraft[0]?.callsign ?? null;

  return {
    ...state,
    elapsedSeconds,
    aircraft,
    conflicts,
    selectedCallsign,
    skill,
    peakSkill,
    targetAircraft: profile.targetAircraft,
    score: Math.round(peakSkill * 10),
    landed: state.landed + landedAircraft.length,
    spawned,
    trafficLevel: profile.level,
    flowId,
    nextTrafficAt,
    runwayAvailableAt,
    eventLog,
    activeLossPairs: lossKeys,
    handoffs: state.handoffs + handedOffAircraft.length,
    trackHistory,
    lastTrackAt: shouldSampleTrack ? elapsedSeconds : state.lastTrackAt,
    pendingInstructions,
    metrics: {
      separationLosses: state.metrics.separationLosses + newLossKeys.length,
      wakeViolations: state.metrics.wakeViolations + newWakeLosses,
      goArounds: state.metrics.goArounds + goAroundAircraft.length,
      missedHandoffs: state.metrics.missedHandoffs + missedHandoffAircraft.length,
      expiredPriorities: state.metrics.expiredPriorities + expiredPriority.length,
      unmanagedArrivals: state.metrics.unmanagedArrivals + unmanagedArrivalAircraft.length,
    },
    eventTimeline: [...state.eventTimeline, ...timelineUpdates].slice(-60),
  };
}

export function stepGame(state: GameState, world: RadarWorld, dt: number): GameState {
  if (state.paused || dt <= 0) return state;
  let next = state;
  let remaining = Math.min(dt, 0.25) * state.timeScale;
  while (remaining > 0.0001) {
    const step = Math.min(FIXED_STEP_SECONDS, remaining);
    next = stepFixed(next, world, step);
    remaining -= step;
  }
  return next;
}
