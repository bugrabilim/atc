import { describe, expect, it } from 'vitest';
import { createInitialState, world, worldWithFlow } from './scenario';
import { flowCapacity, planTraffic } from './trafficDirector';

describe('traffic director', () => {
  it('places a parallel-flow arrival on the least loaded compatible runway', () => {
    const state = createInitialState();
    const plan = planTraffic(1, state.aircraft.filter((item) => item.callsign !== 'NX204'), world);

    expect(plan.aircraft.phase).toBe('arrival');
    expect(plan.aircraft.assignedRunway).toBe('35R');
    expect(plan.aircraft.navigation).toBeUndefined();
  });

  it('uses only the configured active runway in a single-runway flow', () => {
    const singleRunwayWorld = worldWithFlow(world, 'north-single');
    const plan = planTraffic(1, [], singleRunwayWorld);

    expect(plan.aircraft.assignedRunway).toBe('34L');
    expect(plan.aircraft.navigation).toBeUndefined();
  });

  it('reduces capacity for a single-runway operation', () => {
    const singleRunwayWorld = worldWithFlow(world, 'north-single');

    expect(flowCapacity(singleRunwayWorld)).toMatchObject({ intervalAdjustment: 4, aircraftAdjustment: -1 });
  });

  it('repeats the same traffic plan for the same seed', () => {
    const first = planTraffic(6, [], world, 73421);
    const replay = planTraffic(6, [], world, 73421);
    expect(replay.aircraft).toEqual(first.aircraft);
  });

  it('mixes arrival wake categories so sequencing decisions stay meaningful', () => {
    const arrivals = Array.from({ length: 10 }, (_, index) => planTraffic(index, [], world, 0).aircraft);
    const categories = new Set(arrivals.map((item) => item.wakeCategory));

    expect(categories.has('A')).toBe(true);
    expect(categories.has('B')).toBe(true);
    expect(categories.has('D')).toBe(true);
  });

  it('varies boundary entries and fleet composition while preserving seeded replay', () => {
    const plans = Array.from({ length: 16 }, (_, index) => planTraffic(index, [], world, 73421));
    const arrivalTypes = new Set(plans.filter((plan) => plan.aircraft.phase === 'arrival').map((plan) => plan.aircraft.type));
    const entryMessages = new Set(plans.filter((plan) => plan.aircraft.phase === 'arrival').map((plan) => plan.message.split(' · ')[2]));

    expect(arrivalTypes.size).toBeGreaterThan(4);
    // The active runway flow deliberately limits arrivals to compatible
    // boundaries; two or more proves deterministic entry variation without
    // assigning an unsafe/incompatible entry just for variety.
    expect(entryMessages.size).toBeGreaterThan(1);
    expect(planTraffic(9, [], world, 73421)).toEqual(plans[9]);
  });
});
