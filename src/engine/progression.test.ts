import { describe, expect, it } from 'vitest';
import { buildDebrief, controllerRank, nextMission } from './progression';
import { initialState } from './scenario';

describe('controller progression', () => {
  it('promotes the controller through score thresholds', () => {
    expect(controllerRank(0)).toBe('STAJYER KONTROLÖR');
    expect(controllerRank(350)).toBe('YAKLAŞMA KONTROLÖRÜ');
    expect(controllerRank(1800)).toBe('BAŞ KONTROLÖR');
  });

  it('keeps early objectives concise and actionable', () => {
    expect(nextMission(0, 0)).toContain('ILS');
    expect(nextMission(1, 100)).toContain('DCT/HOLD');
  });
});

describe('debrief', () => {
  it('reports a safety-focused grade from session outcomes', () => {
    const state = structuredClone(initialState);
    state.landed = 3;
    state.score = 400;
    const report = buildDebrief(state);

    expect(report.grade).toBe('A');
    expect(report.strengths[0]).toContain('3 güvenli iniş');
  });

  it('lowers the report grade when separation losses occur', () => {
    const state = structuredClone(initialState);
    state.metrics.separationLosses = 2;
    const report = buildDebrief(state);

    expect(report.grade).toBe('D');
    expect(report.improvements[0]).toContain('2 ayırma kaybı');
  });
});
