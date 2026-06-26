import { describe, it, expect } from 'vitest';
import { parseStat } from './stats';

describe('parseStat', () => {
  it('parses a plain number', () => {
    expect(parseStat('9')).toEqual({ kind: 'number', prefix: '', number: 9, suffix: '' });
  });
  it('parses a number with a trailing suffix', () => {
    expect(parseStat('40+')).toEqual({ kind: 'number', prefix: '', number: 40, suffix: '+' });
    expect(parseStat('6+')).toEqual({ kind: 'number', prefix: '', number: 6, suffix: '+' });
  });
  it('parses a number with a leading prefix', () => {
    expect(parseStat('$5M')).toEqual({ kind: 'number', prefix: '$', number: 5, suffix: 'M' });
  });
  it('returns text for non-numeric values', () => {
    expect(parseStat('API')).toEqual({ kind: 'text', text: 'API' });
  });
});
