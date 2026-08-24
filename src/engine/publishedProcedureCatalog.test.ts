import { describe, expect, it } from 'vitest';
import { airportDefinitionById } from './airportCatalog';
import { FAA_CIFP_PROCEDURE_PACKS } from './generated/faaCifpProcedures';
import { PUBLISHED_PROCEDURE_PACKS, publishedProcedurePackByAirportId } from './publishedProcedureCatalog';
import { scenarioCatalog, worldWithFlow } from './scenario';
import { planTraffic } from './trafficDirector';
import type { ScenarioId } from './types';

describe('published procedure catalog', () => {
  it('combines the five reviewed packs with every generated FAA group', () => {
    expect(PUBLISHED_PROCEDURE_PACKS.map((pack) => pack.airportId)).toEqual([
      'ist', 'lhr', 'lax', 'jfk', 'atl', 'dfw', 'ord', 'den',
      'mco', 'mia', 'las', 'sfo', 'clt', 'sea', 'phx', 'iah',
    ]);
    expect(publishedProcedurePackByAirportId.size).toBe(PUBLISHED_PROCEDURE_PACKS.length);
  });

  it('ships selected STAR feeds for every catalogued U.S. airport from cycle 2608', () => {
    const expected: Partial<Record<ScenarioId, readonly string[]>> = {
      dfw: ['BEREE3', 'BRDJE5', 'JOVEM6', 'SHMPP3'],
      ord: ['BENKY6', 'ERNNY8', 'ESSPO5', 'FYTTE7'],
      den: ['AALLE4', 'CLASH5', 'FLATI5', 'SSKII4'],
      mco: ['ALYNA4', 'GRNCH5', 'JOKRS4', 'MUNGI1'],
      mia: ['BNFSH3', 'FROGZ5', 'SNDBR3', 'VIICE2'],
      las: ['CHOWW4', 'COKTL4', 'RKSTR4', 'RNDRZ4'],
      sfo: ['ALWYS3', 'BDEGA4', 'PIRAT3', 'RISTI1'],
      clt: ['BANKR7', 'CHSLY8', 'FILPZ6', 'MLLET5'],
      sea: ['HAWKZ8', 'MARNR8'],
      phx: ['DSERT2', 'EAGUL6', 'HYDRR1', 'PINNG1'],
      iah: ['BAZBL1', 'GESNR2', 'HTOWN3', 'LINKK1'],
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
        expect(procedure.fixes.length).toBeGreaterThanOrEqual(2);
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

  it('can spawn a published arrival in every generated airport flow', () => {
    for (const pack of FAA_CIFP_PROCEDURE_PACKS) {
      const scenario = scenarioCatalog.find((item) => item.id === pack.airportId);
      if (!scenario) throw new Error(`Missing scenario for ${pack.airportId}`);
      for (const flow of scenario.world.flowConfigurations) {
        const activeWorld = worldWithFlow(scenario.world, flow.id, 10);
        const plan = planTraffic(0, [], activeWorld, 73);
        const procedure = activeWorld.procedures.find((item) => item.id === plan.aircraft.navigation?.procedure);
        expect(plan.aircraft.phase, `${pack.airportId}/${flow.id}`).toBe('arrival');
        expect(procedure?.source, `${pack.airportId}/${flow.id}`).toBe('published');
        expect(pack.procedures.map((item) => item.id), `${pack.airportId}/${flow.id}`).toContain(procedure?.id);
      }
    }
  });
});
