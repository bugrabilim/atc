import { describe, expect, it } from 'vitest';
import { initialState, world } from './scenario';
import { stepGame } from './simulation';

describe('stepGame', () => {
  it('turns gradually instead of snapping to the target heading', () => {
    const state = structuredClone(initialState);
    state.aircraft[0].targetHeading = 180;
    const next = stepGame(state, world, 0.1);
    expect(next.aircraft[0].heading).toBeGreaterThan(state.aircraft[0].heading);
    expect(next.aircraft[0].heading).toBeLessThan(180);
  });

  it('descends gradually toward a lower flight level', () => {
    const state = structuredClone(initialState);
    state.aircraft[0].targetAltitude = 1000;
    const next = stepGame(state, world, 0.1);
    expect(next.aircraft[0].altitude).toBeLessThan(10000);
    expect(next.aircraft[0].altitude).toBeGreaterThan(1000);
  });
});

