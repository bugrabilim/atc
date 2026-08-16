import type { AircraftCommand, ParseResult } from './types';
import { normalizeHeading } from './math';

const RE_NUMBER = /^\d{1,5}$/;
const HEADING_ALIASES = new Set(['HDG', 'H', 'HEADING']);
const SPEED_ALIASES = new Set(['SPD', 'S', 'SPEED']);
const ALTITUDE_ALIASES = new Set(['ALT', 'A', 'ALTITUDE']);
const APPROACH_ALIASES = new Set(['APP', 'ILS', 'I']);
const LOCALIZER_ALIASES = new Set(['LOC', 'LLZ', 'L']);
const DIRECT_ALIASES = new Set(['DCT', 'DIRECT']);
const HOLD_ALIASES = new Set(['HOLD']);
const LAND_ALIASES = new Set(['LAND', 'CLEARED']);
const HANDOFF_ALIASES = new Set(['HANDOFF', 'HOF']);
const RESUME_ALIASES = new Set(['RESUME', 'NORMAL', 'NORM', 'RN']);
const EXPEDITE_ALIASES = new Set(['EXPEDITE', 'EXP', 'X']);

function expandCompactSyntax(input: string) {
  return input
    .trim()
    .toUpperCase()
    .replace(/[;,]+/g, ' ')
    .replace(/\b(HDG|SPD|ALT|FL)(\d)/g, '$1 $2')
    .replace(/\b([HASI])(\d)/g, '$1 $2')
    .replace(/\b(L)(\d{2}[LRC]?)\b/g, '$1 $2');
}

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
  const compact = expandCompactSyntax(input);
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
    return { ok: false, error: 'Standart yaklaşma modunda LAND kullanılmaz. LOC ve glideslope established olduğunda uçak otomatik olarak kuleye devredilir.' };
  }
  if (keyword && HANDOFF_ALIASES.has(keyword)) {
    return { ok: true, command: { kind: 'handoff', callsign }, normalized: `${callsign} HANDOFF` };
  }
  if (keyword && RESUME_ALIASES.has(keyword)) {
    return { ok: true, command: { kind: 'resumeSpeed', callsign }, normalized: `${callsign} RESUME NORMAL SPEED` };
  }
  if (keyword && EXPEDITE_ALIASES.has(keyword)) {
    return { ok: true, command: { kind: 'expedite', callsign }, normalized: `${callsign} EXPEDITE` };
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

  if (LOCALIZER_ALIASES.has(keyword)) {
    const runwayId = rawValue.toUpperCase();
    if (runwayIds.length > 0 && !runwayIds.includes(runwayId)) {
      return { ok: false, error: `${runwayId} bu senaryoda tanımlı bir pist değil.` };
    }
    return {
      ok: true,
      command: { kind: 'localizer', callsign, runwayId },
      normalized: `${callsign} LOC ${runwayId}`,
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
    const altitude = keyword === 'A' && numericValue <= 450 ? numericValue * 100 : numericValue;
    if (altitude > 45000) return { ok: false, error: 'İrtifa 0 ile 45.000 ft arasında olmalı.' };
    command = { kind: 'altitude', callsign, value: altitude };
    normalized = `${callsign} ALT ${altitude}`;
  } else if (SPEED_ALIASES.has(keyword)) {
    if (numericValue < 120 || numericValue > 520) return { ok: false, error: 'Hız 120 ile 520 knot arasında olmalı.' };
    command = { kind: 'speed', callsign, value: numericValue };
    normalized = `${callsign} SPD ${numericValue}`;
  } else {
    return { ok: false, error: `“${keyword}” bilinmeyen komut. H/HDG, A/FL, S/SPD, DCT, HOLD, LOC veya ILS kullan.` };
  }

  return { ok: true, command, normalized };
}

export type ParseBatchResult =
  | { ok: true; commands: AircraftCommand[]; normalized: string[] }
  | { ok: false; error: string; suggestions?: string[] };

/** Parses terse chained clearances such as `AR H090 A30 S180 I34L`. */
export function parseCommandBatch(
  input: string,
  callsigns: string[],
  selectedCallsign: string | null,
  runwayIds: string[] = [],
  fixIds: string[] = [],
): ParseBatchResult {
  const compact = expandCompactSyntax(input);
  if (!compact) return { ok: false, error: 'Bir komut yaz veya hızlı komutlardan birini seç.' };
  const tokens = compact.split(/\s+/);
  const resolved = resolveCallsign(tokens[0], callsigns);
  const callsign = resolved ?? selectedCallsign;
  const body = resolved ? tokens.slice(1) : tokens;
  if (!callsign) return { ok: false, error: 'Önce bir uçak seç veya çağrı kodunu yaz.' };

  const chunks: string[][] = [];
  let index = 0;
  while (index < body.length) {
    const keyword = body[index];
    if (LAND_ALIASES.has(keyword) || HANDOFF_ALIASES.has(keyword) || RESUME_ALIASES.has(keyword) || EXPEDITE_ALIASES.has(keyword)) {
      chunks.push([keyword]);
      index += 1;
      continue;
    }
    if (!body[index + 1]) return { ok: false, error: `${keyword} komutu için bir değer eksik.` };
    const chunk = [keyword, body[index + 1]];
    if (HEADING_ALIASES.has(keyword) && ['L', 'R'].includes(body[index + 2])) {
      chunk.push(body[index + 2]);
      index += 1;
    }
    chunks.push(chunk);
    index += 2;
  }

  const commands: AircraftCommand[] = [];
  const normalized: string[] = [];
  for (const chunk of chunks) {
    const parsed = parseCommandLine(`${callsign} ${chunk.join(' ')}`, callsigns, callsign, runwayIds, fixIds);
    if (!parsed.ok) return parsed;
    commands.push(parsed.command);
    normalized.push(parsed.normalized);
  }
  return commands.length > 0 ? { ok: true, commands, normalized } : { ok: false, error: 'Geçerli bir talimat bulunamadı.' };
}

export function applyCommand(stateAircraft: readonly import('./types').Aircraft[], command: AircraftCommand) {
  return stateAircraft.map((aircraft) => {
    if (aircraft.callsign !== command.callsign) return aircraft;
    if (command.kind === 'heading') {
      return {
        ...aircraft,
        targetHeading: command.value,
        turnDirection: command.direction,
        approach: aircraft.approach?.status === 'armed' ? aircraft.approach : undefined,
        navigation: undefined,
      };
    }
    if (command.kind === 'altitude') return { ...aircraft, targetAltitude: command.value };
    if (command.kind === 'approach') {
      return aircraft.phase === 'arrival'
        ? { ...aircraft, approach: { runwayId: command.runwayId, status: 'armed' as const }, navigation: undefined }
        : aircraft;
    }
    if (command.kind === 'localizer') {
      return aircraft.phase === 'arrival'
        ? { ...aircraft, approach: { runwayId: command.runwayId, status: 'armed' as const, localizerOnly: true }, navigation: undefined }
        : aircraft;
    }
    if (command.kind === 'land') {
      return aircraft;
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
    if (command.kind === 'resumeSpeed') {
      return { ...aircraft, speedMode: 'normal' as const };
    }
    if (command.kind === 'expedite') {
      return { ...aircraft, expedite: true };
    }
    return {
      ...aircraft,
      targetSpeed: Math.max(aircraft.performance.minSpeed, Math.min(aircraft.performance.maxSpeed, command.value)),
      speedMode: 'assigned' as const,
    };
  });
}
