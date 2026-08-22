import { describe, expect, it } from 'vitest';
import { createInitialState, defaultScenario, scenarioCatalog } from './scenario';
import { restoreSession, serializeSession } from './session';

describe('session persistence', () => {
  it('round-trips a valid session and pauses it on restore', () => {
    const state = createInitialState(defaultScenario);
    state.elapsedSeconds = 71;
    state.paused = false;
    const restored = restoreSession(serializeSession('ist', state), scenarioCatalog);

    expect(restored?.state.elapsedSeconds).toBe(71);
    expect(restored?.state.paused).toBe(true);
    expect(restored?.scenarioId).toBe('ist');
  });

  it('retains a valid optional daily challenge identity', () => {
    const state = createInitialState(defaultScenario, 'normal');
    const restored = restoreSession(serializeSession('ist', state, 'daily-2026-08-22'), scenarioCatalog);
    expect(restored?.dailyChallengeId).toBe('daily-2026-08-22');
  });

  it('drops malformed daily challenge metadata without rejecting the shift', () => {
    const state = createInitialState(defaultScenario, 'normal');
    const record = JSON.parse(serializeSession('ist', state)) as { dailyChallengeId?: string };
    record.dailyChallengeId = 'daily-tampered';
    const restored = restoreSession(JSON.stringify(record), scenarioCatalog);
    expect(restored?.dailyChallengeId).toBeUndefined();
    expect(restored?.scenarioId).toBe('ist');
  });

  it('retains valid story identity and drops malformed story metadata', () => {
    const state = createInitialState(defaultScenario, 'beginner', 'north-parallel');
    const restored = restoreSession(serializeSession('ist', state, undefined, 'first-contact'), scenarioCatalog);
    expect(restored?.careerEpisodeId).toBe('first-contact');

    const record = JSON.parse(serializeSession('ist', state)) as { careerEpisodeId?: string };
    record.careerEpisodeId = 'tampered-episode';
    const sanitized = restoreSession(JSON.stringify(record), scenarioCatalog);
    expect(sanitized?.careerEpisodeId).toBeUndefined();
    expect(sanitized?.scenarioId).toBe('ist');
  });

  it('rejects sessions with unknown airport flows', () => {
    const state = createInitialState(defaultScenario);
    state.flowId = 'missing-flow';
    const restored = restoreSession(serializeSession('ist', state), scenarioCatalog);

    expect(restored).toBeNull();
  });

  it('accepts an older valid record by seeding a timeline from live events', () => {
    const state = createInitialState(defaultScenario);
    const record = JSON.parse(serializeSession('ist', state)) as { state: Record<string, unknown> };
    delete record.state.eventTimeline;
    const restored = restoreSession(JSON.stringify(record), scenarioCatalog);

    expect(restored?.state.eventTimeline).toEqual(state.eventLog);
  });
});
