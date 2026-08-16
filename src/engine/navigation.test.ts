import { describe, expect, it } from 'vitest';
import { guideNavigation } from './navigation';
import { initialState, world } from './scenario';

describe('guideNavigation', () => {
  it('turns a direct clearance toward its active fix', () => {
    const aircraft = structuredClone(initialState.aircraft[1]);
    const fix = world.fixes.find((item) => item.id.startsWith('FINAL'));
    if (!fix) throw new Error('Test fix is missing');
    aircraft.targetHeading = 0;
    aircraft.navigation = { mode: 'direct', fixIds: [fix.id], currentLegIndex: 0, procedure: `DCT ${fix.id}` };

    const result = guideNavigation(aircraft, world);

    expect(result.aircraft.targetHeading).not.toBe(aircraft.targetHeading);
    expect(result.aircraft.navigation?.fixIds[0]).toBe(fix.id);
  });

  it('enters a hold when it reaches its hold fix', () => {
    const aircraft = structuredClone(initialState.aircraft[1]);
    const fix = world.fixes.find((item) => item.id.startsWith('FINAL'));
    if (!fix) throw new Error('Test fix is missing');
    aircraft.position = { ...fix.position };
    aircraft.navigation = { mode: 'hold', fixIds: [fix.id], currentLegIndex: 0, procedure: `HOLD ${fix.id}`, holding: false };

    const result = guideNavigation(aircraft, world);

    expect(result.aircraft.navigation?.holding).toBe(true);
    expect(result.event?.message).toContain('hold başladı');
  });

  it('orbits a holding fix instead of steering directly back to it', () => {
    const aircraft = structuredClone(initialState.aircraft[1]);
    const fix = world.fixes.find((item) => item.id.startsWith('FINAL'));
    if (!fix) throw new Error('Test fix is missing');
    aircraft.position = { x: fix.position.x + 1.6, y: fix.position.y };
    aircraft.heading = 90;
    aircraft.navigation = { mode: 'hold', fixIds: [fix.id], currentLegIndex: 0, procedure: `HOLD ${fix.id}`, holding: true };

    const result = guideNavigation(aircraft, world);

    // From the eastern edge of a right-hand hold, the tangential target is south.
    expect(result.aircraft.targetHeading).toBeGreaterThan(165);
    expect(result.aircraft.targetHeading).toBeLessThan(195);
  });
});
