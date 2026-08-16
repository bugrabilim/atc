import { describe, expect, it } from 'vitest';
import { glideslopeAltitude, guideApproach } from './approach';
import { initialState, world } from './scenario';

describe('ILS state machine', () => {
  it('captures a shallow localizer intercept but rejects an excessive angle', () => {
    const shallow = structuredClone(initialState.aircraft[0]);
    shallow.approach = { runwayId: '34L', status: 'armed' };
    shallow.heading = 330;
    const captured = guideApproach(shallow, world, 10);
    expect(captured.aircraft.approach?.status).toBe('localizer');

    const steep = structuredClone(shallow);
    steep.approach = { runwayId: '34L', status: 'armed' };
    steep.heading = 260;
    expect(guideApproach(steep, world, 10).aircraft.approach?.status).toBe('armed');
  });

  it('captures glideslope only when established from below', () => {
    const aircraft = structuredClone(initialState.aircraft[0]);
    aircraft.approach = { runwayId: '34L', status: 'localizer', capturedAt: 1 };
    const runway = world.runways.find((item) => item.id === '34L');
    if (!runway) throw new Error('runway missing');
    const glideAtPosition = glideslopeAltitude(3.8);

    aircraft.altitude = glideAtPosition - 50;
    expect(guideApproach(aircraft, world, 2).aircraft.approach?.status).toBe('glideslope');
    aircraft.altitude = glideAtPosition + 500;
    aircraft.approach = { runwayId: '34L', status: 'localizer', capturedAt: 1 };
    expect(guideApproach(aircraft, world, 2).aircraft.approach?.status).toBe('localizer');
  });

  it('hands an established aircraft to tower automatically', () => {
    const aircraft = structuredClone(initialState.aircraft[0]);
    aircraft.approach = { runwayId: '34L', status: 'glideslope', capturedAt: 1 };
    const result = guideApproach(aircraft, world, 5);
    expect(result.towerHandoff).toBe(true);
    expect(result.aircraft.approach?.status).toBe('tower');
  });
});

