// Parse a stat value like "40+", "9", "6+", "API" into parts so the UI can
// count up the numeric portion while preserving any prefix/suffix. Non-numeric
// values (e.g. "API") return `{ text }` and are shown as-is.

export type ParsedStat =
  | { kind: 'number'; prefix: string; number: number; suffix: string }
  | { kind: 'text'; text: string };

export function parseStat(value: string): ParsedStat {
  const match = value.match(/^(\D*?)(\d+)(\D*)$/);
  if (!match) return { kind: 'text', text: value };
  return { kind: 'number', prefix: match[1], number: parseInt(match[2], 10), suffix: match[3] };
}
