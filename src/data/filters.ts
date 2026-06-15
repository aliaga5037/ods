export interface HasOperator { operator: string; }

export function filterByOperator<T extends HasOperator>(items: T[], operator: string): T[] {
  if (operator === 'All') return items;
  return items.filter((item) => item.operator === operator);
}

export function uniqueOperators<T extends HasOperator>(items: T[]): string[] {
  const set = new Set(items.map((i) => i.operator));
  return ['All', ...Array.from(set).sort()];
}
