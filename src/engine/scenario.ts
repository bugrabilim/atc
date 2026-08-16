import type { Aircraft, GameState, RadarWorld } from './types';

const jet = {
  turnRateDegPerSecond: 3,
  climbRateFpm: 2200,
  descentRateFpm: 1800,
  accelerationKtPerSecond: 2.2,
  minSpeed: 140,
  maxSpeed: 480,
};

const heavy = {
  turnRateDegPerSecond: 2.2,
  climbRateFpm: 1700,
  descentRateFpm: 1500,
  accelerationKtPerSecond: 1.4,
  minSpeed: 150,
  maxSpeed: 500,
};

export const world: RadarWorld = {
  airport: 'LTFM · İSTANBUL',
  sectorName: 'APP · PROTOTİP KUZEY OPERASYONU',
  rangeNm: 42,
  runways: [
    { id: '34R', reciprocal: '16L', center: { x: -3.8, y: 2 }, heading: 354, lengthNm: 2.03, active: false, operation: 'inactive' },
    { id: '34L', reciprocal: '16R', center: { x: -1.9, y: 1.7 }, heading: 354, lengthNm: 2.03, active: true, operation: 'arrival' },
    { id: '35R', reciprocal: '17L', center: { x: 1, y: 1.4 }, heading: 354, lengthNm: 2.21, active: true, operation: 'arrival' },
    { id: '35L', reciprocal: '17R', center: { x: 2.9, y: 1.1 }, heading: 354, lengthNm: 2.21, active: false, operation: 'inactive' },
    { id: '36', reciprocal: '18', center: { x: 5.7, y: 0.6 }, heading: 354, lengthNm: 1.65, active: true, operation: 'departure' },
  ],
  fixes: [
    { id: 'ERKAL', position: { x: -24, y: -19 } },
    { id: 'RILEX', position: { x: 24, y: -17 } },
    { id: 'TURKO', position: { x: -29, y: 13 } },
    { id: 'INKIM', position: { x: 27, y: 16 } },
    { id: 'FM001', position: { x: -8, y: -13 } },
    { id: 'FM002', position: { x: 8, y: -13 } },
  ],
};

const aircraft: Aircraft[] = [
  {
    callsign: 'TK1953', type: 'A321', phase: 'arrival', position: { x: -22, y: -20 },
    heading: 42, altitude: 10000, speed: 285, targetHeading: 42, targetAltitude: 10000, targetSpeed: 285,
    turnDirection: 'shortest', performance: jet,
  },
  {
    callsign: 'PGT7KM', type: 'B738', phase: 'arrival', position: { x: 20, y: -17 },
    heading: 316, altitude: 8000, speed: 260, targetHeading: 316, targetAltitude: 8000, targetSpeed: 260,
    turnDirection: 'shortest', performance: jet,
  },
  {
    callsign: 'THY6AL', type: 'B77W', phase: 'departure', position: { x: 5.7, y: 3.5 },
    heading: 354, altitude: 3200, speed: 210, targetHeading: 354, targetAltitude: 12000, targetSpeed: 280,
    turnDirection: 'shortest', performance: heavy,
  },
];

export const initialState: GameState = {
  elapsedSeconds: 0,
  paused: false,
  timeScale: 1,
  aircraft,
  conflicts: [],
  selectedCallsign: 'TK1953',
  score: 0,
};

