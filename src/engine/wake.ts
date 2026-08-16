import type { Aircraft, WakeCategory } from './types';

const WAKE_SEPARATION: Record<WakeCategory, Record<WakeCategory, number>> = {
  A: { A: 4, B: 5, C: 6, D: 7, E: 8, F: 8 },
  B: { A: 3, B: 4, C: 5, D: 6, E: 7, F: 7 },
  C: { A: 3, B: 3, C: 4, D: 5, E: 6, F: 6 },
  D: { A: 3, B: 3, C: 3, D: 3, E: 4, F: 5 },
  E: { A: 3, B: 3, C: 3, D: 3, E: 3, F: 4 },
  F: { A: 3, B: 3, C: 3, D: 3, E: 3, F: 3 },
};

export function requiredWakeSeparationNm(leader: Pick<Aircraft, 'wakeCategory'>, follower: Pick<Aircraft, 'wakeCategory'>) {
  return WAKE_SEPARATION[leader.wakeCategory][follower.wakeCategory];
}

export function departureWakeSeconds(leader: Pick<Aircraft, 'wakeCategory'>, follower: Pick<Aircraft, 'wakeCategory'>) {
  const distance = requiredWakeSeparationNm(leader, follower);
  return distance >= 7 ? 180 : distance >= 5 ? 120 : distance >= 4 ? 90 : 60;
}

