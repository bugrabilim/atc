import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseCommandLine } from '../engine/commands';
import { queueInstruction } from '../engine/radio';
import { createInitialState, defaultScenario, scenarioCatalog, worldWithFlow } from '../engine/scenario';
import { landingClearanceStatus, stepGame } from '../engine/simulation';
import type { GameState } from '../engine/types';
import type { GameScenario } from '../engine/scenario';
import { CommandPanel } from './CommandPanel';
import { DebriefPanel } from './DebriefPanel';
import { FlightStripList } from './FlightStripList';
import { MissionPanel } from './MissionPanel';
import { RadarScope } from './RadarScope';
import { buildDebrief } from '../engine/progression';

interface CareerStats {
  bestScore: number;
  bestLandings: number;
}

const CAREER_STORAGE_KEY = 'airspace-control-career-v1';

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
  const [scenario, setScenario] = useState<GameScenario>(defaultScenario);
  const [state, setState] = useState<GameState>(() => createInitialState(defaultScenario));
  const [career, setCareer] = useState<CareerStats>(loadCareerStats);
  const stateRef = useRef(state);
  const [command, setCommand] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string }>({
    type: 'info',
    message: 'Uçağa dokun, hızlı komut seç veya klavyeden komut yaz. Çağrı kodunun ilk harflerini yazıp Tab ile tamamlayabilirsin.',
  });
  const [debriefOpen, setDebriefOpen] = useState(false);
  const activeWorld = useMemo(() => worldWithFlow(scenario.world, state.flowId), [scenario.world, state.flowId]);
  const activeFlow = activeWorld.flowConfigurations.find((item) => item.id === state.flowId) ?? activeWorld.flowConfigurations[0];
  const activeArrivalRunways = activeWorld.runways.filter((item) => item.active && (item.operation === 'arrival' || item.operation === 'mixed'));
  const trainingAircraft = scenario.initialAircraft.find((item) => item.phase === 'arrival');

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
      setState((current) => stepGame(current, activeWorld, dt));
    }, 33);
    return () => window.clearInterval(timer);
  }, [activeWorld]);

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
      activeArrivalRunways.map((item) => item.id),
      activeWorld.fixes.map((item) => item.id),
    );
    if (!parsed.ok) {
      setFeedback({ type: 'error', message: parsed.error });
      return;
    }
    if (parsed.command.kind === 'land') {
      const clearance = landingClearanceStatus(snapshot, parsed.command.callsign, activeWorld);
      if (!clearance.ok) {
        setFeedback({ type: 'error', message: clearance.message });
        return;
      }
    }
    setState((current) => ({
      ...queueInstruction(current, parsed.command, parsed.normalized),
      selectedCallsign: parsed.command.callsign,
    }));
    setCommand('');
    setFeedback({
      type: 'success',
      message: parsed.command.kind === 'approach'
        ? `${parsed.normalized} · pilot readback verdi; kısa süre sonra ILS silahlanacak.`
        : parsed.command.kind === 'direct'
          ? `${parsed.normalized} · pilot readback verdi; doğrudan rota birazdan uygulanacak.`
        : parsed.command.kind === 'hold'
            ? `${parsed.normalized} · pilot readback verdi; hold talimatı birazdan uygulanacak.`
          : parsed.command.kind === 'land'
              ? `${parsed.normalized} · iniş izni readback ile onaylandı.`
              : `${parsed.normalized} · pilot readback verdi; uçak talimatı kademeli uygulayacak.`,
    });
  }, [activeArrivalRunways, activeWorld, command]);

  const togglePause = () => setState((current) => ({ ...current, paused: !current.paused }));
  const cycleSpeed = () => setState((current) => ({ ...current, timeScale: current.timeScale === 1 ? 2 : current.timeScale === 2 ? 4 : 1 }));
  const reset = () => {
    setState(createInitialState(scenario));
    setCommand('');
    setFeedback({ type: 'info', message: 'Senaryo yeniden başlatıldı.' });
    setDebriefOpen(false);
  };
  const selectScenario = (nextScenario: GameScenario) => {
    setScenario(nextScenario);
    setState(createInitialState(nextScenario));
    setCommand('');
    setFeedback({ type: 'info', message: `${nextScenario.label} sektörü yüklendi.` });
    setDebriefOpen(false);
  };
  const selectFlow = (flowId: string) => {
    const flow = scenario.world.flowConfigurations.find((item) => item.id === flowId);
    if (!flow) return;
    setState((current) => ({ ...current, flowId }));
    setFeedback({ type: 'info', message: `${flow.label} operasyonu aktif. Yeni trafik bu pist akışına göre planlanacak.` });
  };
  const severeConflicts = state.conflicts.filter((item) => item.severity === 'loss').length;
  const endShift = () => {
    setState((current) => ({ ...current, paused: true }));
    setDebriefOpen(true);
  };
  const continueShift = () => {
    setState((current) => ({ ...current, paused: false }));
    setDebriefOpen(false);
  };

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">◉</span>
          <div>
            <strong>AIRSPACE CONTROL</strong>
            <small>{activeWorld.sectorName}</small>
          </div>
        </div>
        <div className="top-status">
          <span><i className="status-dot" /> SİSTEM AKTİF</span>
          <span>AKTİF PİSTLER <b>{activeWorld.runways.filter((item) => item.active).map((item) => item.id).join(' · ')}</b></span>
          <span>SAAT <b>{formatClock(state.elapsedSeconds)}</b></span>
        </div>
        <div className="session-actions">
          {scenarioCatalog.map((item) => (
            <button key={item.id} type="button" className={item.id === scenario.id ? 'is-active' : ''} onClick={() => selectScenario(item)}>{item.id === 'alpha' ? 'ALPHA' : 'COASTAL'}</button>
          ))}
          <button type="button" onClick={togglePause}>{state.paused ? 'DEVAM' : 'DURAKLAT'}</button>
          <button type="button" onClick={cycleSpeed}>{state.timeScale}×</button>
          <button type="button" onClick={endShift}>BİTİR</button>
          <button type="button" onClick={reset}>YENİLE</button>
        </div>
      </header>

      <div className="operation-bar" aria-label="Operasyon ve hava koşulları">
        <span className="eyebrow">OPERASYON</span>
        <label>
          Pist akışı
          <select value={state.flowId} onChange={(event) => selectFlow(event.target.value)}>
            {activeWorld.flowConfigurations.map((flow) => <option key={flow.id} value={flow.id}>{flow.label}</option>)}
          </select>
        </label>
        {activeFlow ? <span>RÜZGÂR <b>{String(activeFlow.windDirection).padStart(3, '0')}°/{activeFlow.windSpeedKt}KT</b></span> : null}
        {activeFlow ? <span>GÖRÜŞ <b>{activeFlow.visibilityNm}NM</b></span> : null}
        {activeFlow ? <span>QNH <b>{activeFlow.qnh}</b></span> : null}
      </div>

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
          trainingCallsign={trainingAircraft?.callsign ?? null}
          trainingRunway={trainingAircraft?.assignedRunway ?? null}
          priorityTraffic={state.aircraft.filter((item) => item.priority)}
          events={state.eventLog}
          activeFlowLabel={activeFlow?.label ?? 'STANDART'}
          pendingInstructionCount={state.pendingInstructions.length}
        />
      </div>

      <div className="workspace">
        <RadarScope
          world={activeWorld}
          aircraft={state.aircraft}
          conflicts={state.conflicts}
          trackHistory={state.trackHistory}
          pendingCallsigns={state.pendingInstructions.map((item) => item.command.callsign)}
          selectedCallsign={state.selectedCallsign}
          onSelect={selectAircraft}
        />
        <FlightStripList
          aircraft={state.aircraft}
          conflicts={state.conflicts}
          world={activeWorld}
          selectedCallsign={state.selectedCallsign}
          elapsedSeconds={state.elapsedSeconds}
          onSelect={selectAircraft}
        />
      </div>

      <CommandPanel
        aircraft={state.aircraft}
        runwayIds={activeArrivalRunways.map((item) => item.id)}
        fixIds={activeWorld.fixes.map((item) => item.id)}
        selectedCallsign={state.selectedCallsign}
        value={command}
        feedback={feedback}
        onChange={setCommand}
        onSubmit={submitCommand}
        onSelect={selectAircraft}
      />
      {debriefOpen ? <DebriefPanel report={buildDebrief(state)} state={state} onRestart={reset} onContinue={continueShift} /> : null}
    </main>
  );
}
