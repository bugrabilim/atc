import { describe, expect, it } from 'vitest';
import { planTraffic } from './trafficDirector';
import { scenarioCatalog, worldWithFlow } from './scenario';
import { AIRPORT_DEFINITIONS } from './airportCatalog';

describe('airport scenario catalog', () => {
  it('offers distinct airport packages with briefings, procedures and replayable flows', () => {
    expect(scenarioCatalog).toHaveLength(50);
    expect(scenarioCatalog).toHaveLength(AIRPORT_DEFINITIONS.length);
    expect(scenarioCatalog.slice(0, 3).map((scenario) => scenario.id)).toEqual(['ist', 'atl', 'dxb']);
    expect(new Set(scenarioCatalog.map((scenario) => scenario.id)).size).toBe(scenarioCatalog.length);

    for (const scenario of scenarioCatalog) {
      expect(scenario.briefing.length).toBeGreaterThan(24);
      expect(scenario.focus.length).toBeGreaterThan(12);
      expect(scenario.world.flowConfigurations.length).toBeGreaterThanOrEqual(3);
      expect(scenario.world.trafficEntries.length).toBeGreaterThanOrEqual(4);
      expect(scenario.world.trafficExits.length).toBeGreaterThanOrEqual(1);
      expect(scenario.world.procedures.some((procedure) => procedure.kind === 'arrival')).toBe(true);
      expect(scenario.world.procedures.some((procedure) => procedure.kind === 'departure')).toBe(true);
      expect(scenario.world.environment?.icao).toBe(scenario.icao);
      expect(scenario.runwayCount).toBeGreaterThan(0);
    }
  });

  it('keeps every traffic entry, exit and procedure internally resolvable', () => {
    for (const scenario of scenarioCatalog) {
      const fixIds = new Set(scenario.world.fixes.map((fix) => fix.id));
      const runwayIds = new Set(scenario.world.runways.flatMap((runway) => [runway.id, runway.reciprocal]));
      const procedures = new Map(scenario.world.procedures.map((procedure) => [procedure.id, procedure]));

      for (const procedure of scenario.world.procedures) {
        expect(procedure.fixIds.every((fixId) => fixIds.has(fixId))).toBe(true);
        if (procedure.runwayId) expect(runwayIds.has(procedure.runwayId)).toBe(true);
      }
      for (const entry of scenario.world.trafficEntries) {
        expect(procedures.get(entry.procedureId)?.kind).toBe('arrival');
        expect(entry.compatibleRunwayIds.every((runwayId) => runwayIds.has(runwayId))).toBe(true);
      }
      for (const exit of scenario.world.trafficExits) expect(procedures.get(exit.procedureId)?.kind).toBe('departure');
    }
  });

  it('can generate arrivals and departures from each packaged flow', () => {
    for (const scenario of scenarioCatalog) {
      for (const flow of scenario.world.flowConfigurations) {
        const activeWorld = worldWithFlow(scenario.world, flow.id, 10);
        const arrival = planTraffic(0, [], activeWorld, 73).aircraft;
        const departure = planTraffic(3, [], activeWorld, 73).aircraft;
        expect(flow.arrivalRunwayIds).toContain(arrival.assignedRunway);
        expect(departure.phase).toBe('departure');
        expect(departure.navigation?.procedure).toBeTruthy();
      }
    }
  });
});
