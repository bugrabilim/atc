import type { Aircraft, AircraftPerformance, WakeCategory } from './types';

export const JET_PERFORMANCE: AircraftPerformance = {
  climbRateFpm: 2200,
  descentRateFpm: 1900,
  accelerationKtPerSecond: 2.1,
  minSpeed: 135,
  maxSpeed: 480,
  maxBankDeg: 27,
  rollRateDegPerSecond: 5.5,
  finalApproachSpeed: 142,
};

export const HEAVY_PERFORMANCE: AircraftPerformance = {
  climbRateFpm: 1700,
  descentRateFpm: 1600,
  accelerationKtPerSecond: 1.35,
  minSpeed: 145,
  maxSpeed: 500,
  maxBankDeg: 25,
  rollRateDegPerSecond: 4.2,
  finalApproachSpeed: 152,
};

export const LIGHT_PERFORMANCE: AircraftPerformance = {
  climbRateFpm: 1500,
  descentRateFpm: 1400,
  accelerationKtPerSecond: 2.5,
  minSpeed: 105,
  maxSpeed: 330,
  maxBankDeg: 28,
  rollRateDegPerSecond: 6.5,
  finalApproachSpeed: 118,
};

export function wakeCategoryForType(type: string): WakeCategory {
  if (['A388'].includes(type)) return 'A';
  if (['B748', 'B77W', 'B772', 'A35K'].includes(type)) return 'B';
  if (['A330', 'A332', 'A333', 'A359', 'B763', 'B788', 'B789'].includes(type)) return 'C';
  if (['B752', 'A321', 'A21N', 'B738', 'B39M', 'A320'].includes(type)) return 'D';
  if (['A220', 'E190', 'E195', 'CRJ9'].includes(type)) return 'E';
  return 'F';
}

type DynamicKeys = 'groundSpeed' | 'track' | 'bankAngle' | 'verticalSpeed' | 'speedMode' | 'expedite' | 'wakeCategory';
type AircraftSeed = Omit<Aircraft, DynamicKeys> & Partial<Pick<Aircraft, DynamicKeys>>;

/** Adds the dynamics fields required by the deterministic flight model. */
export function createAircraft(seed: AircraftSeed): Aircraft {
  return {
    ...seed,
    groundSpeed: seed.groundSpeed ?? seed.speed,
    track: seed.track ?? seed.heading,
    bankAngle: seed.bankAngle ?? 0,
    verticalSpeed: seed.verticalSpeed ?? 0,
    speedMode: seed.speedMode ?? 'normal',
    expedite: seed.expedite ?? false,
    wakeCategory: seed.wakeCategory ?? wakeCategoryForType(seed.type),
  };
}

