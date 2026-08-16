import { describe, expect, it } from 'vitest';
import { arrivalAdvice } from './arrivalAdvisor';
import { initialState, world, worldWithFlow } from './scenario';
import { approachLateralToleranceNm, runwayWindComponents, stabilizedApproachSpeedKt } from './weather';

describe('arrival advisor and weather', () => {
  it('creates a runway sequence and descent recommendation for arrivals', () => {
    const aircraft = structuredClone(initialState.aircraft);
    const nx204 = aircraft.find((item) => item.callsign === 'NX204');
    if (!nx204) throw new Error('NX204 missing');
    nx204.altitude = 14000;
    const advice = arrivalAdvice(aircraft, world);
    const arrival = advice.get('NX204');

    expect(arrival?.runwayId).toBe('34L');
    expect(arrival?.sequence).toBe(2);
    expect(arrival?.shouldDescend).toBe(true);
  });

  it('turns selected flow wind into approach constraints', () => {
    const coastal = worldWithFlow({ ...world, flowConfigurations: [{ id: 'test', label: 'TEST', arrivalRunwayIds: ['34L'], departureRunwayIds: ['36'], windDirection: 84, windSpeedKt: 20, visibilityNm: 8, qnh: 1013 }], activeFlowId: 'test' }, 'test');
    const runway = coastal.runways.find((item) => item.id === '34L');
    if (!runway) throw new Error('Runway missing');

    expect(runwayWindComponents(coastal, runway).crosswindKt).toBeGreaterThan(15);
    expect(approachLateralToleranceNm(coastal, runway)).toBeLessThan(2.2);
    expect(stabilizedApproachSpeedKt(coastal, runway, 140)).toBeGreaterThan(145);
  });

  it('flags insufficient planned spacing behind a heavy leader', () => {
    const aircraft = structuredClone(initialState.aircraft).filter((item) => item.phase === 'arrival');
    const [leader, follower] = aircraft;
    if (!leader || !follower) throw new Error('Arrival fixtures are missing');
    leader.type = 'B77W';
    leader.wakeCategory = 'B';
    leader.position = { x: -1.5, y: 3.2 };
    leader.speed = 230;
    leader.assignedRunway = '34L';
    follower.position = { x: -1.4, y: 4.8 };
    follower.speed = 250;
    follower.assignedRunway = '34L';

    const advice = arrivalAdvice(aircraft, world).get(follower.callsign);

    expect(advice?.spacingRisk).toBe(true);
    expect(advice?.leaderCallsign).toBe(leader.callsign);
    expect(advice?.requiredSpacingNm).toBe(7);
    expect(advice?.recommendedSpeed).toBeDefined();
  });
});
