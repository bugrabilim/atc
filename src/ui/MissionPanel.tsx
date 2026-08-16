import { useEffect, useState } from 'react';
import type { Aircraft, GameEvent, GameMode } from '../engine/types';
import { controllerRank, nextMission, type ShiftGoal, type TrainingGuide } from '../engine/progression';
import type { CoachAdvice } from '../engine/controllerCoach';

interface MissionPanelProps {
  aircraft: Aircraft[];
  mode: GameMode;
  scenarioLabel: string;
  scenarioBriefing: string;
  scenarioFocus: string;
  goal: ShiftGoal;
  score: number;
  landed: number;
  handoffs: number;
  trafficLevel: number;
  skill: number;
  peakSkill: number;
  targetAircraft: number;
  bestScore: number;
  bestLandings: number;
  completedShifts: number;
  completedObjectives: number;
  badgeCount: number;
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

export function MissionPanel({ aircraft, mode, scenarioLabel, scenarioBriefing, scenarioFocus, goal, score, landed, handoffs, trafficLevel, skill, peakSkill, targetAircraft, bestScore, bestLandings, completedShifts, completedObjectives, badgeCount, trainingCallsign, trainingRunway, priorityTraffic, events, activeFlowLabel, pendingInstructionCount, tutorial, onTutorialCommand, coach, onCoachCommand }: MissionPanelProps) {
  // Radar alanı ilk açılışta öncelikli. Yardım, oyuncunun isteğiyle açılır.
  const [helpOpen, setHelpOpen] = useState(mode === 'beginner');
  useEffect(() => {
    setHelpOpen(mode === 'beginner');
  }, [mode]);
  const trainingAircraft = aircraft.find((item) => item.callsign === trainingCallsign);
  const priorityMission = priorityTraffic.find((item) => item.priority && !item.priority.alertRaised);
  const mission = priorityMission
    ? `${priorityMission.callsign} öncelikli trafik. ${priorityMission.priority?.kind === 'minimumFuel' ? 'Minimum yakıt' : 'Tıbbi uçuş'}: yaklaşmayı hızlandır ve güvenli ilk iniş sırasına al.`
    : landed > 0
    ? nextMission(landed, score)
    : trainingAircraft?.approach?.status === 'tower'
      ? `${trainingCallsign} kuleye devredildi. Şimdi sıradaki gelişi heading, irtifa ve hızla final sırasına al.`
      : trainingAircraft?.approach?.status === 'glideslope'
        ? `${trainingCallsign} established. Kule devri otomatik; sıradaki trafiğe geç.`
        : trainingAircraft?.approach?.status === 'localizer'
          ? `${trainingCallsign} localizer üzerinde. Glideslope'u aşağıdan yakalat.`
          : `İlk görev: ${trainingCallsign ?? 'ilk geliş'} için ILS ${trainingRunway ?? ''} silahlandır. LAND komutu gerekmez.`;

  return (
    <section className="mission-panel" aria-label="Oyun görevi ve skor">
      <div className="mission-primary">
        <span className="eyebrow">GÖREV</span>
        <strong>{mission}</strong>
        <small className="mission-briefing"><b>{scenarioLabel}</b> · {scenarioBriefing} <em>Odak: {scenarioFocus}</em></small>
        {mode === 'beginner' && tutorial?.command ? (
          <button type="button" className="mission-primary__action" onClick={() => onTutorialCommand(tutorial)}>
            {tutorial.command} · İLK ADIMI UYGULA
          </button>
        ) : null}
      </div>
      <div className="mission-score" aria-label={`Skill ${skill}, tamamlanan iniş ${landed}, handoff ${handoffs}`}>
        <span>SKILL <b>{skill.toFixed(1)}</b></span>
        <span>PEAK <b>{peakSkill.toFixed(1)}</b></span>
        <span>HEDEF <b>{aircraft.length}/{targetAircraft}</b></span>
        <span>İNİŞ <b>{landed}</b></span>
        <span>HANDOFF <b>{handoffs}</b></span>
        <span>VARDİYA <b>{landed}/{goal.targetLandings} · {handoffs}/{goal.targetHandoffs}</b></span>
        <span>YOĞUNLUK <b>{trafficLevel}/5</b></span>
        <span>AKIŞ <b>{activeFlowLabel}</b></span>
        {pendingInstructionCount > 0 ? <span>READBACK <b>{pendingInstructionCount}</b></span> : null}
        <span>KARİYER <b>{controllerRank(bestScore)} · {bestLandings} İNİŞ · {completedObjectives}/{completedShifts} HEDEF · {badgeCount} ROZET</b></span>
      </div>
      <div className="mission-event" aria-live="polite">
        {events.at(-1)?.message ?? 'Radar sahası izleniyor.'}
      </div>
      <details className="assistant-drawer" open={helpOpen} onToggle={(event) => setHelpOpen(event.currentTarget.open)}>
        <summary>YARDIM / KOÇ <span>{coach.title}</span></summary>
        <div className="assistant-drawer__content">
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
        </div>
      </details>
    </section>
  );
}
