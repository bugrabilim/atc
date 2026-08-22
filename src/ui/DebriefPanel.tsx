import type { DebriefReport } from '../engine/progression';
import type { GameState } from '../engine/types';
import { CAREER_FLAG_LABELS, type CareerEpisodeResult } from '../engine/careerSeason';

interface DebriefPanelProps {
  report: DebriefReport;
  state: GameState;
  achievementCount: number;
  achievementTotal: number;
  newAchievementIds: string[];
  dailyChallengeLabel?: string;
  dailyChallengeCompleted?: boolean;
  dailyStreak: number;
  careerEpisodeLabel?: string;
  careerResult?: CareerEpisodeResult | null;
  shareFeedback: string;
  onRestart: () => void;
  onContinue: () => void;
  onShare: () => void;
  onCareerMap: () => void;
}

export function DebriefPanel({ report, state, achievementCount, achievementTotal, newAchievementIds, dailyChallengeLabel, dailyChallengeCompleted, dailyStreak, careerEpisodeLabel, careerResult, shareFeedback, onRestart, onContinue, onShare, onCareerMap }: DebriefPanelProps) {
  return (
    <div className="debrief-backdrop" role="dialog" aria-modal="true" aria-label="Vardiya debrief raporu">
      <section className="debrief-panel">
        <div className={`debrief-grade debrief-grade--${report.grade.toLowerCase()}`}>{report.grade}</div>
        <div>
          <span className="eyebrow">VARDİYA DEBRIEF</span>
          <h2>{report.headline}</h2>
          <p>{report.summary}</p>
          <p className={report.objectiveComplete ? 'debrief-objective is-complete' : 'debrief-objective'}>{report.objectiveComplete ? 'HEDEF TAMAMLANDI · ' : 'HEDEF DURUMU · '}{report.objective}</p>
        </div>
        {dailyChallengeLabel ? <div className={`debrief-daily${dailyChallengeCompleted ? ' is-complete' : ''}`}><span>{dailyChallengeCompleted ? '✓ GÜNLÜK GÖREV TAMAMLANDI' : 'GÜNLÜK GÖREV SONUCU'} · {dailyChallengeLabel}</span><b>{dailyStreak} GÜNLÜK SERİ</b></div> : null}
        {careerEpisodeLabel && careerResult ? (
          <div className={`debrief-story debrief-story--${careerResult.tier}`}>
            <div><span>İSTANBUL CONTROL · {careerEpisodeLabel}</span><b>{careerResult.label}</b></div>
            <p>{careerResult.narrative}</p>
            <div>{careerResult.flags.map((flag) => <span key={flag}>{CAREER_FLAG_LABELS[flag]}</span>)}</div>
          </div>
        ) : null}
        <div className="debrief-metrics">
          <span>SKILL <b>{state.skill.toFixed(1)}</b></span>
          <span>PEAK <b>{state.peakSkill.toFixed(1)}</b></span>
          <span>İNİŞ <b>{state.landed}</b></span>
          <span>HANDOFF <b>{state.handoffs}</b></span>
          <span>AYIRMA <b>{state.metrics.separationLosses}</b></span>
          <span>WAKE <b>{state.metrics.wakeViolations}</b></span>
          <span>GO-AROUND <b>{state.metrics.goArounds}</b></span>
          <span>KAYIP GELİŞ <b>{state.metrics.unmanagedArrivals}</b></span>
        </div>
        <div className="debrief-columns">
          <div><span className="eyebrow">GÜÇLÜ YANLAR</span>{report.strengths.map((item) => <p key={item}>{item}</p>)}</div>
          <div><span className="eyebrow">SONRAKİ VARDİYA</span>{report.improvements.map((item) => <p key={item}>{item}</p>)}</div>
        </div>
        {report.awards.length > 0 ? (
          <div className="debrief-awards"><span className="eyebrow">VARDİYA BAŞARIMLARI · {achievementCount}/{achievementTotal}</span><div>{report.awards.map((award) => <b key={award.id} title={award.description}>{newAchievementIds.includes(award.id) ? 'YENİ · ' : ''}{award.label}</b>)}</div></div>
        ) : null}
        <div className="debrief-timeline">
          <span className="eyebrow">OPERASYON KAYDI</span>
          {state.eventTimeline.slice(-6).reverse().map((event) => <p key={event.id} className={`debrief-event debrief-event--${event.type}`}>{event.message}</p>)}
        </div>
        <div className="debrief-actions">
          {shareFeedback ? <span role="status">{shareFeedback}</span> : null}
          <button type="button" onClick={onShare}>SONUCU PAYLAŞ</button>
          {careerEpisodeLabel ? <button type="button" onClick={onCareerMap}>KARİYER HARİTASI</button> : null}
          {!careerEpisodeLabel && dailyChallengeLabel ? <button type="button" onClick={onCareerMap}>ANA SAYFA / LOGBOOK</button> : null}
          {!careerEpisodeLabel && !dailyChallengeLabel ? <button type="button" onClick={onContinue}>VARDİYAYA DÖN</button> : null}
          <button type="button" className="is-primary" onClick={onRestart}>YENİ VARDİYA</button>
        </div>
      </section>
    </div>
  );
}
