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
      'del', 'icn', 'dxb', 'cdg', 'sin', 'ams', 'mad', 'kul',
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

  it('ships runway-compatible Dubai primary STARs from the published UAE GCAA issue', () => {
    const pack = INTERNATIONAL_PUBLISHED_PROCEDURE_PACKS.find((item) => item.airportId === 'dxb');
    expect(pack?.referenceCycle).toContain('UAE GCAA AIRAC AIP AMDT 09/2026');
    expect(pack?.effectiveFrom).toBe('2026-09-03');
    expect(pack?.procedures.map((procedure) => procedure.id)).toEqual([
      'IMPED3E', 'PUVAL2E', 'IMPED3C', 'PUVAL5C',
    ]);
    expect(pack?.sources.every((source) => source.publisher === 'UAE General Civil Aviation Authority')).toBe(true);

    const imped3e = pack?.procedures.find((procedure) => procedure.id === 'IMPED3E');
    expect(imped3e?.compatibleRunwayIds).toEqual(['12L', '12R']);
    expect(imped3e?.fixes.map((fix) => fix.id)).toEqual([
      'IMPED', 'DB520', 'DB517', 'DB423', 'DB407',
      'DB403', 'SOLIL', 'DB414', 'REREK',
    ]);
    expect(imped3e?.fixes.find((fix) => fix.id === 'IMPED')).toMatchObject({
      maximumAltitudeFt: 12000,
      maximumSpeedKt: 230,
    });
    expect(imped3e?.fixes.find((fix) => fix.id === 'DB423')).toMatchObject({ minimumAltitudeFt: 8000 });
    expect(imped3e?.fixes.find((fix) => fix.id === 'SOLIL')).toMatchObject({ maximumSpeedKt: 185 });

    const puval5c = pack?.procedures.find((procedure) => procedure.id === 'PUVAL5C');
    expect(puval5c?.compatibleRunwayIds).toEqual(['30L', '30R']);
    expect(puval5c?.fixes.map((fix) => fix.id)).toEqual([
      'PUVAL', 'KEBOG', 'KUPOR', 'DB526', 'DB530',
      'DB513', 'GIRGO', 'RIDEV', 'DB508', 'DB506', 'ULDOT',
    ]);
    expect(puval5c?.fixes.find((fix) => fix.id === 'KUPOR')).toMatchObject({
      minimumAltitudeFt: 8000,
      maximumSpeedKt: 210,
    });
    expect(puval5c?.fixes.find((fix) => fix.id === 'DB530')).toMatchObject({ maximumAltitudeFt: 7000 });
  });

  it('ships four-sector Paris CDG STARs from the current France SIA issue', () => {
    const pack = INTERNATIONAL_PUBLISHED_PROCEDURE_PACKS.find((item) => item.airportId === 'cdg');
    expect(pack?.referenceCycle).toContain('France SIA eAIP 06 AUG 2026');
    expect(pack?.effectiveFrom).toBe('2026-08-06');
    expect(pack?.effectiveTo).toBe('2026-09-02');
    expect(pack?.procedures.map((procedure) => procedure.id)).toEqual([
      'MATIX9E', 'LUKIP9E', 'TINIL9W', 'ROMGO9P',
    ]);
    expect(pack?.sources.every((source) => source.publisher === 'Service de l’information aéronautique, France')).toBe(true);

    const matix9e = pack?.procedures.find((procedure) => procedure.id === 'MATIX9E');
    expect(matix9e?.compatibleRunwayIds).toEqual(['08L', '08R', '09L', '09R']);
    expect(matix9e?.fixes.map((fix) => fix.id)).toEqual([
      'MATIX', 'VAKOS', 'ENORI', 'DEVIM', 'LORNI',
    ]);
    expect(matix9e?.fixes.find((fix) => fix.id === 'DEVIM')).toMatchObject({ maximumAltitudeFt: 16000 });
    expect(matix9e?.fixes.find((fix) => fix.id === 'LORNI')).toMatchObject({
      minimumAltitudeFt: 11000,
      maximumAltitudeFt: 15000,
      maximumSpeedKt: 300,
    });

    const tinil9w = pack?.procedures.find((procedure) => procedure.id === 'TINIL9W');
    expect(tinil9w?.compatibleRunwayIds).toEqual(['26L', '26R', '27L', '27R']);
    expect(tinil9w?.fixes.map((fix) => fix.id)).toEqual([
      'TINIL', 'FF302', 'NANOP', 'FF301', 'URELO', 'OKIPA',
    ]);
    expect(tinil9w?.fixes.find((fix) => fix.id === 'FF301')).toMatchObject({
      maximumAltitudeFt: 16000,
      maximumSpeedKt: 250,
    });
    expect(tinil9w?.fixes.find((fix) => fix.id === 'OKIPA')).toMatchObject({
      minimumAltitudeFt: 7000,
      maximumAltitudeFt: 11000,
    });

    const romgo9p = pack?.procedures.find((procedure) => procedure.id === 'ROMGO9P');
    expect(romgo9p?.fixes.map((fix) => fix.id)).toEqual(['ROMGO', 'FF501', 'NERKI', 'BANOX']);
    expect(romgo9p?.fixes.find((fix) => fix.id === 'FF501')).toMatchObject({
      minimumAltitudeFt: 19000,
      maximumAltitudeFt: 19000,
    });
    expect(romgo9p?.fixes.find((fix) => fix.id === 'BANOX')).toMatchObject({
      minimumAltitudeFt: 14000,
      maximumAltitudeFt: 14000,
      maximumSpeedKt: 300,
    });
  });

  it('ships runway-direction Changi STARs from the effective CAAS AIP issue', () => {
    const pack = INTERNATIONAL_PUBLISHED_PROCEDURE_PACKS.find((item) => item.airportId === 'sin');
    expect(pack?.referenceCycle).toContain('Singapore AIP AMDT 04/2026');
    expect(pack?.effectiveFrom).toBe('2026-07-09');
    expect(pack?.effectiveTo).toBe('2026-09-02');
    expect(pack?.procedures.map((procedure) => procedure.id)).toEqual([
      'ARAMA1A', 'KARTO2A', 'REPOV2B', 'TEBUN1B',
    ]);
    expect(pack?.sources.every((source) => source.publisher === 'Civil Aviation Authority of Singapore')).toBe(true);

    const arama1a = pack?.procedures.find((procedure) => procedure.id === 'ARAMA1A');
    expect(arama1a?.compatibleRunwayIds).toEqual(['02L', '02C']);
    expect(arama1a?.fixes.map((fix) => fix.id)).toEqual(['ARAMA', 'BOBAG', 'BOKIP', 'SAMKO']);
    expect(arama1a?.fixes.find((fix) => fix.id === 'BOBAG')).toMatchObject({
      minimumAltitudeFt: 10000,
      maximumSpeedKt: 220,
    });
    expect(arama1a?.fixes.find((fix) => fix.id === 'SAMKO')).toMatchObject({
      minimumAltitudeFt: 4000,
      maximumSpeedKt: 190,
    });

    const karto2a = pack?.procedures.find((procedure) => procedure.id === 'KARTO2A');
    expect(karto2a?.fixes.map((fix) => fix.id)).toEqual([
      'TOMAN', 'KARTO', 'GUNUD', 'KEXAS', 'VIMAL', 'IGNON', 'SANAT',
    ]);
    expect(karto2a?.fixes.find((fix) => fix.id === 'KEXAS')).toMatchObject({
      maximumAltitudeFt: 16000,
      maximumSpeedKt: 220,
    });

    const repov2b = pack?.procedures.find((procedure) => procedure.id === 'REPOV2B');
    expect(repov2b?.compatibleRunwayIds).toEqual(['20R', '20C']);
    expect(repov2b?.fixes.map((fix) => fix.id)).toEqual(['REPOV', 'REMES', 'BITAM', 'DOVAN', 'BIPOP']);
    expect(repov2b?.fixes.find((fix) => fix.id === 'REPOV')).toMatchObject({
      maximumAltitudeFt: 21000,
      maximumSpeedKt: 250,
    });

    const tebun1b = pack?.procedures.find((procedure) => procedure.id === 'TEBUN1B');
    expect(tebun1b?.fixes.map((fix) => fix.id)).toEqual([
      'TEBUN', 'VAMPO', 'IBASU', 'VEXEL', 'ABVIP', 'AGROT', 'BITAM', 'DOVAN', 'BIPOP',
    ]);
    expect(tebun1b?.fixes.find((fix) => fix.id === 'VAMPO')).toMatchObject({
      minimumAltitudeFt: 10000,
      maximumSpeedKt: 220,
    });
    expect(tebun1b?.fixes.find((fix) => fix.id === 'BIPOP')).toMatchObject({
      minimumAltitudeFt: 3000,
      maximumSpeedKt: 190,
    });
  });

  it('ships four-sector Schiphol STARs from the current LVNL issue', () => {
    const pack = INTERNATIONAL_PUBLISHED_PROCEDURE_PACKS.find((item) => item.airportId === 'ams');
    expect(pack?.referenceCycle).toContain('Netherlands eAIP AIRAC AMDT 08/2026');
    expect(pack?.effectiveFrom).toBe('2026-08-06');
    expect(pack?.effectiveTo).toBe('2026-09-02');
    expect(pack?.procedures.map((procedure) => procedure.id)).toEqual([
      'BLUFA1A', 'NORKU2A', 'REDFA1A', 'DENUT3A',
    ]);
    expect(pack?.sources.every((source) => source.publisher === 'Luchtverkeersleiding Nederland')).toBe(true);

    const blufa1a = pack?.procedures.find((procedure) => procedure.id === 'BLUFA1A');
    expect(blufa1a?.compatibleRunwayIds).toEqual([
      '04', '22', '06', '24', '09', '27', '18C', '36C', '18L', '36R', '18R', '36L',
    ]);
    expect(blufa1a?.fixes.map((fix) => fix.id)).toEqual(['BLUFA', 'ARTIP']);
    expect(blufa1a?.fixes.find((fix) => fix.id === 'ARTIP')).toMatchObject({
      minimumAltitudeFt: 7000,
      maximumAltitudeFt: 10000,
      maximumSpeedKt: 250,
    });

    const norku2a = pack?.procedures.find((procedure) => procedure.id === 'NORKU2A');
    expect(norku2a?.fixes.map((fix) => fix.id)).toEqual([
      'NORKU', 'SONSA', 'ROBIS', 'OSKUR', 'ARTIP',
    ]);
    expect(norku2a?.fixes.find((fix) => fix.id === 'NORKU')).toMatchObject({
      minimumAltitudeFt: 20000,
      maximumAltitudeFt: 28000,
    });

    const redfa1a = pack?.procedures.find((procedure) => procedure.id === 'REDFA1A');
    expect(redfa1a?.fixes.map((fix) => fix.id)).toEqual(['REDFA', 'SULUT', 'SUGOL']);
    expect(redfa1a?.fixes.find((fix) => fix.id === 'SUGOL')).toMatchObject({
      minimumAltitudeFt: 7000,
      maximumAltitudeFt: 10000,
      maximumSpeedKt: 250,
    });

    const denut3a = pack?.procedures.find((procedure) => procedure.id === 'DENUT3A');
    expect(denut3a?.fixes.map((fix) => fix.id)).toEqual(['DENUT', 'YENZO', 'RIVER']);
    expect(denut3a?.fixes.find((fix) => fix.id === 'RIVER')).toMatchObject({
      minimumAltitudeFt: 7000,
      maximumAltitudeFt: 10000,
      maximumSpeedKt: 250,
    });
  });

  it('ships east/west Madrid STARs for both published landing configurations', () => {
    const pack = INTERNATIONAL_PUBLISHED_PROCEDURE_PACKS.find((item) => item.airportId === 'mad');
    expect(pack?.referenceCycle).toContain('ENAIRE AIP España 06 AUG 2026');
    expect(pack?.effectiveFrom).toBe('2026-08-06');
    expect(pack?.effectiveTo).toBe('2026-09-02');
    expect(pack?.procedures.map((procedure) => procedure.id)).toEqual([
      'RIDAV3A', 'ADUXO7B', 'RIDAV5C', 'ADUXO3D',
    ]);
    expect(pack?.sources.every((source) => source.publisher === 'ENAIRE AIS España')).toBe(true);

    const ridav3a = pack?.procedures.find((procedure) => procedure.id === 'RIDAV3A');
    expect(ridav3a?.compatibleRunwayIds).toEqual(['18L', '18R']);
    expect(ridav3a?.fixes.map((fix) => fix.id)).toEqual([
      'RIDAV', 'MD400', 'USATI', 'SECQO', 'RILKO',
    ]);
    expect(ridav3a?.fixes.find((fix) => fix.id === 'RIDAV')).toMatchObject({ minimumAltitudeFt: 24500 });
    expect(ridav3a?.fixes.find((fix) => fix.id === 'SECQO')).toMatchObject({
      minimumAltitudeFt: 12000,
      maximumSpeedKt: 220,
    });

    const aduxo7b = pack?.procedures.find((procedure) => procedure.id === 'ADUXO7B');
    expect(aduxo7b?.compatibleRunwayIds).toEqual(['18L', '18R']);
    expect(aduxo7b?.fixes.map((fix) => fix.id)).toEqual([
      'ADUXO', 'MD505', 'NOSKO', 'RBO', 'LULER',
    ]);
    expect(aduxo7b?.fixes.find((fix) => fix.id === 'RBO')).toMatchObject({
      maximumAltitudeFt: 9000,
      maximumSpeedKt: 220,
    });

    const ridav5c = pack?.procedures.find((procedure) => procedure.id === 'RIDAV5C');
    expect(ridav5c?.compatibleRunwayIds).toEqual(['32L', '32R']);
    expect(ridav5c?.fixes.map((fix) => fix.id)).toEqual([
      'RIDAV', 'MD455', 'TLD', 'MD445', 'BUREX', 'MD440', 'YUNYE', 'MD420', 'FAFEQ',
    ]);
    expect(ridav5c?.fixes.find((fix) => fix.id === 'TLD')).toMatchObject({
      minimumAltitudeFt: 15000,
      maximumAltitudeFt: 21000,
    });
    expect(ridav5c?.fixes.find((fix) => fix.id === 'FAFEQ')).toMatchObject({
      minimumAltitudeFt: 5000,
      maximumAltitudeFt: 6000,
      maximumSpeedKt: 220,
    });

    const aduxo3d = pack?.procedures.find((procedure) => procedure.id === 'ADUXO3D');
    expect(aduxo3d?.compatibleRunwayIds).toEqual(['32L', '32R']);
    expect(aduxo3d?.fixes.map((fix) => fix.id)).toEqual(['ADUXO', 'MD001', 'SIRGU', 'RUDBI']);
    expect(aduxo3d?.fixes.find((fix) => fix.id === 'SIRGU')).toMatchObject({
      minimumAltitudeFt: 10000,
      maximumAltitudeFt: 14000,
    });
    expect(aduxo3d?.fixes.find((fix) => fix.id === 'RUDBI')).toMatchObject({
      minimumAltitudeFt: 8000,
      maximumSpeedKt: 220,
    });
  });

  it('ships both Kuala Lumpur point-merge systems with their operational runway split', () => {
    const pack = INTERNATIONAL_PUBLISHED_PROCEDURE_PACKS.find((item) => item.airportId === 'kul');
    expect(pack?.referenceCycle).toContain('CAAM eAIP Malaysia 11 AUG 2026');
    expect(pack?.effectiveFrom).toBe('2026-08-11');
    expect(pack?.procedures.map((procedure) => procedure.id)).toEqual([
      'KAKAK1G', 'SAROX1G', 'NIREN1H', 'GUPTA1H',
    ]);
    expect(pack?.sources.some((source) => source.publisher === 'Civil Aviation Authority of Malaysia')).toBe(true);

    const kakak1g = pack?.procedures.find((procedure) => procedure.id === 'KAKAK1G');
    expect(kakak1g?.compatibleRunwayIds).toEqual(['14L', '14R', '32L', '32R']);
    expect(kakak1g?.fixes.map((fix) => fix.id)).toEqual([
      'KAKAK', 'LIBKI', 'RITLO', 'KK811', 'KK812',
      'KK813', 'KK814', 'KK815', 'KK816', 'EGURI',
    ]);
    expect(kakak1g?.fixes.find((fix) => fix.id === 'RITLO')).toMatchObject({
      minimumAltitudeFt: 19000,
      maximumSpeedKt: 250,
    });
    expect(kakak1g?.fixes.find((fix) => fix.id === 'EGURI')).toMatchObject({
      minimumAltitudeFt: 15000,
      maximumSpeedKt: 230,
    });

    const sarox1g = pack?.procedures.find((procedure) => procedure.id === 'SAROX1G');
    expect(sarox1g?.fixes.map((fix) => fix.id)).toEqual([
      'SAROX', 'VEKTO', 'NUKPA', 'KK804', 'KK805',
      'KK806', 'KK807', 'KK808', 'KK809', 'EGURI',
    ]);
    expect(sarox1g?.fixes.find((fix) => fix.id === 'NUKPA')).toMatchObject({
      minimumAltitudeFt: 17000,
      maximumSpeedKt: 250,
    });

    const niren1h = pack?.procedures.find((procedure) => procedure.id === 'NIREN1H');
    expect(niren1h?.compatibleRunwayIds).toEqual(['15', '33']);
    expect(niren1h?.fixes.map((fix) => fix.id)).toEqual([
      'NIREN', 'AKESO', 'KK871', 'KADKU', 'PAPGO', 'KK872',
      'KK873', 'KK874', 'KK875', 'KK876', 'KK877', 'MESUP',
    ]);
    expect(niren1h?.fixes.find((fix) => fix.id === 'PAPGO')).toMatchObject({
      minimumAltitudeFt: 14000,
      maximumSpeedKt: 230,
    });

    const gupta1h = pack?.procedures.find((procedure) => procedure.id === 'GUPTA1H');
    expect(gupta1h?.fixes.map((fix) => fix.id)).toEqual([
      'GUPTA', 'PANKA', 'LULKI', 'KK881', 'KK882',
      'KK883', 'KK884', 'KK885', 'KK886', 'MESUP',
    ]);
    expect(gupta1h?.fixes.find((fix) => fix.id === 'MESUP')).toMatchObject({
      minimumAltitudeFt: 8000,
      maximumSpeedKt: 230,
    });
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
