import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseCommandBatch } from '../engine/commands';
import { queueInstructions, spokenRadioMessage } from '../engine/radio';
import { createInitialState, defaultScenario, scenarioCatalog, worldWithFlow } from '../engine/scenario';
import { stepGame } from '../engine/simulation';
import type { GameMode, GameState } from '../engine/types';
import type { GameScenario } from '../engine/scenario';
import { CommandPanel } from './CommandPanel';
import { DebriefPanel } from './DebriefPanel';
import { FlightStripList } from './FlightStripList';
import { MissionPanel } from './MissionPanel';
import { RadarScope } from './RadarScope';
import { ACHIEVEMENT_TOTAL, buildDebrief, careerProgression, earnedAwards, goalComplete, isAchievementId, shiftGoal, trainingGuide, type TrainingGuide } from '../engine/progression';
import { controllerCoach, type CoachAdvice } from '../engine/controllerCoach';
import { restoreSession, serializeSession, type SavedSession } from '../engine/session';
import { AudioCuePlayer, type AudioCue } from './audioCues';
import { DIFFICULTY_MODES, difficultyConfig, worldForMode } from '../engine/difficulty';

interface CareerStats {
  bestScore: number;
  bestLandings: number;
  completedShifts: number;
  completedObjectives: number;
  badges: string[];
  scenarioBestScores: Record<string, number>;
}

const CAREER_STORAGE_KEY = 'airspace-control-career-v1';
const SESSION_STORAGE_KEY = 'airspace-control-session-v1';

function loadCareerStats(): CareerStats {
  try {
    const value = window.localStorage.getItem(CAREER_STORAGE_KEY);
    if (!value) return { bestScore: 0, bestLandings: 0, completedShifts: 0, completedObjectives: 0, badges: [], scenarioBestScores: {} };
    const parsed = JSON.parse(value) as Partial<CareerStats>;
    return {
      bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : 0,
      bestLandings: typeof parsed.bestLandings === 'number' ? parsed.bestLandings : 0,
      completedShifts: typeof parsed.completedShifts === 'number' ? parsed.completedShifts : 0,
      completedObjectives: typeof parsed.completedObjectives === 'number' ? parsed.completedObjectives : 0,
      badges: Array.isArray(parsed.badges) ? [...new Set(parsed.badges.filter((item): item is string => typeof item === 'string' && isAchievementId(item)))] : [],
      scenarioBestScores: parsed.scenarioBestScores && typeof parsed.scenarioBestScores === 'object'
        ? Object.fromEntries(Object.entries(parsed.scenarioBestScores).filter(([, score]) => typeof score === 'number' && Number.isFinite(score) && score >= 0))
        : {},
    };
  } catch {
    return { bestScore: 0, bestLandings: 0, completedShifts: 0, completedObjectives: 0, badges: [], scenarioBestScores: {} };
  }
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function loadSavedSession(): SavedSession | null {
  try {
    return restoreSession(window.localStorage.getItem(SESSION_STORAGE_KEY), scenarioCatalog);
  } catch {
    return null;
  }
}

export function App() {
  const [savedSession] = useState<SavedSession | null>(loadSavedSession);
  const [scenario, setScenario] = useState<GameScenario>(() => scenarioCatalog.find((item) => item.id === savedSession?.scenarioId) ?? defaultScenario);
  const [state, setState] = useState<GameState>(() => savedSession?.state ?? createInitialState(defaultScenario, 'beginner'));
  const [career, setCareer] = useState<CareerStats>(loadCareerStats);
  const stateRef = useRef(state);
  const scenarioRef = useRef(scenario);
  const careerRef = useRef(career);
  const [command, setCommand] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string }>({
    type: 'info',
    message: savedSession ? 'Kaydedilmiş vardiya duraklatıldı. Devam ile aynı trafikten sürdürebilirsin.' : 'Uçağa dokun, hızlı komut seç veya klavyeden komut yaz. Çağrı kodunun ilk harflerini yazıp Tab ile tamamlayabilirsin.',
  });
  const [debriefOpen, setDebriefOpen] = useState(false);
  const [newAchievementIds, setNewAchievementIds] = useState<string[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const lastSpokenEvent = useRef<string | null>(null);
  const lastCuedEvent = useRef<string | null>(null);
  const shiftRecorded = useRef(false);
  const audioPlayer = useRef<AudioCuePlayer | null>(null);
  const activeWorld = useMemo(() => worldWithFlow(worldForMode(scenario.world, state.mode), state.flowId, state.peakSkill), [scenario.world, state.flowId, state.mode, state.peakSkill]);
  const activeFlow = activeWorld.flowConfigurations.find((item) => item.id === state.flowId) ?? activeWorld.flowConfigurations[0];
  const goal = useMemo(() => shiftGoal(state.mode), [state.mode]);
  const progression = useMemo(() => careerProgression(career.badges, career.scenarioBestScores), [career.badges, career.scenarioBestScores]);
  const activeArrivalRunways = activeWorld.runways.filter((item) => item.active && (item.operation === 'arrival' || item.operation === 'mixed'));
  const trainingAircraft = scenario.initialAircraft.find((item) => item.phase === 'arrival');

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    scenarioRef.current = scenario;
  }, [scenario]);

  useEffect(() => {
    careerRef.current = career;
  }, [career]);

  const persistSession = useCallback(() => {
    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, serializeSession(scenarioRef.current.id, stateRef.current));
    } catch {
      // Storage can be unavailable in private or quota-limited browser contexts.
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(persistSession, 3000);
    window.addEventListener('beforeunload', persistSession);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('beforeunload', persistSession);
      persistSession();
    };
  }, [persistSession]);

  useEffect(() => {
    setCareer((current) => {
      const next = {
        ...current,
        bestScore: Math.max(current.bestScore, state.score),
        bestLandings: Math.max(current.bestLandings, state.landed),
        scenarioBestScores: {
          ...current.scenarioBestScores,
          [scenario.id]: Math.max(current.scenarioBestScores[scenario.id] ?? 0, state.score),
        },
      };
      if (next.bestScore === current.bestScore && next.bestLandings === current.bestLandings && next.scenarioBestScores[scenario.id] === current.scenarioBestScores[scenario.id]) return current;
      window.localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [scenario.id, state.landed, state.score]);

  useEffect(() => {
    if (!debriefOpen || shiftRecorded.current) return;
    shiftRecorded.current = true;
    const objectiveComplete = goalComplete(state, goal);
    const awards = earnedAwards(state, goal);
    setNewAchievementIds(awards.map((award) => award.id).filter((id) => !careerRef.current.badges.includes(id)));
    setCareer((current) => {
      const next = {
        ...current,
        completedShifts: current.completedShifts + 1,
        completedObjectives: current.completedObjectives + (objectiveComplete ? 1 : 0),
        badges: [...new Set([...current.badges, ...awards.map((award) => award.id)])],
      };
      window.localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [debriefOpen, goal, state]);

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

  useEffect(() => {
    if (!debriefOpen && goalComplete(state, goal)) {
      setState((current) => ({ ...current, paused: true }));
      setDebriefOpen(true);
    }
  }, [debriefOpen, goal, state]);

  const playCue = useCallback((cue: AudioCue) => {
    if (!audioEnabled) return;
    audioPlayer.current ??= new AudioCuePlayer();
    // Browsers permit AudioContext activation only after a user interaction.
    // Selection and command actions call this function directly, so the first
    // interaction unlocks all later radio and warning cues automatically.
    void audioPlayer.current.unlock().then(() => audioPlayer.current?.play(cue));
  }, [audioEnabled]);

  useEffect(() => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;
    const event = [...state.eventLog].reverse().find((item) => item.id.startsWith('readback-') || item.id.startsWith('tower-'));
    if (!event || event.id === lastSpokenEvent.current) return;
    lastSpokenEvent.current = event.id;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spokenRadioMessage(event.message));
    utterance.rate = 1.08;
    utterance.pitch = 0.92;
    utterance.lang = 'en-US';
    const installedVoices = window.speechSynthesis.getVoices();
    const englishVoices = installedVoices.filter((voice) => voice.lang.startsWith('en'));
    const voices = englishVoices.length > 0 ? englishVoices : installedVoices.filter((voice) => voice.lang.startsWith('tr'));
    const voiceIndex = [...event.message].reduce((sum, character) => sum + character.charCodeAt(0), 0) % Math.max(1, voices.length);
    if (voices[voiceIndex]) utterance.voice = voices[voiceIndex];
    window.speechSynthesis.speak(utterance);
  }, [audioEnabled, state.eventLog]);

  useEffect(() => {
    const event = state.eventLog.at(-1);
    if (!event || event.id === lastCuedEvent.current) return;
    lastCuedEvent.current = event.id;
    if (!audioEnabled) return;
    if (event.id.startsWith('readback-')) playCue('readback');
    else if (event.id.startsWith('tower-')) playCue('handoff');
    else if (event.id.startsWith('landing-')) playCue('landing');
    else if (event.type === 'danger') playCue('alert');
    else if (event.type === 'warning') playCue('warning');
  }, [audioEnabled, playCue, state.eventLog]);

  useEffect(() => () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const selectAircraft = useCallback((callsign: string) => {
    setState((current) => ({ ...current, selectedCallsign: callsign }));
    setFeedback({ type: 'info', message: `${callsign} seçildi. Hedef komutu yazabilir veya hızlı komut kullanabilirsin.` });
    playCue('select');
  }, [playCue]);

  const issueCommand = useCallback((input: string) => {
    const snapshot = stateRef.current;
    const parsed = parseCommandBatch(
      input,
      snapshot.aircraft.map((item) => item.callsign),
      snapshot.selectedCallsign,
      activeArrivalRunways.map((item) => item.id),
      activeWorld.fixes.map((item) => item.id),
      activeWorld.procedures,
    );
    if (!parsed.ok) {
      setFeedback({ type: 'error', message: parsed.error });
      return false;
    }
    const callsign = parsed.commands[0].callsign;
    setState((current) => ({
      ...queueInstructions(current, parsed.commands, parsed.normalized),
      selectedCallsign: callsign,
    }));
    setFeedback({
      type: 'success',
      message: `${parsed.normalized.join(' · ')} · tek readback içinde sıraya alındı.`,
    });
    playCue('command');
    return true;
  }, [activeArrivalRunways, activeWorld, playCue]);

  const selectNextAircraft = useCallback(() => {
    const snapshot = stateRef.current;
    const priority = [...snapshot.aircraft].sort((first, second) => {
      const rank = (callsign: string) => {
        const aircraft = snapshot.aircraft.find((item) => item.callsign === callsign);
        if (snapshot.conflicts.some((item) => item.pair.includes(callsign) && item.severity === 'loss')) return 0;
        if (aircraft?.priority && !aircraft.priority.alertRaised) return 1;
        if (snapshot.pendingInstructions.some((item) => item.command.callsign === callsign)) return 2;
        if (aircraft?.phase === 'arrival' && !aircraft.approach) return 3;
        if (aircraft?.approach?.status === 'armed' || aircraft?.approach?.status === 'localizer') return 4;
        return 5;
      };
      return rank(first.callsign) - rank(second.callsign) || first.callsign.localeCompare(second.callsign);
    });
    const currentIndex = priority.findIndex((item) => item.callsign === snapshot.selectedCallsign);
    const next = priority[(currentIndex + 1) % Math.max(1, priority.length)];
    if (next) selectAircraft(next.callsign);
  }, [selectAircraft]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
      event.preventDefault();
      selectNextAircraft();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectNextAircraft]);

  const submitCommand = useCallback(() => {
    if (issueCommand(command)) setCommand('');
  }, [command, issueCommand]);

  const tutorial = trainingGuide(state, trainingAircraft?.callsign ?? null, trainingAircraft?.assignedRunway ?? null);
  const submitTutorialCommand = useCallback((guide: TrainingGuide) => {
    if (!guide.callsign || !guide.command) return;
    if (issueCommand(`${guide.callsign} ${guide.command}`)) setCommand('');
  }, [issueCommand]);
  const coach = controllerCoach(state, activeWorld);
  const submitCoachCommand = useCallback((advice: CoachAdvice) => {
    if (!advice.callsign || !advice.command) return;
    if (issueCommand(`${advice.callsign} ${advice.command}`)) setCommand('');
  }, [issueCommand]);

  const togglePause = () => setState((current) => ({ ...current, paused: !current.paused }));
  const cycleSpeed = () => setState((current) => ({ ...current, timeScale: current.timeScale === 1 ? 2 : current.timeScale === 2 ? 4 : 1 }));
  const toggleAudio = () => {
    setAudioEnabled((current) => {
      const next = !current;
      if (next) {
        audioPlayer.current ??= new AudioCuePlayer();
        void audioPlayer.current.unlock().then(() => audioPlayer.current?.play('select'));
      }
      return next;
    });
  };
  const reset = () => {
    shiftRecorded.current = false;
    setNewAchievementIds([]);
    setState(createInitialState(scenario, stateRef.current.mode));
    setCommand('');
    setFeedback({ type: 'info', message: 'Senaryo yeniden başlatıldı.' });
    setDebriefOpen(false);
    try { window.localStorage.removeItem(SESSION_STORAGE_KEY); } catch { /* storage unavailable */ }
  };
  const selectScenario = (nextScenario: GameScenario) => {
    if (!progression.unlockedScenarioIds.includes(nextScenario.id)) {
      const next = progression.nextUnlock;
      setFeedback({ type: 'info', message: `${nextScenario.label} henüz kilitli.${next ? ` Sıradaki açılma: ${next.label}.` : ''}` });
      return;
    }
    shiftRecorded.current = false;
    setNewAchievementIds([]);
    setScenario(nextScenario);
    setState(createInitialState(nextScenario, stateRef.current.mode));
    setCommand('');
    setFeedback({ type: 'info', message: `${nextScenario.label} sektörü yüklendi.` });
    setDebriefOpen(false);
    try { window.localStorage.removeItem(SESSION_STORAGE_KEY); } catch { /* storage unavailable */ }
  };
  const selectFlow = (flowId: string) => {
    const flow = scenario.world.flowConfigurations.find((item) => item.id === flowId);
    if (!flow) return;
    setState((current) => ({ ...current, flowId }));
    setFeedback({ type: 'info', message: `${flow.label} operasyonu aktif. Yeni trafik bu pist akışına göre planlanacak.` });
  };
  const selectMode = (mode: GameMode) => {
    if (!progression.unlockedModeIds.includes(mode)) {
      const next = progression.nextUnlock;
      setFeedback({ type: 'info', message: `${difficultyConfig(mode).label} modu henüz kilitli.${next ? ` Sıradaki açılma: ${next.label}.` : ''}` });
      return;
    }
    shiftRecorded.current = false;
    setNewAchievementIds([]);
    const config = difficultyConfig(mode);
    setState(createInitialState(scenario, mode));
    setCommand('');
    setFeedback({ type: 'info', message: `${config.label} modu başladı · ${config.description}` });
    setDebriefOpen(false);
    try { window.localStorage.removeItem(SESSION_STORAGE_KEY); } catch { /* storage unavailable */ }
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
          <span>SKILL <b>{state.skill.toFixed(1)}</b> / PEAK <b>{state.peakSkill.toFixed(1)}</b></span>
        </div>
        <div className="session-actions">
          <button type="button" onClick={togglePause}>{state.paused ? 'DEVAM' : 'DUR'}</button>
          <button type="button" onClick={cycleSpeed}>{state.timeScale}×</button>
          <button type="button" className={audioEnabled ? 'is-active' : ''} onClick={toggleAudio}>{audioEnabled ? 'SES AÇIK' : 'SES'}</button>
        </div>
        <details className="session-menu">
          <summary aria-label="Oyun menüsü">MENÜ</summary>
          <div className="session-menu__panel">
            <span>SENARYO</span>
          {scenarioCatalog.map((item) => (
            <button key={item.id} type="button" disabled={!progression.unlockedScenarioIds.includes(item.id)} className={item.id === scenario.id ? 'is-active' : ''} onClick={() => selectScenario(item)}>{progression.unlockedScenarioIds.includes(item.id) ? item.label : `🔒 ${item.label}`}</button>
          ))}
          <button type="button" onClick={endShift}>BİTİR</button>
          <button type="button" onClick={reset}>YENİLE</button>
          </div>
        </details>
      </header>

      <div className="operation-bar" aria-label="Operasyon ve hava koşulları">
        <span className="eyebrow">OPERASYON</span>
        <label>
          Pist akışı
          <select value={state.flowId} onChange={(event) => selectFlow(event.target.value)}>
            {activeWorld.flowConfigurations.map((flow) => <option key={flow.id} value={flow.id}>{flow.label}</option>)}
          </select>
        </label>
        <label>
          Mod
          <select value={state.mode} onChange={(event) => selectMode(event.target.value as GameMode)}>
            {DIFFICULTY_MODES.map((mode) => <option key={mode.id} value={mode.id} disabled={!progression.unlockedModeIds.includes(mode.id)}>{progression.unlockedModeIds.includes(mode.id) ? mode.label : `🔒 ${mode.label}`}</option>)}
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
          mode={state.mode}
          scenarioLabel={scenario.label}
          scenarioBriefing={scenario.briefing}
          scenarioFocus={scenario.focus}
          goal={goal}
          score={state.score}
          landed={state.landed}
          handoffs={state.handoffs}
          trafficLevel={state.trafficLevel}
          skill={state.skill}
          peakSkill={state.peakSkill}
          targetAircraft={state.targetAircraft}
          bestScore={career.bestScore}
          bestLandings={career.bestLandings}
          completedShifts={career.completedShifts}
          completedObjectives={career.completedObjectives}
          badgeCount={career.badges.length}
          achievementTotal={ACHIEVEMENT_TOTAL}
          achievementIds={career.badges}
          scenarioBestScore={career.scenarioBestScores[scenario.id] ?? 0}
          nextUnlockLabel={progression.nextUnlock?.label ?? null}
          nextUnlockDescription={progression.nextUnlock?.description ?? null}
          trainingCallsign={trainingAircraft?.callsign ?? null}
          trainingRunway={trainingAircraft?.assignedRunway ?? null}
          priorityTraffic={state.aircraft.filter((item) => item.priority)}
          events={state.eventLog}
          activeFlowLabel={activeFlow?.label ?? 'STANDART'}
          pendingInstructionCount={state.pendingInstructions.length}
          tutorial={tutorial}
          onTutorialCommand={submitTutorialCommand}
          coach={coach}
          onCoachCommand={submitCoachCommand}
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
          coach={coach}
          onSelect={selectAircraft}
          onApplyCoach={submitCoachCommand}
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
        procedures={activeWorld.procedures}
        selectedCallsign={state.selectedCallsign}
        mode={state.mode}
        coach={coach}
        value={command}
        feedback={feedback}
        onChange={setCommand}
        onSubmit={submitCommand}
        onQuickCommand={issueCommand}
        onCoachCommand={submitCoachCommand}
        onSelect={selectAircraft}
        onNext={selectNextAircraft}
      />
      {debriefOpen ? <DebriefPanel report={buildDebrief(state, goal)} state={state} achievementCount={career.badges.length} achievementTotal={ACHIEVEMENT_TOTAL} newAchievementIds={newAchievementIds} onRestart={reset} onContinue={continueShift} /> : null}
    </main>
  );
}
