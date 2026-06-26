export type CalcValue = { label: string; value: string };

export type CalcResult = {
  ok: boolean;
  values: CalcValue[];
  notes?: string[];
  warnings?: string[];
  error?: string;
};

export const fail = (error: string): CalcResult => ({ ok: false, values: [], error });
