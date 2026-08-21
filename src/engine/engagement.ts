import type { GameScenario } from './scenario';
import type { DebriefReport, ShiftGoal } from './progression';
import { goalComplete } from './progression';
import type { GameMode, GameState, ScenarioId, SessionMetrics } from './types';

const DAY_MS = 86_400_000;
const FLAGSHIP_IDS = ['ist', 'lhr', 'lax', 'jfk', 'atl'] as const;
export const LOGBOOK_LIMIT = 30;

const DAILY_FLOW_LABELS: Record<string, string> = {
  'north-parallel': 'NORTH · PARALLEL', 'north-single': 'NORTH · SINGLE RUNWAY', 'north-lowvis': 'NORTH · LOW VISIBILITY', 'south-triple': 'SOUTH · TRIPLE INDEPENDENT',
  'lhr-primary': 'WEST · ALTERNATION A', 'lhr-reverse': 'WEST · ALTERNATION B', 'lhr-lowvis': 'WEST · LOW VISIBILITY', 'lhr-easterly': 'EAST · RUNWAY 09',
  'lax-primary': 'WEST · BOTH COMPLEXES', 'lax-reverse': 'EAST · OVER OCEAN', 'lax-lowvis': 'WEST · SOUTH COMPLEX', 'lax-south-complex': 'WEST · NORTH MAINTENANCE',
  'jfk-primary': 'SOUTHWEST · 22/31 CROSSING', 'jfk-reverse': 'NORTHWEST · 31 BANK', 'jfk-lowvis': 'SOUTHWEST · SINGLE ARRIVAL', 'jfk-northeast': 'NORTHEAST · 04 BANK',
  'atl-primary': 'WEST · TRIPLE ARRIVAL', 'atl-reverse': 'EAST · TRIPLE ARRIVAL', 'atl-lowvis': 'WEST · SINGLE ARRIVAL', 'atl-prm': 'WEST · PRM SPACING',
};

export interface DailyChallenge {
  id: string;
  dateKey: string;
  scenarioId: ScenarioId;
  airportLabel: string;
  mode: Extract<GameMode, 'normal'>;
  flowId: string;
  flowLabel: string;
  seed: number;
  goal: ShiftGoal;
}

export interface ShiftLogEntry {
  id: string;
  completedAt: string;
  scenarioId: ScenarioId;
  airportLabel: string;
  mode: GameMode;
  flowId: string;
  score: number;
  landed: number;
  handoffs: number;
  peakSkill: number;
  grade: DebriefReport['grade'];
  objectiveComplete: boolean;
  metrics: SessionMetrics;
  dailyChallengeId?: string;
}

export function utcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function hashString(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function dailyChallengeForDate(date: Date, scenarios: readonly GameScenario[]): DailyChallenge {
  const dateKey = utcDateKey(date);
  const hash = hashString(`airspace-control:${dateKey}`);
  const flagshipScenarios = FLAGSHIP_IDS
    .map((id) => scenarios.find((scenario) => scenario.id === id))
    .filter((scenario): scenario is GameScenario => Boolean(scenario));
  if (flagshipScenarios.length === 0) throw new Error('Daily challenge requires at least one flagship airport');
  const scenario = flagshipScenarios[hash % flagshipScenarios.length]!;
  const flows = scenario.world.flowConfigurations;
  const flow = flows[Math.floor(hash / flagshipScenarios.length) % flows.length] ?? flows[0];
  if (!flow) throw new Error(`${scenario.id} requires at least one flow`);
  const targetScore = 350 + (hash % 3) * 25;
  return {
    id: `daily-${dateKey}`,
    dateKey,
    scenarioId: scenario.id,
    airportLabel: scenario.label,
    mode: 'normal',
    flowId: flow.id,
    flowLabel: DAILY_FLOW_LABELS[flow.id] ?? flow.label,
    seed: 10_000 + (hash % 900_000),
    goal: {
      label: `GÜNLÜK RADAR · ${scenario.iata}`,
      targetLandings: 3,
      targetHandoffs: 1,
      maximumLosses: 0,
      targetScore,
    },
  };
}

export function dailyChallengeComplete(state: GameState, challenge: DailyChallenge) {
  return state.mode === challenge.mode && state.flowId === challenge.flowId && goalComplete(state, challenge.goal);
}

function dateKeyAtOffset(dateKey: string, offsetDays: number) {
  const timestamp = Date.parse(`${dateKey}T00:00:00.000Z`);
  return Number.isFinite(timestamp) ? new Date(timestamp + offsetDays * DAY_MS).toISOString().slice(0, 10) : '';
}

export function sanitizeDailyCompletionDates(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => (
    typeof item === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(item)
    && Number.isFinite(Date.parse(`${item}T00:00:00.000Z`))
    && new Date(`${item}T00:00:00.000Z`).toISOString().slice(0, 10) === item
  )))].sort();
}

/** A streak remains current until the end of the day after the last completion. */
export function currentDailyStreak(completedDates: readonly string[], today = new Date()) {
  const completed = new Set(sanitizeDailyCompletionDates(completedDates));
  const todayKey = utcDateKey(today);
  let cursor = completed.has(todayKey) ? todayKey : dateKeyAtOffset(todayKey, -1);
  let count = 0;
  while (cursor && completed.has(cursor)) {
    count += 1;
    cursor = dateKeyAtOffset(cursor, -1);
  }
  return count;
}

export function bestDailyStreak(completedDates: readonly string[]) {
  const dates = sanitizeDailyCompletionDates(completedDates);
  let best = 0;
  let current = 0;
  let previous = '';
  for (const date of dates) {
    current = previous && dateKeyAtOffset(previous, 1) === date ? current + 1 : 1;
    best = Math.max(best, current);
    previous = date;
  }
  return best;
}

export function createShiftLogEntry(
  scenario: GameScenario,
  state: GameState,
  report: DebriefReport,
  dailyChallengeId?: string,
  completedAt = new Date(),
): ShiftLogEntry {
  return {
    id: `${completedAt.getTime()}-${scenario.id}-${state.seed}`,
    completedAt: completedAt.toISOString(),
    scenarioId: scenario.id,
    airportLabel: scenario.label,
    mode: state.mode,
    flowId: state.flowId,
    score: Math.max(0, Math.round(state.score)),
    landed: Math.max(0, Math.round(state.landed)),
    handoffs: Math.max(0, Math.round(state.handoffs)),
    peakSkill: Math.max(0, state.peakSkill),
    grade: report.grade,
    objectiveComplete: report.objectiveComplete,
    metrics: { ...state.metrics },
    dailyChallengeId,
  };
}

function validMode(value: unknown): value is GameMode {
  return value === 'beginner' || value === 'normal' || value === 'advanced' || value === 'expert';
}

function validGrade(value: unknown): value is DebriefReport['grade'] {
  return value === 'A' || value === 'B' || value === 'C' || value === 'D';
}

function validMetrics(value: unknown): value is SessionMetrics {
  if (!value || typeof value !== 'object') return false;
  const metrics = value as Partial<SessionMetrics>;
  return [metrics.separationLosses, metrics.goArounds, metrics.missedHandoffs, metrics.expiredPriorities, metrics.unmanagedArrivals, metrics.wakeViolations]
    .every((metric) => typeof metric === 'number' && Number.isFinite(metric) && metric >= 0);
}

export function sanitizeLogbook(value: unknown): ShiftLogEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ShiftLogEntry => {
    if (!item || typeof item !== 'object') return false;
    const entry = item as Partial<ShiftLogEntry>;
    return typeof entry.id === 'string'
      && typeof entry.completedAt === 'string' && Number.isFinite(Date.parse(entry.completedAt))
      && typeof entry.scenarioId === 'string'
      && typeof entry.airportLabel === 'string'
      && validMode(entry.mode)
      && typeof entry.flowId === 'string'
      && typeof entry.score === 'number' && Number.isFinite(entry.score) && entry.score >= 0
      && typeof entry.landed === 'number' && entry.landed >= 0
      && typeof entry.handoffs === 'number' && entry.handoffs >= 0
      && typeof entry.peakSkill === 'number' && entry.peakSkill >= 0
      && validGrade(entry.grade)
      && typeof entry.objectiveComplete === 'boolean'
      && validMetrics(entry.metrics);
  }).slice(0, LOGBOOK_LIMIT);
}

export function appendLogbook(entries: readonly ShiftLogEntry[], entry: ShiftLogEntry) {
  return [entry, ...entries.filter((item) => item.id !== entry.id)].slice(0, LOGBOOK_LIMIT);
}

const modeLabels: Record<GameMode, string> = {
  beginner: 'BEGINNER', normal: 'NORMAL', advanced: 'ADVANCED', expert: 'EXPERT',
};

export function shareShiftText(entry: ShiftLogEntry, streak: number) {
  const daily = entry.dailyChallengeId ? 'DAILY RADAR' : 'SHIFT REPORT';
  return [
    `AIRSPACE CONTROL // ${daily}`,
    `${entry.airportLabel} · ${modeLabels[entry.mode]} · GRADE ${entry.grade}`,
    `SCORE ${entry.score} · ${entry.landed} LANDINGS · ${entry.handoffs} HANDOFFS · PEAK ${entry.peakSkill.toFixed(1)}`,
    `SAFETY ${entry.metrics.separationLosses === 0 ? 'CLEAR' : `${entry.metrics.separationLosses} LOSS`} · STREAK ${streak} DAY${streak === 1 ? '' : 'S'}`,
    'https://atc-tr.vercel.app',
  ].join('\n');
}
