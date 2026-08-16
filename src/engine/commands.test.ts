import { describe, expect, it } from 'vitest';
import { parseCommandLine } from './commands';

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

  it('accepts a landing clearance without a numeric argument', () => {
    expect(parseCommandLine('AR LAND', callsigns, null)).toEqual({
      ok: true,
      command: { kind: 'land', callsign: 'AR101' },
      normalized: 'AR101 CLEARED TO LAND',
    });
  });

  it('accepts a departure handoff clearance', () => {
    expect(parseCommandLine('NX HANDOFF', callsigns, null)).toEqual({
      ok: true,
      command: { kind: 'handoff', callsign: 'NX204' },
      normalized: 'NX204 HANDOFF',
    });
  });
});
