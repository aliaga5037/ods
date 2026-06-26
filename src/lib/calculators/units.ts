export type Category = 'length' | 'volume' | 'pressure' | 'temperature' | 'weight' | 'density';

export type ConversionPair = {
  id: string;
  label: string;
  from: string;
  to: string;
  factor?: number;
  convert?: (v: number) => number;
};

export const conversions: Record<Category, ConversionPair[]> = {
  length: [
    { id: 'm-ft', label: 'Meter → Feet', from: 'm', to: 'ft', factor: 3.28084 },
    { id: 'ft-m', label: 'Feet → Meter', from: 'ft', to: 'm', factor: 0.3048 },
    { id: 'km-mi', label: 'Kilometer → Mile', from: 'km', to: 'mi', factor: 0.621371 },
    { id: 'mi-km', label: 'Mile → Kilometer', from: 'mi', to: 'km', factor: 1.60934 },
    { id: 'in-cm', label: 'Inch → Centimeter', from: 'in', to: 'cm', factor: 2.54 },
    { id: 'cm-in', label: 'Centimeter → Inch', from: 'cm', to: 'in', factor: 0.393701 },
  ],
  volume: [
    { id: 'bbl-m3', label: 'Barrel (bbl) → Cubic Meter (m³)', from: 'bbl', to: 'm³', factor: 0.158987 },
    { id: 'm3-bbl', label: 'Cubic Meter (m³) → Barrel (bbl)', from: 'm³', to: 'bbl', factor: 6.28981 },
    { id: 'bbl-gal', label: 'Barrel → Gallon (US)', from: 'bbl', to: 'gal', factor: 42 },
    { id: 'gal-bbl', label: 'Gallon (US) → Barrel', from: 'gal', to: 'bbl', factor: 0.0238095 },
    { id: 'l-gal', label: 'Liter → Gallon (US)', from: 'L', to: 'gal', factor: 0.264172 },
    { id: 'gal-l', label: 'Gallon (US) → Liter', from: 'gal', to: 'L', factor: 3.78541 },
  ],
  pressure: [
    { id: 'psi-atm', label: 'PSI → Atmosphere (atm)', from: 'psi', to: 'atm', factor: 0.068046 },
    { id: 'atm-psi', label: 'Atmosphere (atm) → PSI', from: 'atm', to: 'psi', factor: 14.6959 },
    { id: 'psi-bar', label: 'PSI → Bar', from: 'psi', to: 'bar', factor: 0.0689476 },
    { id: 'bar-psi', label: 'Bar → PSI', from: 'bar', to: 'psi', factor: 14.5038 },
    { id: 'psi-kpa', label: 'PSI → kPa', from: 'psi', to: 'kPa', factor: 6.89476 },
    { id: 'kpa-psi', label: 'kPa → PSI', from: 'kPa', to: 'psi', factor: 0.145038 },
  ],
  temperature: [
    { id: 'c-f', label: 'Celsius → Fahrenheit', from: '°C', to: '°F', convert: (v) => (v * 9) / 5 + 32 },
    { id: 'f-c', label: 'Fahrenheit → Celsius', from: '°F', to: '°C', convert: (v) => ((v - 32) * 5) / 9 },
    { id: 'c-k', label: 'Celsius → Kelvin', from: '°C', to: 'K', convert: (v) => v + 273.15 },
    { id: 'k-c', label: 'Kelvin → Celsius', from: 'K', to: '°C', convert: (v) => v - 273.15 },
    { id: 'f-k', label: 'Fahrenheit → Kelvin', from: '°F', to: 'K', convert: (v) => ((v - 32) * 5) / 9 + 273.15 },
    { id: 'k-f', label: 'Kelvin → Fahrenheit', from: 'K', to: '°F', convert: (v) => ((v - 273.15) * 9) / 5 + 32 },
  ],
  weight: [
    { id: 'lb-kg', label: 'Pound (lb) → Kilogram (kg)', from: 'lb', to: 'kg', factor: 0.453592 },
    { id: 'kg-lb', label: 'Kilogram (kg) → Pound (lb)', from: 'kg', to: 'lb', factor: 2.20462 },
    { id: 'ton-kg', label: 'Ton (US) → Kilogram', from: 'ton', to: 'kg', factor: 907.185 },
    { id: 'kg-ton', label: 'Kilogram → Ton (US)', from: 'kg', to: 'ton', factor: 0.00110231 },
    { id: 'oz-g', label: 'Ounce → Gram', from: 'oz', to: 'g', factor: 28.3495 },
    { id: 'g-oz', label: 'Gram → Ounce', from: 'g', to: 'oz', factor: 0.035274 },
  ],
  density: [
    { id: 'sg-ppg', label: 'Specific Gravity (SG) → PPG', from: 'SG', to: 'ppg', factor: 8.33 },
    { id: 'ppg-sg', label: 'PPG → Specific Gravity (SG)', from: 'ppg', to: 'SG', factor: 0.120048 },
    { id: 'ppg-kgm3', label: 'PPG → kg/m³', from: 'ppg', to: 'kg/m³', factor: 119.826 },
    { id: 'kgm3-ppg', label: 'kg/m³ → PPG', from: 'kg/m³', to: 'ppg', factor: 0.00834541 },
    { id: 'sg-kgm3', label: 'SG → kg/m³', from: 'SG', to: 'kg/m³', factor: 1000 },
    { id: 'kgm3-sg', label: 'kg/m³ → SG', from: 'kg/m³', to: 'SG', factor: 0.001 },
  ],
};

export function convert(category: Category, pairId: string, value: number): number {
  const pair = conversions[category]?.find((p) => p.id === pairId);
  if (!pair) throw new Error(`Unknown conversion: ${category}/${pairId}`);
  return pair.convert ? pair.convert(value) : value * (pair.factor as number);
}
