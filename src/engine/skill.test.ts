import { describe, expect, it } from 'vitest';
import { profileForSkill, updateSkill } from './skill';

describe('adaptive skill loop', () => {
  it('raises workload after successful tower handoffs', () => {
    const skill = updateSkill(4, { towerHandoffs: 4 });
    expect(skill).toBeGreaterThan(4);
    expect(profileForSkill(skill).targetAircraft).toBeGreaterThan(profileForSkill(4).targetAircraft);
  });

  it('reduces workload after safety errors without dropping below recovery floor', () => {
    const skill = updateSkill(8, { separationLosses: 2, goArounds: 1 });
    expect(skill).toBeLessThan(8);
    expect(updateSkill(2, { separationLosses: 10 })).toBe(2);
  });
});

