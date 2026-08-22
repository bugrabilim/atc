import { describe, expect, it } from 'vitest';
import { createInitialState, initialState, scenarioCatalog, spawnTraffic, world, worldWithFlow } from './scenario';
import { detectConflicts, landingClearanceStatus, requiredFinalSeparationNm, stepGame, trafficProfile } from './simulation';

describe('stepGame', () => {
  it('turns gradually instead of snapping to the target heading', () => {
    const state = structuredClone(initialState);
    state.aircraft[0].targetHeading = 180;
    const next = stepGame(state, world, 0.1);
    expect(next.aircraft[0].heading).toBeLessThan(state.aircraft[0].heading);
    expect(next.aircraft[0].heading).toBeGreaterThan(180);
  });

  it('descends gradually toward a lower flight level', () => {
    const state = structuredClone(initialState);
    state.aircraft[0].targetAltitude = 1000;
    const next = stepGame(state, world, 0.1);
    expect(next.aircraft[0].altitude).toBeLessThan(10000);
    expect(next.aircraft[0].altitude).toBeGreaterThan(1000);
  });

  it('captures the ILS and completes a landing over time', () => {
    let state = structuredClone(initialState);
    state.aircraft = [state.aircraft[0]];
    state.aircraft[0].approach = { runwayId: '34L', status: 'armed' };

    for (let index = 0; index < 1200; index += 1) {
      state = stepGame(state, world, 0.1);
      if (state.landed > 0) break;
    }

    expect(state.landed).toBe(1);
    expect(state.peakSkill).toBeGreaterThan(initialState.peakSkill);
    expect(state.aircraft.some((item) => item.callsign === 'AR101')).toBe(false);
  });

  it('does not expose a manual landing clearance in approach mode', () => {
    const result = landingClearanceStatus();
    expect(result.ok).toBe(false);
    expect(result.message).toContain('otomatik');
  });

  it('derives traffic density from live skill rather than spawned count', () => {
    expect(trafficProfile(3.5)).toMatchObject({ level: 1, maxAircraft: 4 });
    expect(trafficProfile(10)).toMatchObject({ level: 2, maxAircraft: 10 });
    expect(trafficProfile(30)).toMatchObject({ level: 5, maxAircraft: 24 });
  });

  it('requires more final spacing behind heavy aircraft', () => {
    const heavy = structuredClone(initialState.aircraft[2]);
    const medium = structuredClone(initialState.aircraft[1]);

    expect(requiredFinalSeparationNm(heavy)).toBe(7);
    expect(requiredFinalSeparationNm(medium)).toBe(4);
  });

  it('introduces a timed priority arrival at higher traffic volume', () => {
    const state = structuredClone(initialState);
    state.spawned = 7;
    state.skill = 10;
    state.nextTrafficAt = 0;
    const next = stepGame(state, world, 0.1);

    expect(next.aircraft.some((item) => item.priority?.deadlineAt)).toBe(true);
  });

  it('removes an unmanaged arrival that leaves the radar sector', () => {
    const state = structuredClone(initialState);
    state.aircraft = [state.aircraft[1]];
    state.aircraft[0].position = { x: world.rangeNm + 3, y: 0 };
    state.aircraft[0].navigation = undefined;

    const next = stepGame(state, world, 0.1);

    expect(next.aircraft).toHaveLength(0);
    expect(next.metrics.unmanagedArrivals).toBe(1);
    expect(next.eventLog.at(-1)?.message).toContain('yaklaşma yönetilmeden');
  });

  it('spawns vector-only arrivals while keeping departure procedures', () => {
    const earlyArrival = spawnTraffic(0);
    const laterArrival = spawnTraffic(1);
    const departure = spawnTraffic(3);

    expect(earlyArrival.callsign).not.toBe(laterArrival.callsign);
    expect(earlyArrival.navigation).toBeUndefined();
    expect(laterArrival.navigation).toBeUndefined();
    expect(departure.phase).toBe('departure');
  });

  it('uses the selected sector runway flow when generating traffic', () => {
    const atlanta = scenarioCatalog.find((scenario) => scenario.id === 'atl');
    if (!atlanta) throw new Error('Atlanta scenario is missing');

    const state = createInitialState(atlanta);
    const incoming = spawnTraffic(0, atlanta.world);

    expect(state.selectedCallsign).toBe('AT101');
    expect(state.timeScale).toBe(2);
    expect(atlanta.world.flowConfigurations[0]?.arrivalRunwayIds).toContain(incoming.assignedRunway);
  });

  it('derives active runways from an airport-pack flow configuration', () => {
    const singleFlow = worldWithFlow(world, 'north-single');
    const arrivals = singleFlow.runways.filter((item) => item.operation === 'arrival').map((item) => item.id);
    const departures = singleFlow.runways.filter((item) => item.operation === 'departure').map((item) => item.id);

    expect(arrivals).toEqual(['34L']);
    expect(departures).toEqual(['36']);
  });

  it('keeps a short radar history trail for active aircraft', () => {
    let state = structuredClone(initialState);
    state.aircraft = [state.aircraft[0]];
    state.trackHistory = { [state.aircraft[0].callsign]: [{ ...state.aircraft[0].position }] };

    for (let index = 0; index < 6; index += 1) state = stepGame(state, world, 0.1);

    expect(state.trackHistory.AR101.length).toBeGreaterThan(1);
  });

  it('warns about an approaching loss before aircraft are already too close', () => {
    const first = structuredClone(initialState.aircraft[0]);
    const second = structuredClone(initialState.aircraft[1]);
    first.position = { x: 0, y: 10 };
    first.heading = 0;
    first.track = 0;
    first.speed = 360;
    first.groundSpeed = 360;
    first.altitude = 6000;
    first.targetAltitude = 6000;
    second.position = { x: 0, y: -10 };
    second.heading = 180;
    second.track = 180;
    second.speed = 360;
    second.groundSpeed = 360;
    second.altitude = 6000;
    second.targetAltitude = 6000;

    const conflict = detectConflicts([first, second])[0];

    expect(conflict.severity).toBe('warning');
    expect(conflict.predicted?.timeSeconds).toBeGreaterThan(0);
  });

  it('unlocks a second arrival runway at a higher live skill', () => {
    const beginner = worldWithFlow(world, 'north-parallel', 3.5);
    const advanced = worldWithFlow(world, 'north-parallel', 8);
    expect(beginner.runways.filter((item) => item.operation === 'arrival')).toHaveLength(1);
    expect(advanced.runways.filter((item) => item.operation === 'arrival')).toHaveLength(2);
  });

  it('reduces live skill after a newly detected separation loss', () => {
    const state = structuredClone(initialState);
    state.aircraft = state.aircraft.slice(0, 2);
    state.aircraft[0].position = { x: 0, y: 0 };
    state.aircraft[1].position = { x: 1, y: 0 };
    state.aircraft[0].altitude = 5000;
    state.aircraft[1].altitude = 5200;
    const next = stepGame(state, world, 0.1);
    expect(next.skill).toBeLessThan(state.skill);
    expect(next.targetAircraft).toBeLessThanOrEqual(state.targetAircraft);
  });

  it('orders an automatic go-around when the runway is occupied on short final', () => {
    const state = structuredClone(initialState);
    const arrival = state.aircraft[0];
    const runway = world.runways.find((item) => item.id === '34L');
    if (!runway) throw new Error('Runway 34L is missing');
    const radians = runway.heading * Math.PI / 180;
    arrival.position = {
      x: runway.center.x - Math.sin(radians) * 2,
      y: runway.center.y + Math.cos(radians) * 2,
    };
    arrival.altitude = 680;
    arrival.targetAltitude = 680;
    arrival.approach = { runwayId: '34L', status: 'tower', towerHandoffAt: 1 };
    state.aircraft = [arrival];
    state.runwayAvailableAt['34L'] = 100;
    const next = stepGame(state, world, 0.1);
    expect(next.aircraft[0].approach).toBeUndefined();
    expect(next.metrics.goArounds).toBe(1);
  });

  it('moves advanced shifts to a reduced-capacity operational flow', () => {
    const state = createInitialState(undefined, 'advanced');
    state.elapsedSeconds = world.operations?.disruption.triggerSeconds ?? 210;
    state.flowId = 'north-parallel';
    const next = stepGame(state, worldWithFlow(world, state.flowId, state.peakSkill), 0.1);

    expect(next.flowId).toBe(world.operations?.disruption.reducedFlowId);
    expect(worldWithFlow(world, next.flowId).runways.filter((item) => item.operation === 'arrival')).toHaveLength(1);
    expect(next.eventLog.at(-1)?.message).toContain('OPERASYON DEĞİŞİKLİĞİ');
  });

  it('adds one deterministic demand pulse before the runway-flow change', () => {
    const state = createInitialState(undefined, 'advanced');
    state.elapsedSeconds = 145;
    state.nextTrafficAt = 999;
    const next = stepGame(state, worldWithFlow(world, state.flowId, state.peakSkill), 0.1);

    expect(next.nextTrafficAt).toBeLessThanOrEqual(147);
    expect(next.eventTimeline.some((event) => event.id.startsWith('demand-pulse-'))).toBe(true);
  });

  it('recovers the higher-capacity flow after an operational disruption', () => {
    const state = createInitialState(undefined, 'advanced');
    state.elapsedSeconds = (world.operations?.disruption.triggerSeconds ?? 210) + (world.operations?.disruption.durationSeconds ?? 210);
    state.flowId = 'north-single';
    state.eventTimeline.push({ id: 'flow-change-advanced-210', type: 'warning', message: 'fixture' });
    const next = stepGame(state, worldWithFlow(world, state.flowId, state.peakSkill), 0.1);

    expect(next.flowId).toBe(world.operations?.disruption.recoveryFlowId);
    expect(next.eventTimeline.some((event) => event.id.startsWith('flow-recovery-'))).toBe(true);
  });

  it('executes the configured disruption and recovery for every flagship airport', () => {
    for (const airportId of ['ist', 'lhr', 'lax', 'jfk', 'atl'] as const) {
      const scenario = scenarioCatalog.find((item) => item.id === airportId);
      if (!scenario?.world.operations) throw new Error(`Missing operations pack for ${airportId}`);
      const disruption = scenario.world.operations.disruption;
      const changedState = createInitialState(scenario, 'advanced');
      changedState.elapsedSeconds = disruption.triggerSeconds;
      changedState.flowId = scenario.world.flowConfigurations[0]!.id;
      const changed = stepGame(changedState, worldWithFlow(scenario.world, changedState.flowId, changedState.peakSkill), 0.1);
      expect(changed.flowId).toBe(disruption.reducedFlowId);

      const recoveryState = createInitialState(scenario, 'advanced');
      recoveryState.elapsedSeconds = disruption.triggerSeconds + disruption.durationSeconds;
      recoveryState.flowId = disruption.reducedFlowId;
      recoveryState.eventTimeline.push({ id: `flow-change-${disruption.id}-fixture`, type: 'warning', message: 'fixture' });
      const recovered = stepGame(recoveryState, worldWithFlow(scenario.world, recoveryState.flowId, recoveryState.peakSkill), 0.1);
      expect(recovered.flowId).toBe(disruption.recoveryFlowId);
    }
  });

  it('closes an expert arrival runway temporarily for an operational inspection', () => {
    const state = createInitialState(undefined, 'expert');
    state.elapsedSeconds = 330;
    const next = stepGame(state, worldWithFlow(world, state.flowId, state.peakSkill), 0.1);

    expect(next.runwayAvailableAt['34L']).toBeGreaterThan(390);
    expect(next.eventLog.at(-1)?.message).toContain('PİST KONTROLÜ');
  });

  it('announces that a completed runway inspection has reopened the runway', () => {
    const state = createInitialState(undefined, 'expert');
    state.elapsedSeconds = 405;
    state.runwayAvailableAt['34L'] = 400;
    state.eventTimeline.push({ id: 'runway-inspection-330', type: 'danger', message: 'PİST KONTROLÜ · 34L 70 sn inişe kapalı' });
    const next = stepGame(state, worldWithFlow(world, state.flowId, state.peakSkill), 0.1);

    expect(next.eventTimeline.some((event) => event.id.startsWith('runway-reopen-34L'))).toBe(true);
  });

  it('meters a saturated terminal arrival bank and announces capacity recovery', () => {
    const state = createInitialState(undefined, 'advanced');
    state.elapsedSeconds = 255;
    state.nextTrafficAt = 0;
    const template = structuredClone(state.aircraft.find((item) => item.phase === 'arrival')!);
    state.aircraft = Array.from({ length: 6 }, (_, index) => ({
      ...structuredClone(template),
      callsign: `BK${101 + index}`,
      position: { x: -12 + index, y: 11 + index },
      assignedRunway: index % 2 === 0 ? '34L' : '35R',
    }));
    const saturated = stepGame(state, worldWithFlow(world, state.flowId, state.peakSkill), 0.1);

    expect(saturated.eventTimeline.some((event) => event.id.startsWith('terminal-metering-'))).toBe(true);
    expect(saturated.nextTrafficAt).toBeGreaterThan(255);

    saturated.elapsedSeconds = 270;
    saturated.aircraft = saturated.aircraft.slice(0, 2);
    const recovered = stepGame(saturated, worldWithFlow(world, saturated.flowId, saturated.peakSkill), 0.1);
    expect(recovered.eventTimeline.some((event) => event.id.startsWith('terminal-recovery-'))).toBe(true);
  });
});
