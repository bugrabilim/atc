import { describe, expect, it } from 'vitest';
import { initialState, world } from './scenario';
import { landingClearanceStatus, stepGame, trafficProfile } from './simulation';

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
    expect(state.aircraft.some((item) => item.callsign === 'TK1953')).toBe(false);
  });

  it('blocks a landing clearance while the runway is occupied', () => {
    const state = structuredClone(initialState);
    state.aircraft[0].approach = { runwayId: '34L', status: 'captured', landingCleared: false };
    state.runwayAvailableAt['34L'] = 40;
    const result = landingClearanceStatus(state, 'TK1953', world);

    expect(result.ok).toBe(false);
    expect(result.message).toContain('pist işgali');
  });

  it('raises traffic density and capacity in measured steps', () => {
    expect(trafficProfile(0)).toMatchObject({ level: 1, maxAircraft: 5 });
    expect(trafficProfile(9)).toMatchObject({ level: 4, maxAircraft: 8 });
    expect(trafficProfile(99)).toMatchObject({ level: 5, maxAircraft: 9 });
  });
});
