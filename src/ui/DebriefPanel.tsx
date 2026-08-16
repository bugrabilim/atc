import type { DebriefReport } from '../engine/progression';
import type { GameState } from '../engine/types';

interface DebriefPanelProps {
  report: DebriefReport;
  state: GameState;
  onRestart: () => void;
  onContinue: () => void;
}

export function DebriefPanel({ report, state, onRestart, onContinue }: DebriefPanelProps) {
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
          <div className="debrief-awards"><span className="eyebrow">KAZANILAN ROZETLER</span><div>{report.awards.map((award) => <b key={award.id}>{award.label}</b>)}</div></div>
        ) : null}
        <div className="debrief-timeline">
          <span className="eyebrow">OPERASYON KAYDI</span>
          {state.eventTimeline.slice(-6).reverse().map((event) => <p key={event.id} className={`debrief-event debrief-event--${event.type}`}>{event.message}</p>)}
        </div>
        <div className="debrief-actions">
          <button type="button" onClick={onContinue}>VARDİYAYA DÖN</button>
          <button type="button" className="is-primary" onClick={onRestart}>YENİ VARDİYA</button>
        </div>
      </section>
    </div>
  );
}
