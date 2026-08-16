import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, ACHIEVEMENT_TOTAL, CAREER_UNLOCKS, buildDebrief, careerProgression, controllerRank, earnedAwards, isAchievementId, nextMission, trainingGuide } from './progression';
import { initialState, scenarioCatalog } from './scenario';

describe('controller progression', () => {
  it('promotes the controller through score thresholds', () => {
    expect(controllerRank(0)).toBe('STAJYER KONTROLÖR');
    expect(controllerRank(60)).toBe('YAKLAŞMA KONTROLÖRÜ');
    expect(controllerRank(180)).toBe('BAŞ KONTROLÖR');
  });

  it('keeps early objectives concise and actionable', () => {
    expect(nextMission(0, 0)).toContain('ILS');
    expect(nextMission(1, 100)).toContain('DCT/HOLD');
  });
});

describe('debrief', () => {
  it('defines a shared catalogue of at least 50 achievements', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(50);
    expect(ACHIEVEMENT_TOTAL).toBe(ACHIEVEMENTS.length);
    expect(new Set(ACHIEVEMENTS.map((achievement) => achievement.id)).size).toBe(ACHIEVEMENTS.length);
    expect(isAchievementId('first-touchdown')).toBe(true);
    expect(isAchievementId('unknown-achievement')).toBe(false);
  });

  it('unlocks multiple relevant achievements from a strong session', () => {
    const state = structuredClone(initialState);
    state.landed = 6;
    state.handoffs = 3;
    state.score = 160;
    state.peakSkill = 12;
    state.spawned = 8;
    state.elapsedSeconds = 600;
    const ids = earnedAwards(state).map((award) => award.id);

    expect(ids).toContain('landing-six');
    expect(ids).toContain('wake-keeper');
    expect(ids).toContain('high-workload');
  });

  it('reports a safety-focused grade from session outcomes', () => {
    const state = structuredClone(initialState);
    state.landed = 3;
    state.score = 400;
    const report = buildDebrief(state);

    expect(report.grade).toBe('A');
    expect(report.strengths[0]).toContain('3 güvenli iniş');
  });

  it('lowers the report grade when separation losses occur', () => {
    const state = structuredClone(initialState);
    state.metrics.separationLosses = 2;
    const report = buildDebrief(state);

    expect(report.grade).toBe('D');
    expect(report.improvements[0]).toContain('2 ayırma kaybı');
  });
});

describe('career progression', () => {
  it('starts with an immediately playable training sector and no artificial wait gate', () => {
    const career = careerProgression([]);
    expect(career.unlockedScenarioIds).toEqual(['ist']);
    expect(career.unlockedModeIds).toEqual(['beginner']);
    expect(career.nextUnlock?.id).toBe('scenario:atl');
  });

  it('unlocks content through demonstrated safety and procedure skill', () => {
    const career = careerProgression(
      ['beginner-complete', 'landing-trio', 'clean-start', 'wake-keeper', 'normal-complete', 'procedure-pilot', 'holding-strategist'],
      { ist: 250, atl: 250 },
    );
    expect(career.unlockedScenarioIds).toEqual(expect.arrayContaining(['ist', 'atl', 'dxb']));
    expect(career.unlockedModeIds).toEqual(expect.arrayContaining(['beginner', 'normal', 'advanced']));
    expect(career.unlockedOperationIds).toContain('wake-advisor');
    expect(career.rank).toBe('YAKLAŞMA KONTROLÖRÜ');
  });

  it('keeps every unlock backed by achievement requirements and reaches full completion', () => {
    expect(CAREER_UNLOCKS.every((unlock) => unlock.requiredAchievementIds.every(isAchievementId))).toBe(true);
    const career = careerProgression(
      ACHIEVEMENTS.map((achievement) => achievement.id),
      Object.fromEntries(scenarioCatalog.map((scenario) => [scenario.id, 5000])),
    );
    expect(career.completionPercent).toBe(100);
    expect(career.nextUnlock).toBeNull();
    expect(career.unlockedScenarioIds).toHaveLength(50);
  });
});

describe('guided training', () => {
  it('walks a first arrival through ILS and automatic tower handoff', () => {
    const state = structuredClone(initialState);
    const first = trainingGuide(state, 'AR101', '34L');
    state.aircraft[0].approach = { runwayId: '34L', status: 'tower' };
    const final = trainingGuide(state, 'AR101', '34L');

    expect(first?.command).toBe('ILS 34L');
    expect(final?.command).toBeUndefined();
    expect(final?.title).toContain('KULEYE');
  });
});
