import { describe, expect, it } from 'vitest';
import { createInitialState, world, worldWithFlow } from './scenario';
import { flowCapacity, planTraffic } from './trafficDirector';

describe('traffic director', () => {
  it('places a parallel-flow arrival on the least loaded compatible runway', () => {
    const state = createInitialState();
    const plan = planTraffic(1, state.aircraft.filter((item) => item.callsign !== 'NX204'), world);

    expect(plan.aircraft.phase).toBe('arrival');
    expect(plan.aircraft.assignedRunway).toBe('35R');
    expect(plan.aircraft.navigation?.procedure).toBe('GATE2-BRAVO');
  });

  it('uses only the configured active runway in a single-runway flow', () => {
    const singleRunwayWorld = worldWithFlow(world, 'north-single');
    const plan = planTraffic(1, [], singleRunwayWorld);

    expect(plan.aircraft.assignedRunway).toBe('34L');
    expect(plan.aircraft.navigation?.procedure).not.toBe('GATE2-BRAVO');
  });

  it('reduces capacity for a single-runway operation', () => {
    const singleRunwayWorld = worldWithFlow(world, 'north-single');

    expect(flowCapacity(singleRunwayWorld)).toMatchObject({ intervalAdjustment: 4, aircraftAdjustment: -1 });
  });
});
