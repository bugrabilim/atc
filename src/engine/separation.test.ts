import { describe, expect, it } from 'vitest';
import { detectConflicts } from './separation';
import { initialState, world } from './scenario';
import { requiredWakeSeparationNm } from './wake';

describe('operational separation and wake', () => {
  it('uses the six-category wake matrix', () => {
    expect(requiredWakeSeparationNm({ wakeCategory: 'B' }, { wakeCategory: 'E' })).toBe(7);
    expect(requiredWakeSeparationNm({ wakeCategory: 'D' }, { wakeCategory: 'D' })).toBe(3);
  });

  it('detects insufficient final spacing behind a heavier leader', () => {
    const leader = structuredClone(initialState.aircraft[0]);
    const follower = structuredClone(initialState.aircraft[1]);
    leader.approach = { runwayId: '34L', status: 'localizer' };
    follower.approach = { runwayId: '34L', status: 'localizer' };
    leader.wakeCategory = 'B';
    follower.wakeCategory = 'E';
    leader.position = { x: -1.9, y: 5 };
    follower.position = { x: -1.9, y: 10 };
    leader.altitude = 1500;
    follower.altitude = 1600;
    const conflict = detectConflicts([leader, follower], world)[0];
    expect(conflict.reason).toBe('wake');
  });

  it('allows independent established approaches on parallel runways', () => {
    const first = structuredClone(initialState.aircraft[0]);
    const second = structuredClone(initialState.aircraft[1]);
    first.approach = { runwayId: '34L', status: 'localizer' };
    second.approach = { runwayId: '35R', status: 'localizer' };
    first.position = { x: -1.9, y: 8 };
    second.position = { x: 1, y: 8 };
    first.altitude = second.altitude = 2500;
    expect(detectConflicts([first, second], world)).toHaveLength(0);
  });
});

