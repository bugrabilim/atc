import { useMemo, useState } from 'react';
import type { GameScenario } from '../engine/scenario';
import type { ScenarioId } from '../engine/types';
import { ACADEMY_LESSONS, type AcademyLessonId } from '../engine/academy';
import type { DailyChallenge, ShiftLogEntry } from '../engine/engagement';
import { DailyChallengePanel } from './DailyChallengePanel';
import type { CareerEpisode, CareerEpisodeId, CareerOutcomeTier } from '../engine/careerSeason';
import { CareerSeasonPanel } from './CareerSeasonPanel';

interface LandingPageProps {
  scenarios: GameScenario[];
  selectedScenario: GameScenario;
  unlockedScenarioIds: ScenarioId[];
  scenarioBestScores: Record<string, number>;
  savedSession: boolean;
  completedAcademyLessonIds: AcademyLessonId[];
  dailyChallenge: DailyChallenge;
  dailyChallengeCompleted: boolean;
  currentDailyStreak: number;
  bestDailyStreak: number;
  logbook: ShiftLogEntry[];
  completedCareerEpisodeIds: CareerEpisodeId[];
  careerBestOutcomes: Partial<Record<CareerEpisodeId, CareerOutcomeTier>>;
  onStart: (scenario: GameScenario) => void;
  onResume: () => void;
  onAcademyStart: (lessonId: AcademyLessonId) => void;
  onDailyChallengeStart: () => void;
  onCareerEpisodeStart: (episode: CareerEpisode) => void;
}

export function LandingPage({ scenarios, selectedScenario, unlockedScenarioIds, scenarioBestScores, savedSession, completedAcademyLessonIds, dailyChallenge, dailyChallengeCompleted, currentDailyStreak, bestDailyStreak, logbook, completedCareerEpisodeIds, careerBestOutcomes, onStart, onResume, onAcademyStart, onDailyChallengeStart, onCareerEpisodeStart }: LandingPageProps) {
  const firstUnlocked = scenarios.find((item) => unlockedScenarioIds.includes(item.id as ScenarioId)) ?? selectedScenario;
  const [airportQuery, setAirportQuery] = useState('');
  const [showAllAirports, setShowAllAirports] = useState(false);
  const matchingAirports = useMemo(() => {
    const query = airportQuery.trim().toLocaleLowerCase('en-US');
    if (!query) return scenarios;
    return scenarios.filter((scenario) => `${scenario.iata} ${scenario.icao} ${scenario.label} ${scenario.world.environment?.city ?? ''}`.toLocaleLowerCase('en-US').includes(query));
  }, [airportQuery, scenarios]);
  const visibleAirports = airportQuery || showAllAirports ? matchingAirports : matchingAirports.slice(0, 12);
  return (
    <main className="landing-page">
      <header className="landing-header">
        <nav className="landing-nav" aria-label="Primary navigation">
          <a className="landing-brand" href="#top" aria-label="Airspace Control home"><span className="landing-brand__mark">✦</span><span><strong>AIRSPACE CONTROL</strong><small>BY BUMBA GAMES</small></span></a>
          <div className="landing-nav__links"><a href="#experience">Experience</a><a href="#career">Career</a><a href="#daily">Daily</a><a href="#academy">Academy</a><a href="#airports">Airports</a><a href="#how">How it works</a></div>
          <button type="button" className="landing-nav__cta" onClick={() => onStart(firstUnlocked)}>START FREE <span>↗</span></button>
        </nav>
      </header>

      <section id="top" className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero__copy"><span className="landing-kicker"><i /> BUMBA GAMES ORIGINAL · RADAR STRATEGY</span><h1 id="landing-title">The sky is<br /><em>yours to</em><br />control.</h1><p className="landing-hero__lead">Manage live air traffic, make the right calls, protect safe separation and unlock new airports across your career map.</p><div className="landing-actions">{savedSession ? <button type="button" className="landing-primary" onClick={onResume}>RESUME SHIFT <small>Your saved session is ready</small></button> : null}<button type="button" className={savedSession ? 'landing-secondary' : 'landing-primary'} onClick={() => onStart(firstUnlocked)}>PLAY NOW <small>No account or password required</small></button><button type="button" className="landing-secondary" onClick={() => onAcademyStart(ACADEMY_LESSONS[0]!.id)}>START ACADEMY <small>10 short interactive lessons</small></button></div><div className="landing-proof"><span>● NO PASSWORD</span><span>● WEB + MOBILE</span><span>● FREE TO START</span></div></div>
        <div className="landing-hero__visual" aria-label="Live scope preview"><div className="landing-hero__visual-top"><span>LIVE SCOPE</span><b>IST / 01</b><span className="live-dot">LIVE</span></div><div className="landing-hero__radar" aria-hidden="true"><span className="landing-hero__sweep" /><i /><i /><i /><b>IST</b></div><div className="landing-hero__visual-bottom"><span>TRAFFIC <b>08</b></span><span>SKILL <b>74%</b></span><span>WIND <b>→ 12KT</b></span></div></div>
      </section>

      <section id="experience" className="landing-section landing-experience" aria-labelledby="experience-title"><div className="landing-section__heading"><span className="landing-kicker">WHY AIRSPACE CONTROL?</span><h2 id="experience-title">More than a game.<br /><em>A real control room mindset.</em></h2></div><div className="landing-feature-grid"><article className="landing-feature"><span className="landing-feature__icon">⌁</span><h3>Take the scope</h3><p>Track inbound traffic, select flights and guide every aircraft through an intuitive command panel.</p></article><article className="landing-feature"><span className="landing-feature__icon">↗</span><h3>Your calls matter</h3><p>Make the right heading, altitude, speed and runway decisions at exactly the right moment.</p></article><article className="landing-feature"><span className="landing-feature__icon">✦</span><h3>Build your career</h3><p>Master every airport, unlock new scenarios and complete a career collection of 52 achievements.</p></article></div></section>

      <CareerSeasonPanel completedEpisodeIds={completedCareerEpisodeIds} bestOutcomes={careerBestOutcomes} logbook={logbook} onStart={onCareerEpisodeStart} />

      <DailyChallengePanel challenge={dailyChallenge} completed={dailyChallengeCompleted} currentStreak={currentDailyStreak} bestStreak={bestDailyStreak} logbook={logbook} onStart={onDailyChallengeStart} />

      <section id="academy" className="landing-section landing-academy" aria-labelledby="academy-title">
        <div className="landing-section__heading landing-section__heading--row"><div><span className="landing-kicker">FLIGHT ACADEMY · {completedAcademyLessonIds.length}/{ACADEMY_LESSONS.length} COMPLETE</span><h2 id="academy-title">Your first safe arrival<br /><em>starts in two minutes.</em></h2></div><p>No manual. No exam.<br />One control skill at a time.</p></div>
        <div className="academy-grid">
          {ACADEMY_LESSONS.map((lesson) => {
            const complete = completedAcademyLessonIds.includes(lesson.id);
            return <button key={lesson.id} type="button" className={`academy-card${complete ? ' is-complete' : ''}`} onClick={() => onAcademyStart(lesson.id)}><span>{String(lesson.number).padStart(2, '0')}</span><div><strong>{lesson.shortTitle}</strong><small>{lesson.durationMinutes} MIN · INTERACTIVE</small></div><b>{complete ? '✓' : '→'}</b></button>;
          })}
        </div>
      </section>

      <section id="airports" className="landing-section landing-airports" aria-labelledby="airport-title"><div className="landing-section__heading landing-section__heading--row"><div><span className="landing-kicker">CAREER MAP · {scenarios.length} AIRPORTS</span><h2 id="airport-title">Choose your first shift.</h2></div><p>Start in Istanbul. Earn your score<br />to unlock the next real-world airport.</p></div><div className="airport-browser"><label htmlFor="airport-search">SEARCH AIRPORTS</label><input id="airport-search" type="search" value={airportQuery} onChange={(event) => setAirportQuery(event.target.value)} placeholder="IST, Heathrow, KATL…" /><span>{matchingAirports.length} RESULTS</span></div><div className="airport-grid">{visibleAirports.map((scenario) => { const unlocked = unlockedScenarioIds.includes(scenario.id as ScenarioId); const score = scenarioBestScores[scenario.id] ?? 0; return <button key={scenario.id} type="button" disabled={!unlocked} className={`airport-card${scenario.id === selectedScenario.id ? ' is-selected' : ''}${!unlocked ? ' is-locked' : ''}`} onClick={() => unlocked && onStart(scenario)}><span className="airport-card__number">{String(scenario.rank).padStart(2, '0')}</span><span className="airport-card__mark" aria-hidden="true">{unlocked ? '◉' : '🔒'}</span><span className="airport-card__body"><strong>{scenario.label}</strong><small>{scenario.icao} · {scenario.runwayCount} RUNWAYS · {(scenario.passengers2025 / 1_000_000).toFixed(1)}M PASSENGERS</small></span><span className="airport-card__score">{unlocked ? `BEST ${score}` : 'SCORE ON THE PREVIOUS AIRPORT TO UNLOCK'}</span></button>; })}</div>{!airportQuery && scenarios.length > 12 ? <button type="button" className="airport-show-all" onClick={() => setShowAllAirports((current) => !current)}>{showAllAirports ? 'SHOW FIRST 12 AIRPORTS' : `SHOW ALL ${scenarios.length} AIRPORTS`}</button> : null}</section>

      <section id="how" className="landing-section landing-how" aria-labelledby="how-title"><div className="landing-section__heading"><span className="landing-kicker">START IN THREE STEPS</span><h2 id="how-title">Simple rules.<br /><em>Real mastery.</em></h2></div><div className="landing-steps"><div><b>01</b><h3>Read the traffic</h3><p>Read every aircraft’s direction, altitude and speed on the scope.</p></div><div><b>02</b><h3>Make the call</h3><p>Select an aircraft and manage its route and approach with ATC commands.</p></div><div><b>03</b><h3>Finish safely</h3><p>Prevent conflicts, complete landings and unlock the next airport.</p></div></div></section>

      <footer className="landing-footer"><div className="landing-footer__brand"><span className="landing-brand__mark">✦</span><span><strong>BUMBA GAMES</strong><small>PLAY WITH PURPOSE.</small></span></div><div className="landing-footer__meta"><span>AIRSPACE CONTROL © 2026</span><span>NO PASSWORD · LOCAL CAREER SAVE</span><span>WEB · PWA · IOS · ANDROID</span></div></footer>
    </main>
  );
}
