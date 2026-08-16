import type { AircraftCommand, GameState, PendingInstruction } from './types';

const NATO_ALPHABET: Record<string, string> = {
  A: 'Alfa', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot', G: 'Golf',
  H: 'Hotel', I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November',
  O: 'Oscar', P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango', U: 'Uniform',
  V: 'Victor', W: 'Whiskey', X: 'X-ray', Y: 'Yankee', Z: 'Zulu',
};

const DIGIT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'niner'];

function spokenDigits(value: string) {
  return [...value].map((character) => DIGIT_WORDS[Number(character)] ?? character).join(' ');
}

/** Formats an airline-style callsign for English ATC speech, e.g. CF101 → Charlie Foxtrot one zero one. */
export function spokenCallsign(callsign: string) {
  const match = callsign.toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) return callsign;
  const [, letters, digits] = match;
  return `${[...letters].map((letter) => NATO_ALPHABET[letter] ?? letter).join(' ')} ${spokenDigits(digits)}`;
}

function spokenRunway(runway: string) {
  const match = runway.toUpperCase().match(/^(\d{1,2})([LRC])?$/);
  if (!match) return runway;
  const side = match[2] === 'L' ? ' left' : match[2] === 'R' ? ' right' : match[2] === 'C' ? ' center' : '';
  return `${spokenDigits(match[1].padStart(2, '0'))}${side}`;
}

function spokenClearance(normalized: string) {
  const [, command = '', value = '', direction = ''] = normalized.trim().split(/\s+/);
  if (command === 'HDG') return `heading ${spokenDigits(value)}${direction === 'L' ? ' left' : direction === 'R' ? ' right' : ''}`;
  if (command === 'FL') return `flight level ${spokenDigits(value)}`;
  if (command === 'ALT') return `altitude ${spokenDigits(value)} feet`;
  if (command === 'SPD') return `speed ${spokenDigits(value)} knots`;
  if (command === 'ILS') return `ILS runway ${spokenRunway(value)}`;
  if (command === 'LOC') return `localizer runway ${spokenRunway(value)}`;
  if (command === 'DCT') return `direct ${value}`;
  if (command === 'HOLD') return `hold at ${value}`;
  if (command === 'HANDOFF') return 'handoff approved';
  if (command === 'EXPEDITE') return 'expedite';
  if (command === 'RESUME') return 'resume normal speed';
  return normalized;
}

/** Produces a speech-only English transmission while UI captions remain Turkish. */
export function spokenRadioMessage(message: string) {
  const readback = message.match(/^([A-Z]+\d+)\s·\sreadback onaylandı:\s(.+)$/i);
  if (readback) return `${spokenCallsign(readback[1])}, readback. ${spokenClearance(readback[2])}.`;

  const tower = message.match(/^([A-Z]+\d+)\s·\s(\d{1,2}[LRC]?) üzerinde established, kuleye devredildi$/i);
  if (tower) return `${spokenCallsign(tower[1])}, established ILS runway ${spokenRunway(tower[2])}, contact tower.`;

  return message.replace(/\b[A-Z]{2,3}\d{1,4}\b/g, (callsign) => spokenCallsign(callsign)).replace(/·/g, ',');
}

function callsignSeed(callsign: string) {
  return [...callsign].reduce((total, character) => total + character.charCodeAt(0), 0);
}

/** A deterministic response delay models a concise pilot readback without relying on randomness. */
export function instructionDelaySeconds(command: AircraftCommand) {
  const base = command.kind === 'heading' ? 1.25 : command.kind === 'speed' ? 1.35 : 1.55;
  return base + (callsignSeed(command.callsign) % 4) * 0.35;
}

/** Queues one combined radio transmission while retaining separately executable clearances. */
export function queueInstructions(
  state: GameState,
  commands: readonly AircraftCommand[],
  normalized: readonly string[],
): GameState {
  return commands.reduce((current, command, index) => {
    const queued = queueInstruction(current, command, normalized[index] ?? `${command.callsign} ${command.kind}`);
    if (index === 0) return queued;
    return {
      ...queued,
      pendingInstructions: queued.pendingInstructions.map((item) => (
        item.command === command ? { ...item, executeAt: item.executeAt + index * 0.08 } : item
      )),
    };
  }, state);
}

export function queueInstruction(state: GameState, command: AircraftCommand, normalized: string): GameState {
  const existing = state.pendingInstructions.find((item) => item.command.callsign === command.callsign && item.command.kind === command.kind);
  const pending: PendingInstruction = {
    id: `instruction-${command.callsign}-${command.kind}-${Math.round(state.elapsedSeconds * 10)}`,
    command,
    normalized,
    issuedAt: state.elapsedSeconds,
    executeAt: state.elapsedSeconds + instructionDelaySeconds(command),
  };
  return {
    ...state,
    commandHistory: [...state.commandHistory, { issuedAt: state.elapsedSeconds, normalized }].slice(-500),
    pendingInstructions: existing
      ? [...state.pendingInstructions.filter((item) => item !== existing), pending]
      : [...state.pendingInstructions, pending],
  };
}
