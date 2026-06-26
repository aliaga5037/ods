import { describe, it, expect } from 'vitest';
import { bariteRequired, addKnownBarite, cutWeight, mixFluids, owrAdjust, slugCalc } from './mud';

const num = (r: { values: { label: string; value: string }[] }, label: string) =>
  parseFloat(r.values.find((v) => v.label.startsWith(label))!.value);

describe('mixFluids', () => {
  it('blends two fluids by mass', () => {
    const r = mixFluids({ fluids: [{ density: 1.2, volume: 100 }, { density: 1.5, volume: 50 }] });
    expect(r.ok).toBe(true);
    expect(num(r, 'Mixed')).toBeCloseTo(1.3, 4);     // (120+75)/150
    expect(num(r, 'Total')).toBeCloseTo(150, 4);
  });
  it('requires at least two fluids', () => {
    expect(mixFluids({ fluids: [{ density: 1.2, volume: 100 }] }).ok).toBe(false);
  });
});

describe('cutWeight (variable volume)', () => {
  it('computes dilution volume', () => {
    const r = cutWeight({ initialWeight: 1.5, volume: 100, desiredWeight: 1.3, dilutionDensity: 1.0, constantVolume: false });
    expect(r.ok).toBe(true);
    expect(num(r, 'Dilution')).toBeCloseTo(66.6667, 2);   // 100*(0.2)/(0.3)
    expect(num(r, 'Final Volume')).toBeCloseTo(166.6667, 2);
  });
  it('rejects desired >= initial', () => {
    expect(cutWeight({ initialWeight: 1.3, volume: 100, desiredWeight: 1.5, dilutionDensity: 1.0, constantVolume: false }).ok).toBe(false);
  });
});

describe('bariteRequired (variable volume)', () => {
  it('returns a positive tonnage and flags it pending verification', () => {
    const r = bariteRequired({ initialWeight: 1.2, desiredWeight: 1.5, volume: 100, constantVolume: false });
    expect(r.ok).toBe(true);
    expect(num(r, 'Barite')).toBeGreaterThan(0);
    expect(r.warnings?.some((w) => /verif/i.test(w))).toBe(true);
  });
  it('rejects desired <= initial', () => {
    expect(bariteRequired({ initialWeight: 1.5, desiredWeight: 1.2, volume: 100, constantVolume: false }).ok).toBe(false);
  });
});

describe('addKnownBarite', () => {
  it('increases mud weight', () => {
    const r = addKnownBarite({ initialWeight: 1.2, volume: 100, bariteAdded: 5 });
    expect(r.ok).toBe(true);
    expect(num(r, 'New Mud Weight')).toBeGreaterThan(1.2);
  });
});

describe('owrAdjust', () => {
  it('returns a result for a valid adjustment', () => {
    const r = owrAdjust({ currentOWR: 70, oilPercent: 70, volume: 100, desiredOWR: 80, density: 0.85 });
    expect(r.ok).toBe(true);
  });
});

describe('slugCalc', () => {
  it('returns a result and flags it pending ODS verification', () => {
    const r = slugCalc({ pipeLength: 100, mudWeight: 1.5, pipeCapacity: 0.0178, slugVolume: 20 });
    expect(r.ok).toBe(true);
    expect(r.warnings?.some((w) => /verif/i.test(w))).toBe(true);
  });
});
