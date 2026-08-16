import type { GameMode, RadarWorld } from './types';

export interface DifficultyConfig {
  id: GameMode;
  label: string;
  description: string;
  initialSkill: number;
  initialAircraft: number;
  maxSkill: number;
  maxAircraft: number;
  minSpawnInterval: number;
  spawnMultiplier: number;
  timeScale: number;
  windMultiplier: number;
  allowPriorityTraffic: boolean;
  showAdvancedCommands: boolean;
}

export const DIFFICULTY_MODES: readonly DifficultyConfig[] = [
  { id: 'beginner', label: 'BAŞLANGIÇ', description: 'Tek geliş, sakin hava, bol zaman ve sürekli yönlendirme.', initialSkill: 2, initialAircraft: 1, maxSkill: 3, maxAircraft: 2, minSpawnInterval: 42, spawnMultiplier: 1.8, timeScale: 1, windMultiplier: 0, allowPriorityTraffic: false, showAdvancedCommands: false },
  { id: 'normal', label: 'NORMAL', description: 'Dengeli tempo; temel ATC akışı.', initialSkill: 3.5, initialAircraft: 3, maxSkill: 8, maxAircraft: 8, minSpawnInterval: 18, spawnMultiplier: 1.05, timeScale: 2, windMultiplier: 0.65, allowPriorityTraffic: true, showAdvancedCommands: false },
  { id: 'advanced', label: 'İLERİ', description: 'Tam trafik, rüzgâr, handoff ve öncelikli uçuşlar.', initialSkill: 8, initialAircraft: 3, maxSkill: 15, maxAircraft: 12, minSpawnInterval: 11, spawnMultiplier: 0.9, timeScale: 2, windMultiplier: 1, allowPriorityTraffic: true, showAdvancedCommands: true },
  { id: 'expert', label: 'UZMAN', description: 'Yoğun akış, sert hava ve yüksek müdahale baskısı.', initialSkill: 12, initialAircraft: 3, maxSkill: 30, maxAircraft: 20, minSpawnInterval: 6.5, spawnMultiplier: 0.72, timeScale: 2, windMultiplier: 1.2, allowPriorityTraffic: true, showAdvancedCommands: true },
] as const;

export function difficultyConfig(mode: GameMode) {
  return DIFFICULTY_MODES.find((item) => item.id === mode) ?? DIFFICULTY_MODES[0];
}

export function limitSkillForMode(mode: GameMode, skill: number) {
  return Math.min(difficultyConfig(mode).maxSkill, Math.max(2, skill));
}

export function modeTrafficProfile(mode: GameMode, profile: { level: number; targetAircraft: number; maxAircraft: number; spawnInterval: number }) {
  const config = difficultyConfig(mode);
  const targetAircraft = Math.min(config.maxAircraft, profile.targetAircraft);
  return { ...profile, targetAircraft, maxAircraft: targetAircraft, spawnInterval: Math.max(config.minSpawnInterval, profile.spawnInterval * config.spawnMultiplier) };
}

/** Difficulty changes operating conditions without mutating the airport pack. */
export function worldForMode(world: RadarWorld, mode: GameMode): RadarWorld {
  const config = difficultyConfig(mode);
  return {
    ...world,
    flowConfigurations: world.flowConfigurations.map((flow) => ({
      ...flow,
      windSpeedKt: Math.round(flow.windSpeedKt * config.windMultiplier),
      visibilityNm: mode === 'beginner' ? Math.max(14, flow.visibilityNm) : flow.visibilityNm,
    })),
  };
}
