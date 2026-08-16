import { useRef } from 'react';
import type { Aircraft } from '../engine/types';

interface CommandPanelProps {
  aircraft: Aircraft[];
  runwayIds: string[];
  fixIds: string[];
  selectedCallsign: string | null;
  value: string;
  feedback: { type: 'success' | 'error' | 'info'; message: string };
  onChange: (value: string) => void;
  onSubmit: () => void;
  onSelect: (callsign: string) => void;
  onNext: () => void;
}

const baseQuickCommands = [
  { label: 'NORMAL SPD', command: 'RN' },
  { label: 'EXPEDITE', command: 'X' },
  { label: 'HANDOFF', command: 'HANDOFF' },
];

export function CommandPanel({
  aircraft,
  runwayIds,
  fixIds,
  selectedCallsign,
  value,
  feedback,
  onChange,
  onSubmit,
  onSelect,
  onNext,
}: CommandPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = aircraft.find((item) => item.callsign === selectedCallsign) ?? null;
  const primaryFix = fixIds.find((item) => item.startsWith('FINAL')) ?? fixIds[0];
  const quickCommands = [
    ...(primaryFix ? [{ label: `DCT ${primaryFix}`, command: `DCT ${primaryFix}` }, { label: `HOLD ${primaryFix}`, command: `HOLD ${primaryFix}` }] : []),
    ...runwayIds.slice(0, 2).map((runwayId) => ({ label: `ILS ${runwayId}`, command: `ILS ${runwayId}` })),
    ...runwayIds.slice(0, 2).map((runwayId) => ({ label: `LOC ${runwayId}`, command: `LOC ${runwayId}` })),
    ...baseQuickCommands,
  ];

  const useQuickCommand = (command: string) => {
    if (!selectedCallsign) return;
    onChange(`${selectedCallsign} ${command}`);
    inputRef.current?.focus();
  };

  const relativeCommand = (kind: 'heading' | 'altitude' | 'speed', delta: number) => {
    if (!selected) return;
    const command = kind === 'heading'
      ? `H${String((Math.round(selected.heading / 10) * 10 + delta + 360) % 360).padStart(3, '0')}`
      : kind === 'altitude'
        ? `A${Math.max(10, Math.min(450, Math.round((selected.targetAltitude + delta) / 100)))}`
        : `S${Math.max(selected.performance.minSpeed, Math.min(selected.performance.maxSpeed, Math.round(selected.targetSpeed + delta)))}`;
    useQuickCommand(command);
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
            <span>GS <b>{Math.round(selected.groundSpeed)}</b></span>
            <span>WTC <b>{selected.wakeCategory}</b></span>
          </div>
        ) : null}
        <button type="button" className="next-aircraft" onClick={onNext}>SONRAKİ · TAB</button>
      </div>

      <div className="vector-control" aria-label="Dokunmatik vektör kontrolleri">
        <div><span>HEADING</span><button type="button" disabled={!selected} onClick={() => relativeCommand('heading', -30)}>−30°</button><button type="button" disabled={!selected} onClick={() => relativeCommand('heading', -10)}>−10°</button><b>{selected ? String(Math.round(selected.targetHeading)).padStart(3, '0') : '---'}</b><button type="button" disabled={!selected} onClick={() => relativeCommand('heading', 10)}>+10°</button><button type="button" disabled={!selected} onClick={() => relativeCommand('heading', 30)}>+30°</button></div>
        <div><span>ALTITUDE</span><button type="button" disabled={!selected} onClick={() => relativeCommand('altitude', -1000)}>−1000</button><b>{selected ? `FL${String(Math.round(selected.targetAltitude / 100)).padStart(3, '0')}` : '---'}</b><button type="button" disabled={!selected} onClick={() => relativeCommand('altitude', 1000)}>+1000</button></div>
        <div><span>SPEED</span><button type="button" disabled={!selected} onClick={() => relativeCommand('speed', -20)}>−20</button><b>{selected ? Math.round(selected.targetSpeed) : '---'}</b><button type="button" disabled={!selected} onClick={() => relativeCommand('speed', 20)}>+20</button></div>
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
        placeholder={selectedCallsign ? `${selectedCallsign} H090 A30 S180 I${runwayIds[0] ?? '---'} · birleşik komut yazabilirsin` : 'Uçağa dokun veya çağrı kodunu yaz'}
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
