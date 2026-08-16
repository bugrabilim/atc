export type Vector2 = { x: number; y: number };

export type AircraftPhase = 'arrival' | 'departure';
export type Trend = 'climb' | 'level' | 'descend';

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

export interface RadarWorld {
  airport: string;
  sectorName: string;
  rangeNm: number;
  runways: Runway[];
  fixes: Fix[];
}

export interface Conflict {
  pair: [string, string];
  horizontalNm: number;
  verticalFt: number;
  severity: 'warning' | 'loss';
}

export interface GameState {
  elapsedSeconds: number;
  paused: boolean;
  timeScale: number;
  aircraft: Aircraft[];
  conflicts: Conflict[];
  selectedCallsign: string | null;
  score: number;
}

export type AircraftCommand =
  | { kind: 'heading'; callsign: string; value: number; direction: 'shortest' | 'left' | 'right' }
  | { kind: 'altitude'; callsign: string; value: number }
  | { kind: 'speed'; callsign: string; value: number };

export type ParseResult =
  | { ok: true; command: AircraftCommand; normalized: string }
  | { ok: false; error: string; suggestions?: string[] };

