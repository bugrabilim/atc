import { describe, expect, it } from 'vitest';
import { planTraffic } from './trafficDirector';
import { createInitialState, scenarioCatalog, worldWithFlow } from './scenario';
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

  it('loads reviewed and generated published procedures as executable routes', () => {
    const expected = {
      ist: ['RIXEN1W', 'VICEN1S'],
      lhr: ['BNN-STACK', 'LAM-STACK', 'BIG-STACK', 'OCK-STACK'],
      lax: ['IRNMN2', 'RYDRR2', 'WAYVE1'],
      jfk: ['CAMRN5', 'PARCH4', 'PAWLN1', 'PUCKY1'],
      atl: ['SITTH3-09', 'SITTH3-08', 'GNDLF3'],
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

    for (const [airportId, procedureIds] of Object.entries(expected)) {
      const scenario = scenarioCatalog.find((item) => item.id === airportId);
      expect(scenario, airportId).toBeTruthy();
      for (const procedureId of procedureIds) {
        const procedure = scenario?.world.procedures.find((item) => item.id === procedureId);
        expect(procedure?.source, `${airportId}/${procedureId}`).toBe('published');
        expect(procedure?.fixIds.length, `${airportId}/${procedureId}`).toBeGreaterThan(0);
      }
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

  it('uses the published Madrid north/south runway split in every saved flow id', () => {
    const madrid = scenarioCatalog.find((scenario) => scenario.id === 'mad');
    expect(madrid?.world.flowConfigurations).toEqual([
      expect.objectContaining({ id: 'mad-primary', arrivalRunwayIds: ['18L', '18R'], departureRunwayIds: ['14L', '14R'] }),
      expect.objectContaining({ id: 'mad-reverse', arrivalRunwayIds: ['32L', '32R'], departureRunwayIds: ['36L', '36R'] }),
      expect.objectContaining({ id: 'mad-lowvis', arrivalRunwayIds: ['18R'], departureRunwayIds: ['14L'] }),
      expect.objectContaining({ id: 'mad-north-lowvis', arrivalRunwayIds: ['32L'], departureRunwayIds: ['36L'] }),
    ]);
  });

  it('uses Kuala Lumpur three-runway and point-merge assignments in every saved flow id', () => {
    const kualaLumpur = scenarioCatalog.find((scenario) => scenario.id === 'kul');
    expect(kualaLumpur?.world.flowConfigurations).toEqual([
      expect.objectContaining({ id: 'kul-primary', arrivalRunwayIds: ['32R', '33'], departureRunwayIds: ['32L', '33'] }),
      expect.objectContaining({ id: 'kul-reverse', arrivalRunwayIds: ['14L', '15'], departureRunwayIds: ['14R', '15'] }),
      expect.objectContaining({ id: 'kul-lowvis', arrivalRunwayIds: ['32R'], departureRunwayIds: ['32L'] }),
      expect.objectContaining({ id: 'kul-south-lowvis', arrivalRunwayIds: ['14L'], departureRunwayIds: ['14R'] }),
    ]);
  });

  it('uses Bangkok published three-runway arrival and departure assignments', () => {
    const bangkok = scenarioCatalog.find((scenario) => scenario.id === 'bkk');
    expect(bangkok?.world.environment?.elevationFt).toBe(8);
    expect(bangkok?.world.flowConfigurations).toEqual([
      expect.objectContaining({ id: 'bkk-primary', arrivalRunwayIds: ['01', '02L'], departureRunwayIds: ['01', '02R'] }),
      expect.objectContaining({ id: 'bkk-reverse', arrivalRunwayIds: ['19', '20R'], departureRunwayIds: ['19', '20L'] }),
      expect.objectContaining({ id: 'bkk-lowvis', arrivalRunwayIds: ['02L'], departureRunwayIds: ['02R'] }),
      expect.objectContaining({ id: 'bkk-south-lowvis', arrivalRunwayIds: ['20R'], departureRunwayIds: ['20L'] }),
    ]);
  });

  it('uses Hong Kong published three-runway and night dual-runway assignments', () => {
    const hongKong = scenarioCatalog.find((scenario) => scenario.id === 'hkg');
    expect(hongKong?.world.environment?.elevationFt).toBe(28);
    expect(hongKong?.world.runways.map((runway) => runway.heading)).toEqual([70.9, 70.9, 70.9]);
    expect(hongKong?.world.flowConfigurations).toEqual([
      expect.objectContaining({ id: 'hkg-primary', arrivalRunwayIds: ['07L', '07R'], departureRunwayIds: ['07C', '07R'] }),
      expect.objectContaining({ id: 'hkg-reverse', arrivalRunwayIds: ['25R', '25L'], departureRunwayIds: ['25C', '25L'] }),
      expect.objectContaining({ id: 'hkg-night-07', arrivalRunwayIds: ['07C'], departureRunwayIds: ['07R'] }),
      expect.objectContaining({ id: 'hkg-night-25', arrivalRunwayIds: ['25C'], departureRunwayIds: ['25L'] }),
    ]);
  });

  it('uses Barcelona published daytime parallel and night runway configurations', () => {
    const barcelona = scenarioCatalog.find((scenario) => scenario.id === 'bcn');
    const barcelonaDefinition = AIRPORT_DEFINITIONS.find((airport) => airport.id === 'bcn');
    expect(barcelona?.world.environment?.elevationFt).toBe(14);
    expect(barcelonaDefinition?.runways.map((runway) => runway.heading)).toEqual([18.98, 65.57, 65.57]);
    expect(barcelona?.world.runways.map((runway) => Number(runway.heading.toFixed(2)))).toEqual([245.57, 245.57, 18.98]);
    expect(barcelona?.world.flowConfigurations).toEqual([
      expect.objectContaining({ id: 'bcn-primary', arrivalRunwayIds: ['24R'], departureRunwayIds: ['24L'] }),
      expect.objectContaining({ id: 'bcn-reverse', arrivalRunwayIds: ['06L'], departureRunwayIds: ['06R'] }),
      expect.objectContaining({ id: 'bcn-night-02', arrivalRunwayIds: ['02'], departureRunwayIds: ['06R'] }),
      expect.objectContaining({ id: 'bcn-night-24', arrivalRunwayIds: ['24L'], departureRunwayIds: ['24L'] }),
    ]);
  });

  it('uses Mumbai current intersecting-runway geometry and all four STAR flows', () => {
    const mumbai = scenarioCatalog.find((scenario) => scenario.id === 'bom');
    const mumbaiDefinition = AIRPORT_DEFINITIONS.find((airport) => airport.id === 'bom');
    expect(mumbai?.world.environment?.elevationFt).toBe(40);
    expect(mumbaiDefinition?.runways.map((runway) => runway.heading)).toEqual([89.52, 134.52]);
    expect(mumbai?.world.runways.map((runway) => Number(runway.heading.toFixed(2)))).toEqual([269.52, 134.52]);
    expect(mumbai?.world.flowConfigurations).toEqual([
      expect.objectContaining({ id: 'bom-primary', arrivalRunwayIds: ['27'], departureRunwayIds: ['27'] }),
      expect.objectContaining({ id: 'bom-reverse', arrivalRunwayIds: ['09'], departureRunwayIds: ['09'] }),
      expect.objectContaining({ id: 'bom-cross-14', arrivalRunwayIds: ['14'], departureRunwayIds: ['14'] }),
      expect.objectContaining({ id: 'bom-cross-32', arrivalRunwayIds: ['32'], departureRunwayIds: ['32'] }),
    ]);
  });

  it('uses Doha current parallel-runway geometry and independent approach flows', () => {
    const doha = scenarioCatalog.find((scenario) => scenario.id === 'doh');
    const dohaDefinition = AIRPORT_DEFINITIONS.find((airport) => airport.id === 'doh');
    expect(doha?.world.environment?.elevationFt).toBe(13);
    expect(dohaDefinition?.runways.map((runway) => runway.heading)).toEqual([158.17, 158.16]);
    expect(doha?.world.flowConfigurations).toEqual([
      expect.objectContaining({ id: 'doh-primary', arrivalRunwayIds: ['16L', '16R'], departureRunwayIds: ['16L', '16R'] }),
      expect.objectContaining({ id: 'doh-reverse', arrivalRunwayIds: ['34L', '34R'], departureRunwayIds: ['34L', '34R'] }),
      expect.objectContaining({ id: 'doh-lowvis', arrivalRunwayIds: ['16L'], departureRunwayIds: ['16L'] }),
      expect.objectContaining({ id: 'doh-north-lowvis', arrivalRunwayIds: ['34R'], departureRunwayIds: ['34R'] }),
    ]);
  });

  it('can start directly in a non-primary flow without assigning inactive runways', () => {
    for (const scenario of scenarioCatalog.filter((item) => item.world.operations)) {
      const flow = scenario.world.flowConfigurations.at(-1)!;
      const state = createInitialState(scenario, 'normal', flow.id);
      const activeWorld = worldWithFlow(scenario.world, flow.id, state.peakSkill);
      const activeRunwayIds = new Set(activeWorld.runways.filter((runway) => runway.active).map((runway) => runway.id));
      expect(state.flowId).toBe(flow.id);
      const inactiveAssignments = state.aircraft.filter((aircraft) => aircraft.assignedRunway && !activeRunwayIds.has(aircraft.assignedRunway));
      expect(inactiveAssignments, `${scenario.id}/${flow.id}: ${inactiveAssignments.map((aircraft) => `${aircraft.callsign}:${aircraft.assignedRunway}`).join(', ')}`).toHaveLength(0);
    }
  });
});
