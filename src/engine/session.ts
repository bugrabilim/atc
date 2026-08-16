import type { GameScenario } from './scenario';
import type { GameState } from './types';

export const SESSION_VERSION = 1;

export interface SavedSession {
  version: typeof SESSION_VERSION;
  scenarioId: GameScenario['id'];
  state: GameState;
  savedAt: number;
}

export function serializeSession(scenarioId: GameScenario['id'], state: GameState) {
  return JSON.stringify({ version: SESSION_VERSION, scenarioId, state, savedAt: Date.now() } satisfies SavedSession);
}

function hasRequiredState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<GameState>;
  return typeof state.elapsedSeconds === 'number'
    && typeof state.flowId === 'string'
    && Array.isArray(state.aircraft)
    && Array.isArray(state.eventLog)
    && Array.isArray(state.pendingInstructions)
    && Boolean(state.metrics)
    && typeof state.metrics?.separationLosses === 'number';
}

/** Restores only records that still match a known airport pack and current state shape. */
export function restoreSession(serialized: string | null, scenarios: readonly GameScenario[]): SavedSession | null {
  if (!serialized) return null;
  try {
    const parsed = JSON.parse(serialized) as Partial<SavedSession>;
    const scenario = scenarios.find((item) => item.id === parsed.scenarioId);
    const state = parsed.state;
    if (parsed.version !== SESSION_VERSION || !scenario || !hasRequiredState(state)) return null;
    if (!scenario.world.flowConfigurations.some((item) => item.id === state.flowId)) return null;
    return {
      version: SESSION_VERSION,
      scenarioId: scenario.id,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
      state: {
        ...state,
        paused: true,
        metrics: {
          ...state.metrics,
          unmanagedArrivals: typeof state.metrics?.unmanagedArrivals === 'number' ? state.metrics.unmanagedArrivals : 0,
        },
        eventTimeline: Array.isArray(state.eventTimeline) ? state.eventTimeline : state.eventLog,
      },
    };
  } catch {
    return null;
  }
}
