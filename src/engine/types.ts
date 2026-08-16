export type Vector2 = { x: number; y: number };

export type AircraftPhase = 'arrival' | 'departure';
export type Trend = 'climb' | 'level' | 'descend';
export type ApproachStatus = 'armed' | 'captured';
export type NavigationMode = 'route' | 'direct' | 'hold';

export interface AircraftPerformance {
  turnRateDegPerSecond: number;
  climbRateFpm: number;
  descentRateFpm: number;
  accelerationKtPerSecond: number;
  minSpeed: number;
  maxSpeed: number;
}

export interface Aircraft {
  callsign: string;
  type: string;
  phase: AircraftPhase;
  position: Vector2;
  heading: number;
  altitude: number;
  speed: number;
  targetHeading: number;
  targetAltitude: number;
  targetSpeed: number;
  turnDirection: 'shortest' | 'left' | 'right';
  performance: AircraftPerformance;
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
    landingCleared: boolean;
  };
  navigation?: {
    mode: NavigationMode;
    fixIds: string[];
    currentLegIndex: number;
    procedure: string;
    holding?: boolean;
  };
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
  position: Vector2;
}

export interface Procedure {
  id: string;
  kind: 'arrival' | 'departure';
  runwayId?: string;
  fixIds: string[];
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
}

export interface Conflict {
  pair: [string, string];
  horizontalNm: number;
  verticalFt: number;
  severity: 'warning' | 'loss';
  predicted?: {
    timeSeconds: number;
    horizontalNm: number;
  };
}

export interface GameState {
  elapsedSeconds: number;
  paused: boolean;
  timeScale: number;
  aircraft: Aircraft[];
  conflicts: Conflict[];
  selectedCallsign: string | null;
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
  | { kind: 'approach'; callsign: string; runwayId: string }
  | { kind: 'land'; callsign: string }
  | { kind: 'handoff'; callsign: string }
  | { kind: 'direct'; callsign: string; fixId: string }
  | { kind: 'hold'; callsign: string; fixId: string };

export interface PendingInstruction {
  id: string;
  command: AircraftCommand;
  normalized: string;
  issuedAt: number;
  executeAt: number;
}

export type ParseResult =
  | { ok: true; command: AircraftCommand; normalized: string }
  | { ok: false; error: string; suggestions?: string[] };
