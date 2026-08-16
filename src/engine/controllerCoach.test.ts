import { describe, expect, it } from 'vitest';
import { controllerCoach } from './controllerCoach';
import { initialState, world } from './scenario';

describe('controller coach', () => {
  it('guides the selected first arrival toward its planned ILS', () => {
    const advice = controllerCoach(structuredClone(initialState), world);

    expect(advice.callsign).toBe('AR101');
    expect(advice.command).toBe('ILS 34L');
  });

  it('explains glideslope capture instead of offering a landing clearance', () => {
    const state = structuredClone(initialState);
    state.aircraft[0].approach = { runwayId: '34L', status: 'localizer' };
    const advice = controllerCoach(state, world);

    expect(advice.command).toBeUndefined();
    expect(advice.title).toContain('LOCALIZER');
  });

  it('puts a separation loss ahead of normal task advice', () => {
    const state = structuredClone(initialState);
    state.conflicts = [{ pair: ['AR101', 'NX204'], horizontalNm: 2.2, verticalFt: 700, severity: 'loss' }];

    expect(controllerCoach(state, world)).toMatchObject({ tone: 'danger', label: 'EMNİYET ÖNCE' });
  });
});
