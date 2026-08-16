import type { AircraftCommand, ParseResult } from './types';
import { normalizeHeading } from './math';

const RE_NUMBER = /^\d{1,5}$/;
const HEADING_ALIASES = new Set(['HDG', 'H', 'HEADING']);
const SPEED_ALIASES = new Set(['SPD', 'S', 'SPEED']);
const ALTITUDE_ALIASES = new Set(['ALT', 'A', 'ALTITUDE']);
const APPROACH_ALIASES = new Set(['APP', 'ILS']);
const DIRECT_ALIASES = new Set(['DCT', 'DIRECT']);
const HOLD_ALIASES = new Set(['HOLD']);
const LAND_ALIASES = new Set(['LAND', 'CLEARED']);
const HANDOFF_ALIASES = new Set(['HANDOFF', 'HOF']);

function resolveCallsign(token: string, callsigns: string[]): string | null {
  const upper = token.toUpperCase();
  if (callsigns.includes(upper)) return upper;
  const matches = callsigns.filter((callsign) => callsign.startsWith(upper));
  return matches.length === 1 ? matches[0] : null;
}

export function parseCommandLine(
  input: string,
  callsigns: string[],
  selectedCallsign: string | null,
  runwayIds: string[] = [],
  fixIds: string[] = [],
): ParseResult {
  const compact = input.trim().toUpperCase().replace(/(HDG|SPD|ALT|FL)(\d)/g, '$1 $2');
  if (!compact) return { ok: false, error: 'Bir komut yaz veya hızlı komutlardan birini seç.' };

  const tokens = compact.split(/\s+/);
  const resolved = resolveCallsign(tokens[0], callsigns);
  const callsign = resolved ?? selectedCallsign;
  const body = resolved ? tokens.slice(1) : tokens;

  if (!callsign) {
    return {
      ok: false,
      error: `“${tokens[0]}” çağrı kodu bulunamadı. Önce radardan bir uçak seçebilirsin.`,
      suggestions: callsigns.filter((item) => item.startsWith(tokens[0])).slice(0, 4),
    };
  }

  const keyword = body[0];
  const rawValue = body[1];
  if (keyword && LAND_ALIASES.has(keyword)) {
    return { ok: true, command: { kind: 'land', callsign }, normalized: `${callsign} CLEARED TO LAND` };
  }
  if (keyword && HANDOFF_ALIASES.has(keyword)) {
    return { ok: true, command: { kind: 'handoff', callsign }, normalized: `${callsign} HANDOFF` };
  }
  if (!keyword || !rawValue) {
    return { ok: false, error: `${callsign} için örnek: HDG 090, FL100, SPD 220 veya ILS 34L.` };
  }

  if (APPROACH_ALIASES.has(keyword)) {
    const runwayId = rawValue.toUpperCase();
    if (runwayIds.length > 0 && !runwayIds.includes(runwayId)) {
      return { ok: false, error: `${runwayId} bu senaryoda tanımlı bir pist değil.` };
    }
    return {
      ok: true,
      command: { kind: 'approach', callsign, runwayId },
      normalized: `${callsign} ILS ${runwayId}`,
    };
  }

  if (DIRECT_ALIASES.has(keyword) || HOLD_ALIASES.has(keyword)) {
    const fixId = rawValue.toUpperCase();
    if (fixIds.length > 0 && !fixIds.includes(fixId)) {
      return { ok: false, error: `${fixId} bu sahada tanımlı bir waypoint değil.` };
    }
    const kind = DIRECT_ALIASES.has(keyword) ? 'direct' : 'hold';
    return {
      ok: true,
      command: { kind, callsign, fixId },
      normalized: `${callsign} ${kind === 'direct' ? 'DCT' : 'HOLD'} ${fixId}`,
    };
  }

  if (!RE_NUMBER.test(rawValue)) {
    return { ok: false, error: `${callsign} için örnek: HDG 090, FL100, SPD 220, DCT FINAL1 veya ILS 34L.` };
  }

  const numericValue = Number(rawValue);
  let command: AircraftCommand;
  let normalized: string;

  if (HEADING_ALIASES.has(keyword)) {
    if (numericValue > 360) return { ok: false, error: 'Heading 000 ile 360 arasında olmalı.' };
    const directionToken = body[2];
    const direction = directionToken === 'L' ? 'left' : directionToken === 'R' ? 'right' : 'shortest';
    const heading = normalizeHeading(numericValue);
    command = { kind: 'heading', callsign, value: heading, direction };
    normalized = `${callsign} HDG ${String(heading).padStart(3, '0')}${direction === 'shortest' ? '' : ` ${direction === 'left' ? 'L' : 'R'}`}`;
  } else if (keyword === 'FL') {
    if (numericValue > 450) return { ok: false, error: 'Flight level FL000 ile FL450 arasında olmalı.' };
    command = { kind: 'altitude', callsign, value: numericValue * 100 };
    normalized = `${callsign} FL${String(numericValue).padStart(3, '0')}`;
  } else if (ALTITUDE_ALIASES.has(keyword)) {
    if (numericValue > 45000) return { ok: false, error: 'İrtifa 0 ile 45.000 ft arasında olmalı.' };
    command = { kind: 'altitude', callsign, value: numericValue };
    normalized = `${callsign} ALT ${numericValue}`;
  } else if (SPEED_ALIASES.has(keyword)) {
    if (numericValue < 120 || numericValue > 520) return { ok: false, error: 'Hız 120 ile 520 knot arasında olmalı.' };
    command = { kind: 'speed', callsign, value: numericValue };
    normalized = `${callsign} SPD ${numericValue}`;
  } else {
    return { ok: false, error: `“${keyword}” bilinmeyen komut. HDG, FL, ALT, SPD, DCT, HOLD veya ILS kullan.` };
  }

  return { ok: true, command, normalized };
}

export function applyCommand(stateAircraft: readonly import('./types').Aircraft[], command: AircraftCommand) {
  return stateAircraft.map((aircraft) => {
    if (aircraft.callsign !== command.callsign) return aircraft;
    if (command.kind === 'heading') {
      return { ...aircraft, targetHeading: command.value, turnDirection: command.direction, approach: undefined, navigation: undefined };
    }
    if (command.kind === 'altitude') return { ...aircraft, targetAltitude: command.value };
    if (command.kind === 'approach') {
      return aircraft.phase === 'arrival'
        ? { ...aircraft, approach: { runwayId: command.runwayId, status: 'armed' as const, landingCleared: false }, navigation: undefined }
        : aircraft;
    }
    if (command.kind === 'land') {
      return aircraft.approach
        ? { ...aircraft, approach: { ...aircraft.approach, landingCleared: true } }
        : aircraft;
    }
    if (command.kind === 'handoff') {
      return aircraft.phase === 'departure' ? { ...aircraft, handoffCleared: true } : aircraft;
    }
    if (command.kind === 'direct') {
      return {
        ...aircraft,
        approach: undefined,
        navigation: { mode: 'direct' as const, fixIds: [command.fixId], currentLegIndex: 0, procedure: `DCT ${command.fixId}` },
      };
    }
    if (command.kind === 'hold') {
      return {
        ...aircraft,
        approach: undefined,
        navigation: { mode: 'hold' as const, fixIds: [command.fixId], currentLegIndex: 0, procedure: `HOLD ${command.fixId}`, holding: false },
      };
    }
    return {
      ...aircraft,
      targetSpeed: Math.max(aircraft.performance.minSpeed, Math.min(aircraft.performance.maxSpeed, command.value)),
    };
  });
}
