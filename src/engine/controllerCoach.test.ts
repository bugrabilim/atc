import { describe, expect, it } from 'vitest';
import { controllerCoach } from './controllerCoach';
import { initialState, world } from './scenario';

describe('controller coach', () => {
  it('guides the selected first arrival toward its planned ILS', () => {
    const advice = controllerCoach(structuredClone(initialState), world);

    expect(advice.callsign).toBe('AR101');
    expect(advice.command).toBe('ILS 34L');
  });

  it('only offers a landing clearance after the simulator marks it safe', () => {
    const state = structuredClone(initialState);
    state.aircraft[0].approach = { runwayId: '34L', status: 'captured', landingCleared: false };
    const advice = controllerCoach(state, world);

    expect(advice.command).toBe('LAND');
    state.runwayAvailableAt['34L'] = 50;
    expect(controllerCoach(state, world).command).toBeUndefined();
  });

  it('puts a separation loss ahead of normal task advice', () => {
    const state = structuredClone(initialState);
    state.conflicts = [{ pair: ['AR101', 'NX204'], horizontalNm: 2.2, verticalFt: 700, severity: 'loss' }];

    expect(controllerCoach(state, world)).toMatchObject({ tone: 'danger', label: 'EMNİYET ÖNCE' });
  });
});
