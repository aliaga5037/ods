import { describe, it, expect } from 'vitest';
import { convert, conversions } from './units';

describe('convert — linear factors', () => {
  it('meters to feet', () => { expect(convert('length', 'm-ft', 10)).toBeCloseTo(32.8084, 3); });
  it('barrels to cubic meters', () => { expect(convert('volume', 'bbl-m3', 100)).toBeCloseTo(15.8987, 3); });
  it('SG to ppg', () => { expect(convert('density', 'sg-ppg', 1.2)).toBeCloseTo(9.996, 3); });
});

describe('convert — temperature', () => {
  it('celsius to fahrenheit', () => { expect(convert('temperature', 'c-f', 100)).toBeCloseTo(212, 6); });
  it('celsius to kelvin', () => { expect(convert('temperature', 'c-k', 0)).toBeCloseTo(273.15, 6); });
});

describe('conversions table', () => {
  it('has all six categories', () => {
    expect(Object.keys(conversions).sort()).toEqual(
      ['density', 'length', 'pressure', 'temperature', 'volume', 'weight']);
  });
  it('every pair has a unique id within its category', () => {
    for (const cat of Object.values(conversions)) {
      const ids = cat.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
