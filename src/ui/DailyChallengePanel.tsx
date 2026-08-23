import type { DailyChallenge, ShiftLogEntry } from '../engine/engagement';

interface DailyChallengePanelProps {
  challenge: DailyChallenge;
  completed: boolean;
  currentStreak: number;
  bestStreak: number;
  logbook: ShiftLogEntry[];
  onStart: () => void;
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })
    .format(new Date(`${value}T12:00:00.000Z`))
    .toUpperCase();
}

function shiftDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    .format(new Date(value))
    .toUpperCase();
}

export function DailyChallengePanel({ challenge, completed, currentStreak, bestStreak, logbook, onStart }: DailyChallengePanelProps) {
  return (
    <section id="daily" className="landing-section landing-daily" aria-labelledby="daily-title">
      <div className="landing-section__heading landing-section__heading--row">
        <div><span className="landing-kicker">DAILY RADAR · {shortDate(challenge.dateKey)}</span><h2 id="daily-title">One shared shift.<br /><em>One clean result.</em></h2></div>
        <p>A deterministic challenge on every device.<br />No account required.</p>
      </div>
      <div className="daily-grid">
        <article className={`daily-card${completed ? ' is-complete' : ''}`}>
          <div className="daily-card__top"><span>{completed ? '✓ COMPLETE' : '● LIVE TODAY'}</span><b>{challenge.airportLabel}</b></div>
          <h3>{challenge.flowLabel}</h3>
          <p>{challenge.goal.targetLandings} landings · {challenge.goal.targetHandoffs} handoff · score {challenge.goal.targetScore} · zero separation losses</p>
          <button type="button" onClick={onStart}>{completed ? 'PLAY AGAIN' : 'START DAILY RADAR'} <span>↗</span></button>
        </article>
        <aside className="streak-card" aria-label={`Current streak ${currentStreak} days, best ${bestStreak} days`}>
          <span className="landing-kicker">CONTROLLER STREAK</span>
          <div><strong>{String(currentStreak).padStart(2, '0')}</strong><span>DAYS<br />CURRENT</span></div>
          <p>BEST STREAK <b>{bestStreak} DAYS</b></p>
        </aside>
        <aside className="logbook-card">
          <div className="logbook-card__top"><span className="landing-kicker">SHIFT LOGBOOK</span><b>{logbook.length} SAVED</b></div>
          {logbook.length > 0 ? logbook.slice(0, 4).map((entry) => (
            <div className="logbook-row" key={entry.id}>
              <span>{entry.grade}</span>
              <div><strong>{entry.airportLabel}</strong><small>{shiftDate(entry.completedAt)} · {entry.mode.toUpperCase()}</small></div>
              <b>{entry.score}</b>
            </div>
          )) : <p className="logbook-empty">Complete a shift to create your first permanent local log entry.</p>}
        </aside>
      </div>
    </section>
  );
}
