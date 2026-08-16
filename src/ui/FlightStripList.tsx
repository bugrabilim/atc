import { aircraftTrend } from '../engine/simulation';
import { activeFixId } from '../engine/navigation';
import { arrivalAdvice } from '../engine/arrivalAdvisor';
import type { Aircraft, Conflict, RadarWorld } from '../engine/types';

interface FlightStripListProps {
  aircraft: Aircraft[];
  conflicts: Conflict[];
  selectedCallsign: string | null;
  elapsedSeconds: number;
  world: RadarWorld;
  onSelect: (callsign: string) => void;
}

export function FlightStripList({ aircraft, conflicts, selectedCallsign, elapsedSeconds, world, onSelect }: FlightStripListProps) {
  const advice = arrivalAdvice(aircraft, world);
  const sortedAircraft = [...aircraft].sort((first, second) => {
    const firstConflict = conflicts.some((entry) => entry.pair.includes(first.callsign));
    const secondConflict = conflicts.some((entry) => entry.pair.includes(second.callsign));
    if (firstConflict !== secondConflict) return firstConflict ? -1 : 1;
    if (Boolean(first.priority) !== Boolean(second.priority)) return first.priority ? -1 : 1;
    const firstAdvice = advice.get(first.callsign);
    const secondAdvice = advice.get(second.callsign);
    if (firstAdvice && secondAdvice) {
      if (firstAdvice.runwayId !== secondAdvice.runwayId) return firstAdvice.runwayId.localeCompare(secondAdvice.runwayId);
      return firstAdvice.sequence - secondAdvice.sequence;
    }
    if (firstAdvice) return -1;
    if (secondAdvice) return 1;
    return first.callsign.localeCompare(second.callsign);
  });
  return (
    <aside className="flight-panel" aria-label="Aktif uçuşlar">
      <div className="panel-heading">
        <span>AKTİF UÇUŞLAR</span>
        <span className="panel-count">{aircraft.length}</span>
      </div>
      <div className="flight-list">
        {sortedAircraft.map((item) => {
          const selected = item.callsign === selectedCallsign;
          const conflict = conflicts.find((entry) => entry.pair.includes(item.callsign));
          const trend = aircraftTrend(item);
          const nextFix = activeFixId(item);
          const arrival = advice.get(item.callsign);
          return (
            <button
              key={item.callsign}
              type="button"
              className={`flight-strip${selected ? ' is-selected' : ''}${conflict ? ' has-conflict' : ''}`}
              onClick={() => onSelect(item.callsign)}
              aria-pressed={selected}
              aria-label={`${item.callsign}, FL${String(Math.round(item.altitude / 100)).padStart(3, '0')}, ${Math.round(item.speed)} knot${conflict ? ', ayırma uyarısı' : ''}${item.priority ? ', öncelikli trafik' : ''}`}
            >
              <span className="flight-strip__lead">
                <strong>{item.callsign}</strong>
                <small>{item.type} · WTC {item.wakeCategory} · {item.priority ? `ÖNCELİK ${Math.max(0, Math.ceil(item.priority.deadlineAt - elapsedSeconds))}sn` : item.approach ? `${item.approach.status.toUpperCase()} ${item.approach.runwayId}` : item.handoffCleared ? 'HANDOFF ONAYLI' : arrival ? `${arrival.runwayId} · SIRA ${arrival.sequence} · ${arrival.etaSeconds}s${arrival.spacingRisk ? ` · WAKE ${arrival.leaderCallsign}` : ''}` : nextFix ? `${item.navigation?.mode === 'hold' ? 'HOLD' : '→'} ${nextFix}` : 'KALKIŞ'}</small>
              </span>
              <span className="flight-strip__numbers">
                <b>FL{String(Math.round(item.altitude / 100)).padStart(3, '0')}</b>
                <small>{arrival?.spacingRisk && arrival.recommendedSpeed ? `S${arrival.recommendedSpeed} · ` : ''}{arrival?.shouldDescend ? `↓ FL${String(Math.round(arrival.recommendedAltitude / 100)).padStart(3, '0')}` : trend === 'climb' ? '↑' : trend === 'descend' ? '↓' : '—'} {Math.round(item.speed)}/{Math.round(item.groundSpeed)} KT{item.speedMode === 'assigned' ? ' A' : ' N'}{arrival?.crosswindKt ? ` · XW${arrival.crosswindKt}` : ''}</small>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
