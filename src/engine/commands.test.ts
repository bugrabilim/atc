import { describe, expect, it } from 'vitest';
import { parseCommandBatch, parseCommandLine } from './commands';

const callsigns = ['AR101', 'NX204'];

describe('parseCommandLine', () => {
  it('resolves a unique partial callsign and heading', () => {
    expect(parseCommandLine('AR HDG 90', callsigns, null)).toEqual({
      ok: true,
      command: { kind: 'heading', callsign: 'AR101', value: 90, direction: 'shortest' },
      normalized: 'AR101 HDG 090',
    });
  });

  it('accepts compact flight levels', () => {
    const result = parseCommandLine('FL010', callsigns, 'AR101');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.command).toEqual({ kind: 'altitude', callsign: 'AR101', value: 1000 });
  });

  it('returns a useful error for an unknown command', () => {
    const result = parseCommandLine('AR101 DOWN 1000', callsigns, null);
    expect(result.ok).toBe(false);
  });

  it('arms an ILS approach for an available runway', () => {
    expect(parseCommandLine('AR ILS 34L', callsigns, null, ['34L', '35R'])).toEqual({
      ok: true,
      command: { kind: 'approach', callsign: 'AR101', runwayId: '34L' },
      normalized: 'AR101 ILS 34L',
    });
  });

  it('accepts direct-to and hold clearances for known fixes', () => {
    expect(parseCommandLine('NX DCT FINAL1', callsigns, null, [], ['FINAL1'])).toMatchObject({
      ok: true,
      command: { kind: 'direct', callsign: 'NX204', fixId: 'FINAL1' },
    });
    expect(parseCommandLine('NX HOLD FINAL1', callsigns, null, [], ['FINAL1'])).toMatchObject({
      ok: true,
      command: { kind: 'hold', callsign: 'NX204', fixId: 'FINAL1' },
    });
  });

  it('explains that tower handoff replaces a manual landing clearance', () => {
    const result = parseCommandLine('AR LAND', callsigns, null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('otomatik');
  });

  it('parses terse chained clearances in one transmission', () => {
    expect(parseCommandBatch('AR H090 A30 S180 I34L', callsigns, null, ['34L'])).toMatchObject({
      ok: true,
      commands: [
        { kind: 'heading', callsign: 'AR101', value: 90 },
        { kind: 'altitude', callsign: 'AR101', value: 3000 },
        { kind: 'speed', callsign: 'AR101', value: 180 },
        { kind: 'approach', callsign: 'AR101', runwayId: '34L' },
      ],
    });
  });

  it('supports localizer-only, expedite and resume-normal-speed commands', () => {
    expect(parseCommandLine('AR L34L', callsigns, null, ['34L'])).toMatchObject({ ok: true, command: { kind: 'localizer' } });
    expect(parseCommandLine('AR X', callsigns, null)).toMatchObject({ ok: true, command: { kind: 'expedite' } });
    expect(parseCommandLine('AR RN', callsigns, null)).toMatchObject({ ok: true, command: { kind: 'resumeSpeed' } });
  });

  it('accepts a departure handoff clearance', () => {
    expect(parseCommandLine('NX HANDOFF', callsigns, null)).toEqual({
      ok: true,
      command: { kind: 'handoff', callsign: 'NX204' },
      normalized: 'NX204 HANDOFF',
    });
  });

  it('accepts a controller-initiated go-around for an established arrival', () => {
    expect(parseCommandLine('AR GA', callsigns, null)).toEqual({
      ok: true,
      command: { kind: 'goAround', callsign: 'AR101' },
      normalized: 'AR101 GO AROUND',
    });
  });
});
