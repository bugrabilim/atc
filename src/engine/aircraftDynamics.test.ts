import { describe, expect, it } from 'vitest';
import { stepAircraftDynamics } from './aircraftDynamics';
import { initialState, world, worldWithFlow } from './scenario';

describe('aircraft dynamics', () => {
  it('uses speed and bank angle to produce a wider turn at higher speed', () => {
    let slow = structuredClone(initialState.aircraft[0]);
    let fast = structuredClone(initialState.aircraft[0]);
    slow.speed = 160;
    slow.targetSpeed = 160;
    slow.speedMode = 'assigned';
    fast.speed = 320;
    fast.targetSpeed = 320;
    fast.speedMode = 'assigned';
    slow.targetHeading = 90;
    fast.targetHeading = 90;

    for (let index = 0; index < 100; index += 1) {
      slow = stepAircraftDynamics(slow, world, 0.1);
      fast = stepAircraftDynamics(fast, world, 0.1);
    }

    const slowTurn = (slow.heading - 354 + 360) % 360;
    const fastTurn = (fast.heading - 354 + 360) % 360;
    expect(slowTurn).toBeGreaterThan(fastTurn);
    expect(Math.abs(slow.bankAngle)).toBeLessThanOrEqual(slow.performance.maxBankDeg);
  });

  it('separates heading, track and ground speed under crosswind', () => {
    const windyWorld = worldWithFlow(world, 'north-single');
    const aircraft = stepAircraftDynamics(initialState.aircraft[0], windyWorld, 1);
    expect(aircraft.track).not.toBeCloseTo(aircraft.heading, 1);
    expect(aircraft.groundSpeed).not.toBeCloseTo(aircraft.speed, 1);
  });

  it('accelerates vertical movement when expedite is active', () => {
    const normalSeed = structuredClone(initialState.aircraft[0]);
    normalSeed.targetAltitude = 8000;
    const expediteSeed = { ...structuredClone(normalSeed), expedite: true };
    let normal = normalSeed;
    let expedited = expediteSeed;
    for (let index = 0; index < 50; index += 1) {
      normal = stepAircraftDynamics(normal, world, 0.1);
      expedited = stepAircraftDynamics(expedited, world, 0.1);
    }
    expect(expedited.altitude).toBeGreaterThan(normal.altitude);
  });
});

