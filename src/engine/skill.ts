export const INITIAL_SKILL = 3.5;
export const MIN_SKILL = 2;
export const MAX_SKILL = 30;

export interface SkillEvents {
  towerHandoffs?: number;
  departureHandoffs?: number;
  separationLosses?: number;
  goArounds?: number;
  missedHandoffs?: number;
  unmanagedArrivals?: number;
  expiredPriorities?: number;
  wakeViolations?: number;
}

export function skillDelta(events: SkillEvents) {
  return (events.towerHandoffs ?? 0) * 0.55
    + (events.departureHandoffs ?? 0) * 0.12
    - (events.separationLosses ?? 0) * 1.35
    - (events.goArounds ?? 0) * 0.45
    - (events.missedHandoffs ?? 0) * 0.5
    - (events.unmanagedArrivals ?? 0) * 0.65
    - (events.expiredPriorities ?? 0) * 0.55
    - (events.wakeViolations ?? 0) * 0.4;
}

export function updateSkill(current: number, events: SkillEvents) {
  return Math.max(MIN_SKILL, Math.min(MAX_SKILL, current + skillDelta(events)));
}

export function profileForSkill(skill: number, runwayAdjustment = 0) {
  const targetAircraft = Math.max(3, Math.min(24, Math.round(skill) + runwayAdjustment));
  const level = Math.max(1, Math.min(5, Math.ceil(skill / 5)));
  return {
    level,
    targetAircraft,
    maxAircraft: targetAircraft,
    spawnInterval: Math.max(6.5, 21 - skill * 0.72 - runwayAdjustment * 0.6),
  };
}

