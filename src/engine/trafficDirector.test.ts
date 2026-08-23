import { describe, expect, it } from 'vitest';
import { createInitialState, scenarioCatalog, world, worldWithFlow } from './scenario';
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

  it('balances departures across active runways and varies their fleet', () => {
    const extraDeparture = world.runways.find((runway) => !runway.active);
    const parallelDepartureWorld = {
      ...world,
      runways: world.runways.map((runway) => runway.id === extraDeparture?.id
        ? { ...runway, active: true, operation: 'departure' as const }
        : runway),
    };
    const departures = Array.from({ length: 12 }, (_, index) => planTraffic(index * 5 + 3, [], parallelDepartureWorld, 1459));
    const departurePlans = departures.filter((plan) => plan.aircraft.phase === 'departure');
    const runwayIds = new Set(departurePlans.map((plan) => plan.aircraft.assignedRunway));
    const types = new Set(departurePlans.map((plan) => plan.aircraft.type));

    expect(runwayIds.size).toBeGreaterThan(1);
    expect(types.size).toBeGreaterThan(2);
    expect(planTraffic(18, [], world, 1459)).toEqual(planTraffic(18, [], world, 1459));
  });

  it('uses each flagship airport traffic bank instead of one global cadence', () => {
    for (const airportId of ['ist', 'lhr', 'lax', 'jfk', 'atl'] as const) {
      const airportWorld = scenarioCatalog.find((scenario) => scenario.id === airportId)?.world;
      if (!airportWorld?.operations) throw new Error(`Missing operations pack for ${airportId}`);
      const phases = airportWorld.operations.trafficPattern.map((_, index) => planTraffic(index, [], airportWorld, 17).aircraft.phase);
      expect(phases).toEqual(airportWorld.operations.trafficPattern);
    }
  });

  it('puts compatible flagship arrivals on their chart-derived route', () => {
    const laxScenario = scenarioCatalog.find((scenario) => scenario.id === 'lax');
    if (!laxScenario) throw new Error('Missing LAX scenario');
    const activeWorld = worldWithFlow(laxScenario.world, 'lax-primary', 10);
    const plan = planTraffic(0, [], activeWorld, 73);

    expect(plan.aircraft.phase).toBe('arrival');
    expect(['IRNMN2', 'RYDRR2', 'WAYVE1']).toContain(plan.aircraft.navigation?.procedure);
    expect(plan.message).toContain('gelişinde');
    const entryFix = activeWorld.fixes.find((fix) => fix.id === plan.aircraft.navigation?.fixIds[0]);
    expect(plan.aircraft.altitude).toBeGreaterThanOrEqual(entryFix?.minimumAltitudeFt ?? 0);
    expect(plan.aircraft.speed).toBeLessThanOrEqual(entryFix?.maximumSpeedKt ?? Number.POSITIVE_INFINITY);
  });

  it('guarantees a heavy arrival at an airport-specific cadence and displays the named feed', () => {
    const heavyArrival = planTraffic(7, [], world, 73);
    expect(['B789', 'A330', 'B77W', 'A388']).toContain(heavyArrival.aircraft.type);
    expect(heavyArrival.aircraft.phase).toBe('arrival');
    expect(heavyArrival.message).toMatch(/BLACK SEA|ANATOLIA|MARMARA|THRACE/);
  });
});
