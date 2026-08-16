import { useCallback, useEffect, useRef, useState } from 'react';
import { applyCommand, parseCommandLine } from '../engine/commands';
import { initialState, world } from '../engine/scenario';
import { landingClearanceStatus, stepGame } from '../engine/simulation';
import type { GameState } from '../engine/types';
import { CommandPanel } from './CommandPanel';
import { FlightStripList } from './FlightStripList';
import { MissionPanel } from './MissionPanel';
import { RadarScope } from './RadarScope';

interface CareerStats {
  bestScore: number;
  bestLandings: number;
}

const CAREER_STORAGE_KEY = 'istanbul-radar-career-v1';

function loadCareerStats(): CareerStats {
  try {
    const value = window.localStorage.getItem(CAREER_STORAGE_KEY);
    if (!value) return { bestScore: 0, bestLandings: 0 };
    const parsed = JSON.parse(value) as Partial<CareerStats>;
    return {
      bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : 0,
      bestLandings: typeof parsed.bestLandings === 'number' ? parsed.bestLandings : 0,
    };
  } catch {
    return { bestScore: 0, bestLandings: 0 };
  }
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function App() {
  const [state, setState] = useState<GameState>(() => structuredClone(initialState));
  const [career, setCareer] = useState<CareerStats>(loadCareerStats);
  const stateRef = useRef(state);
  const [command, setCommand] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string }>({
    type: 'info',
    message: 'Uçağa dokun, hızlı komut seç veya klavyeden komut yaz. “TK” + Tab ile çağrı kodunu tamamlayabilirsin.',
  });

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    setCareer((current) => {
      const next = {
        bestScore: Math.max(current.bestScore, state.score),
        bestLandings: Math.max(current.bestLandings, state.landed),
      };
      if (next.bestScore === current.bestScore && next.bestLandings === current.bestLandings) return current;
      window.localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [state.landed, state.score]);

  useEffect(() => {
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - previous) / 1000;
      previous = now;
      setState((current) => stepGame(current, world, dt));
    }, 33);
    return () => window.clearInterval(timer);
  }, []);

  const selectAircraft = useCallback((callsign: string) => {
    setState((current) => ({ ...current, selectedCallsign: callsign }));
    setFeedback({ type: 'info', message: `${callsign} seçildi. Hedef komutu yazabilir veya hızlı komut kullanabilirsin.` });
  }, []);

  const submitCommand = useCallback(() => {
    const snapshot = stateRef.current;
    const parsed = parseCommandLine(
      command,
      snapshot.aircraft.map((item) => item.callsign),
      snapshot.selectedCallsign,
      world.runways.filter((item) => item.active && (item.operation === 'arrival' || item.operation === 'mixed')).map((item) => item.id),
      world.fixes.map((item) => item.id),
    );
    if (!parsed.ok) {
      setFeedback({ type: 'error', message: parsed.error });
      return;
    }
    if (parsed.command.kind === 'land') {
      const clearance = landingClearanceStatus(snapshot, parsed.command.callsign, world);
      if (!clearance.ok) {
        setFeedback({ type: 'error', message: clearance.message });
        return;
      }
    }
    setState((current) => ({
      ...current,
      selectedCallsign: parsed.command.callsign,
      aircraft: applyCommand(current.aircraft, parsed.command),
    }));
    setCommand('');
    setFeedback({
      type: 'success',
      message: parsed.command.kind === 'approach'
        ? `${parsed.normalized} · ILS silahlandı; localizer ve glideslope yakalanınca otomatik takip başlayacak.`
        : parsed.command.kind === 'direct'
          ? `${parsed.normalized} · Uçak waypoint'e doğrudan yönlendirildi.`
        : parsed.command.kind === 'hold'
          ? `${parsed.normalized} · Uçak waypoint üzerinde hold paternine girecek.`
          : parsed.command.kind === 'land'
            ? `${parsed.normalized} · Pist sıralaması doğrulandı; yaklaşmayı sürdür.`
          : `${parsed.normalized} · Talimat alındı, uçak kademeli uyguluyor.`,
    });
  }, [command]);

  const togglePause = () => setState((current) => ({ ...current, paused: !current.paused }));
  const cycleSpeed = () => setState((current) => ({ ...current, timeScale: current.timeScale === 1 ? 2 : current.timeScale === 2 ? 4 : 1 }));
  const reset = () => {
    setState(structuredClone(initialState));
    setCommand('');
    setFeedback({ type: 'info', message: 'Senaryo yeniden başlatıldı.' });
  };
  const severeConflicts = state.conflicts.filter((item) => item.severity === 'loss').length;

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">◉</span>
          <div>
            <strong>İSTANBUL RADAR</strong>
            <small>{world.sectorName}</small>
          </div>
        </div>
        <div className="top-status">
          <span><i className="status-dot" /> SİSTEM AKTİF</span>
          <span>AKTİF PİSTLER <b>34L · 35R · 36</b></span>
          <span>SAAT <b>{formatClock(state.elapsedSeconds)}</b></span>
        </div>
        <div className="session-actions">
          <button type="button" onClick={togglePause}>{state.paused ? 'DEVAM' : 'DURAKLAT'}</button>
          <button type="button" onClick={cycleSpeed}>{state.timeScale}×</button>
          <button type="button" onClick={reset}>YENİLE</button>
        </div>
      </header>

      <div className="game-status">
        {severeConflicts > 0 ? (
          <div className="conflict-banner" role="alert">AYIRMA KAYBI · ACİL MÜDAHALE GEREKİYOR</div>
        ) : null}
        <MissionPanel
          aircraft={state.aircraft}
          score={state.score}
          landed={state.landed}
          handoffs={state.handoffs}
          trafficLevel={state.trafficLevel}
          bestScore={career.bestScore}
          bestLandings={career.bestLandings}
          events={state.eventLog}
        />
      </div>

      <div className="workspace">
        <RadarScope
          world={world}
          aircraft={state.aircraft}
          conflicts={state.conflicts}
          selectedCallsign={state.selectedCallsign}
          onSelect={selectAircraft}
        />
        <FlightStripList
          aircraft={state.aircraft}
          conflicts={state.conflicts}
          selectedCallsign={state.selectedCallsign}
          onSelect={selectAircraft}
        />
      </div>

      <CommandPanel
        aircraft={state.aircraft}
        selectedCallsign={state.selectedCallsign}
        value={command}
        feedback={feedback}
        onChange={setCommand}
        onSubmit={submitCommand}
        onSelect={selectAircraft}
      />
    </main>
  );
}
