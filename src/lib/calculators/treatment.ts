import { type CalcResult, fail } from './types';

const LB_PER_KG = 0.453592;
const GAL_PER_BBL = 42;
const fixed = (n: number, d = 2) => n.toFixed(d);

export const CONTAINERS = [
  { id: 'sack-25', label: '25 kg Sack' },
  { id: 'drum-55', label: '55 gal Drum' },
  { id: 'ibc-1000', label: '1000 L IBC' },
  { id: 'can-30', label: '30 L Can' },
] as const;

export function addLightPremix(i: { volume: number; pumpRate: number; currentWeight: number; desiredWeight: number; premixDensity: number }): CalcResult {
  const { volume, pumpRate, currentWeight, desiredWeight, premixDensity } = i;
  if ([volume, pumpRate, currentWeight, desiredWeight, premixDensity].some(Number.isNaN)) return fail('Please fill in all fields.');
  if (desiredWeight >= currentWeight) return fail('Desired weight must be less than current weight.');
  if (premixDensity >= desiredWeight) return fail('Premix density should be less than desired weight.');
  const premixVolume = (volume * (currentWeight - desiredWeight)) / (desiredWeight - premixDensity);
  const circulationTime = volume / (pumpRate / GAL_PER_BBL);
  const dilutionRate = premixVolume / circulationTime;
  return {
    ok: true,
    values: [
      { label: 'Premix Volume', value: `${fixed(premixVolume, 1)} bbl` },
      { label: 'Dilution Rate', value: `${fixed(dilutionRate)} bbl/min` },
      { label: 'Circulation Time', value: `${fixed(circulationTime, 1)} min` },
      { label: 'Divert to Reserve', value: `${fixed(premixVolume, 1)} bbl` },
    ],
  };
}

export function maintainConcentration(i: { volume: number; pumpRate: number; containerType: string; customCapacity: number; chemicalDensity: number; currentConcentration: number; desiredConcentration: number }): CalcResult {
  const { volume, pumpRate, containerType, customCapacity, chemicalDensity, currentConcentration, desiredConcentration } = i;
  if ([volume, pumpRate, chemicalDensity, currentConcentration, desiredConcentration].some(Number.isNaN)) return fail('Please fill in all required fields.');
  if (desiredConcentration <= currentConcentration) return fail('Desired concentration must be greater than current concentration.');
  const capacities: Record<string, number> = {
    'sack-25': 25,
    'drum-55': 55 * 3.78541 * chemicalDensity,
    'ibc-1000': 1000 * chemicalDensity,
    'can-30': 30 * chemicalDensity,
  };
  const capacity = !Number.isNaN(customCapacity) && customCapacity > 0 ? customCapacity : capacities[containerType];
  const chemicalKg = (desiredConcentration - currentConcentration) * volume * LB_PER_KG;
  const containers = chemicalKg / capacity;
  const circulationTime = volume / (pumpRate / GAL_PER_BBL);
  const additionRate = containers / circulationTime;
  const label = CONTAINERS.find((c) => c.id === containerType)?.label ?? 'container';
  return {
    ok: true,
    values: [
      { label: 'Containers', value: `${fixed(containers, 1)} × ${label}` },
      { label: 'Addition Rate', value: `${fixed(additionRate)} per min` },
      { label: 'Circulation Time', value: `${fixed(circulationTime, 1)} min` },
    ],
  };
}
