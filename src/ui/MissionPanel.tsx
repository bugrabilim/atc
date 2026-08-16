import type { Aircraft, GameEvent } from '../engine/types';
import { controllerRank, nextMission } from '../engine/progression';

interface MissionPanelProps {
  aircraft: Aircraft[];
  score: number;
  landed: number;
  handoffs: number;
  trafficLevel: number;
  bestScore: number;
  bestLandings: number;
  priorityTraffic: Aircraft[];
  events: GameEvent[];
}

export function MissionPanel({ aircraft, score, landed, handoffs, trafficLevel, bestScore, bestLandings, priorityTraffic, events }: MissionPanelProps) {
  const trainingAircraft = aircraft.find((item) => item.callsign === 'AR101');
  const approachCaptured = trainingAircraft?.approach?.status === 'captured';
  const landingCleared = trainingAircraft?.approach?.landingCleared;
  const priorityMission = priorityTraffic.find((item) => item.priority && !item.priority.alertRaised);
  const mission = priorityMission
    ? `${priorityMission.callsign} öncelikli trafik. ${priorityMission.priority?.kind === 'minimumFuel' ? 'Minimum yakıt' : 'Tıbbi uçuş'}: yaklaşmayı hızlandır ve güvenli ilk iniş sırasına al.`
    : landed > 0
    ? nextMission(landed, score)
    : approachCaptured && !landingCleared
      ? 'AR101 ILS üzerinde. Pist geçmeden LAND komutuyla iniş izni ver.'
    : approachCaptured
      ? 'AR101 localizer ve glideslope üzerinde. Pisti takip et.'
      : 'İlk görev: AR101 için ILS 34L komutunu ver. Diğer trafikte DCT ve HOLD kullan.';

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
        <span>KARİYER <b>{controllerRank(bestScore)} · {bestLandings} İNİŞ</b></span>
      </div>
      <div className="mission-event" aria-live="polite">
        {events.at(-1)?.message ?? 'Radar sahası izleniyor.'}
      </div>
    </section>
  );
}
