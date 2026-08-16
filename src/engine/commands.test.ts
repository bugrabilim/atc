import { describe, expect, it } from 'vitest';
import { parseCommandLine } from './commands';

const callsigns = ['TK1953', 'PGT7KM'];

describe('parseCommandLine', () => {
  it('resolves a unique partial callsign and heading', () => {
    expect(parseCommandLine('TK HDG 90', callsigns, null)).toEqual({
      ok: true,
      command: { kind: 'heading', callsign: 'TK1953', value: 90, direction: 'shortest' },
      normalized: 'TK1953 HDG 090',
    });
  });

  it('accepts compact flight levels', () => {
    const result = parseCommandLine('FL010', callsigns, 'TK1953');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.command).toEqual({ kind: 'altitude', callsign: 'TK1953', value: 1000 });
  });

  it('returns a useful error for an unknown command', () => {
    const result = parseCommandLine('TK1953 DOWN 1000', callsigns, null);
    expect(result.ok).toBe(false);
  });

  it('arms an ILS approach for an available runway', () => {
    expect(parseCommandLine('TK ILS 34L', callsigns, null, ['34L', '35R'])).toEqual({
      ok: true,
      command: { kind: 'approach', callsign: 'TK1953', runwayId: '34L' },
      normalized: 'TK1953 ILS 34L',
    });
  });

  it('accepts direct-to and hold clearances for known fixes', () => {
    expect(parseCommandLine('PGT DCT FM001', callsigns, null, [], ['FM001'])).toMatchObject({
      ok: true,
      command: { kind: 'direct', callsign: 'PGT7KM', fixId: 'FM001' },
    });
    expect(parseCommandLine('PGT HOLD FM001', callsigns, null, [], ['FM001'])).toMatchObject({
      ok: true,
      command: { kind: 'hold', callsign: 'PGT7KM', fixId: 'FM001' },
    });
  });

  it('accepts a landing clearance without a numeric argument', () => {
    expect(parseCommandLine('TK LAND', callsigns, null)).toEqual({
      ok: true,
      command: { kind: 'land', callsign: 'TK1953' },
      normalized: 'TK1953 CLEARED TO LAND',
    });
  });
});
