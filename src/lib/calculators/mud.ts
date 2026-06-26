import { type CalcResult, fail } from './types';

const PPG_PER_SG = 8.33;
const BARITE_PPG = 35;
const BARITE_SG = 4.2;
const fixed = (n: number, d = 2) => n.toFixed(d);

export function bariteRequired(i: { initialWeight: number; desiredWeight: number; volume: number; constantVolume: boolean }): CalcResult {
  const { initialWeight, desiredWeight, volume, constantVolume } = i;
  if ([initialWeight, desiredWeight, volume].some(Number.isNaN)) return fail('Please fill in all fields.');
  if (desiredWeight <= initialWeight) return fail('Desired weight must be greater than initial weight.');
  const initialPPG = initialWeight * PPG_PER_SG;
  const desiredPPG = desiredWeight * PPG_PER_SG;
  let bariteTons: number, finalVolume: number;
  const notes: string[] = [];
  if (constantVolume) {
    const volumeToRemove = (volume * (desiredPPG - initialPPG)) / (BARITE_PPG - initialPPG);
    bariteTons = (volumeToRemove * BARITE_PPG * 42) / 2000;
    finalVolume = volume;
    notes.push('Constant volume: remove mud before adding barite.');
  } else {
    const sacks = (1470 * volume * (desiredPPG - initialPPG)) / (BARITE_PPG - desiredPPG);
    bariteTons = (sacks * 94) / 2000;
    finalVolume = volume + sacks / (94 * BARITE_SG);
  }
  return {
    ok: true,
    values: [
      { label: 'Barite Required', value: `${fixed(bariteTons)} tons` },
      { label: 'Final Mud Weight', value: `${fixed(desiredWeight)} sg (${fixed(desiredWeight * PPG_PER_SG)} ppg)` },
      { label: 'Final Volume', value: `${fixed(finalVolume)} bbl` },
    ],
    notes,
    warnings: ['Barite tonnage uses legacy sack/lb assumptions — pending ODS verification.'],
  };
}

export function addKnownBarite(i: { initialWeight: number; volume: number; bariteAdded: number }): CalcResult {
  const { initialWeight, volume, bariteAdded } = i;
  if ([initialWeight, volume, bariteAdded].some(Number.isNaN)) return fail('Please fill in all fields.');
  const initialPPG = initialWeight * PPG_PER_SG;
  const bariteBarrels = (bariteAdded * 2000) / (BARITE_PPG * 42);
  const newVolume = volume + bariteBarrels;
  const newPPG = (initialPPG * volume + BARITE_PPG * bariteBarrels) / newVolume;
  const newSG = newPPG / PPG_PER_SG;
  return {
    ok: true,
    values: [
      { label: 'New Mud Weight', value: `${fixed(newSG)} sg (${fixed(newPPG)} ppg)` },
      { label: 'Final Volume', value: `${fixed(newVolume)} bbl` },
      { label: 'Weight Increase', value: `${fixed(newSG - initialWeight)} sg` },
    ],
  };
}

export function cutWeight(i: { initialWeight: number; volume: number; desiredWeight: number; dilutionDensity: number; constantVolume: boolean }): CalcResult {
  const { initialWeight, volume, desiredWeight, dilutionDensity, constantVolume } = i;
  if ([initialWeight, volume, desiredWeight, dilutionDensity].some(Number.isNaN)) return fail('Please fill in all fields.');
  if (desiredWeight >= initialWeight) return fail('Desired weight must be less than initial weight for dilution.');
  if (dilutionDensity >= desiredWeight) return fail('Dilution fluid density should be less than desired weight.');
  let dilutionVolume: number, finalVolume: number;
  const notes: string[] = [];
  if (constantVolume) {
    dilutionVolume = (volume * (initialWeight - desiredWeight)) / (initialWeight - dilutionDensity);
    finalVolume = volume;
    notes.push(`Constant volume: remove ${fixed(dilutionVolume)} bbl of mud before adding dilution fluid.`);
  } else {
    dilutionVolume = (volume * (initialWeight - desiredWeight)) / (desiredWeight - dilutionDensity);
    finalVolume = volume + dilutionVolume;
  }
  return {
    ok: true,
    values: [
      { label: 'Dilution Fluid Required', value: `${fixed(dilutionVolume)} bbl` },
      { label: 'Final Mud Weight', value: `${fixed(desiredWeight)} sg` },
      { label: 'Final Volume', value: `${fixed(finalVolume)} bbl` },
    ],
    notes,
  };
}

export function mixFluids(i: { fluids: { density: number; volume: number }[] }): CalcResult {
  const valid = i.fluids.filter((f) => !Number.isNaN(f.density) && !Number.isNaN(f.volume) && f.volume > 0);
  if (valid.length < 2) return fail('Please provide at least two fluids (density and volume).');
  const totalVolume = valid.reduce((s, f) => s + f.volume, 0);
  const totalMass = valid.reduce((s, f) => s + f.density * f.volume, 0);
  const mixed = totalMass / totalVolume;
  return {
    ok: true,
    values: [
      { label: 'Mixed Mud Density', value: `${fixed(mixed)} sg (${fixed(mixed * PPG_PER_SG)} ppg)` },
      { label: 'Total Volume', value: `${fixed(totalVolume)} bbl` },
    ],
    notes: ['Mixed Density = Σ(Dᵢ×Vᵢ) / ΣVᵢ'],
  };
}

export function owrAdjust(i: { currentOWR: number; oilPercent: number; volume: number; desiredOWR: number; density: number }): CalcResult {
  const { currentOWR, oilPercent, volume, desiredOWR, density } = i;
  if ([currentOWR, oilPercent, volume, desiredOWR, density].some(Number.isNaN)) return fail('Please fill in all fields.');
  const currentOilVolume = (oilPercent / 100) * volume;
  const desiredTotalOil = (desiredOWR / (desiredOWR + 1)) * volume;
  const oilToAdd = desiredTotalOil - currentOilVolume;
  const newOilPct = (desiredOWR / (desiredOWR + 1)) * 100;
  if (oilToAdd > 0) {
    return {
      ok: true,
      values: [
        { label: 'Oil to Add', value: `${fixed(oilToAdd)} bbl` },
        { label: 'New OWR', value: `${fixed(desiredOWR)} (${fixed(newOilPct, 1)}% oil)` },
        { label: 'Final Volume', value: `${fixed(volume + oilToAdd)} bbl` },
      ],
    };
  }
  const waterToAdd = Math.abs(oilToAdd) * (1 / desiredOWR);
  return {
    ok: true,
    values: [
      { label: 'Water to Add', value: `${fixed(waterToAdd)} bbl` },
      { label: 'New OWR', value: `${fixed(desiredOWR)} (${fixed(newOilPct, 1)}% oil)` },
      { label: 'Final Volume', value: `${fixed(volume + waterToAdd)} bbl` },
    ],
  };
}

export function slugCalc(i: { pipeLength: number; mudWeight: number; pipeCapacity: number; slugVolume: number }): CalcResult {
  const { pipeLength, mudWeight, pipeCapacity, slugVolume } = i;
  if ([pipeLength, mudWeight, pipeCapacity, slugVolume].some(Number.isNaN)) return fail('Please fill in all fields.');
  // NOTE: legacy slug math is suspect (a no-op 8.33/8.33). This is a defensible
  // placeholder implementation; numbers must be confirmed by an ODS engineer.
  const slugWeight = mudWeight + (pipeLength * 0.052) / pipeCapacity;
  const volumeInPipe = pipeLength * pipeCapacity;
  return {
    ok: true,
    values: [
      { label: 'Required Slug Weight', value: `${fixed(slugWeight)} sg` },
      { label: 'Slug Volume in Pipe', value: `${fixed(volumeInPipe)} bbl` },
      { label: 'Dry Pipe Length', value: `${fixed(pipeLength)} m` },
    ],
    warnings: ['Slug formula is a provisional implementation — pending ODS engineer verification before field use.'],
  };
}
