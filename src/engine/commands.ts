import type { AircraftCommand, ParseResult } from './types';
import { normalizeHeading } from './math';

const RE_NUMBER = /^\d{1,5}$/;
const HEADING_ALIASES = new Set(['HDG', 'H', 'HEADING']);
const SPEED_ALIASES = new Set(['SPD', 'S', 'SPEED']);
const ALTITUDE_ALIASES = new Set(['ALT', 'A', 'ALTITUDE']);

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
  if (!keyword || !rawValue || !RE_NUMBER.test(rawValue)) {
    return { ok: false, error: `${callsign} için örnek: HDG 090, FL100 veya SPD 220.` };
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
    return { ok: false, error: `“${keyword}” bilinmeyen komut. HDG, FL, ALT veya SPD kullan.` };
  }

  return { ok: true, command, normalized };
}

export function applyCommand(stateAircraft: readonly import('./types').Aircraft[], command: AircraftCommand) {
  return stateAircraft.map((aircraft) => {
    if (aircraft.callsign !== command.callsign) return aircraft;
    if (command.kind === 'heading') {
      return { ...aircraft, targetHeading: command.value, turnDirection: command.direction };
    }
    if (command.kind === 'altitude') return { ...aircraft, targetAltitude: command.value };
    return {
      ...aircraft,
      targetSpeed: Math.max(aircraft.performance.minSpeed, Math.min(aircraft.performance.maxSpeed, command.value)),
    };
  });
}

