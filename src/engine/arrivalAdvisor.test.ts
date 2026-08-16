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
});
