import type { AircraftCommand, GameState, PendingInstruction } from './types';

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
