import { describe, expect, it } from 'vitest';
import { airportDefinitionById } from './airportCatalog';
import { FAA_CIFP_PROCEDURE_PACKS } from './generated/faaCifpProcedures';
import { PUBLISHED_PROCEDURE_PACKS, publishedProcedurePackByAirportId } from './publishedProcedureCatalog';
import type { ScenarioId } from './types';

describe('published procedure catalog', () => {
  it('combines the five reviewed packs with the first generated FAA group', () => {
    expect(PUBLISHED_PROCEDURE_PACKS.map((pack) => pack.airportId)).toEqual([
      'ist', 'lhr', 'lax', 'jfk', 'atl', 'dfw', 'ord', 'den',
    ]);
    expect(publishedProcedurePackByAirportId.size).toBe(PUBLISHED_PROCEDURE_PACKS.length);
  });

  it('ships four directional STAR feeds for DFW, ORD and DEN from cycle 2608', () => {
    const expected: Partial<Record<ScenarioId, readonly string[]>> = {
      dfw: ['BEREE3', 'BRDJE5', 'JOVEM6', 'SHMPP3'],
      ord: ['BENKY6', 'ERNNY8', 'ESSPO5', 'FYTTE7'],
      den: ['AALLE4', 'CLASH5', 'FLATI5', 'SSKII4'],
    } as const;

    for (const pack of FAA_CIFP_PROCEDURE_PACKS) {
      expect(pack.referenceCycle).toContain('FAA CIFP 2608');
      expect(pack.generatedFrom).toBe('FAA CIFP · ARINC 424-18');
      expect(pack.effectiveFrom).toBe('2026-08-06');
      expect(pack.effectiveTo).toBe('2026-09-03');
      expect(pack.procedures.map((procedure) => procedure.id)).toEqual(expected[pack.airportId]);
      expect(pack.sources).toHaveLength(1);
      expect(pack.sources[0]?.publisher).toBe('FAA');
    }
  });

  it('keeps generated fixes, restrictions and runway references runtime-safe', () => {
    for (const pack of FAA_CIFP_PROCEDURE_PACKS) {
      const definition = airportDefinitionById.get(pack.airportId);
      if (!definition) throw new Error(`Missing airport definition for ${pack.airportId}`);
      const runwayIds = new Set(definition.runways.flatMap((runway) => [runway.lowId, runway.highId]));
      expect(pack.procedures.some((procedure) => procedure.fixes.some((fix) => (
        fix.minimumAltitudeFt !== undefined
        || fix.maximumAltitudeFt !== undefined
        || fix.maximumSpeedKt !== undefined
      )))).toBe(true);

      for (const procedure of pack.procedures) {
        expect(procedure.kind).toBe('arrival');
        expect(procedure.entryTransition?.length).toBeGreaterThan(2);
        expect(procedure.fixes.length).toBeGreaterThanOrEqual(3);
        expect(new Set(procedure.fixes.map((fix) => fix.id)).size).toBe(procedure.fixes.length);
        expect(procedure.compatibleRunwayIds.every((runwayId) => runwayIds.has(runwayId))).toBe(true);
        for (const fix of procedure.fixes) {
          expect(fix.bearing).toBeGreaterThanOrEqual(0);
          expect(fix.bearing).toBeLessThan(360);
          expect(fix.distanceNm).toBeGreaterThanOrEqual(6);
          expect(fix.distanceNm).toBeLessThanOrEqual(40);
        }
      }
    }
  });
});
