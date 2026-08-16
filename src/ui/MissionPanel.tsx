import type { Aircraft, GameEvent } from '../engine/types';

interface MissionPanelProps {
  aircraft: Aircraft[];
  score: number;
  landed: number;
  handoffs: number;
  trafficLevel: number;
  events: GameEvent[];
}

export function MissionPanel({ aircraft, score, landed, handoffs, trafficLevel, events }: MissionPanelProps) {
  const trainingAircraft = aircraft.find((item) => item.callsign === 'TK1953');
  const approachCaptured = trainingAircraft?.approach?.status === 'captured';
  const landingCleared = trainingAircraft?.approach?.landingCleared;
  const mission = landed > 0
    ? 'Trafiği ayır, gelişleri ILS yaklaşmasına yönlendir.'
    : approachCaptured && !landingCleared
      ? 'TK1953 ILS üzerinde. Pist geçmeden LAND komutuyla iniş izni ver.'
    : approachCaptured
      ? 'TK1953 localizer ve glideslope üzerinde. Pisti takip et.'
      : 'İlk görev: TK1953 için ILS 34L komutunu ver. Diğer trafikte DCT ve HOLD kullan.';

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
      </div>
      <div className="mission-event" aria-live="polite">
        {events.at(-1)?.message ?? 'Radar sahası izleniyor.'}
      </div>
    </section>
  );
}
