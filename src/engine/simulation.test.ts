import { describe, expect, it } from 'vitest';
import { createInitialState, initialState, scenarioCatalog, spawnTraffic, world } from './scenario';
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
    state.aircraft[0].approach = { runwayId: '34L', status: 'armed', landingCleared: true };

    for (let index = 0; index < 1200; index += 1) {
      state = stepGame(state, world, 0.1);
      if (state.landed > 0) break;
    }

    expect(state.landed).toBe(1);
    expect(state.score).toBe(100);
    expect(state.aircraft.some((item) => item.callsign === 'AR101')).toBe(false);
  });

  it('blocks a landing clearance while the runway is occupied', () => {
    const state = structuredClone(initialState);
    state.aircraft[0].approach = { runwayId: '34L', status: 'captured', landingCleared: false };
    state.runwayAvailableAt['34L'] = 40;
    const result = landingClearanceStatus(state, 'AR101', world);

    expect(result.ok).toBe(false);
    expect(result.message).toContain('pist işgali');
  });

  it('raises traffic density and capacity in measured steps', () => {
    expect(trafficProfile(0)).toMatchObject({ level: 1, maxAircraft: 5, spawnInterval: 18 });
    expect(trafficProfile(9)).toMatchObject({ level: 4, maxAircraft: 8, spawnInterval: 11 });
    expect(trafficProfile(99)).toMatchObject({ level: 5, maxAircraft: 9 });
  });

  it('requires more final spacing behind heavy aircraft', () => {
    const heavy = structuredClone(initialState.aircraft[2]);
    const medium = structuredClone(initialState.aircraft[1]);

    expect(requiredFinalSeparationNm(heavy)).toBe(5.5);
    expect(requiredFinalSeparationNm(medium)).toBe(4.5);
  });

  it('introduces a timed priority arrival at higher traffic volume', () => {
    const state = structuredClone(initialState);
    state.spawned = 6;
    state.nextTrafficAt = 0;
    const next = stepGame(state, world, 0.1);

    expect(next.aircraft.some((item) => item.priority?.deadlineAt)).toBe(true);
  });

  it('varies callsigns, types, routes and traffic phase over successive spawns', () => {
    const earlyArrival = spawnTraffic(0);
    const laterArrival = spawnTraffic(1);
    const departure = spawnTraffic(3);

    expect(earlyArrival.callsign).not.toBe(laterArrival.callsign);
    expect(earlyArrival.navigation?.procedure).not.toBe(laterArrival.navigation?.procedure);
    expect(departure.phase).toBe('departure');
  });

  it('uses the selected sector runway flow when generating traffic', () => {
    const coastal = scenarioCatalog.find((scenario) => scenario.id === 'coastal');
    if (!coastal) throw new Error('Coastal scenario is missing');

    const state = createInitialState(coastal);
    const incoming = spawnTraffic(0, coastal.world);

    expect(state.selectedCallsign).toBe('CF101');
    expect(state.timeScale).toBe(2);
    expect(['09L', '09R']).toContain(incoming.assignedRunway);
  });

  it('warns about an approaching loss before aircraft are already too close', () => {
    const first = structuredClone(initialState.aircraft[0]);
    const second = structuredClone(initialState.aircraft[1]);
    first.position = { x: 0, y: 10 };
    first.heading = 0;
    first.speed = 360;
    first.altitude = 6000;
    first.targetAltitude = 6000;
    second.position = { x: 0, y: -10 };
    second.heading = 180;
    second.speed = 360;
    second.altitude = 6000;
    second.targetAltitude = 6000;

    const conflict = detectConflicts([first, second])[0];

    expect(conflict.severity).toBe('warning');
    expect(conflict.predicted?.timeSeconds).toBeGreaterThan(0);
  });
});
