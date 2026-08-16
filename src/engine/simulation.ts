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

/** A shift score rewards completed work; skill is a multiplier, not the score itself. */
export function shiftScore(state: Pick<GameState, 'landed' | 'handoffs' | 'peakSkill' | 'metrics'>) {
  const reward = state.landed * 125 + state.handoffs * 55 + Math.round(state.peakSkill * 15);
  const penalty = state.metrics.separationLosses * 260
    + state.metrics.wakeViolations * 100
    + state.metrics.goArounds * 45
    + state.metrics.missedHandoffs * 85
    + state.metrics.unmanagedArrivals * 120
    + state.metrics.expiredPriorities * 170;
  return Math.max(0, reward - penalty);
}

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
  const responseWindow = kind === 'minimumFuel' ? 210 : 260;
  return {
    ...aircraft,
    priority: {
      kind,
      // The window is intentionally generous at first: this is a sequencing
      // decision, not a surprise fail state. Higher traffic still makes it a
      // meaningful reason to protect a gap and use the parallel runway.
      deadlineAt: elapsedSeconds + responseWindow,
      alertRaised: false,
    },
  };
}

function appendEvent(events: GameEvent[], event: GameEvent) {
  return [...events, event].slice(-5);
}

function hasOperationalEvent(state: GameState, prefix: string) {
  return state.eventTimeline.some((event) => event.id.startsWith(prefix));
}

/**
 * A short, deterministic demand pulse prevents every session from settling
 * into the same comfortable cadence.  It is deliberately advisory first,
 * then advances the next boundary hand-off instead of creating aircraft out
 * of thin air.
 */
function trafficCompression(state: GameState, elapsedSeconds: number) {
  if (!difficultyConfig(state.mode).showAdvancedCommands || elapsedSeconds < 145) return null;
  if (hasOperationalEvent(state, 'demand-pulse-')) return null;
  return {
    nextTrafficAt: Math.min(state.nextTrafficAt, elapsedSeconds + 1),
    event: {
      id: `demand-pulse-${state.mode}-${Math.round(elapsedSeconds)}`,
      type: 'warning' as const,
      message: 'TALEP DARBESİ · sınır girişleri sıklaştı · sırayı erken kur, hız ve HOLD ile kapasiteyi koru',
    },
  };
}

function operationalFlowChange(state: GameState, world: RadarWorld, elapsedSeconds: number) {
  const config = difficultyConfig(state.mode);
  // Higher difficulties deliberately disrupt a comfortable runway setup once
  // per shift. This creates a real controller decision: preserve a sequence,
  // then absorb a reduced-capacity flow instead of repeating one static board.
  if (!config.showAdvancedCommands || elapsedSeconds < 210) return null;
  if (hasOperationalEvent(state, 'flow-change-')) return null;
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

/** Restores a higher-capacity configuration after the disruption window. */
function operationalFlowRecovery(state: GameState, world: RadarWorld, elapsedSeconds: number) {
  if (!difficultyConfig(state.mode).showAdvancedCommands || elapsedSeconds < 420) return null;
  if (!hasOperationalEvent(state, 'flow-change-') || hasOperationalEvent(state, 'flow-recovery-')) return null;
  const current = world.flowConfigurations.find((item) => item.id === state.flowId);
  const recovered = [...world.flowConfigurations].sort((first, second) => {
    const firstCapacity = first.arrivalRunwayIds.length + first.departureRunwayIds.length;
    const secondCapacity = second.arrivalRunwayIds.length + second.departureRunwayIds.length;
    return secondCapacity - firstCapacity || second.visibilityNm - first.visibilityNm || first.id.localeCompare(second.id);
  })[0];
  if (!current || !recovered || recovered.id === current.id) return null;
  return {
    flowId: recovered.id,
    event: {
      id: `flow-recovery-${state.mode}-${Math.round(elapsedSeconds)}`,
      type: 'success' as const,
      message: `AKIŞ TOPARLANDI · ${current.label} → ${recovered.label} · ek pist kapasitesi yeniden kullanılabilir`,
    },
  };
}

function runwayInspection(state: GameState, world: RadarWorld, elapsedSeconds: number) {
  if (state.mode !== 'expert' || elapsedSeconds < 330) return null;
  if (hasOperationalEvent(state, 'runway-inspection-')) return null;
  const arrivalRunway = world.runways.find((runway) => runway.active && (runway.operation === 'arrival' || runway.operation === 'mixed'));
  if (!arrivalRunway) return null;
  return {
    runwayId: arrivalRunway.id,
    availableAt: elapsedSeconds + 70,
    event: {
      id: `runway-inspection-${Math.round(elapsedSeconds)}`,
      type: 'danger' as const,
      message: `PİST KONTROLÜ · ${arrivalRunway.id} 70 sn inişe kapalı · yaklaşan trafiği HOLD / hız / go-around ile yönet`,
    },
  };
}

function runwayReopen(state: GameState, elapsedSeconds: number) {
  const inspection = state.eventTimeline.find((event) => event.id.startsWith('runway-inspection-'));
  const runwayId = inspection?.message.match(/PİST KONTROLÜ · ([^ ]+)/)?.[1];
  if (!runwayId || (state.runwayAvailableAt[runwayId] ?? Infinity) > elapsedSeconds) return null;
  if (hasOperationalEvent(state, `runway-reopen-${runwayId}`)) return null;
  return {
    id: `runway-reopen-${runwayId}-${Math.round(elapsedSeconds)}`,
    type: 'success' as const,
    message: `PİST AÇILDI · ${runwayId} yeniden iniş akışına hazır`,
  };
}

/**
 * Terminal capacity is modelled as an arrival-bank limit per available
 * runway. It meters the boundary instead of silently spawning an impossible
 * queue, and it recovers once the player has worked the bank down.
 */
function terminalMetering(state: GameState, aircraft: readonly Aircraft[], world: RadarWorld, elapsedSeconds: number) {
  if (!difficultyConfig(state.mode).showAdvancedCommands || elapsedSeconds < 255) return null;
  const arrivalRunways = world.runways.filter((runway) => runway.active && (runway.operation === 'arrival' || runway.operation === 'mixed'));
  const arrivals = aircraft.filter((item) => item.phase === 'arrival').length;
  const limit = Math.max(3, arrivalRunways.length * 3);
  const alreadyMetering = hasOperationalEvent(state, 'terminal-metering-');
  const alreadyRecovered = hasOperationalEvent(state, 'terminal-recovery-');
  if (arrivals >= limit && !alreadyMetering) {
    return {
      metering: true,
      event: {
        id: `terminal-metering-${Math.round(elapsedSeconds)}`,
        type: 'warning' as const,
        message: `TERMİNAL KAPASİTESİ · ${arrivals}/${limit} yaklaşma slotu dolu · yeni girişler kısa süre metered, mevcut sırayı çöz`,
      },
    };
  }
  // Re-open as soon as one tactical slot per runway is restored. Waiting for
  // the entire bank to drain made single-runway recovery feel artificially
  // delayed even after the controller had created usable spacing.
  if (alreadyMetering && !alreadyRecovered && arrivals <= Math.max(1, limit - Math.ceil(limit / 3))) {
    return {
      metering: false,
      event: {
        id: `terminal-recovery-${Math.round(elapsedSeconds)}`,
        type: 'success' as const,
        message: `TERMİNAL AKIŞI AÇILDI · ${arrivals}/${limit} yaklaşma slotu · sınır girişleri normale döndü`,
      },
    };
  }
  return alreadyMetering && !alreadyRecovered ? { metering: true } : null;
}

function priorityTrafficDue(state: GameState, aircraft: readonly Aircraft[]) {
  if (!difficultyConfig(state.mode).allowPriorityTraffic || state.spawned === 0) return false;
  // Priority flights are spaced out and never stack. The cadence varies by
  // workload, making them memorable operational events rather than noise.
  const cadence = state.mode === 'expert' ? 6 : 7;
  return state.spawned % cadence === 0 && !aircraft.some((item) => item.priority && !item.priority.alertRaised);
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

  const compression = trafficCompression(state, elapsedSeconds);
  if (compression) {
    nextTrafficAt = compression.nextTrafficAt;
    eventLog = appendEvent(eventLog, compression.event);
  }

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

  const metering = terminalMetering(state, aircraft, world, elapsedSeconds);
  if (metering?.event) eventLog = appendEvent(eventLog, metering.event);

  if (elapsedSeconds >= nextTrafficAt) {
    if (metering?.metering) {
      // Preserve the current workload while the terminal is saturated. This
      // gives a controller time to use speed, vectors, HOLD and parallel
      // capacity without flooding the sector every fixed simulation tick.
      nextTrafficAt = elapsedSeconds + Math.max(6, profile.spawnInterval * 0.65);
    } else if (aircraft.length < profile.targetAircraft) {
      const plannedTraffic = planTraffic(spawned, aircraft, world, state.seed);
      const incoming = priorityTrafficDue(state, aircraft)
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

  const flowRecovery = operationalFlowRecovery(state, world, elapsedSeconds);
  if (flowRecovery) {
    flowId = flowRecovery.flowId;
    eventLog = appendEvent(eventLog, flowRecovery.event);
  }

  const inspection = runwayInspection(state, world, elapsedSeconds);
  if (inspection) {
    runwayAvailableAt = { ...runwayAvailableAt, [inspection.runwayId]: inspection.availableAt };
    eventLog = appendEvent(eventLog, inspection.event);
  }

  const reopened = runwayReopen(state, elapsedSeconds);
  if (reopened) eventLog = appendEvent(eventLog, reopened);

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
    score: shiftScore({
      landed: state.landed + landedAircraft.length,
      handoffs: state.handoffs + handedOffAircraft.length,
      peakSkill,
      metrics: {
        separationLosses: state.metrics.separationLosses + newLossKeys.length,
        wakeViolations: state.metrics.wakeViolations + newWakeLosses,
        goArounds: state.metrics.goArounds + goAroundAircraft.length,
        missedHandoffs: state.metrics.missedHandoffs + missedHandoffAircraft.length,
        expiredPriorities: state.metrics.expiredPriorities + expiredPriority.length,
        unmanagedArrivals: state.metrics.unmanagedArrivals + unmanagedArrivalAircraft.length,
      },
    }),
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
