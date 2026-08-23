export type Vector2 = { x: number; y: number };

export type AircraftPhase = 'arrival' | 'departure';
export type Trend = 'climb' | 'level' | 'descend';
export type ApproachStatus = 'armed' | 'localizer' | 'glideslope' | 'tower';
export type NavigationMode = 'route' | 'direct' | 'hold';
export type SpeedMode = 'normal' | 'assigned';
export type WakeCategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type GameMode = 'beginner' | 'normal' | 'advanced' | 'expert';
export type ScenarioId =
  | 'ist' | 'atl' | 'dxb' | 'hnd' | 'dfw' | 'pvg' | 'ord' | 'lhr' | 'can' | 'den'
  | 'del' | 'icn' | 'lax' | 'cdg' | 'pek' | 'sin' | 'ams' | 'mad' | 'szx' | 'kul'
  | 'fra' | 'bkk' | 'jfk' | 'hkg' | 'mco' | 'bcn' | 'tfu' | 'bom' | 'mia' | 'las'
  | 'cgk' | 'sfo' | 'doh' | 'clt' | 'pkx' | 'jed' | 'sea' | 'mnl' | 'phx' | 'fco'
  | 'hgh' | 'sha' | 'ckg' | 'kmg' | 'xiy' | 'saw' | 'iah' | 'tpe' | 'yyz' | 'gru';
export type CareerUnlockKind = 'scenario' | 'mode' | 'operation';

/**
 * Platform-neutral career output. The UI, PWA and native wrappers can consume
 * this shape without duplicating progression rules.
 */
export interface CareerUnlock {
  id: string;
  kind: CareerUnlockKind;
  label: string;
  description: string;
  requiredAchievementIds: string[];
  /** Mini Metro-style per-map high-score gate, evaluated against career history. */
  scoreScenarioId?: ScenarioId;
  requiredScore?: number;
}

export interface CareerProgression {
  rank: string;
  unlockedScenarioIds: ScenarioId[];
  unlockedModeIds: GameMode[];
  unlockedOperationIds: string[];
  unlocked: CareerUnlock[];
  nextUnlock: CareerUnlock | null;
  completionPercent: number;
}

export interface AircraftPerformance {
  climbRateFpm: number;
  descentRateFpm: number;
  accelerationKtPerSecond: number;
  minSpeed: number;
  maxSpeed: number;
  maxBankDeg: number;
  rollRateDegPerSecond: number;
  finalApproachSpeed: number;
}

export interface Aircraft {
  callsign: string;
  type: string;
  phase: AircraftPhase;
  position: Vector2;
  heading: number;
  altitude: number;
  /** Indicated airspeed. Kept as `speed` for backwards-compatible UI and saves. */
  speed: number;
  groundSpeed: number;
  track: number;
  bankAngle: number;
  verticalSpeed: number;
  targetHeading: number;
  targetAltitude: number;
  targetSpeed: number;
  speedMode: SpeedMode;
  expedite: boolean;
  turnDirection: 'shortest' | 'left' | 'right';
  performance: AircraftPerformance;
  wakeCategory: WakeCategory;
  /** Suggested arrival runway from the traffic flow. The controller may still assign another active runway. */
  assignedRunway?: string;
  handoffCleared?: boolean;
  priority?: {
    kind: 'medical' | 'minimumFuel';
    deadlineAt: number;
    alertRaised: boolean;
  };
  approach?: {
    runwayId: string;
    status: ApproachStatus;
    localizerOnly?: boolean;
    capturedAt?: number;
    towerHandoffAt?: number;
  };
  navigation?: {
    mode: NavigationMode;
    fixIds: string[];
    currentLegIndex: number;
    procedure: string;
    holding?: boolean;
  };
  goAroundGraceUntil?: number;
  /** Set by a controller-issued missed-approach clearance; consumed on readback. */
  goAroundRequested?: boolean;
}

export interface Runway {
  id: string;
  reciprocal: string;
  center: Vector2;
  heading: number;
  lengthNm: number;
  active: boolean;
  operation: 'arrival' | 'departure' | 'mixed' | 'inactive';
}

export interface Fix {
  id: string;
  /** Human-readable chart label. The stable id remains the command/save key. */
  label?: string;
  position: Vector2;
  /** Optional chart-derived crossing constraints used by route guidance. */
  minimumAltitudeFt?: number;
  maximumAltitudeFt?: number;
  maximumSpeedKt?: number;
}

export interface Procedure {
  id: string;
  kind: 'arrival' | 'departure';
  runwayId?: string;
  fixIds: string[];
  compatibleRunwayIds?: string[];
  source?: 'published' | 'game';
}

export interface TrafficEntry {
  id: string;
  position: Vector2;
  procedureId: string;
  compatibleRunwayIds: string[];
}

export interface TrafficExit {
  id: string;
  procedureId: string;
  compatibleRunwayIds?: string[];
}

export interface FlowConfiguration {
  id: string;
  label: string;
  arrivalRunwayIds: string[];
  departureRunwayIds: string[];
  windDirection: number;
  windSpeedKt: number;
  visibilityNm: number;
  qnh: number;
}

export interface AirportDisruptionProfile {
  /** Stable airport-specific event key, used in replay/debrief logs. */
  id: string;
  triggerSeconds: number;
  durationSeconds: number;
  reducedFlowId: string;
  recoveryFlowId: string;
  message: string;
  recoveryMessage: string;
}

/** Runtime portion of a versioned airport operations pack. It intentionally
 * describes a tactical game sector, not navigation-grade procedure data. */
export interface AirportOperationsProfile {
  packVersion: string;
  referenceCycle: string;
  strategyLabel: string;
  trafficPattern: AircraftPhase[];
  heavyArrivalEvery: number;
  procedureReferences: string[];
  disruption: AirportDisruptionProfile;
}

export interface RadarWorld {
  airport: string;
  sectorName: string;
  rangeNm: number;
  runways: Runway[];
  fixes: Fix[];
  procedures: Procedure[];
  trafficEntries: TrafficEntry[];
  trafficExits: TrafficExit[];
  flowConfigurations: FlowConfiguration[];
  activeFlowId?: string;
  operations?: AirportOperationsProfile;
  /** Geographic context used by the tactical sector chart. Stylized shapes
   are game-only and are never a substitute for current aeronautical charts. */
  environment?: {
    terrain: 'flat' | 'rolling' | 'highland' | 'mountain' | 'desert' | 'coastal' | 'island';
    urbanDensity: 'urban' | 'metropolis';
    cityBearing: number;
    waterBearing?: number;
    mountainBearing?: number;
    elevationFt: number;
    city: string;
    icao: string;
  };
}

export interface Conflict {
  pair: [string, string];
  horizontalNm: number;
  verticalFt: number;
  severity: 'warning' | 'loss';
  reason?: 'separation' | 'wake';
  predicted?: {
    timeSeconds: number;
    horizontalNm: number;
  };
}

export interface GameState {
  /** Chosen workload preset. Difficulty affects traffic, weather and available helpers. */
  mode: GameMode;
  elapsedSeconds: number;
  paused: boolean;
  timeScale: number;
  aircraft: Aircraft[];
  conflicts: Conflict[];
  selectedCallsign: string | null;
  /** Endless-style live workload rating. Traffic target follows this value up and down. */
  skill: number;
  /** Highest live skill reached in the current shift. */
  peakSkill: number;
  targetAircraft: number;
  score: number;
  landed: number;
  spawned: number;
  trafficLevel: number;
  nextTrafficAt: number;
  /** Simulated timestamp after which a runway can accept another landing clearance. */
  runwayAvailableAt: Record<string, number>;
  eventLog: GameEvent[];
  activeLossPairs: string[];
  handoffs: number;
  /** Selected operational runway/wind configuration for this session. */
  flowId: string;
  /** Radar positions sampled at one-second intervals for history trails. */
  trackHistory: Record<string, Vector2[]>;
  lastTrackAt: number;
  /** Instructions acknowledged by a pilot and waiting for execution. */
  pendingInstructions: PendingInstruction[];
  metrics: SessionMetrics;
  /** Rolling operational history used by the debrief, separate from the short live event log. */
  eventTimeline: GameEvent[];
  /** Seed retained in saves so traffic is reproducible. */
  seed: number;
  commandHistory: CommandRecord[];
}

export interface SessionMetrics {
  separationLosses: number;
  goArounds: number;
  missedHandoffs: number;
  expiredPriorities: number;
  /** Arrivals that crossed the sector boundary without being safely established. */
  unmanagedArrivals: number;
  wakeViolations: number;
}

export interface GameEvent {
  id: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  message: string;
}

export type AircraftCommand =
  | { kind: 'heading'; callsign: string; value: number; direction: 'shortest' | 'left' | 'right' }
  | { kind: 'altitude'; callsign: string; value: number }
  | { kind: 'speed'; callsign: string; value: number }
  | { kind: 'resumeSpeed'; callsign: string }
  | { kind: 'expedite'; callsign: string }
  | { kind: 'approach'; callsign: string; runwayId: string }
  | { kind: 'localizer'; callsign: string; runwayId: string }
  /** Legacy save compatibility. Standard approach mode hands aircraft to tower automatically. */
  | { kind: 'land'; callsign: string }
  | { kind: 'handoff'; callsign: string }
  | { kind: 'goAround'; callsign: string }
  | { kind: 'direct'; callsign: string; fixId: string }
  | { kind: 'hold'; callsign: string; fixId: string }
  | { kind: 'procedure'; callsign: string; procedureId: string; procedureKind: 'arrival' | 'departure'; fixIds: string[] };

export interface PendingInstruction {
  id: string;
  command: AircraftCommand;
  normalized: string;
  issuedAt: number;
  executeAt: number;
}

export interface CommandRecord {
  issuedAt: number;
  normalized: string;
}

export type ParseResult =
  | { ok: true; command: AircraftCommand; normalized: string }
  | { ok: false; error: string; suggestions?: string[] };
