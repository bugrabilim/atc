import { describe, expect, it } from 'vitest';
import { guideNavigation } from './navigation';
import { initialState, world } from './scenario';

describe('guideNavigation', () => {
  it('turns a direct clearance toward its active fix', () => {
    const aircraft = structuredClone(initialState.aircraft[1]);
    aircraft.navigation = { mode: 'direct', fixIds: ['FM001'], currentLegIndex: 0, procedure: 'DCT FM001' };

    const result = guideNavigation(aircraft, world);

    expect(result.aircraft.targetHeading).not.toBe(aircraft.targetHeading);
    expect(result.aircraft.navigation?.fixIds[0]).toBe('FM001');
  });

  it('enters a hold when it reaches its hold fix', () => {
    const aircraft = structuredClone(initialState.aircraft[1]);
    const fix = world.fixes.find((item) => item.id === 'FM001');
    if (!fix) throw new Error('Test fix is missing');
    aircraft.position = { ...fix.position };
    aircraft.navigation = { mode: 'hold', fixIds: ['FM001'], currentLegIndex: 0, procedure: 'HOLD FM001', holding: false };

    const result = guideNavigation(aircraft, world);

    expect(result.aircraft.navigation?.holding).toBe(true);
    expect(result.event?.message).toContain('hold başladı');
  });
});
