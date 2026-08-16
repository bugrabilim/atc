import type { Aircraft, GameMode, GameState, RadarWorld } from './types';
import { planTraffic } from './trafficDirector';
import { createAircraft, HEAVY_PERFORMANCE, JET_PERFORMANCE } from './aircraftData';
import { profileForSkill } from './skill';
import { difficultyConfig, modeTrafficProfile } from './difficulty';

export interface GameScenario {
  id: 'alpha' | 'coastal' | 'metro' | 'highland' | 'strait' | 'nordic' | 'desert' | 'river';
  label: string;
  briefing: string;
  focus: string;
  world: RadarWorld;
  initialAircraft: Aircraft[];
}

const alphaWorld: RadarWorld = {
  airport: 'ISTANBUL AIRPORT', sectorName: 'APPROACH · IST NORTH SECTOR', rangeNm: 42,
  runways: [
    { id: '34R', reciprocal: '16L', center: { x: -3.8, y: 2 }, heading: 354, lengthNm: 2.03, active: false, operation: 'inactive' },
    { id: '34L', reciprocal: '16R', center: { x: -1.9, y: 1.7 }, heading: 354, lengthNm: 2.03, active: true, operation: 'arrival' },
    { id: '35R', reciprocal: '17L', center: { x: 1, y: 1.4 }, heading: 354, lengthNm: 2.21, active: true, operation: 'arrival' },
    { id: '35L', reciprocal: '17R', center: { x: 2.9, y: 1.1 }, heading: 354, lengthNm: 2.21, active: false, operation: 'inactive' },
    { id: '36', reciprocal: '18', center: { x: 5.7, y: 0.6 }, heading: 354, lengthNm: 1.65, active: true, operation: 'departure' },
  ],
  fixes: [
    { id: 'GATE1', position: { x: -24, y: -19 } }, { id: 'GATE2', position: { x: 24, y: -17 } },
    { id: 'GATE3', position: { x: -29, y: 13 } }, { id: 'EXIT1', position: { x: 27, y: 16 } },
    { id: 'GATE4', position: { x: 29, y: 12 } }, { id: 'STACK1', position: { x: -17, y: -8 } },
    { id: 'STACK2', position: { x: 16, y: -7 } }, { id: 'FINAL1', position: { x: -8, y: -13 } },
    { id: 'FINAL2', position: { x: 8, y: -13 } },
  ],
  procedures: [
    { id: 'GATE1-ALPHA', kind: 'arrival', runwayId: '34L', fixIds: ['GATE1', 'FINAL1'] },
    { id: 'GATE2-BRAVO', kind: 'arrival', runwayId: '35R', fixIds: ['GATE2', 'FINAL2'] },
    { id: 'GATE3-ALPHA', kind: 'arrival', runwayId: '34L', fixIds: ['GATE3', 'FINAL1'] },
    { id: 'GATE4-BRAVO', kind: 'arrival', runwayId: '35R', fixIds: ['GATE4', 'STACK2', 'FINAL2'] },
    { id: 'GATE1-STACK', kind: 'arrival', runwayId: '34L', fixIds: ['GATE1', 'STACK1', 'FINAL1'] },
    { id: 'EXIT1-DEPARTURE', kind: 'departure', fixIds: ['EXIT1'] },
  ],
  trafficEntries: [
    { id: 'GATE1', position: { x: -25, y: -19 }, procedureId: 'GATE1-ALPHA', compatibleRunwayIds: ['34L'] },
    { id: 'GATE2', position: { x: 25, y: -17 }, procedureId: 'GATE2-BRAVO', compatibleRunwayIds: ['35R'] },
    { id: 'GATE3', position: { x: -29, y: 13 }, procedureId: 'GATE3-ALPHA', compatibleRunwayIds: ['34L'] },
    { id: 'GATE4', position: { x: 29, y: 12 }, procedureId: 'GATE4-BRAVO', compatibleRunwayIds: ['35R'] },
  ],
  trafficExits: [{ id: 'EXIT1', procedureId: 'EXIT1-DEPARTURE' }],
  flowConfigurations: [
    { id: 'north-parallel', label: 'KUZEY · PARALEL', arrivalRunwayIds: ['34L', '35R'], departureRunwayIds: ['36'], windDirection: 350, windSpeedKt: 10, visibilityNm: 10, qnh: 1016 },
    { id: 'north-single', label: 'KUZEY · TEK PİST', arrivalRunwayIds: ['34L'], departureRunwayIds: ['36'], windDirection: 340, windSpeedKt: 18, visibilityNm: 7, qnh: 1009 },
    { id: 'north-lowvis', label: 'KUZEY · LOW VIS', arrivalRunwayIds: ['35R'], departureRunwayIds: ['36'], windDirection: 2, windSpeedKt: 21, visibilityNm: 4, qnh: 1003 },
  ],
};

const coastalWorld: RadarWorld = {
  airport: 'COASTAL GATEWAY', sectorName: 'APPROACH · COASTAL SECTOR', rangeNm: 36,
  runways: [
    { id: '09L', reciprocal: '27R', center: { x: -1.8, y: 0.6 }, heading: 90, lengthNm: 1.9, active: true, operation: 'arrival' },
    { id: '09R', reciprocal: '27L', center: { x: 1.2, y: -1.4 }, heading: 90, lengthNm: 1.9, active: true, operation: 'arrival' },
    { id: '18', reciprocal: '36', center: { x: 3.8, y: 2.8 }, heading: 180, lengthNm: 1.55, active: true, operation: 'departure' },
  ],
  fixes: [
    { id: 'GATE1', position: { x: -23, y: -18 } }, { id: 'GATE2', position: { x: 22, y: -20 } },
    { id: 'GATE3', position: { x: -25, y: 15 } }, { id: 'EXIT1', position: { x: 21, y: 23 } },
    { id: 'GATE4', position: { x: 24, y: 14 } }, { id: 'COAST1', position: { x: -16, y: -10 } },
    { id: 'COAST2', position: { x: -15, y: 9 } }, { id: 'FINAL1', position: { x: -12, y: -5 } },
    { id: 'FINAL2', position: { x: -12, y: 5 } },
  ],
  procedures: [
    { id: 'GATE1-COAST', kind: 'arrival', runwayId: '09L', fixIds: ['GATE1', 'FINAL1'] },
    { id: 'GATE2-COAST', kind: 'arrival', runwayId: '09R', fixIds: ['GATE2', 'FINAL2'] },
    { id: 'GATE3-COAST', kind: 'arrival', runwayId: '09L', fixIds: ['GATE3', 'FINAL1'] },
    { id: 'GATE4-COAST', kind: 'arrival', runwayId: '09R', fixIds: ['GATE4', 'COAST2', 'FINAL2'] },
    { id: 'GATE1-COAST-ARC', kind: 'arrival', runwayId: '09L', fixIds: ['GATE1', 'COAST1', 'FINAL1'] },
    { id: 'EXIT1-COAST', kind: 'departure', fixIds: ['EXIT1'] },
  ],
  trafficEntries: [
    { id: 'GATE1', position: { x: -23, y: -18 }, procedureId: 'GATE1-COAST', compatibleRunwayIds: ['09L'] },
    { id: 'GATE2', position: { x: 22, y: -20 }, procedureId: 'GATE2-COAST', compatibleRunwayIds: ['09R'] },
    { id: 'GATE3', position: { x: -25, y: 15 }, procedureId: 'GATE3-COAST', compatibleRunwayIds: ['09L'] },
    { id: 'GATE4', position: { x: 24, y: 14 }, procedureId: 'GATE4-COAST', compatibleRunwayIds: ['09R'] },
  ],
  trafficExits: [{ id: 'EXIT1', procedureId: 'EXIT1-COAST' }],
  flowConfigurations: [
    { id: 'east-crosswind', label: 'DOĞU · ÇAPRAZ RÜZGÂR', arrivalRunwayIds: ['09L', '09R'], departureRunwayIds: ['18'], windDirection: 145, windSpeedKt: 16, visibilityNm: 8, qnh: 1012 },
    { id: 'east-single', label: 'DOĞU · TEK PİST', arrivalRunwayIds: ['09L'], departureRunwayIds: ['18'], windDirection: 95, windSpeedKt: 9, visibilityNm: 10, qnh: 1018 },
    { id: 'east-weather', label: 'DOĞU · HAVA KAÇIŞI', arrivalRunwayIds: ['09R'], departureRunwayIds: ['18'], windDirection: 128, windSpeedKt: 23, visibilityNm: 5, qnh: 1006 },
  ],
};

const metroWorld: RadarWorld = {
  airport: 'METRO GATEWAY', sectorName: 'APPROACH · METRO SECTOR', rangeNm: 34,
  runways: [
    { id: '22', reciprocal: '04', center: { x: -0.9, y: 0.4 }, heading: 220, lengthNm: 1.86, active: true, operation: 'arrival' },
    { id: '27', reciprocal: '09', center: { x: 1.8, y: -1.8 }, heading: 270, lengthNm: 1.54, active: true, operation: 'departure' },
  ],
  fixes: [
    { id: 'NORTH', position: { x: -8, y: -25 } }, { id: 'EAST', position: { x: 24, y: 8 } },
    { id: 'SOUTH', position: { x: 9, y: 24 } }, { id: 'WEST', position: { x: -24, y: 6 } },
    { id: 'CITY', position: { x: 15, y: 16 } }, { id: 'RIVER', position: { x: -16, y: -9 } },
    { id: 'FINAL22', position: { x: 11, y: -10 } }, { id: 'EXIT27', position: { x: -22, y: -2 } },
  ],
  procedures: [
    { id: 'NORTH-METRO', kind: 'arrival', runwayId: '22', fixIds: ['NORTH', 'FINAL22'] },
    { id: 'EAST-METRO', kind: 'arrival', runwayId: '22', fixIds: ['EAST', 'FINAL22'] },
    { id: 'SOUTH-METRO', kind: 'arrival', runwayId: '22', fixIds: ['SOUTH', 'FINAL22'] },
    { id: 'WEST-METRO', kind: 'arrival', runwayId: '22', fixIds: ['WEST', 'RIVER', 'FINAL22'] },
    { id: 'EAST-CITY-METRO', kind: 'arrival', runwayId: '22', fixIds: ['EAST', 'CITY', 'FINAL22'] },
    { id: 'EXIT27-METRO', kind: 'departure', fixIds: ['EXIT27'] },
  ],
  trafficEntries: [
    { id: 'NORTH', position: { x: -8, y: -25 }, procedureId: 'NORTH-METRO', compatibleRunwayIds: ['22'] },
    { id: 'EAST', position: { x: 24, y: 8 }, procedureId: 'EAST-METRO', compatibleRunwayIds: ['22'] },
    { id: 'SOUTH', position: { x: 9, y: 24 }, procedureId: 'SOUTH-METRO', compatibleRunwayIds: ['22'] },
    { id: 'WEST', position: { x: -24, y: 6 }, procedureId: 'WEST-METRO', compatibleRunwayIds: ['22'] },
  ],
  trafficExits: [{ id: 'EXIT27', procedureId: 'EXIT27-METRO' }],
  flowConfigurations: [
    { id: 'metro-standard', label: 'METRO · STANDART', arrivalRunwayIds: ['22'], departureRunwayIds: ['27'], windDirection: 225, windSpeedKt: 8, visibilityNm: 10, qnh: 1017 },
    { id: 'metro-lowvis', label: 'METRO · DÜŞÜK GÖRÜŞ', arrivalRunwayIds: ['22'], departureRunwayIds: ['27'], windDirection: 215, windSpeedKt: 16, visibilityNm: 4, qnh: 1005 },
    { id: 'metro-night', label: 'METRO · GECE AKIŞI', arrivalRunwayIds: ['22'], departureRunwayIds: ['27'], windDirection: 235, windSpeedKt: 13, visibilityNm: 6, qnh: 1010 },
  ],
};

const highlandWorld: RadarWorld = {
  airport: 'HIGHLAND INTERNATIONAL', sectorName: 'APPROACH · HIGHLAND SECTOR', rangeNm: 38,
  runways: [
    { id: '14', reciprocal: '32', center: { x: -1.4, y: 0.8 }, heading: 140, lengthNm: 1.78, active: true, operation: 'arrival' },
    { id: '15', reciprocal: '33', center: { x: 2.1, y: -1.7 }, heading: 150, lengthNm: 1.71, active: true, operation: 'departure' },
  ],
  fixes: [
    { id: 'RIDGE', position: { x: -23, y: -15 } }, { id: 'VALLEY', position: { x: 24, y: -12 } },
    { id: 'PASS', position: { x: -17, y: 18 } }, { id: 'FINAL14', position: { x: -10, y: 10 } },
    { id: 'SADDLE', position: { x: 16, y: 17 } }, { id: 'GLEN', position: { x: -15, y: 4 } },
    { id: 'EXIT15', position: { x: 23, y: 17 } },
  ],
  procedures: [
    { id: 'RIDGE-HIGH', kind: 'arrival', runwayId: '14', fixIds: ['RIDGE', 'FINAL14'] },
    { id: 'VALLEY-HIGH', kind: 'arrival', runwayId: '14', fixIds: ['VALLEY', 'FINAL14'] },
    { id: 'PASS-HIGH', kind: 'arrival', runwayId: '14', fixIds: ['PASS', 'FINAL14'] },
    { id: 'SADDLE-HIGH', kind: 'arrival', runwayId: '14', fixIds: ['SADDLE', 'GLEN', 'FINAL14'] },
    { id: 'EXIT15-HIGH', kind: 'departure', fixIds: ['EXIT15'] },
  ],
  trafficEntries: [
    { id: 'RIDGE', position: { x: -23, y: -15 }, procedureId: 'RIDGE-HIGH', compatibleRunwayIds: ['14'] },
    { id: 'VALLEY', position: { x: 24, y: -12 }, procedureId: 'VALLEY-HIGH', compatibleRunwayIds: ['14'] },
    { id: 'PASS', position: { x: -17, y: 18 }, procedureId: 'PASS-HIGH', compatibleRunwayIds: ['14'] },
    { id: 'SADDLE', position: { x: 16, y: 17 }, procedureId: 'SADDLE-HIGH', compatibleRunwayIds: ['14'] },
  ],
  trafficExits: [{ id: 'EXIT15', procedureId: 'EXIT15-HIGH' }],
  flowConfigurations: [
    { id: 'highland-calm', label: 'HIGHLAND · SAKİN HAVA', arrivalRunwayIds: ['14'], departureRunwayIds: ['15'], windDirection: 135, windSpeedKt: 7, visibilityNm: 12, qnh: 1019 },
    { id: 'highland-front', label: 'HIGHLAND · HAVA CEPHESİ', arrivalRunwayIds: ['14'], departureRunwayIds: ['15'], windDirection: 185, windSpeedKt: 24, visibilityNm: 5, qnh: 997 },
    { id: 'highland-ridge', label: 'HIGHLAND · DAĞ DALGASI', arrivalRunwayIds: ['14'], departureRunwayIds: ['15'], windDirection: 205, windSpeedKt: 29, visibilityNm: 4, qnh: 992 },
  ],
};

// The additional sectors deliberately use different arrival geometry instead of
// reskinning one map: a constrained strait, low-visibility northern parallels,
// a wide desert terminal area, and a river hub with diverging SIDs.
const straitWorld: RadarWorld = {
  airport: 'STRAIT INTERNATIONAL', sectorName: 'APPROACH · STRAIT SECTOR', rangeNm: 35,
  runways: [
    { id: '05', reciprocal: '23', center: { x: -1.3, y: 0.8 }, heading: 50, lengthNm: 1.72, active: true, operation: 'arrival' },
    { id: '06', reciprocal: '24', center: { x: 2.1, y: -1.3 }, heading: 60, lengthNm: 1.66, active: true, operation: 'departure' },
  ],
  fixes: [
    { id: 'BOSPH', position: { x: -23, y: -16 } }, { id: 'MARM', position: { x: 24, y: -13 } },
    { id: 'NARROW', position: { x: -18, y: 12 } }, { id: 'CAPE', position: { x: 19, y: 17 } },
    { id: 'BRIDGE', position: { x: -10, y: -4 } }, { id: 'SOUND', position: { x: 11, y: 7 } },
    { id: 'FINAL05', position: { x: -9, y: -8 } }, { id: 'EXIT06N', position: { x: 21, y: 20 } }, { id: 'EXIT06S', position: { x: 24, y: -4 } },
  ],
  procedures: [
    { id: 'BOSPH-05', kind: 'arrival', runwayId: '05', fixIds: ['BOSPH', 'BRIDGE', 'FINAL05'] },
    { id: 'MARM-05', kind: 'arrival', runwayId: '05', fixIds: ['MARM', 'SOUND', 'FINAL05'] },
    { id: 'NARROW-05', kind: 'arrival', runwayId: '05', fixIds: ['NARROW', 'BRIDGE', 'FINAL05'] },
    { id: 'CAPE-05', kind: 'arrival', runwayId: '05', fixIds: ['CAPE', 'SOUND', 'FINAL05'] },
    { id: 'BRIDGE-HOLD-05', kind: 'arrival', runwayId: '05', fixIds: ['BRIDGE', 'FINAL05'] },
    { id: 'EXIT06-NORTH', kind: 'departure', fixIds: ['EXIT06N'] }, { id: 'EXIT06-SOUTH', kind: 'departure', fixIds: ['EXIT06S'] },
  ],
  trafficEntries: [
    { id: 'BOSPH', position: { x: -23, y: -16 }, procedureId: 'BOSPH-05', compatibleRunwayIds: ['05'] },
    { id: 'MARM', position: { x: 24, y: -13 }, procedureId: 'MARM-05', compatibleRunwayIds: ['05'] },
    { id: 'NARROW', position: { x: -18, y: 12 }, procedureId: 'NARROW-05', compatibleRunwayIds: ['05'] },
    { id: 'CAPE', position: { x: 19, y: 17 }, procedureId: 'CAPE-05', compatibleRunwayIds: ['05'] },
  ],
  trafficExits: [{ id: 'EXIT06N', procedureId: 'EXIT06-NORTH' }, { id: 'EXIT06S', procedureId: 'EXIT06-SOUTH' }],
  flowConfigurations: [
    { id: 'strait-east', label: 'STRAIT · DOĞU AKIŞI', arrivalRunwayIds: ['05'], departureRunwayIds: ['06'], windDirection: 55, windSpeedKt: 11, visibilityNm: 10, qnh: 1015 },
    { id: 'strait-channel', label: 'STRAIT · KANAL RÜZGÂRI', arrivalRunwayIds: ['05'], departureRunwayIds: ['06'], windDirection: 96, windSpeedKt: 22, visibilityNm: 7, qnh: 1007 },
    { id: 'strait-night', label: 'STRAIT · GECE DALGASI', arrivalRunwayIds: ['05'], departureRunwayIds: ['06'], windDirection: 40, windSpeedKt: 7, visibilityNm: 6, qnh: 1018 },
  ],
};

const nordicWorld: RadarWorld = {
  airport: 'NORDIC HUB', sectorName: 'APPROACH · NORDIC SECTOR', rangeNm: 40,
  runways: [
    { id: '01L', reciprocal: '19R', center: { x: -2.3, y: 0.8 }, heading: 10, lengthNm: 2.08, active: true, operation: 'arrival' },
    { id: '01R', reciprocal: '19L', center: { x: 0.8, y: 0.5 }, heading: 10, lengthNm: 2.08, active: true, operation: 'arrival' },
    { id: '02', reciprocal: '20', center: { x: 3.9, y: 0.2 }, heading: 20, lengthNm: 1.76, active: true, operation: 'departure' },
  ],
  fixes: [
    { id: 'FJORD', position: { x: -25, y: -17 } }, { id: 'AURORA', position: { x: 23, y: -18 } },
    { id: 'BIRCH', position: { x: -28, y: 15 } }, { id: 'ICE', position: { x: 26, y: 14 } },
    { id: 'NORD1', position: { x: -9, y: -12 } }, { id: 'NORD2', position: { x: 8, y: -12 } },
    { id: 'HOLDN', position: { x: -16, y: 4 } }, { id: 'EXIT02W', position: { x: -22, y: 18 } }, { id: 'EXIT02E', position: { x: 23, y: 19 } },
  ],
  procedures: [
    { id: 'FJORD-01L', kind: 'arrival', runwayId: '01L', fixIds: ['FJORD', 'NORD1'] },
    { id: 'BIRCH-01L', kind: 'arrival', runwayId: '01L', fixIds: ['BIRCH', 'HOLDN', 'NORD1'] },
    { id: 'AURORA-01R', kind: 'arrival', runwayId: '01R', fixIds: ['AURORA', 'NORD2'] },
    { id: 'ICE-01R', kind: 'arrival', runwayId: '01R', fixIds: ['ICE', 'NORD2'] },
    { id: 'HOLDN-01L', kind: 'arrival', runwayId: '01L', fixIds: ['HOLDN', 'NORD1'] },
    { id: 'EXIT02-WEST', kind: 'departure', fixIds: ['EXIT02W'] }, { id: 'EXIT02-EAST', kind: 'departure', fixIds: ['EXIT02E'] },
  ],
  trafficEntries: [
    { id: 'FJORD', position: { x: -25, y: -17 }, procedureId: 'FJORD-01L', compatibleRunwayIds: ['01L'] },
    { id: 'BIRCH', position: { x: -28, y: 15 }, procedureId: 'BIRCH-01L', compatibleRunwayIds: ['01L'] },
    { id: 'AURORA', position: { x: 23, y: -18 }, procedureId: 'AURORA-01R', compatibleRunwayIds: ['01R'] },
    { id: 'ICE', position: { x: 26, y: 14 }, procedureId: 'ICE-01R', compatibleRunwayIds: ['01R'] },
  ],
  trafficExits: [{ id: 'EXIT02W', procedureId: 'EXIT02-WEST' }, { id: 'EXIT02E', procedureId: 'EXIT02-EAST' }],
  flowConfigurations: [
    { id: 'nordic-parallel', label: 'NORDIC · PARALEL', arrivalRunwayIds: ['01L', '01R'], departureRunwayIds: ['02'], windDirection: 15, windSpeedKt: 9, visibilityNm: 11, qnh: 1021 },
    { id: 'nordic-snow', label: 'NORDIC · KAR YAĞIŞI', arrivalRunwayIds: ['01R'], departureRunwayIds: ['02'], windDirection: 28, windSpeedKt: 17, visibilityNm: 3, qnh: 1001 },
    { id: 'nordic-crosswind', label: 'NORDIC · YAN RÜZGÂR', arrivalRunwayIds: ['01L'], departureRunwayIds: ['02'], windDirection: 72, windSpeedKt: 25, visibilityNm: 6, qnh: 1008 },
  ],
};

const desertWorld: RadarWorld = {
  airport: 'DESERT CROSSING', sectorName: 'APPROACH · DESERT SECTOR', rangeNm: 48,
  runways: [
    { id: '30', reciprocal: '12', center: { x: -1.1, y: 0.5 }, heading: 300, lengthNm: 2.2, active: true, operation: 'arrival' },
    { id: '31', reciprocal: '13', center: { x: 2.3, y: -1.2 }, heading: 310, lengthNm: 2.05, active: true, operation: 'departure' },
  ],
  fixes: [
    { id: 'DUNE', position: { x: -33, y: -21 } }, { id: 'OASIS', position: { x: 31, y: -19 } },
    { id: 'MESA', position: { x: -34, y: 19 } }, { id: 'SOLAR', position: { x: 33, y: 18 } },
    { id: 'ARCW', position: { x: -18, y: -2 } }, { id: 'ARCE', position: { x: 17, y: 4 } },
    { id: 'FINAL30', position: { x: 8, y: 12 } }, { id: 'EXIT31N', position: { x: -24, y: 24 } }, { id: 'EXIT31S', position: { x: 25, y: -25 } },
  ],
  procedures: [
    { id: 'DUNE-30', kind: 'arrival', runwayId: '30', fixIds: ['DUNE', 'ARCW', 'FINAL30'] },
    { id: 'MESA-30', kind: 'arrival', runwayId: '30', fixIds: ['MESA', 'ARCW', 'FINAL30'] },
    { id: 'OASIS-30', kind: 'arrival', runwayId: '30', fixIds: ['OASIS', 'ARCE', 'FINAL30'] },
    { id: 'SOLAR-30', kind: 'arrival', runwayId: '30', fixIds: ['SOLAR', 'ARCE', 'FINAL30'] },
    { id: 'OASIS-ARC-30', kind: 'arrival', runwayId: '30', fixIds: ['OASIS', 'SOLAR', 'ARCE', 'FINAL30'] },
    { id: 'EXIT31-NORTH', kind: 'departure', fixIds: ['EXIT31N'] }, { id: 'EXIT31-SOUTH', kind: 'departure', fixIds: ['EXIT31S'] },
  ],
  trafficEntries: [
    { id: 'DUNE', position: { x: -33, y: -21 }, procedureId: 'DUNE-30', compatibleRunwayIds: ['30'] },
    { id: 'MESA', position: { x: -34, y: 19 }, procedureId: 'MESA-30', compatibleRunwayIds: ['30'] },
    { id: 'OASIS', position: { x: 31, y: -19 }, procedureId: 'OASIS-30', compatibleRunwayIds: ['30'] },
    { id: 'SOLAR', position: { x: 33, y: 18 }, procedureId: 'SOLAR-30', compatibleRunwayIds: ['30'] },
  ],
  trafficExits: [{ id: 'EXIT31N', procedureId: 'EXIT31-NORTH' }, { id: 'EXIT31S', procedureId: 'EXIT31-SOUTH' }],
  flowConfigurations: [
    { id: 'desert-night', label: 'DESERT · GECE AKIŞI', arrivalRunwayIds: ['30'], departureRunwayIds: ['31'], windDirection: 305, windSpeedKt: 8, visibilityNm: 12, qnh: 1013 },
    { id: 'desert-heat', label: 'DESERT · ISI TÜRBÜLANSI', arrivalRunwayIds: ['30'], departureRunwayIds: ['31'], windDirection: 278, windSpeedKt: 17, visibilityNm: 7, qnh: 1004 },
    { id: 'desert-dust', label: 'DESERT · TOZ CEPHESİ', arrivalRunwayIds: ['30'], departureRunwayIds: ['31'], windDirection: 335, windSpeedKt: 29, visibilityNm: 3, qnh: 997 },
  ],
};

const riverWorld: RadarWorld = {
  airport: 'RIVER CITY HUB', sectorName: 'APPROACH · RIVER CITY SECTOR', rangeNm: 43,
  runways: [
    { id: '27L', reciprocal: '09R', center: { x: -2.6, y: 0.8 }, heading: 270, lengthNm: 2.12, active: true, operation: 'arrival' },
    { id: '27R', reciprocal: '09L', center: { x: 0.5, y: 0.6 }, heading: 270, lengthNm: 2.12, active: true, operation: 'arrival' },
    { id: '26', reciprocal: '08', center: { x: 3.7, y: -1.1 }, heading: 260, lengthNm: 1.86, active: true, operation: 'departure' },
  ],
  fixes: [
    { id: 'DELTA', position: { x: -27, y: -18 } }, { id: 'ECHO', position: { x: 28, y: -17 } },
    { id: 'NORTHBEND', position: { x: -30, y: 16 } }, { id: 'SOUTHBEND', position: { x: 30, y: 15 } },
    { id: 'RIVL', position: { x: 10, y: -8 } }, { id: 'RIVR', position: { x: 10, y: 8 } },
    { id: 'EXIT26N', position: { x: -24, y: 21 } }, { id: 'EXIT26S', position: { x: -24, y: -20 } }, { id: 'EXIT26E', position: { x: 26, y: 0 } },
  ],
  procedures: [
    { id: 'DELTA-27L', kind: 'arrival', runwayId: '27L', fixIds: ['DELTA', 'RIVL'] },
    { id: 'NORTHBEND-27L', kind: 'arrival', runwayId: '27L', fixIds: ['NORTHBEND', 'RIVL'] },
    { id: 'ECHO-27R', kind: 'arrival', runwayId: '27R', fixIds: ['ECHO', 'RIVR'] },
    { id: 'SOUTHBEND-27R', kind: 'arrival', runwayId: '27R', fixIds: ['SOUTHBEND', 'RIVR'] },
    { id: 'DELTA-RIVER-27L', kind: 'arrival', runwayId: '27L', fixIds: ['DELTA', 'NORTHBEND', 'RIVL'] },
    { id: 'EXIT26-NORTH', kind: 'departure', fixIds: ['EXIT26N'] }, { id: 'EXIT26-SOUTH', kind: 'departure', fixIds: ['EXIT26S'] }, { id: 'EXIT26-EAST', kind: 'departure', fixIds: ['EXIT26E'] },
  ],
  trafficEntries: [
    { id: 'DELTA', position: { x: -27, y: -18 }, procedureId: 'DELTA-27L', compatibleRunwayIds: ['27L'] },
    { id: 'NORTHBEND', position: { x: -30, y: 16 }, procedureId: 'NORTHBEND-27L', compatibleRunwayIds: ['27L'] },
    { id: 'ECHO', position: { x: 28, y: -17 }, procedureId: 'ECHO-27R', compatibleRunwayIds: ['27R'] },
    { id: 'SOUTHBEND', position: { x: 30, y: 15 }, procedureId: 'SOUTHBEND-27R', compatibleRunwayIds: ['27R'] },
  ],
  trafficExits: [{ id: 'EXIT26N', procedureId: 'EXIT26-NORTH' }, { id: 'EXIT26S', procedureId: 'EXIT26-SOUTH' }, { id: 'EXIT26E', procedureId: 'EXIT26-EAST' }],
  flowConfigurations: [
    { id: 'river-parallel', label: 'RIVER · PARALEL AKIŞ', arrivalRunwayIds: ['27L', '27R'], departureRunwayIds: ['26'], windDirection: 267, windSpeedKt: 10, visibilityNm: 10, qnh: 1016 },
    { id: 'river-rain', label: 'RIVER · YAĞMUR BANDI', arrivalRunwayIds: ['27R'], departureRunwayIds: ['26'], windDirection: 248, windSpeedKt: 19, visibilityNm: 5, qnh: 1003 },
    { id: 'river-peak', label: 'RIVER · PİK DALGA', arrivalRunwayIds: ['27L', '27R'], departureRunwayIds: ['26'], windDirection: 276, windSpeedKt: 14, visibilityNm: 8, qnh: 1011 },
  ],
};

const alphaAircraft: Aircraft[] = [
  createAircraft({ callsign: 'AR101', type: 'A321', phase: 'arrival', position: { x: -1.65, y: 6 }, heading: 354, altitude: 1200, speed: 170, targetHeading: 354, targetAltitude: 1200, targetSpeed: 170, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '34L' }),
  createAircraft({ callsign: 'NX204', type: 'B738', phase: 'arrival', position: { x: 20, y: -17 }, heading: 316, altitude: 8000, speed: 260, targetHeading: 316, targetAltitude: 8000, targetSpeed: 260, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '34L' }),
  createAircraft({ callsign: 'VX810', type: 'B77W', phase: 'departure', position: { x: 5.7, y: 3.5 }, heading: 354, altitude: 3200, speed: 210, targetHeading: 354, targetAltitude: 12000, targetSpeed: 280, turnDirection: 'shortest', performance: HEAVY_PERFORMANCE, navigation: { mode: 'route', fixIds: ['EXIT1'], currentLegIndex: 0, procedure: 'EXIT1-DEPARTURE' } }),
];

const coastalAircraft: Aircraft[] = [
  createAircraft({ callsign: 'CF101', type: 'A320', phase: 'arrival', position: { x: -8, y: 0.6 }, heading: 90, altitude: 1500, speed: 170, targetHeading: 90, targetAltitude: 1500, targetSpeed: 170, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '09L' }),
  createAircraft({ callsign: 'OR330', type: 'E190', phase: 'arrival', position: { x: 18, y: -20 }, heading: 316, altitude: 7000, speed: 250, targetHeading: 316, targetAltitude: 7000, targetSpeed: 250, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '09L' }),
  createAircraft({ callsign: 'SK721', type: 'A330', phase: 'departure', position: { x: 3.8, y: 1.8 }, heading: 180, altitude: 3000, speed: 205, targetHeading: 180, targetAltitude: 11000, targetSpeed: 275, turnDirection: 'shortest', performance: HEAVY_PERFORMANCE, navigation: { mode: 'route', fixIds: ['EXIT1'], currentLegIndex: 0, procedure: 'EXIT1-COAST' } }),
];

const metroAircraft: Aircraft[] = [
  createAircraft({ callsign: 'MG104', type: 'A320', phase: 'arrival', position: { x: 12, y: -16 }, heading: 310, altitude: 7000, speed: 230, targetHeading: 310, targetAltitude: 7000, targetSpeed: 230, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '22' }),
  createAircraft({ callsign: 'MG602', type: 'B738', phase: 'arrival', position: { x: -9, y: -25 }, heading: 18, altitude: 9000, speed: 250, targetHeading: 18, targetAltitude: 9000, targetSpeed: 250, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '22' }),
  createAircraft({ callsign: 'MG711', type: 'A330', phase: 'departure', position: { x: 2, y: -1.8 }, heading: 270, altitude: 3000, speed: 205, targetHeading: 270, targetAltitude: 11000, targetSpeed: 275, turnDirection: 'shortest', performance: HEAVY_PERFORMANCE, navigation: { mode: 'route', fixIds: ['EXIT27'], currentLegIndex: 0, procedure: 'EXIT27-METRO' } }),
];

const highlandAircraft: Aircraft[] = [
  createAircraft({ callsign: 'HL208', type: 'A21N', phase: 'arrival', position: { x: -11, y: 12 }, heading: 140, altitude: 3100, speed: 185, targetHeading: 140, targetAltitude: 3100, targetSpeed: 185, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '14' }),
  createAircraft({ callsign: 'HL431', type: 'B738', phase: 'arrival', position: { x: 24, y: -12 }, heading: 285, altitude: 9500, speed: 255, targetHeading: 285, targetAltitude: 9500, targetSpeed: 255, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '14' }),
  createAircraft({ callsign: 'HL777', type: 'B77W', phase: 'departure', position: { x: 2.5, y: -2 }, heading: 150, altitude: 3200, speed: 205, targetHeading: 150, targetAltitude: 12000, targetSpeed: 280, turnDirection: 'shortest', performance: HEAVY_PERFORMANCE, navigation: { mode: 'route', fixIds: ['EXIT15'], currentLegIndex: 0, procedure: 'EXIT15-HIGH' } }),
];

const straitAircraft: Aircraft[] = [
  createAircraft({ callsign: 'ST205', type: 'A21N', phase: 'arrival', position: { x: -7, y: -6 }, heading: 50, altitude: 2400, speed: 180, targetHeading: 50, targetAltitude: 2400, targetSpeed: 180, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '05' }),
  createAircraft({ callsign: 'ST418', type: 'B738', phase: 'arrival', position: { x: 24, y: -13 }, heading: 292, altitude: 9000, speed: 255, targetHeading: 292, targetAltitude: 9000, targetSpeed: 255, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '05' }),
  createAircraft({ callsign: 'ST901', type: 'A330', phase: 'departure', position: { x: 2.5, y: -1.6 }, heading: 60, altitude: 3000, speed: 205, targetHeading: 60, targetAltitude: 12000, targetSpeed: 280, turnDirection: 'shortest', performance: HEAVY_PERFORMANCE, navigation: { mode: 'route', fixIds: ['EXIT06N'], currentLegIndex: 0, procedure: 'EXIT06-NORTH' } }),
];

const nordicAircraft: Aircraft[] = [
  createAircraft({ callsign: 'ND112', type: 'A320', phase: 'arrival', position: { x: -8, y: -10 }, heading: 10, altitude: 2200, speed: 175, targetHeading: 10, targetAltitude: 2200, targetSpeed: 175, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '01L' }),
  createAircraft({ callsign: 'ND521', type: 'B39M', phase: 'arrival', position: { x: 23, y: -18 }, heading: 314, altitude: 9200, speed: 258, targetHeading: 314, targetAltitude: 9200, targetSpeed: 258, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '01R' }),
  createAircraft({ callsign: 'ND804', type: 'B77W', phase: 'departure', position: { x: 4.2, y: 0 }, heading: 20, altitude: 3100, speed: 205, targetHeading: 20, targetAltitude: 13000, targetSpeed: 285, turnDirection: 'shortest', performance: HEAVY_PERFORMANCE, navigation: { mode: 'route', fixIds: ['EXIT02E'], currentLegIndex: 0, procedure: 'EXIT02-EAST' } }),
];

const desertAircraft: Aircraft[] = [
  createAircraft({ callsign: 'DS305', type: 'A320', phase: 'arrival', position: { x: 6, y: 13 }, heading: 300, altitude: 2300, speed: 180, targetHeading: 300, targetAltitude: 2300, targetSpeed: 180, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '30' }),
  createAircraft({ callsign: 'DS640', type: 'A388', phase: 'arrival', position: { x: -33, y: -21 }, heading: 47, altitude: 11000, speed: 255, targetHeading: 47, targetAltitude: 11000, targetSpeed: 255, turnDirection: 'shortest', performance: HEAVY_PERFORMANCE, assignedRunway: '30' }),
  createAircraft({ callsign: 'DS711', type: 'B77W', phase: 'departure', position: { x: 2.7, y: -1.5 }, heading: 310, altitude: 3300, speed: 210, targetHeading: 310, targetAltitude: 14000, targetSpeed: 290, turnDirection: 'shortest', performance: HEAVY_PERFORMANCE, navigation: { mode: 'route', fixIds: ['EXIT31N'], currentLegIndex: 0, procedure: 'EXIT31-NORTH' } }),
];

const riverAircraft: Aircraft[] = [
  createAircraft({ callsign: 'RV121', type: 'A220', phase: 'arrival', position: { x: 9, y: -8 }, heading: 270, altitude: 2200, speed: 175, targetHeading: 270, targetAltitude: 2200, targetSpeed: 175, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '27L' }),
  createAircraft({ callsign: 'RV534', type: 'B738', phase: 'arrival', position: { x: 28, y: -17 }, heading: 304, altitude: 9400, speed: 260, targetHeading: 304, targetAltitude: 9400, targetSpeed: 260, turnDirection: 'shortest', performance: JET_PERFORMANCE, assignedRunway: '27R' }),
  createAircraft({ callsign: 'RV880', type: 'A330', phase: 'departure', position: { x: 4.1, y: -1.2 }, heading: 260, altitude: 3200, speed: 205, targetHeading: 260, targetAltitude: 13000, targetSpeed: 285, turnDirection: 'shortest', performance: HEAVY_PERFORMANCE, navigation: { mode: 'route', fixIds: ['EXIT26E'], currentLegIndex: 0, procedure: 'EXIT26-EAST' } }),
];

export const scenarioCatalog: GameScenario[] = [
  {
    id: 'alpha', label: 'IST · PARALEL AKIŞ',
    briefing: 'Çift yaklaşma pistinde gelişleri dağıt; kalkışları güvenli şekilde sektörden çıkar.',
    focus: 'Paralel final, wake aralığı ve kalkış handoff’u', world: alphaWorld, initialAircraft: alphaAircraft,
  },
  {
    id: 'coastal', label: 'COASTAL · ÇAPRAZ RÜZGÂR',
    briefing: 'Çapraz rüzgâr altında iki finali yönet. Hız kontrolü, son yaklaşma aralığını belirler.',
    focus: 'Hız yönetimi ve rüzgâr telafisi', world: coastalWorld, initialAircraft: coastalAircraft,
  },
  {
    id: 'metro', label: 'METRO · TEK PİST',
    briefing: 'Tek iniş pisti, sınırlı kapasite. Sıralamayı erken kur; gerekirse HOLD ve go-around kullan.',
    focus: 'Sıralama, holding ve pist kapasitesi', world: metroWorld, initialAircraft: metroAircraft,
  },
  {
    id: 'highland', label: 'HIGHLAND · HAVA CEPHESİ',
    briefing: 'Tek piste gelen akışı, yaklaşan hava cephesi ve düşen görüş altında koru.',
    focus: 'Düşük görüş, rüzgâr ve erken yaklaşma kararı', world: highlandWorld, initialAircraft: highlandAircraft,
  },
  {
    id: 'strait', label: 'STRAIT · DAR KORİDOR',
    briefing: 'Dar su koridorunda dört giriş noktasını tek finale sırala; kalkışları iki farklı SID ile ayır.',
    focus: 'Dar yaklaşma alanı, holding ve ayrışan SID’ler', world: straitWorld, initialAircraft: straitAircraft,
  },
  {
    id: 'nordic', label: 'NORDIC · KAR AKIŞI',
    briefing: 'Yakın paralel finallerde akışı dengede tut. Kar akışında tek piste düşen kapasiteyi erken yönet.',
    focus: 'Paralel yaklaşma, düşük görüş ve pist değişimi', world: nordicWorld, initialAircraft: nordicAircraft,
  },
  {
    id: 'desert', label: 'DESERT · GENİŞ TMA',
    briefing: 'Uzak giriş noktalarından gelen ağır ve dar gövdeli trafiği geniş terminal sahasında planla.',
    focus: 'Uzun menzilli planlama, ağır uçak wake aralığı', world: desertWorld, initialAircraft: desertAircraft,
  },
  {
    id: 'river', label: 'RIVER · PİK DALGA',
    briefing: 'İki paralel finale geliş dağıt; üç SID çıkışını birbirinden ayırarak kapasiteyi koru.',
    focus: 'Paralel sıralama, SID ayrımı ve pik trafik', world: riverWorld, initialAircraft: riverAircraft,
  },
];

export const defaultScenario = scenarioCatalog[0];
export const world = defaultScenario.world;

export function worldWithFlow(world: RadarWorld, flowId: string, skill?: number): RadarWorld {
  const flow = world.flowConfigurations.find((item) => item.id === flowId) ?? world.flowConfigurations[0];
  if (!flow) return world;
  const availableArrivalRunways = skill !== undefined && skill < 7.5
    ? flow.arrivalRunwayIds.slice(0, 1)
    : flow.arrivalRunwayIds;
  return {
    ...world,
    activeFlowId: flow.id,
    runways: world.runways.map((runway) => {
      const arrival = availableArrivalRunways.includes(runway.id);
      const departure = flow.departureRunwayIds.includes(runway.id);
      return {
        ...runway,
        active: arrival || departure,
        operation: arrival && departure ? 'mixed' : arrival ? 'arrival' : departure ? 'departure' : 'inactive',
      };
    }),
  };
}

export function createInitialState(scenario: GameScenario = defaultScenario, mode: GameMode = 'normal'): GameState {
  const config = difficultyConfig(mode);
  const initialAircraft = structuredClone(scenario.initialAircraft.slice(0, config.initialAircraft));
  const trainingAircraft = initialAircraft.find((item) => item.phase === 'arrival');
  const flowId = scenario.world.flowConfigurations[0]?.id ?? 'default';
  const initialProfile = modeTrafficProfile(mode, profileForSkill(config.initialSkill));
  const welcome = { id: 'welcome', type: 'info' as const, message: `Radar contact: ${trainingAircraft?.callsign ?? 'ilk geliş'}. Heading, irtifa ve hızla ${trainingAircraft?.assignedRunway ?? ''} finaline vektörle; sonra ILS'i silahlandır.` };
  return {
    mode, elapsedSeconds: 0, paused: false, timeScale: config.timeScale, aircraft: initialAircraft, conflicts: [],
    selectedCallsign: trainingAircraft?.callsign ?? null, skill: config.initialSkill, peakSkill: config.initialSkill, targetAircraft: initialProfile.targetAircraft,
    score: Math.round(config.initialSkill * 15), landed: 0, spawned: 0, trafficLevel: initialProfile.level, nextTrafficAt: initialProfile.spawnInterval,
    runwayAvailableAt: {}, eventLog: [welcome],
    activeLossPairs: [], handoffs: 0, flowId,
    trackHistory: Object.fromEntries(initialAircraft.map((item) => [item.callsign, [{ ...item.position }]])),
    lastTrackAt: 0, pendingInstructions: [],
    metrics: { separationLosses: 0, goArounds: 0, missedHandoffs: 0, expiredPriorities: 0, unmanagedArrivals: 0, wakeViolations: 0 },
    eventTimeline: [welcome], seed: 73421, commandHistory: [],
  };
}

export const initialState = createInitialState();

export function spawnTraffic(index: number, activeWorld: RadarWorld = world): Aircraft {
  return planTraffic(index, [], activeWorld).aircraft;
}
