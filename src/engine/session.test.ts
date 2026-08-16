import { describe, expect, it } from 'vitest';
import { createInitialState, defaultScenario, scenarioCatalog } from './scenario';
import { restoreSession, serializeSession } from './session';

describe('session persistence', () => {
  it('round-trips a valid session and pauses it on restore', () => {
    const state = createInitialState(defaultScenario);
    state.elapsedSeconds = 71;
    state.paused = false;
    const restored = restoreSession(serializeSession('alpha', state), scenarioCatalog);

    expect(restored?.state.elapsedSeconds).toBe(71);
    expect(restored?.state.paused).toBe(true);
    expect(restored?.scenarioId).toBe('alpha');
  });

  it('rejects sessions with unknown airport flows', () => {
    const state = createInitialState(defaultScenario);
    state.flowId = 'missing-flow';
    const restored = restoreSession(serializeSession('alpha', state), scenarioCatalog);

    expect(restored).toBeNull();
  });

  it('accepts an older valid record by seeding a timeline from live events', () => {
    const state = createInitialState(defaultScenario);
    const record = JSON.parse(serializeSession('alpha', state)) as { state: Record<string, unknown> };
    delete record.state.eventTimeline;
    const restored = restoreSession(JSON.stringify(record), scenarioCatalog);

    expect(restored?.state.eventTimeline).toEqual(state.eventLog);
  });
});
