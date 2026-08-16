import { describe, expect, it } from 'vitest';
import { controllerRank, nextMission } from './progression';

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
