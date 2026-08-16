import type { AircraftCommand, GameState, PendingInstruction } from './types';

function callsignSeed(callsign: string) {
  return [...callsign].reduce((total, character) => total + character.charCodeAt(0), 0);
}

/** A deterministic response delay models a concise pilot readback without relying on randomness. */
export function instructionDelaySeconds(command: AircraftCommand) {
  const base = command.kind === 'land' ? 1.1 : command.kind === 'heading' ? 1.35 : 1.7;
  return base + (callsignSeed(command.callsign) % 4) * 0.35;
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
    pendingInstructions: existing
      ? [...state.pendingInstructions.filter((item) => item !== existing), pending]
      : [...state.pendingInstructions, pending],
  };
}
