import { useEffect, useRef, useState } from 'react';
import { difficultyConfig } from '../engine/difficulty';
import type { Aircraft, GameMode, Procedure } from '../engine/types';
import type { CoachAdvice } from '../engine/controllerCoach';

interface CommandPanelProps {
  aircraft: Aircraft[];
  runwayIds: string[];
  fixIds: string[];
  procedures: Procedure[];
  selectedCallsign: string | null;
  mode: GameMode;
  coach: CoachAdvice;
  value: string;
  feedback: { type: 'success' | 'error' | 'info'; message: string };
  onChange: (value: string) => void;
  onSubmit: () => void;
  onQuickCommand: (command: string) => boolean;
  onCoachCommand: (advice: CoachAdvice) => void;
  onSelect: (callsign: string) => void;
  onNext: () => void;
  onClose: () => void;
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
  procedures,
  selectedCallsign,
  mode,
  coach,
  value,
  feedback,
  onChange,
  onSubmit,
  onQuickCommand,
  onCoachCommand,
  onSelect,
  onNext,
  onClose,
}: CommandPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [activeVector, setActiveVector] = useState<'heading' | 'altitude' | 'speed'>('heading');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const previousSelectedCallsign = useRef(selectedCallsign);
  const selected = aircraft.find((item) => item.callsign === selectedCallsign) ?? null;
  const modeConfig = difficultyConfig(mode);
  const primaryFix = fixIds.find((item) => item.startsWith('FINAL')) ?? fixIds[0];
  const matchingProcedure = selected ? procedures.find((item) => item.kind === selected.phase) : undefined;
  const quickCommands = [
    ...runwayIds.slice(0, 2).map((runwayId) => ({ label: `ILS ${runwayId}`, command: `ILS ${runwayId}` })),
    ...(mode !== 'beginner' ? runwayIds.slice(0, 2).map((runwayId) => ({ label: `LOC ${runwayId}`, command: `LOC ${runwayId}` })) : []),
    ...(modeConfig.showAdvancedCommands && primaryFix ? [{ label: `DCT ${primaryFix}`, command: `DCT ${primaryFix}` }, { label: `HOLD ${primaryFix}`, command: `HOLD ${primaryFix}` }] : []),
    ...(modeConfig.showAdvancedCommands && matchingProcedure ? [{ label: `${matchingProcedure.kind === 'arrival' ? 'STAR' : 'SID'} ${matchingProcedure.id}`, command: `${matchingProcedure.kind === 'arrival' ? 'STAR' : 'SID'} ${matchingProcedure.id}` }] : []),
    ...(selected?.approach ? [{ label: 'GO-AROUND', command: 'GA' }] : []),
    ...(mode !== 'beginner' ? baseQuickCommands : [{ label: 'NORMAL SPD', command: 'RN' }]),
  ];

  useEffect(() => {
    if (selectedCallsign && previousSelectedCallsign.current !== selectedCallsign) setSheetExpanded(true);
    if (!selectedCallsign) setSheetExpanded(false);
    previousSelectedCallsign.current = selectedCallsign;
  }, [selectedCallsign]);

  const useQuickCommand = (command: string) => {
    if (!selectedCallsign) return;
    onQuickCommand(`${selectedCallsign} ${command}`);
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
    <section className={`command-panel${sheetExpanded ? ' is-expanded' : ' is-collapsed'}${selected ? ' has-selection' : ''}`} aria-label="ATC komut paneli">
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
        <div className="selected-aircraft__actions">
          <button type="button" className="next-aircraft" onClick={onNext}>SONRAKİ</button>
          <button type="button" className="sheet-expander" aria-expanded={sheetExpanded} onClick={() => setSheetExpanded((current) => !current)}>{sheetExpanded ? 'KAPAT ⌄' : 'KOMUTLAR ⌃'}</button>
          <button type="button" className="close-command-panel" aria-label="Komut panelini kapat" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="command-panel__body">
        <div className="vector-mode-tabs" role="tablist" aria-label="Kontrol türü">
          <button type="button" role="tab" aria-selected={activeVector === 'heading'} className={activeVector === 'heading' ? 'is-active' : ''} onClick={() => setActiveVector('heading')}><span>YÖN</span><b>{selected ? String(Math.round(selected.targetHeading)).padStart(3, '0') : '---'}°</b></button>
          <button type="button" role="tab" aria-selected={activeVector === 'altitude'} className={activeVector === 'altitude' ? 'is-active' : ''} onClick={() => setActiveVector('altitude')}><span>İRTİFA</span><b>{selected ? `FL${String(Math.round(selected.targetAltitude / 100)).padStart(3, '0')}` : '---'}</b></button>
          <button type="button" role="tab" aria-selected={activeVector === 'speed'} className={activeVector === 'speed' ? 'is-active' : ''} onClick={() => setActiveVector('speed')}><span>HIZ</span><b>{selected ? Math.round(selected.targetSpeed) : '---'}</b></button>
        </div>
      <div className="command-panel__advanced is-open">
        <div className="vector-control" aria-label="Dokunmatik vektör kontrolleri">
          <div className={activeVector === 'heading' ? 'is-active' : ''} data-vector="heading"><span>HEADING</span><button type="button" disabled={!selected} onClick={() => relativeCommand('heading', -30)}>−30°</button><button type="button" disabled={!selected} onClick={() => relativeCommand('heading', -10)}>−10°</button><b>{selected ? String(Math.round(selected.targetHeading)).padStart(3, '0') : '---'}</b><button type="button" disabled={!selected} onClick={() => relativeCommand('heading', 10)}>+10°</button><button type="button" disabled={!selected} onClick={() => relativeCommand('heading', 30)}>+30°</button></div>
          <div className={activeVector === 'altitude' ? 'is-active' : ''} data-vector="altitude"><span>ALTITUDE</span><button type="button" disabled={!selected} onClick={() => relativeCommand('altitude', -1000)}>−1000</button><b>{selected ? `FL${String(Math.round(selected.targetAltitude / 100)).padStart(3, '0')}` : '---'}</b><button type="button" disabled={!selected} onClick={() => relativeCommand('altitude', 1000)}>+1000</button></div>
          <div className={activeVector === 'speed' ? 'is-active' : ''} data-vector="speed"><span>SPEED</span><button type="button" disabled={!selected} onClick={() => relativeCommand('speed', -20)}>−20</button><b>{selected ? Math.round(selected.targetSpeed) : '---'}</b><button type="button" disabled={!selected} onClick={() => relativeCommand('speed', 20)}>+20</button></div>
        </div>

        {coach.command && coach.callsign === selectedCallsign ? (
          <button type="button" className={`coach-command coach-command--${coach.tone}`} onClick={() => onCoachCommand(coach)}>
            <span>KOÇ · {coach.label}</span>
            <b>{coach.command}</b>
            <small>{coach.title}</small>
          </button>
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

      <button type="button" className="keyboard-toggle" aria-expanded={keyboardOpen} onClick={() => setKeyboardOpen((current) => !current)}>⌨ KOMUT SATIRI {keyboardOpen ? 'KAPAT' : 'AÇ'}</button>
      <div className={`command-entry${keyboardOpen ? ' is-open' : ''}`}>
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
      </div>
    </section>
  );
}
