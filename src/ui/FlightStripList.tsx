import { aircraftTrend } from '../engine/simulation';
import type { Aircraft, Conflict } from '../engine/types';

interface FlightStripListProps {
  aircraft: Aircraft[];
  conflicts: Conflict[];
  selectedCallsign: string | null;
  onSelect: (callsign: string) => void;
}

export function FlightStripList({ aircraft, conflicts, selectedCallsign, onSelect }: FlightStripListProps) {
  return (
    <aside className="flight-panel" aria-label="Aktif uçuşlar">
      <div className="panel-heading">
        <span>AKTİF UÇUŞLAR</span>
        <span className="panel-count">{aircraft.length}</span>
      </div>
      <div className="flight-list">
        {aircraft.map((item) => {
          const selected = item.callsign === selectedCallsign;
          const conflict = conflicts.find((entry) => entry.pair.includes(item.callsign));
          const trend = aircraftTrend(item);
          return (
            <button
              key={item.callsign}
              type="button"
              className={`flight-strip${selected ? ' is-selected' : ''}${conflict ? ' has-conflict' : ''}`}
              onClick={() => onSelect(item.callsign)}
              aria-pressed={selected}
            >
              <span className="flight-strip__lead">
                <strong>{item.callsign}</strong>
                <small>{item.type} · {item.approach ? `ILS ${item.approach.runwayId}` : item.phase === 'arrival' ? 'GELİŞ' : 'KALKIŞ'}</small>
              </span>
              <span className="flight-strip__numbers">
                <b>FL{String(Math.round(item.altitude / 100)).padStart(3, '0')}</b>
                <small>{trend === 'climb' ? '↑' : trend === 'descend' ? '↓' : '—'} {Math.round(item.speed)} KT</small>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
