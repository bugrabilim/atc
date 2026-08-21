import { describe, expect, it } from 'vitest';
import { queueInstructions } from './radio';
import { ACADEMY_LESSONS, createAcademyState, evaluateAcademyLesson } from './academy';
import { defaultScenario, worldWithFlow } from './scenario';

function lessonWorld(state: ReturnType<typeof createAcademyState>) {
  return worldWithFlow(defaultScenario.world, state.flowId, state.peakSkill);
}

describe('academy', () => {
  it('defines ten ordered, unique lessons', () => {
    expect(ACADEMY_LESSONS).toHaveLength(10);
    expect(new Set(ACADEMY_LESSONS.map((lesson) => lesson.id)).size).toBe(10);
    expect(ACADEMY_LESSONS.map((lesson) => lesson.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('starts the scope lesson without an aircraft selected', () => {
    const state = createAcademyState(defaultScenario, 'scope-basics');
    expect(state.mode).toBe('beginner');
    expect(state.selectedCallsign).toBeNull();
    expect(evaluateAcademyLesson(state, lessonWorld(state), 'scope-basics').complete).toBe(false);
    const selected = { ...state, selectedCallsign: state.aircraft[0]!.callsign };
    expect(evaluateAcademyLesson(selected, lessonWorld(selected), 'scope-basics').complete).toBe(true);
  });

  it('recognises a lesson command from the shared radio queue', () => {
    const state = createAcademyState(defaultScenario, 'heading');
    const callsign = state.selectedCallsign!;
    const commanded = queueInstructions(state, [{ kind: 'heading', callsign, value: 90, direction: 'shortest' }], [`${callsign} HDG 090`]);
    expect(evaluateAcademyLesson(commanded, lessonWorld(commanded), 'heading').complete).toBe(true);
  });

  it('uses only departures in the handoff lesson and two arrivals in sequencing', () => {
    const handoff = createAcademyState(defaultScenario, 'departure-handoff');
    const sequence = createAcademyState(defaultScenario, 'safe-sequence');
    expect(handoff.aircraft.every((aircraft) => aircraft.phase === 'departure')).toBe(true);
    expect(sequence.aircraft).toHaveLength(2);
    expect(sequence.aircraft.every((aircraft) => aircraft.phase === 'arrival')).toBe(true);
  });

  it('does not complete safe sequencing merely because two ILS clearances were issued', () => {
    const state = createAcademyState(defaultScenario, 'safe-sequence');
    const runwayId = state.aircraft[0]!.assignedRunway!;
    const withFirst = queueInstructions(state, [{ kind: 'approach', callsign: state.aircraft[0]!.callsign, runwayId }], [`${state.aircraft[0]!.callsign} ILS ${runwayId}`]);
    const withBoth = queueInstructions(withFirst, [{ kind: 'approach', callsign: state.aircraft[1]!.callsign, runwayId }], [`${state.aircraft[1]!.callsign} ILS ${runwayId}`]);
    expect(evaluateAcademyLesson(withBoth, lessonWorld(withBoth), 'safe-sequence').complete).toBe(false);
    const safelyWorked = { ...withBoth, pendingInstructions: [], landed: 1 };
    expect(evaluateAcademyLesson(safelyWorked, lessonWorld(safelyWorked), 'safe-sequence').complete).toBe(true);
  });
});
