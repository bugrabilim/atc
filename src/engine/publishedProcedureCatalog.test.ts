import { describe, expect, it } from 'vitest';
import { airportDefinitionById } from './airportCatalog';
import { FAA_CIFP_PROCEDURE_PACKS } from './generated/faaCifpProcedures';
import { INTERNATIONAL_PUBLISHED_PROCEDURE_PACKS } from './internationalPublishedProcedures';
import { PUBLISHED_PROCEDURE_PACKS, publishedProcedurePackByAirportId } from './publishedProcedureCatalog';
import { scenarioCatalog, worldWithFlow } from './scenario';
import { planTraffic } from './trafficDirector';
import type { ScenarioId } from './types';

describe('published procedure catalog', () => {
  it('combines the reviewed, FAA and international procedure groups', () => {
    expect(PUBLISHED_PROCEDURE_PACKS.map((pack) => pack.airportId)).toEqual([
      'ist', 'lhr', 'lax', 'jfk', 'atl', 'dfw', 'ord', 'den',
      'mco', 'mia', 'las', 'sfo', 'clt', 'sea', 'phx', 'iah',
      'del', 'icn',
    ]);
    expect(publishedProcedurePackByAirportId.size).toBe(PUBLISHED_PROCEDURE_PACKS.length);
  });

  it('ships runway-compatible Incheon STARs from the current Korea AIM assignment', () => {
    const pack = INTERNATIONAL_PUBLISHED_PROCEDURE_PACKS.find((item) => item.airportId === 'icn');
    expect(pack?.referenceCycle).toContain('Korea AIM eAIP 2026-08-20');
    expect(pack?.effectiveFrom).toBe('2025-10-01');
    expect(pack?.procedures.map((procedure) => procedure.id)).toEqual([
      'GUKDO2H', 'KARBU2H', 'GUKDO2E', 'KARBU2E',
    ]);
    expect(pack?.sources.every((source) => source.publisher === 'Office of Civil Aviation, Republic of Korea')).toBe(true);

    const gukdo2h = pack?.procedures.find((procedure) => procedure.id === 'GUKDO2H');
    expect(gukdo2h?.compatibleRunwayIds).toEqual(['15L', '15R', '16L', '16R']);
    expect(gukdo2h?.fixes.map((fix) => fix.id)).toEqual([
      'GUKDO', 'NODUN', 'SEL', 'GH034', 'SANLA', 'DH034',
      'POMIM', 'DH030', 'DH021', 'DH024', 'DH023', 'MUNAN',
    ]);
    expect(gukdo2h?.fixes.find((fix) => fix.id === 'SEL')).toMatchObject({ minimumAltitudeFt: 13000 });
    expect(gukdo2h?.fixes.find((fix) => fix.id === 'POMIM')).toMatchObject({
      minimumAltitudeFt: 3000,
      maximumSpeedKt: 210,
    });

    const karbu2e = pack?.procedures.find((procedure) => procedure.id === 'KARBU2E');
    expect(karbu2e?.compatibleRunwayIds).toEqual(['33L', '33R', '34L', '34R']);
    expect(karbu2e?.fixes.map((fix) => fix.id)).toEqual([
      'KARBU', 'EGOBA', 'KE044', 'ELMAP', 'TESIK', 'GE023',
      'GE022', 'GE016', 'GE024', 'GE028', 'GE027', 'ENPIL',
    ]);
    expect(karbu2e?.fixes.find((fix) => fix.id === 'TESIK')).toMatchObject({
      minimumAltitudeFt: 10000,
      maximumSpeedKt: 210,
    });
    expect(karbu2e?.fixes.find((fix) => fix.id === 'ENPIL')).toMatchObject({ minimumAltitudeFt: 7000 });
  });

  it('ships runway-specific Delhi STARs from the effective AIM India issue', () => {
    const [pack] = INTERNATIONAL_PUBLISHED_PROCEDURE_PACKS;
    expect(pack?.airportId).toBe('del');
    expect(pack?.referenceCycle).toContain('AIP AMDT 07/2026');
    expect(pack?.effectiveFrom).toBe('2026-08-06');
    expect(pack?.effectiveTo).toBe('2026-09-02');
    expect(pack?.sources.every((source) => source.publisher === 'Airports Authority of India')).toBe(true);
    expect(pack?.procedures.map((procedure) => procedure.id)).toEqual([
      'SP6E', 'SP6F', 'SP6G', 'SP6H',
      'ELKUX6E', 'ELKUX6F', 'ELKUX6G', 'ELKUX6H',
      'BAVOX6A', 'BAVOX6B', 'BAVOX6C', 'BAVOX6D',
      'POSIG6A', 'POSIG6B', 'POSIG6C', 'POSIG6D',
    ]);

    const sp6h = pack?.procedures.find((procedure) => procedure.id === 'SP6H');
    expect(sp6h?.compatibleRunwayIds).toEqual(['11R']);
    expect(sp6h?.fixes.map((fix) => fix.id)).toEqual(['SP', 'ISREL', 'VILUT', 'SAM', 'FN911']);
    expect(sp6h?.fixes.find((fix) => fix.id === 'SAM')).toMatchObject({
      maximumAltitudeFt: 6000,
      maximumSpeedKt: 210,
    });

    const bavox6d = pack?.procedures.find((procedure) => procedure.id === 'BAVOX6D');
    expect(bavox6d?.compatibleRunwayIds).toEqual(['29L']);
    expect(bavox6d?.fixes.map((fix) => fix.id)).toEqual(['BAVOX', 'SURGO', 'SAPLO', 'DP505', 'FS711']);
    expect(bavox6d?.fixes.find((fix) => fix.id === 'DP505')).toMatchObject({
      maximumAltitudeFt: 10000,
      maximumSpeedKt: 230,
    });
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

  it('can spawn a runway-compatible published arrival in every international airport flow', () => {
    for (const pack of INTERNATIONAL_PUBLISHED_PROCEDURE_PACKS) {
      const scenario = scenarioCatalog.find((item) => item.id === pack.airportId);
      if (!scenario) throw new Error(`Missing scenario for ${pack.airportId}`);
      for (const flow of scenario.world.flowConfigurations) {
        const activeWorld = worldWithFlow(scenario.world, flow.id, 10);
        const plan = planTraffic(0, [], activeWorld, 73);
        const procedure = activeWorld.procedures.find((item) => item.id === plan.aircraft.navigation?.procedure);
        expect(plan.aircraft.phase, `${pack.airportId}/${flow.id}`).toBe('arrival');
        expect(procedure?.source, `${pack.airportId}/${flow.id}`).toBe('published');
        expect(procedure?.compatibleRunwayIds, `${pack.airportId}/${flow.id}`).toContain(plan.aircraft.assignedRunway);
      }
    }
  });
});
