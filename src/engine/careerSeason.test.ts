import { describe, expect, it } from 'vitest';
import { buildDebrief } from './progression';
import { createInitialState, defaultScenario } from './scenario';
import {
  FIRST_WATCH_EPISODES,
  FIRST_WATCH_SEASON,
  applyCareerEpisodeEvents,
  bestCareerOutcome,
  evaluateCareerEpisode,
  sanitizeCareerOutcomes,
  sanitizeCompletedCareerEpisodes,
  unlockedCareerEpisodeIds,
} from './careerSeason';

describe('Istanbul Control: First Watch career season', () => {
  it('defines seven ordered, deterministic Istanbul episodes with valid flows', () => {
    expect(FIRST_WATCH_EPISODES).toHaveLength(7);
    expect(FIRST_WATCH_SEASON.episodes).toBe(FIRST_WATCH_EPISODES);
    expect(FIRST_WATCH_SEASON.homeScenarioId).toBe('ist');
    expect(FIRST_WATCH_EPISODES.map((episode) => episode.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(new Set(FIRST_WATCH_EPISODES.map((episode) => episode.id)).size).toBe(7);
    expect(new Set(FIRST_WATCH_EPISODES.map((episode) => episode.seed)).size).toBe(7);
    for (const episode of FIRST_WATCH_EPISODES) {
      expect(episode.scenarioId).toBe('ist');
      expect(defaultScenario.world.flowConfigurations.some((flow) => flow.id === episode.flowId)).toBe(true);
      for (const beat of episode.beats) {
        const effect = beat.effect;
        if (effect.kind === 'flow-change') {
          expect(defaultScenario.world.flowConfigurations.some((flow) => flow.id === effect.flowId)).toBe(true);
        }
      }
      expect(episode.goal.targetScore).toBeGreaterThan(0);
    }
  });

  it('unlocks one chapter at a time and sanitizes persisted progress', () => {
    expect(unlockedCareerEpisodeIds([])).toEqual(['first-contact']);
    expect(unlockedCareerEpisodeIds(['first-contact'])).toEqual(['first-contact', 'parallel-lines']);
    expect(unlockedCareerEpisodeIds(['first-contact', 'parallel-lines'])).toEqual(['first-contact', 'parallel-lines', 'fog-line']);
    expect(sanitizeCompletedCareerEpisodes(['first-contact', 'bad', 'first-contact'])).toEqual(['first-contact']);
    expect(sanitizeCompletedCareerEpisodes(['first-contact', 'fog-line'])).toEqual(['first-contact']);
    expect(sanitizeCompletedCareerEpisodes(['parallel-lines', 'fog-line'])).toEqual([]);
    expect(sanitizeCareerOutcomes({ 'first-contact': 'distinction', bad: 'qualified', 'fog-line': 'unknown' })).toEqual({ 'first-contact': 'distinction' });
    expect(bestCareerOutcome('qualified', 'repeat')).toBe('qualified');
    expect(bestCareerOutcome('qualified', 'distinction')).toBe('distinction');
  });

  it('applies a demand pulse once with a replay-safe event id', () => {
    const episode = FIRST_WATCH_EPISODES[1]!;
    const state = createInitialState(defaultScenario, episode.mode, episode.flowId);
    state.elapsedSeconds = 35;
    state.nextTrafficAt = 999;
    const applied = applyCareerEpisodeEvents(state, episode);
    const replay = applyCareerEpisodeEvents(applied, episode);

    expect(applied.nextTrafficAt).toBe(36);
    expect(applied.eventTimeline.filter((event) => event.id === 'career-parallel-lines-bank-compression')).toHaveLength(1);
    expect(replay.eventTimeline.filter((event) => event.id === 'career-parallel-lines-bank-compression')).toHaveLength(1);
  });

  it('creates a priority arrival and performs the scripted capacity turn', () => {
    const priorityEpisode = FIRST_WATCH_EPISODES[3]!;
    const priorityState = createInitialState(defaultScenario, priorityEpisode.mode, priorityEpisode.flowId);
    priorityState.elapsedSeconds = 45;
    const prioritized = applyCareerEpisodeEvents(priorityState, priorityEpisode);
    const priorityAircraft = prioritized.aircraft.find((aircraft) => aircraft.priority);
    expect(priorityAircraft?.priority?.kind).toBe('medical');
    expect(prioritized.eventLog.at(-1)?.message).toContain(priorityAircraft?.callsign);

    const turnEpisode = FIRST_WATCH_EPISODES[4]!;
    const turnState = createInitialState(defaultScenario, turnEpisode.mode, turnEpisode.flowId);
    turnState.landed = 2;
    const turned = applyCareerEpisodeEvents(turnState, turnEpisode);
    expect(turned.flowId).toBe('north-single');
    expect(turned.eventTimeline.some((event) => event.id === 'career-runway-turn-single-runway-turn')).toBe(true);
  });

  it('produces three meaningful outcomes and performance flags', () => {
    const episode = FIRST_WATCH_EPISODES[1]!;
    const state = createInitialState(defaultScenario, episode.mode, episode.flowId);
    state.landed = episode.goal.targetLandings;
    state.handoffs = episode.goal.targetHandoffs;
    state.score = 800;
    state.peakSkill = 7;
    state.elapsedSeconds = 60;
    const distinction = evaluateCareerEpisode(state, episode, buildDebrief(state, episode.goal));
    expect(distinction.tier).toBe('distinction');
    expect(distinction.flags).toContain('clean-separation');
    expect(distinction.flags).toContain('objective-complete');

    state.metrics.goArounds = 1;
    const qualified = evaluateCareerEpisode(state, episode, buildDebrief(state, episode.goal));
    expect(qualified.tier).toBe('qualified');
    expect(qualified.flags).not.toContain('stable-approaches');

    state.landed = 0;
    const repeat = evaluateCareerEpisode(state, episode, buildDebrief(state, episode.goal));
    expect(repeat.tier).toBe('repeat');
    expect(repeat.complete).toBe(false);
  });
});
