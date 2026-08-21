import type { GameScenario } from './scenario';
import type { GameMode, GameState } from './types';
import { createAircraft, HEAVY_PERFORMANCE, JET_PERFORMANCE } from './aircraftData';
import { INITIAL_SKILL, profileForSkill } from './skill';
import { modeTrafficProfile } from './difficulty';

export const SESSION_VERSION = 3;

export interface SavedSession {
  version: typeof SESSION_VERSION;
  scenarioId: GameScenario['id'];
  state: GameState;
  savedAt: number;
  dailyChallengeId?: string;
}

export function serializeSession(scenarioId: GameScenario['id'], state: GameState, dailyChallengeId?: string) {
  return JSON.stringify({ version: SESSION_VERSION, scenarioId, state, savedAt: Date.now(), dailyChallengeId } satisfies SavedSession);
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
    const parsedVersion = (parsed as { version?: number }).version;
    const scenario = scenarios.find((item) => item.id === parsed.scenarioId);
    const state = parsed.state;
    if ((parsedVersion !== 1 && parsedVersion !== 2 && parsedVersion !== SESSION_VERSION) || !scenario || !hasRequiredState(state)) return null;
    if (!scenario.world.flowConfigurations.some((item) => item.id === state.flowId)) return null;
    const legacyState = state as GameState & { mode?: GameMode; skill?: number; peakSkill?: number; targetAircraft?: number; seed?: number; commandHistory?: GameState['commandHistory'] };
    const mode: GameMode = legacyState.mode === 'beginner' || legacyState.mode === 'normal' || legacyState.mode === 'advanced' || legacyState.mode === 'expert' ? legacyState.mode : 'normal';
    const skill = typeof legacyState.skill === 'number' ? legacyState.skill : Math.max(INITIAL_SKILL, Math.min(12, state.score / 100 + INITIAL_SKILL));
    const profile = modeTrafficProfile(mode, profileForSkill(skill));
    return {
      version: SESSION_VERSION,
      scenarioId: scenario.id,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
      dailyChallengeId: typeof parsed.dailyChallengeId === 'string' && /^daily-\d{4}-\d{2}-\d{2}$/.test(parsed.dailyChallengeId)
        ? parsed.dailyChallengeId
        : undefined,
      state: {
        ...state,
        mode,
        aircraft: state.aircraft.map((aircraft) => {
          const defaults = ['B77W', 'A330', 'A332', 'A333', 'B748'].includes(aircraft.type) ? HEAVY_PERFORMANCE : JET_PERFORMANCE;
          const legacyApproach = aircraft.approach as (Omit<NonNullable<typeof aircraft.approach>, 'status'> & { status?: string; landingCleared?: boolean }) | undefined;
          return createAircraft({
            ...aircraft,
            performance: { ...defaults, ...aircraft.performance },
            approach: legacyApproach
              ? {
                runwayId: legacyApproach.runwayId,
                status: legacyApproach.status === 'captured'
                  ? legacyApproach.landingCleared ? 'tower' : 'glideslope'
                  : legacyApproach.status === 'localizer' || legacyApproach.status === 'glideslope' || legacyApproach.status === 'tower'
                    ? legacyApproach.status
                    : 'armed',
                localizerOnly: legacyApproach.localizerOnly,
                capturedAt: legacyApproach.capturedAt,
                towerHandoffAt: legacyApproach.towerHandoffAt,
              }
              : undefined,
          });
        }),
        paused: true,
        skill,
        peakSkill: typeof legacyState.peakSkill === 'number' ? legacyState.peakSkill : skill,
        targetAircraft: typeof legacyState.targetAircraft === 'number' ? legacyState.targetAircraft : profile.targetAircraft,
        seed: typeof legacyState.seed === 'number' ? legacyState.seed : 73421,
        commandHistory: Array.isArray(legacyState.commandHistory) ? legacyState.commandHistory : [],
        metrics: {
          ...state.metrics,
          unmanagedArrivals: typeof state.metrics?.unmanagedArrivals === 'number' ? state.metrics.unmanagedArrivals : 0,
          wakeViolations: typeof state.metrics?.wakeViolations === 'number' ? state.metrics.wakeViolations : 0,
        },
        eventTimeline: Array.isArray(state.eventTimeline) ? state.eventTimeline : state.eventLog,
      },
    };
  } catch {
    return null;
  }
}
