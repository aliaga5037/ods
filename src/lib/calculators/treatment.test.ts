import { describe, it, expect } from 'vitest';
import { addLightPremix, maintainConcentration } from './treatment';

const num = (r: { values: { label: string; value: string }[] }, label: string) =>
  parseFloat(r.values.find((v) => v.label.startsWith(label))!.value);

describe('addLightPremix', () => {
  it('computes premix volume and circulation time', () => {
    const r = addLightPremix({ volume: 500, pumpRate: 400, currentWeight: 1.5, desiredWeight: 1.3, premixDensity: 1.0 });
    expect(r.ok).toBe(true);
    expect(num(r, 'Premix Volume')).toBeCloseTo(333.33, 1);   // 500*0.2/0.3
    expect(num(r, 'Circulation Time')).toBeCloseTo(52.5, 1);   // 500/(400/42)
  });
  it('rejects desired >= current', () => {
    expect(addLightPremix({ volume: 500, pumpRate: 400, currentWeight: 1.3, desiredWeight: 1.5, premixDensity: 1.0 }).ok).toBe(false);
  });
});

describe('maintainConcentration', () => {
  it('computes number of containers', () => {
    const r = maintainConcentration({ volume: 500, pumpRate: 400, containerType: 'sack-25', customCapacity: NaN, chemicalDensity: 1.0, currentConcentration: 2, desiredConcentration: 5 });
    expect(r.ok).toBe(true);
    expect(num(r, 'Containers')).toBeCloseTo(27.22, 1);   // 3*500*0.453592/25
  });
  it('rejects desired <= current concentration', () => {
    expect(maintainConcentration({ volume: 500, pumpRate: 400, containerType: 'sack-25', customCapacity: NaN, chemicalDensity: 1.0, currentConcentration: 5, desiredConcentration: 5 }).ok).toBe(false);
  });
});
