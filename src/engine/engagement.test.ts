import { describe, expect, it } from 'vitest';
import { buildDebrief } from './progression';
import { createInitialState, scenarioCatalog } from './scenario';
import {
  LOGBOOK_LIMIT,
  appendLogbook,
  bestDailyStreak,
  createShiftLogEntry,
  currentDailyStreak,
  dailyChallengeComplete,
  dailyChallengeForDate,
  sanitizeDailyCompletionDates,
  sanitizeLogbook,
  shareShiftText,
} from './engagement';

describe('daily radar and shift logbook', () => {
  it('creates a deterministic challenge from a UTC date and a flagship operations pack', () => {
    const date = new Date('2026-08-22T21:30:00.000Z');
    const first = dailyChallengeForDate(date, scenarioCatalog);
    const replay = dailyChallengeForDate(new Date('2026-08-22T00:01:00.000Z'), scenarioCatalog);
    const scenario = scenarioCatalog.find((item) => item.id === first.scenarioId);

    expect(replay).toEqual(first);
    expect(['ist', 'lhr', 'lax', 'jfk', 'atl']).toContain(first.scenarioId);
    expect(scenario?.world.operations).toBeTruthy();
    expect(scenario?.world.flowConfigurations.some((flow) => flow.id === first.flowId)).toBe(true);
    expect(first.goal.maximumLosses).toBe(0);
    expect(first.goal.targetScore).toBeGreaterThanOrEqual(350);
  });

  it('rotates airports and flows across a month instead of serving one static board', () => {
    const challenges = Array.from({ length: 31 }, (_, day) => dailyChallengeForDate(new Date(Date.UTC(2026, 7, day + 1)), scenarioCatalog));
    expect(new Set(challenges.map((challenge) => challenge.scenarioId)).size).toBe(5);
    expect(new Set(challenges.map((challenge) => `${challenge.scenarioId}:${challenge.flowId}`)).size).toBeGreaterThan(10);
    expect(new Set(challenges.map((challenge) => challenge.seed)).size).toBe(challenges.length);
  });

  it('requires the daily flow, score and safety target', () => {
    const challenge = dailyChallengeForDate(new Date('2026-08-22T00:00:00.000Z'), scenarioCatalog);
    const scenario = scenarioCatalog.find((item) => item.id === challenge.scenarioId)!;
    const state = createInitialState(scenario, challenge.mode);
    state.flowId = challenge.flowId;
    state.landed = challenge.goal.targetLandings;
    state.handoffs = challenge.goal.targetHandoffs;
    state.score = challenge.goal.targetScore ?? 0;
    expect(dailyChallengeComplete(state, challenge)).toBe(true);
    state.metrics.separationLosses = 1;
    expect(dailyChallengeComplete(state, challenge)).toBe(false);
  });

  it('calculates current and best streaks without trusting duplicate storage values', () => {
    const values = ['2026-08-18', '2026-08-19', '2026-08-19', 'bad', '2026-08-21', '2026-08-22'];
    expect(sanitizeDailyCompletionDates(values)).toEqual(['2026-08-18', '2026-08-19', '2026-08-21', '2026-08-22']);
    expect(currentDailyStreak(values, new Date('2026-08-22T22:00:00.000Z'))).toBe(2);
    expect(currentDailyStreak(values, new Date('2026-08-23T10:00:00.000Z'))).toBe(2);
    expect(bestDailyStreak(values)).toBe(2);
    expect(currentDailyStreak([], new Date('2026-08-22T22:00:00.000Z'))).toBe(0);
  });

  it('records, sanitizes and caps platform-neutral shift summaries', () => {
    const scenario = scenarioCatalog[0]!;
    const state = createInitialState(scenario, 'normal');
    state.score = 420;
    state.landed = 3;
    state.handoffs = 1;
    const entry = createShiftLogEntry(scenario, state, buildDebrief(state), 'daily-2026-08-22', new Date('2026-08-22T12:00:00.000Z'));
    const entries = Array.from({ length: LOGBOOK_LIMIT + 4 }, (_, index) => ({ ...entry, id: String(index) }));

    expect(appendLogbook(entries, entry)).toHaveLength(LOGBOOK_LIMIT);
    expect(sanitizeLogbook([entry, { bad: true }])).toEqual([entry]);
    expect(shareShiftText(entry, 4)).toContain('DAILY RADAR');
    expect(shareShiftText(entry, 4)).toContain('STREAK 4 DAYS');
  });
});
