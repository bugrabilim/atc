import type { Aircraft, GameEvent } from '../engine/types';

interface MissionPanelProps {
  aircraft: Aircraft[];
  score: number;
  landed: number;
  events: GameEvent[];
}

export function MissionPanel({ aircraft, score, landed, events }: MissionPanelProps) {
  const trainingAircraft = aircraft.find((item) => item.callsign === 'TK1953');
  const approachCaptured = trainingAircraft?.approach?.status === 'captured';
  const mission = landed > 0
    ? 'Trafiği ayır, gelişleri ILS yaklaşmasına yönlendir.'
    : approachCaptured
      ? 'TK1953 localizer ve glideslope üzerinde. Pisti takip et.'
      : 'İlk görev: TK1953 için ILS 34L komutunu ver.';

  return (
    <section className="mission-panel" aria-label="Oyun görevi ve skor">
      <div className="mission-primary">
        <span className="eyebrow">GÖREV</span>
        <strong>{mission}</strong>
      </div>
      <div className="mission-score" aria-label={`Skor ${score}, tamamlanan iniş ${landed}`}>
        <span>SKOR <b>{score}</b></span>
        <span>İNİŞ <b>{landed}</b></span>
      </div>
      <div className="mission-event" aria-live="polite">
        {events.at(-1)?.message ?? 'Radar sahası izleniyor.'}
      </div>
    </section>
  );
}
