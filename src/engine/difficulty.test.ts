import { describe, expect, it } from 'vitest';
import { difficultyConfig, modeTrafficProfile, worldForMode } from './difficulty';
import { defaultScenario } from './scenario';

describe('difficulty presets', () => {
  it('makes beginner mode deliberately quiet and calm', () => {
    const profile = modeTrafficProfile('beginner', { level: 1, targetAircraft: 8, maxAircraft: 8, spawnInterval: 12 });
    expect(profile.targetAircraft).toBe(2);
    expect(profile.spawnInterval).toBeGreaterThanOrEqual(42);
    expect(worldForMode(defaultScenario.world, 'beginner').flowConfigurations[0].windSpeedKt).toBe(0);
  });

  it('unlocks advanced traffic and command tools at higher modes', () => {
    expect(difficultyConfig('advanced').allowPriorityTraffic).toBe(true);
    expect(difficultyConfig('expert').maxAircraft).toBeGreaterThan(difficultyConfig('normal').maxAircraft);
  });
});
