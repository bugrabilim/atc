import {
  CAREER_OUTCOME_LABELS,
  FIRST_WATCH_EPISODES,
  FIRST_WATCH_SEASON,
  unlockedCareerEpisodeIds,
  type CareerEpisode,
  type CareerEpisodeId,
  type CareerOutcomeTier,
} from '../engine/careerSeason';
import type { ShiftLogEntry } from '../engine/engagement';

interface CareerSeasonPanelProps {
  completedEpisodeIds: CareerEpisodeId[];
  bestOutcomes: Partial<Record<CareerEpisodeId, CareerOutcomeTier>>;
  logbook: ShiftLogEntry[];
  onStart: (episode: CareerEpisode) => void;
}

const MODE_LABELS = { beginner: 'BEGINNER', normal: 'NORMAL', advanced: 'ADVANCED', expert: 'EXPERT' } as const;

export function CareerSeasonPanel({ completedEpisodeIds, bestOutcomes, logbook, onStart }: CareerSeasonPanelProps) {
  const unlockedIds = unlockedCareerEpisodeIds(completedEpisodeIds);
  const seasonComplete = completedEpisodeIds.includes(FIRST_WATCH_EPISODES.at(-1)!.id);
  return (
    <section id="career" className="landing-section landing-career" aria-labelledby="career-title">
      <div className="landing-section__heading landing-section__heading--row">
        <div>
          <span className="landing-kicker">ORIGINAL CAREER · SEASON 01</span>
          <h2 id="career-title">{FIRST_WATCH_SEASON.title}.<br /><em>{FIRST_WATCH_SEASON.subtitle}.</em></h2>
        </div>
        <p>{completedEpisodeIds.length}/7 chapters complete.<br />Every result follows your actual shift.</p>
      </div>
      <div className="career-season__summary">
        <div><span>{seasonComplete ? '✓ SEASON COMPLETE' : '● SEASON ACTIVE'}</span><strong>Seven linked radar shifts</strong><small>From first contact to chief controller assessment.</small></div>
        <div className="career-season__progress" role="progressbar" aria-label={`${completedEpisodeIds.length} of 7 career chapters complete`} aria-valuemin={0} aria-valuemax={7} aria-valuenow={completedEpisodeIds.length}><i style={{ width: `${completedEpisodeIds.length / FIRST_WATCH_EPISODES.length * 100}%` }} /></div>
      </div>
      <div className="career-episode-grid">
        {FIRST_WATCH_EPISODES.map((episode) => {
          const unlocked = unlockedIds.includes(episode.id);
          const complete = completedEpisodeIds.includes(episode.id);
          const outcome = bestOutcomes[episode.id];
          const latestLog = logbook.find((entry) => entry.careerEpisodeId === episode.id);
          return (
            <article key={episode.id} className={`career-episode${complete ? ' is-complete' : ''}${!unlocked ? ' is-locked' : ''}`}>
              <div className="career-episode__number"><span>{String(episode.number).padStart(2, '0')}</span><b>{complete ? '✓' : unlocked ? '●' : '🔒'}</b></div>
              <div className="career-episode__body">
                <span>{MODE_LABELS[episode.mode]} · ISTANBUL</span>
                <h3>{episode.title}</h3>
                <p>{episode.subtitle}</p>
                <small>{episode.goal.targetLandings} LANDINGS · {episode.goal.targetHandoffs} HANDOFFS · {episode.goal.targetScore} SCORE</small>
                {latestLog?.careerNarrative ? <blockquote>{latestLog.careerNarrative}</blockquote> : null}
              </div>
              <div className="career-episode__action">
                {outcome ? <span>{CAREER_OUTCOME_LABELS[outcome]}</span> : null}
                <button type="button" disabled={!unlocked} onClick={() => onStart(episode)}>{complete ? 'REPLAY' : unlocked ? 'START CHAPTER' : 'COMPLETE PREVIOUS'} <b>↗</b></button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
