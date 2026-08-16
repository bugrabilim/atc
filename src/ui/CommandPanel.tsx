import { useRef } from 'react';
import type { Aircraft } from '../engine/types';

interface CommandPanelProps {
  aircraft: Aircraft[];
  selectedCallsign: string | null;
  value: string;
  feedback: { type: 'success' | 'error' | 'info'; message: string };
  onChange: (value: string) => void;
  onSubmit: () => void;
  onSelect: (callsign: string) => void;
}

const quickCommands = [
  { label: 'HDG 090', command: 'HDG 090' },
  { label: 'HDG 180', command: 'HDG 180' },
  { label: 'FL060', command: 'FL060' },
  { label: 'FL100', command: 'FL100' },
  { label: 'SPD 220', command: 'SPD 220' },
  { label: 'SPD 180', command: 'SPD 180' },
  { label: 'DCT FM001', command: 'DCT FM001' },
  { label: 'HOLD FM001', command: 'HOLD FM001' },
  { label: 'ILS 34L', command: 'ILS 34L' },
  { label: 'ILS 35R', command: 'ILS 35R' },
  { label: 'CLEARED LAND', command: 'LAND' },
];

export function CommandPanel({
  aircraft,
  selectedCallsign,
  value,
  feedback,
  onChange,
  onSubmit,
  onSelect,
}: CommandPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = aircraft.find((item) => item.callsign === selectedCallsign) ?? null;

  const useQuickCommand = (command: string) => {
    if (!selectedCallsign) return;
    onChange(`${selectedCallsign} ${command}`);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSubmit();
      return;
    }
    if (event.key === 'Tab') {
      const firstToken = value.trim().toUpperCase().split(/\s+/)[0] ?? '';
      const match = aircraft.find((item) => item.callsign.startsWith(firstToken));
      if (match && firstToken !== match.callsign) {
        event.preventDefault();
        onSelect(match.callsign);
        const remainder = value.trim().slice(firstToken.length).trimStart();
        onChange(`${match.callsign}${remainder ? ` ${remainder}` : ' '}`);
      }
    }
  };

  return (
    <section className="command-panel" aria-label="ATC komut paneli">
      <div className="selected-aircraft">
        <div>
          <span className="eyebrow">SEÇİLİ UÇAK</span>
          <strong>{selected?.callsign ?? 'UÇAK SEÇ'}</strong>
        </div>
        {selected ? (
          <div className="selected-aircraft__metrics">
            <span>HDG <b>{String(Math.round(selected.heading)).padStart(3, '0')}</b></span>
            <span>FL <b>{String(Math.round(selected.altitude / 100)).padStart(3, '0')}</b></span>
            <span>SPD <b>{Math.round(selected.speed)}</b></span>
          </div>
        ) : null}
      </div>

      <div className="quick-command-row" aria-label="Hızlı komutlar">
        {quickCommands.map((item) => (
          <button
            key={item.label}
            type="button"
            className="quick-command"
            disabled={!selectedCallsign}
            onClick={() => useQuickCommand(item.command)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="command-entry">
        <span className="command-prompt" aria-hidden="true">›</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        placeholder={selectedCallsign ? `${selectedCallsign} HDG 090 · ILS 34L` : 'Uçağa dokun veya çağrı kodunu yaz'}
          aria-label="Komut satırı"
        />
        <button type="button" className="send-command" onClick={onSubmit}>UYGULA</button>
      </div>
      <div className={`command-feedback command-feedback--${feedback.type}`} role="status">
        {feedback.message}
      </div>
    </section>
  );
}
