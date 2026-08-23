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
import { LandingPage } from './LandingPage';
import { ACHIEVEMENT_TOTAL, buildDebrief, careerProgression, earnedAwards, goalComplete, isAchievementId, shiftGoal, trainingGuide, type TrainingGuide } from '../engine/progression';
import { controllerCoach, type CoachAdvice } from '../engine/controllerCoach';
import { restoreSession, serializeSession, type SavedSession } from '../engine/session';
import { AudioCuePlayer, type AudioCue } from './audioCues';
import { DIFFICULTY_MODES, difficultyConfig, worldForMode } from '../engine/difficulty';
import { ACADEMY_LESSONS, createAcademyState, evaluateAcademyLesson, isAcademyLessonId, shouldAdvanceAcademySimulation, type AcademyAction, type AcademyLessonId } from '../engine/academy';
import { AcademyPanel } from './AcademyPanel';
import {
  appendLogbook,
  bestDailyStreak,
  createShiftLogEntry,
  currentDailyStreak,
  dailyChallengeComplete,
  dailyChallengeForDate,
  sanitizeDailyCompletionDates,
  sanitizeLogbook,
  shareShiftText,
  type ShiftLogEntry,
} from '../engine/engagement';
import {
  applyCareerEpisodeEvents,
  bestCareerOutcome,
  careerEpisodeById,
  evaluateCareerEpisode,
  sanitizeCareerOutcomes,
  sanitizeCompletedCareerEpisodes,
  unlockedCareerEpisodeIds,
  type CareerEpisode,
  type CareerEpisodeId,
  type CareerEpisodeResult,
  type CareerOutcomeTier,
} from '../engine/careerSeason';

interface CareerStats {
  bestScore: number;
  bestLandings: number;
  completedShifts: number;
  completedObjectives: number;
  badges: string[];
  scenarioBestScores: Record<string, number>;
  completedDailyDates: string[];
  logbook: ShiftLogEntry[];
  completedCareerEpisodeIds: CareerEpisodeId[];
  careerBestOutcomes: Partial<Record<CareerEpisodeId, CareerOutcomeTier>>;
}

const CAREER_STORAGE_KEY = 'airspace-control-career-v1';
const SESSION_STORAGE_KEY = 'airspace-control-session-v1';
const ACADEMY_STORAGE_KEY = 'airspace-control-academy-v1';

function emptyCareerStats(): CareerStats {
  return {
    bestScore: 0, bestLandings: 0, completedShifts: 0, completedObjectives: 0, badges: [], scenarioBestScores: {},
    completedDailyDates: [], logbook: [], completedCareerEpisodeIds: [], careerBestOutcomes: {},
  };
}

function loadCareerStats(): CareerStats {
  try {
    const value = window.localStorage.getItem(CAREER_STORAGE_KEY);
    if (!value) return emptyCareerStats();
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
      completedDailyDates: sanitizeDailyCompletionDates(parsed.completedDailyDates),
      logbook: sanitizeLogbook(parsed.logbook),
      completedCareerEpisodeIds: sanitizeCompletedCareerEpisodes(parsed.completedCareerEpisodeIds),
      careerBestOutcomes: sanitizeCareerOutcomes(parsed.careerBestOutcomes),
    };
  } catch {
    return emptyCareerStats();
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

function loadAcademyProgress(): AcademyLessonId[] {
  try {
    const value = window.localStorage.getItem(ACADEMY_STORAGE_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter((item): item is AcademyLessonId => typeof item === 'string' && isAcademyLessonId(item)))]
      : [];
  } catch {
    return [];
  }
}

export function App() {
  const [savedSession] = useState<SavedSession | null>(loadSavedSession);
  const [gameStarted, setGameStarted] = useState(() => Boolean(savedSession) || window.location.hostname === 'atc-tr-play.vercel.app');
  const [todayDailyChallenge] = useState(() => dailyChallengeForDate(new Date(), scenarioCatalog));
  const [activeDailyChallengeId, setActiveDailyChallengeId] = useState<string | null>(() => (
    !savedSession?.careerEpisodeId
      && savedSession?.dailyChallengeId === todayDailyChallenge.id
      && savedSession.scenarioId === todayDailyChallenge.scenarioId
      && savedSession.state.mode === todayDailyChallenge.mode
      && savedSession.state.flowId === todayDailyChallenge.flowId
      ? todayDailyChallenge.id
      : null
  ));
  const [activeCareerEpisodeId, setActiveCareerEpisodeId] = useState<CareerEpisodeId | null>(() => {
    const episode = careerEpisodeById(savedSession?.careerEpisodeId);
    return episode
      && savedSession?.scenarioId === episode.scenarioId
      && savedSession.state.mode === episode.mode
      ? episode.id
      : null;
  });
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
  const [debriefLogEntry, setDebriefLogEntry] = useState<ShiftLogEntry | null>(null);
  const [debriefCareerResult, setDebriefCareerResult] = useState<CareerEpisodeResult | null>(null);
  const [shareFeedback, setShareFeedback] = useState('');
  const [landingOpen, setLandingOpen] = useState(() => window.location.hostname !== 'atc-tr-play.vercel.app');
  const [newAchievementIds, setNewAchievementIds] = useState<string[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [academyLessonId, setAcademyLessonId] = useState<AcademyLessonId | null>(null);
  const [academyCompletedLessonIds, setAcademyCompletedLessonIds] = useState<AcademyLessonId[]>(loadAcademyProgress);
  const lastSpokenEvent = useRef<string | null>(null);
  const lastCuedEvent = useRef<string | null>(null);
  const shiftRecorded = useRef(false);
  const audioPlayer = useRef<AudioCuePlayer | null>(null);
  const academyLessonRef = useRef<AcademyLessonId | null>(null);
  const activeDailyChallengeRef = useRef<string | null>(activeDailyChallengeId);
  const activeCareerEpisodeRef = useRef<CareerEpisodeId | null>(activeCareerEpisodeId);
  const gameStartedRef = useRef(gameStarted);
  const academyCompletionHandled = useRef(false);
  const preAcademySnapshot = useRef<{ scenario: GameScenario; state: GameState; dailyChallengeId: string | null; careerEpisodeId: CareerEpisodeId | null } | null>(null);
  const activeDailyChallenge = activeDailyChallengeId === todayDailyChallenge.id ? todayDailyChallenge : null;
  const activeCareerEpisode = careerEpisodeById(activeCareerEpisodeId);
  const activeWorld = useMemo(() => worldWithFlow(worldForMode(scenario.world, state.mode), state.flowId, state.peakSkill), [scenario.world, state.flowId, state.mode, state.peakSkill]);
  const activeFlow = activeWorld.flowConfigurations.find((item) => item.id === state.flowId) ?? activeWorld.flowConfigurations[0];
  const goal = useMemo(() => activeCareerEpisode?.goal ?? activeDailyChallenge?.goal ?? shiftGoal(state.mode), [activeCareerEpisode, activeDailyChallenge, state.mode]);
  const progression = useMemo(() => careerProgression(career.badges, career.scenarioBestScores), [career.badges, career.scenarioBestScores]);
  const dailyStreak = useMemo(() => currentDailyStreak(career.completedDailyDates), [career.completedDailyDates]);
  const dailyBestStreak = useMemo(() => bestDailyStreak(career.completedDailyDates), [career.completedDailyDates]);
  const activeArrivalRunways = activeWorld.runways.filter((item) => item.active && (item.operation === 'arrival' || item.operation === 'mixed'));
  const trainingAircraft = state.aircraft.find((item) => item.phase === 'arrival');

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    scenarioRef.current = scenario;
  }, [scenario]);

  useEffect(() => {
    careerRef.current = career;
  }, [career]);

  useEffect(() => {
    academyLessonRef.current = academyLessonId;
  }, [academyLessonId]);

  useEffect(() => {
    activeDailyChallengeRef.current = activeDailyChallengeId;
  }, [activeDailyChallengeId]);

  useEffect(() => {
    activeCareerEpisodeRef.current = activeCareerEpisodeId;
  }, [activeCareerEpisodeId]);

  useEffect(() => {
    gameStartedRef.current = gameStarted;
  }, [gameStarted]);

  const persistSession = useCallback(() => {
    if (academyLessonRef.current || !gameStartedRef.current) return;
    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, serializeSession(
        scenarioRef.current.id,
        stateRef.current,
        activeDailyChallengeRef.current ?? undefined,
        activeCareerEpisodeRef.current ?? undefined,
      ));
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
    if (academyLessonId) return;
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
  }, [academyLessonId, scenario.id, state.landed, state.score]);

  useEffect(() => {
    if (academyLessonId || !debriefOpen || shiftRecorded.current) return;
    shiftRecorded.current = true;
    const objectiveComplete = goalComplete(state, goal);
    const awards = earnedAwards(state, goal);
    const report = buildDebrief(state, goal);
    const completedDaily = activeDailyChallenge ? dailyChallengeComplete(state, activeDailyChallenge) : false;
    const careerResult = activeCareerEpisode ? evaluateCareerEpisode(state, activeCareerEpisode, report) : null;
    const logEntry = createShiftLogEntry(
      scenario,
      state,
      report,
      activeDailyChallenge?.id,
      new Date(),
      activeCareerEpisode && careerResult ? {
        episodeId: activeCareerEpisode.id,
        narrative: careerResult.narrative,
        performanceFlags: careerResult.flags,
      } : undefined,
    );
    setDebriefLogEntry(logEntry);
    setDebriefCareerResult(careerResult);
    setShareFeedback('');
    setNewAchievementIds(awards.map((award) => award.id).filter((id) => !careerRef.current.badges.includes(id)));
    setCareer((current) => {
      const completedDailyDates = completedDaily
        ? sanitizeDailyCompletionDates([...current.completedDailyDates, activeDailyChallenge!.dateKey])
        : current.completedDailyDates;
      const completedCareerEpisodeIds = activeCareerEpisode && careerResult?.complete
        ? sanitizeCompletedCareerEpisodes([...current.completedCareerEpisodeIds, activeCareerEpisode.id])
        : current.completedCareerEpisodeIds;
      const careerBestOutcomes = activeCareerEpisode && careerResult
        ? { ...current.careerBestOutcomes, [activeCareerEpisode.id]: bestCareerOutcome(current.careerBestOutcomes[activeCareerEpisode.id], careerResult.tier) }
        : current.careerBestOutcomes;
      const next = {
        ...current,
        completedShifts: current.completedShifts + 1,
        completedObjectives: current.completedObjectives + (objectiveComplete ? 1 : 0),
        badges: [...new Set([...current.badges, ...awards.map((award) => award.id)])],
        completedDailyDates,
        completedCareerEpisodeIds,
        careerBestOutcomes,
        logbook: appendLogbook(current.logbook, logEntry),
      };
      window.localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [academyLessonId, activeCareerEpisode, activeDailyChallenge, debriefOpen, goal, scenario, state]);

  useEffect(() => {
    if (landingOpen) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - previous) / 1000;
      previous = now;
      setState((current) => {
        if (!shouldAdvanceAcademySimulation(current, academyLessonId)) return current;
        const stepped = stepGame(current, activeWorld, dt);
        return activeCareerEpisode ? applyCareerEpisodeEvents(stepped, activeCareerEpisode) : stepped;
      });
    }, 33);
    return () => window.clearInterval(timer);
  }, [academyLessonId, activeCareerEpisode, activeWorld, landingOpen]);

  useEffect(() => {
    if (!academyLessonId && !debriefOpen && goalComplete(state, goal)) {
      setState((current) => ({ ...current, paused: true }));
      setDebriefOpen(true);
    }
  }, [academyLessonId, debriefOpen, goal, state]);

  const playCue = useCallback((cue: AudioCue) => {
    if (!audioEnabled) return;
    audioPlayer.current ??= new AudioCuePlayer();
    // Browsers permit AudioContext activation only after a user interaction.
    // Selection and command actions call this function directly, so the first
    // interaction unlocks all later radio and warning cues automatically.
    void audioPlayer.current.unlock().then(() => audioPlayer.current?.play(cue));
  }, [audioEnabled]);

  const academyEvaluation = useMemo(
    () => academyLessonId ? evaluateAcademyLesson(state, activeWorld, academyLessonId) : null,
    [academyLessonId, activeWorld, state],
  );

  useEffect(() => {
    if (!academyLessonId || !academyEvaluation?.complete || academyCompletionHandled.current) return;
    academyCompletionHandled.current = true;
    setState((current) => ({ ...current, paused: true }));
    setAcademyCompletedLessonIds((current) => {
      if (current.includes(academyLessonId)) return current;
      const next = [...current, academyLessonId];
      try { window.localStorage.setItem(ACADEMY_STORAGE_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
    if (academyLessonId === ACADEMY_LESSONS.at(-1)?.id) {
      setCareer((current) => {
        if (current.badges.includes('beginner-complete')) return current;
        const next = { ...current, badges: [...current.badges, 'beginner-complete'] };
        try { window.localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
        return next;
      });
    }
    playCue('landing');
  }, [academyEvaluation?.complete, academyLessonId, playCue]);

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

  const clearAircraftSelection = useCallback(() => {
    setState((current) => ({ ...current, selectedCallsign: null }));
    setFeedback({ type: 'info', message: 'Radar izleniyor. Komut vermek için bir uçağa dokun.' });
  }, []);

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
  const effectiveCoach: CoachAdvice = academyLessonId ? {
    tone: 'info',
    label: 'ACADEMY',
    title: 'DERS HEDEFİNİ TAMAMLA',
    message: 'Academy kartındaki tek görevi uygula. Normal vardiya koçu ders boyunca devre dışıdır.',
  } : coach;
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
    setDebriefLogEntry(null);
    setDebriefCareerResult(null);
    setShareFeedback('');
    const nextState = activeCareerEpisode
      ? createInitialState(scenario, activeCareerEpisode.mode, activeCareerEpisode.flowId)
      : activeDailyChallenge
        ? createInitialState(scenario, activeDailyChallenge.mode, activeDailyChallenge.flowId)
        : createInitialState(scenario, stateRef.current.mode);
    if (activeCareerEpisode) nextState.seed = activeCareerEpisode.seed;
    else if (activeDailyChallenge) nextState.seed = activeDailyChallenge.seed;
    setState(nextState);
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
    setDebriefLogEntry(null);
    setDebriefCareerResult(null);
    setShareFeedback('');
    setActiveDailyChallengeId(null);
    setActiveCareerEpisodeId(null);
    setScenario(nextScenario);
    setAcademyLessonId(null);
    const nextMode = progression.unlockedModeIds.includes(stateRef.current.mode) ? stateRef.current.mode : 'beginner';
    setState(createInitialState(nextScenario, nextMode));
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
    setDebriefLogEntry(null);
    setDebriefCareerResult(null);
    setShareFeedback('');
    setActiveDailyChallengeId(null);
    setActiveCareerEpisodeId(null);
    const config = difficultyConfig(mode);
    setAcademyLessonId(null);
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

  const startFromLanding = (nextScenario: GameScenario) => {
    preAcademySnapshot.current = null;
    setAcademyLessonId(null);
    setActiveDailyChallengeId(null);
    setActiveCareerEpisodeId(null);
    if (nextScenario.id !== scenario.id || activeDailyChallengeRef.current || activeCareerEpisodeRef.current) {
      shiftRecorded.current = false;
      setScenario(nextScenario);
      const nextMode = progression.unlockedModeIds.includes(stateRef.current.mode) ? stateRef.current.mode : 'beginner';
      setState(createInitialState(nextScenario, nextMode));
      setCommand('');
      setDebriefLogEntry(null);
      setDebriefCareerResult(null);
      setDebriefOpen(false);
      try { window.localStorage.removeItem(SESSION_STORAGE_KEY); } catch { /* storage unavailable */ }
    }
    setGameStarted(true);
    setLandingOpen(false);
  };

  const startDailyChallenge = () => {
    const nextScenario = scenarioCatalog.find((item) => item.id === todayDailyChallenge.scenarioId);
    if (!nextScenario) return;
    const nextState = createInitialState(nextScenario, todayDailyChallenge.mode, todayDailyChallenge.flowId);
    nextState.seed = todayDailyChallenge.seed;
    shiftRecorded.current = false;
    preAcademySnapshot.current = null;
    setNewAchievementIds([]);
    setDebriefLogEntry(null);
    setDebriefCareerResult(null);
    setShareFeedback('');
    setActiveDailyChallengeId(todayDailyChallenge.id);
    setActiveCareerEpisodeId(null);
    setAcademyLessonId(null);
    setScenario(nextScenario);
    setState(nextState);
    setCommand('');
    setFeedback({ type: 'info', message: `${todayDailyChallenge.goal.label} başladı · ${todayDailyChallenge.flowLabel} · sıfır ayırma kaybı.` });
    setDebriefOpen(false);
    setGameStarted(true);
    setLandingOpen(false);
    try { window.localStorage.removeItem(SESSION_STORAGE_KEY); } catch { /* storage unavailable */ }
  };

  const startCareerEpisode = (episode: CareerEpisode) => {
    const unlockedIds = unlockedCareerEpisodeIds(careerRef.current.completedCareerEpisodeIds);
    if (!unlockedIds.includes(episode.id)) return;
    const nextScenario = scenarioCatalog.find((item) => item.id === episode.scenarioId);
    if (!nextScenario) return;
    const nextState = createInitialState(nextScenario, episode.mode, episode.flowId);
    nextState.seed = episode.seed;
    shiftRecorded.current = false;
    preAcademySnapshot.current = null;
    setNewAchievementIds([]);
    setDebriefLogEntry(null);
    setDebriefCareerResult(null);
    setShareFeedback('');
    setActiveDailyChallengeId(null);
    setActiveCareerEpisodeId(episode.id);
    setAcademyLessonId(null);
    setScenario(nextScenario);
    setState(nextState);
    setCommand('');
    setFeedback({ type: 'info', message: `${episode.goal.label} başladı · ${episode.titleTr} · ${episode.focusTr}.` });
    setDebriefOpen(false);
    setGameStarted(true);
    setLandingOpen(false);
    try { window.localStorage.removeItem(SESSION_STORAGE_KEY); } catch { /* storage unavailable */ }
  };

  const resumeFromLanding = () => {
    setGameStarted(true);
    setLandingOpen(false);
  };

  const returnToLanding = () => {
    const pausedState = { ...stateRef.current, paused: true };
    stateRef.current = pausedState;
    setState(pausedState);
    persistSession();
    setLandingOpen(true);
  };

  const shareDebrief = async () => {
    const report = buildDebrief(state, goal);
    const careerResult = activeCareerEpisode ? evaluateCareerEpisode(state, activeCareerEpisode, report) : null;
    const entry = debriefLogEntry ?? createShiftLogEntry(
      scenario,
      state,
      report,
      activeDailyChallenge?.id,
      new Date(),
      activeCareerEpisode && careerResult ? {
        episodeId: activeCareerEpisode.id,
        narrative: careerResult.narrative,
        performanceFlags: careerResult.flags,
      } : undefined,
    );
    const completedDates = activeDailyChallenge && dailyChallengeComplete(state, activeDailyChallenge)
      ? sanitizeDailyCompletionDates([...career.completedDailyDates, activeDailyChallenge.dateKey])
      : career.completedDailyDates;
    const text = shareShiftText(entry, currentDailyStreak(completedDates));
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Airspace Control shift report', text });
        setShareFeedback('SONUÇ PAYLAŞILDI');
        return;
      }
      if (!navigator.clipboard) throw new Error('Clipboard is unavailable');
      await navigator.clipboard.writeText(text);
      setShareFeedback('SONUÇ KOPYALANDI');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      try {
        if (!navigator.clipboard) throw new Error('Clipboard is unavailable');
        await navigator.clipboard.writeText(text);
        setShareFeedback('SONUÇ KOPYALANDI');
      } catch {
        setShareFeedback('PAYLAŞIM KULLANILAMIYOR');
      }
    }
  };

  const startAcademyLesson = (lessonId: AcademyLessonId) => {
    if (!academyLessonRef.current) preAcademySnapshot.current = {
      scenario: scenarioRef.current,
      state: stateRef.current,
      dailyChallengeId: activeDailyChallengeRef.current,
      careerEpisodeId: activeCareerEpisodeRef.current,
    };
    academyCompletionHandled.current = false;
    shiftRecorded.current = false;
    setNewAchievementIds([]);
    setScenario(defaultScenario);
    setState(createAcademyState(defaultScenario, lessonId));
    setActiveDailyChallengeId(null);
    setActiveCareerEpisodeId(null);
    setAcademyLessonId(lessonId);
    setCommand('');
    setFeedback({ type: 'info', message: `Academy dersi başladı: ${ACADEMY_LESSONS.find((item) => item.id === lessonId)?.title ?? lessonId}.` });
    setDebriefOpen(false);
    setLandingOpen(false);
  };

  const applyAcademyAction = (action: AcademyAction) => {
    if (action.kind === 'select') {
      selectAircraft(action.callsign);
      return;
    }
    if (action.command) issueCommand(`${action.callsign} ${action.command}`);
  };

  const restartAcademyLesson = () => {
    if (academyLessonId) startAcademyLesson(academyLessonId);
  };

  const nextAcademyLesson = () => {
    if (!academyLessonId) return;
    const index = ACADEMY_LESSONS.findIndex((item) => item.id === academyLessonId);
    const next = ACADEMY_LESSONS[index + 1];
    if (next) {
      startAcademyLesson(next.id);
      return;
    }
    academyCompletionHandled.current = false;
    preAcademySnapshot.current = null;
    setAcademyLessonId(null);
    setScenario(defaultScenario);
    setState(createInitialState(defaultScenario, 'beginner'));
    setActiveDailyChallengeId(null);
    setActiveCareerEpisodeId(null);
    setGameStarted(true);
    setFeedback({ type: 'success', message: 'Academy tamamlandı. İstanbul başlangıç vardiyası hazır.' });
  };

  const exitAcademy = () => {
    academyCompletionHandled.current = false;
    const snapshot = preAcademySnapshot.current;
    preAcademySnapshot.current = null;
    setAcademyLessonId(null);
    if (snapshot) {
      setScenario(snapshot.scenario);
      setState(snapshot.state);
      setActiveDailyChallengeId(snapshot.dailyChallengeId);
      setActiveCareerEpisodeId(snapshot.careerEpisodeId);
    }
    setLandingOpen(true);
  };

  if (landingOpen) {
    return <LandingPage
      scenarios={scenarioCatalog}
      selectedScenario={scenario}
      unlockedScenarioIds={progression.unlockedScenarioIds}
      scenarioBestScores={career.scenarioBestScores}
      savedSession={Boolean(savedSession) || gameStarted}
      completedAcademyLessonIds={academyCompletedLessonIds}
      dailyChallenge={todayDailyChallenge}
      dailyChallengeCompleted={career.completedDailyDates.includes(todayDailyChallenge.dateKey)}
      currentDailyStreak={dailyStreak}
      bestDailyStreak={dailyBestStreak}
      logbook={career.logbook}
      completedCareerEpisodeIds={career.completedCareerEpisodeIds}
      careerBestOutcomes={career.careerBestOutcomes}
      onStart={startFromLanding}
      onResume={resumeFromLanding}
      onAcademyStart={startAcademyLesson}
      onDailyChallengeStart={startDailyChallenge}
      onCareerEpisodeStart={startCareerEpisode}
    />;
  }

  return (
    <main className={`app-shell app-shell--mobile-v2${academyLessonId ? ' app-shell--academy' : ''}`}>
      <header className="top-bar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">◉</span>
          <div>
            <strong>AIRSPACE CONTROL</strong>
            <small>{activeWorld.sectorName}</small>
          </div>
        </div>
        <div className="top-status">
          <span className="hud-score">PUAN <b>{state.score.toLocaleString('tr-TR')}</b></span>
          <span>İNİŞ <b>{state.landed}/{goal.targetLandings}</b></span>
          <span>TRAFİK <b>{state.aircraft.length}</b></span>
          {activeFlow ? <span>RÜZGÂR <b>{String(activeFlow.windDirection).padStart(3, '0')}°/{activeFlow.windSpeedKt}KT</b></span> : null}
          <span>SAAT <b>{formatClock(state.elapsedSeconds)}</b></span>
        </div>
        <div className="session-actions">
          <button type="button" onClick={togglePause}>{state.paused ? 'DEVAM' : 'DUR'}</button>
          <button type="button" onClick={cycleSpeed}>{state.timeScale}×</button>
          <button type="button" className={audioEnabled ? 'is-active' : ''} onClick={toggleAudio}>{audioEnabled ? 'SES AÇIK' : 'SES'}</button>
        </div>
        <details className="session-menu">
          <summary aria-label="Oyun menüsü">MENÜ</summary>
          <div className="session-menu__panel">
          {academyLessonId ? (
            <>
              <span>FLIGHT ACADEMY</span>
              <button type="button" onClick={restartAcademyLesson}>DERSİ YENİDEN BAŞLAT</button>
              <button type="button" onClick={exitAcademy}>ACADEMY’DEN ÇIK</button>
            </>
          ) : (
            <>
              <span>SENARYO</span>
              {scenarioCatalog.map((item) => (
                <button key={item.id} type="button" disabled={!progression.unlockedScenarioIds.includes(item.id)} className={item.id === scenario.id ? 'is-active' : ''} onClick={() => selectScenario(item)}>{progression.unlockedScenarioIds.includes(item.id) ? item.label : `🔒 ${item.label}`}</button>
              ))}
              <button type="button" onClick={returnToLanding}>ANA SAYFA / LOGBOOK</button>
              <button type="button" onClick={endShift}>BİTİR</button>
              <button type="button" onClick={reset}>YENİLE</button>
            </>
          )}
          </div>
        </details>
      </header>

      <div className="operation-bar" aria-label="Operasyon ve hava koşulları">
        <span className="eyebrow">{activeCareerEpisode ? `İLK NÖBET · ${String(activeCareerEpisode.number).padStart(2, '0')}/07` : activeDailyChallenge ? 'GÜNLÜK RADAR' : 'OPERASYON'}</span>
        <label>
          Pist akışı
          <select value={state.flowId} disabled={Boolean(activeDailyChallenge || activeCareerEpisode)} onChange={(event) => selectFlow(event.target.value)}>
            {activeWorld.flowConfigurations.map((flow) => <option key={flow.id} value={flow.id}>{flow.label}</option>)}
          </select>
        </label>
        <label>
          Mod
          <select value={state.mode} disabled={Boolean(activeDailyChallenge || activeCareerEpisode)} onChange={(event) => selectMode(event.target.value as GameMode)}>
            {DIFFICULTY_MODES.map((mode) => {
              const available = progression.unlockedModeIds.includes(mode.id) || activeDailyChallenge?.mode === mode.id || activeCareerEpisode?.mode === mode.id;
              return <option key={mode.id} value={mode.id} disabled={!available}>{available ? mode.label : `🔒 ${mode.label}`}</option>;
            })}
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
          scenarioBriefing={activeCareerEpisode?.briefingTr ?? scenario.briefing}
          scenarioFocus={activeCareerEpisode?.focusTr ?? scenario.focus}
          missionPrefix={activeCareerEpisode ? `${activeCareerEpisode.titleTr} · ` : undefined}
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
          operationsStrategy={activeWorld.operations?.strategyLabel}
          operationsReference={activeWorld.operations?.referenceCycle}
          procedureReferences={activeWorld.operations?.procedureReferences}
          pendingInstructionCount={state.pendingInstructions.length}
          tutorial={tutorial}
          onTutorialCommand={submitTutorialCommand}
          coach={effectiveCoach}
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
          coach={effectiveCoach}
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
        {academyLessonId && academyEvaluation ? (
          <AcademyPanel
            lessonId={academyLessonId}
            completedLessonIds={academyCompletedLessonIds}
            evaluation={academyEvaluation}
            onAction={applyAcademyAction}
            onRestart={restartAcademyLesson}
            onNext={nextAcademyLesson}
            onExit={exitAcademy}
          />
        ) : null}
      </div>

      <CommandPanel
        aircraft={state.aircraft}
        runwayIds={activeArrivalRunways.map((item) => item.id)}
        fixIds={activeWorld.fixes.map((item) => item.id)}
        procedures={activeWorld.procedures}
        selectedCallsign={state.selectedCallsign}
        mode={state.mode}
        coach={effectiveCoach}
        value={command}
        feedback={feedback}
        onChange={setCommand}
        onSubmit={submitCommand}
        onQuickCommand={issueCommand}
        onCoachCommand={submitCoachCommand}
        onSelect={selectAircraft}
        onNext={selectNextAircraft}
        onClose={clearAircraftSelection}
      />
      {debriefOpen ? <DebriefPanel
        report={buildDebrief(state, goal)}
        state={state}
        achievementCount={career.badges.length}
        achievementTotal={ACHIEVEMENT_TOTAL}
        newAchievementIds={newAchievementIds}
        dailyChallengeLabel={activeDailyChallenge?.goal.label}
        dailyChallengeCompleted={activeDailyChallenge ? dailyChallengeComplete(state, activeDailyChallenge) : undefined}
        dailyStreak={activeDailyChallenge && dailyChallengeComplete(state, activeDailyChallenge)
          ? currentDailyStreak([...career.completedDailyDates, activeDailyChallenge.dateKey])
          : dailyStreak}
        careerEpisodeLabel={activeCareerEpisode ? `BÖLÜM ${String(activeCareerEpisode.number).padStart(2, '0')} · ${activeCareerEpisode.titleTr}` : undefined}
        careerResult={activeCareerEpisode
          ? debriefCareerResult ?? evaluateCareerEpisode(state, activeCareerEpisode, buildDebrief(state, goal))
          : null}
        shareFeedback={shareFeedback}
        onShare={() => void shareDebrief()}
        onCareerMap={returnToLanding}
        onRestart={reset}
        onContinue={continueShift}
      /> : null}
    </main>
  );
}
