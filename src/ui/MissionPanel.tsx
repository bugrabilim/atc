import type { Aircraft, GameEvent } from '../engine/types';
import { controllerRank, nextMission, type TrainingGuide } from '../engine/progression';
import type { CoachAdvice } from '../engine/controllerCoach';

interface MissionPanelProps {
  aircraft: Aircraft[];
  score: number;
  landed: number;
  handoffs: number;
  trafficLevel: number;
  bestScore: number;
  bestLandings: number;
  trainingCallsign: string | null;
  trainingRunway: string | null;
  priorityTraffic: Aircraft[];
  events: GameEvent[];
  activeFlowLabel: string;
  pendingInstructionCount: number;
  tutorial: TrainingGuide | null;
  onTutorialCommand: (guide: TrainingGuide) => void;
  coach: CoachAdvice;
  onCoachCommand: (advice: CoachAdvice) => void;
}

export function MissionPanel({ aircraft, score, landed, handoffs, trafficLevel, bestScore, bestLandings, trainingCallsign, trainingRunway, priorityTraffic, events, activeFlowLabel, pendingInstructionCount, tutorial, onTutorialCommand, coach, onCoachCommand }: MissionPanelProps) {
  const trainingAircraft = aircraft.find((item) => item.callsign === trainingCallsign);
  const approachCaptured = trainingAircraft?.approach?.status === 'captured';
  const landingCleared = trainingAircraft?.approach?.landingCleared;
  const priorityMission = priorityTraffic.find((item) => item.priority && !item.priority.alertRaised);
  const mission = priorityMission
    ? `${priorityMission.callsign} öncelikli trafik. ${priorityMission.priority?.kind === 'minimumFuel' ? 'Minimum yakıt' : 'Tıbbi uçuş'}: yaklaşmayı hızlandır ve güvenli ilk iniş sırasına al.`
    : landed > 0
    ? nextMission(landed, score)
    : approachCaptured && !landingCleared
      ? `${trainingCallsign} ILS üzerinde. Pist geçmeden LAND komutuyla iniş izni ver.`
    : approachCaptured
      ? `${trainingCallsign} localizer ve glideslope üzerinde. Pisti takip et.`
      : `İlk görev: ${trainingCallsign ?? 'ilk geliş'} için ILS ${trainingRunway ?? ''} komutunu ver. Diğer trafikte DCT ve HOLD kullan.`;

  return (
    <section className="mission-panel" aria-label="Oyun görevi ve skor">
      <div className="mission-primary">
        <span className="eyebrow">GÖREV</span>
        <strong>{mission}</strong>
      </div>
      <div className="mission-score" aria-label={`Skor ${score}, tamamlanan iniş ${landed}, handoff ${handoffs}`}>
        <span>SKOR <b>{score}</b></span>
        <span>İNİŞ <b>{landed}</b></span>
        <span>HANDOFF <b>{handoffs}</b></span>
        <span>YOĞUNLUK <b>{trafficLevel}/5</b></span>
        <span>AKIŞ <b>{activeFlowLabel}</b></span>
        {pendingInstructionCount > 0 ? <span>READBACK <b>{pendingInstructionCount}</b></span> : null}
        <span>KARİYER <b>{controllerRank(bestScore)} · {bestLandings} İNİŞ</b></span>
      </div>
      <div className="mission-event" aria-live="polite">
        {events.at(-1)?.message ?? 'Radar sahası izleniyor.'}
      </div>
      {tutorial ? (
        <div className="tutorial-guide" aria-label={`Eğitim adımı ${tutorial.step}`}>
          <span className="tutorial-guide__step">EĞİTİM {tutorial.step}/{tutorial.totalSteps}</span>
          <div><strong>{tutorial.title}</strong><small>{tutorial.message}</small></div>
          {tutorial.command ? <button type="button" onClick={() => onTutorialCommand(tutorial)}>{tutorial.command} UYGULA</button> : null}
        </div>
      ) : null}
      <div className={`coach-guide coach-guide--${coach.tone}`} aria-live="polite">
        <span className="coach-guide__label">{coach.label}</span>
        <div><strong>{coach.title}</strong><small>{coach.message}</small></div>
        {coach.command ? <button type="button" onClick={() => onCoachCommand(coach)}>{coach.command} UYGULA</button> : null}
      </div>
    </section>
  );
}
