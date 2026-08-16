import { describe, expect, it } from 'vitest';
import { applyCommand } from './commands';
import { queueInstruction } from './radio';
import { initialState, world } from './scenario';
import { stepGame } from './simulation';

describe('radio instructions', () => {
  it('queues an instruction before changing the aircraft target', () => {
    const state = structuredClone(initialState);
    const next = queueInstruction(state, { kind: 'heading', callsign: 'AR101', value: 180, direction: 'shortest' }, 'AR101 HDG 180');

    expect(next.aircraft[0].targetHeading).toBe(state.aircraft[0].targetHeading);
    expect(next.pendingInstructions).toHaveLength(1);
    expect(next.commandHistory.at(-1)?.normalized).toBe('AR101 HDG 180');
  });

  it('applies a queued instruction after the pilot readback delay', () => {
    let state = structuredClone(initialState);
    const command = { kind: 'heading' as const, callsign: 'AR101', value: 180, direction: 'shortest' as const };
    state = queueInstruction(state, command, 'AR101 HDG 180');

    for (let index = 0; index < 20; index += 1) state = stepGame(state, world, 0.1);

    expect(state.pendingInstructions).toHaveLength(0);
    expect(state.aircraft[0].targetHeading).toBe(180);
    expect(state.eventLog.at(-1)?.message).toContain('readback onaylandı');
  });

  it('keeps direct command application available to the simulation engine', () => {
    const aircraft = applyCommand(initialState.aircraft, { kind: 'speed', callsign: 'AR101', value: 220 });
    expect(aircraft[0].targetSpeed).toBe(220);
  });
});
