import { describe, expect, it } from 'vitest';
import { AIRPORT_DEFINITIONS } from './airportCatalog';
import { FLAGSHIP_AIRPORT_OPERATIONS } from './airportOperations';
import { scenarioCatalog } from './scenario';

describe('flagship airport operations packs', () => {
  it('ships five versioned, sourced and strategically distinct packs', () => {
    expect(FLAGSHIP_AIRPORT_OPERATIONS.map((pack) => pack.airportId)).toEqual(['ist', 'lhr', 'lax', 'jfk', 'atl']);
    expect(new Set(FLAGSHIP_AIRPORT_OPERATIONS.map((pack) => pack.strategyLabel)).size).toBe(5);
    expect(new Set(FLAGSHIP_AIRPORT_OPERATIONS.map((pack) => pack.disruption.id)).size).toBe(5);

    for (const pack of FLAGSHIP_AIRPORT_OPERATIONS) {
      expect(pack.packVersion).toMatch(/^\d{4}\.\d{2}\.\d+$/);
      expect(pack.referenceCycle.length).toBeGreaterThan(12);
      expect(pack.flows).toHaveLength(4);
      expect(pack.sources.length).toBeGreaterThanOrEqual(2);
      expect(pack.sources.every((source) => source.url.startsWith('https://'))).toBe(true);
      expect(pack.sources.every((source) => source.accessedOn === '2026-08-22')).toBe(true);
      expect(pack.gameOnlyNotice).toContain('not for navigation');
      expect(pack.trafficPattern[0]).toBe('arrival');
      expect(pack.trafficPattern[3]).toBe('departure');
      expect(pack.trafficPattern).toContain('arrival');
      expect(pack.trafficPattern).toContain('departure');
    }
  });

  it('resolves every configured runway and preserves the legacy save-flow ids', () => {
    const expectedLegacyIds: Record<string, string[]> = {
      ist: ['north-parallel', 'north-single', 'north-lowvis'],
      lhr: ['lhr-primary', 'lhr-reverse', 'lhr-lowvis'],
      lax: ['lax-primary', 'lax-reverse', 'lax-lowvis'],
      jfk: ['jfk-primary', 'jfk-reverse', 'jfk-lowvis'],
      atl: ['atl-primary', 'atl-reverse', 'atl-lowvis'],
    };

    for (const pack of FLAGSHIP_AIRPORT_OPERATIONS) {
      const definition = AIRPORT_DEFINITIONS.find((airport) => airport.id === pack.airportId);
      if (!definition) throw new Error(`Missing airport definition for ${pack.airportId}`);
      const runwayIds = new Set(definition.runways.flatMap((runway) => [runway.lowId, runway.highId]));
      const physicalRunwayByEnd = new Map(definition.runways.flatMap((runway, index) => [
        [runway.lowId, index], [runway.highId, index],
      ] as const));
      const flowIds = new Set(pack.flows.map((flow) => flow.id));

      expect(expectedLegacyIds[pack.airportId]?.every((id) => flowIds.has(id))).toBe(true);
      expect(flowIds.has(pack.disruption.reducedFlowId)).toBe(true);
      expect(flowIds.has(pack.disruption.recoveryFlowId)).toBe(true);
      for (const flow of pack.flows) {
        expect(flow.arrivalRunwayIds.every((id) => runwayIds.has(id))).toBe(true);
        expect(flow.departureRunwayIds.every((id) => runwayIds.has(id))).toBe(true);
        const activeEnds = [...flow.arrivalRunwayIds, ...flow.departureRunwayIds];
        expect(new Set(activeEnds.map((id) => physicalRunwayByEnd.get(id))).size).toBe(activeEnds.length);
      }
    }
  });

  it('projects pack identity into the playable radar worlds', () => {
    for (const pack of FLAGSHIP_AIRPORT_OPERATIONS) {
      const scenario = scenarioCatalog.find((item) => item.id === pack.airportId);
      expect(scenario?.world.operations?.packVersion).toBe(pack.packVersion);
      expect(scenario?.world.operations?.strategyLabel).toBe(pack.strategyLabel);
      expect(scenario?.world.flowConfigurations.map((flow) => flow.id)).toEqual(pack.flows.map((flow) => flow.id));
      expect(scenario?.world.fixes.filter((fix) => ['NORTH', 'EAST', 'SOUTH', 'WEST'].includes(fix.id)).map((fix) => fix.label))
        .toEqual(Object.values(pack.boundaryLabels));
      expect(scenario?.briefing).toBe(pack.briefing);
      expect(scenario?.focus).toBe(pack.focus);
    }
  });
});
