import { describe, it, expect } from 'vitest';
import { filterByOperator, uniqueOperators } from './filters';

const projects = [
  { operator: 'SOCAR', data: 1 },
  { operator: 'GLOLYNX', data: 2 },
  { operator: 'SOCAR', data: 3 },
];

describe('filterByOperator', () => {
  it('returns all projects when operator is "All"', () => {
    expect(filterByOperator(projects, 'All')).toHaveLength(3);
  });
  it('returns only matching projects for a specific operator', () => {
    const result = filterByOperator(projects, 'SOCAR');
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.operator === 'SOCAR')).toBe(true);
  });
});

describe('uniqueOperators', () => {
  it('returns a sorted unique list prefixed with "All"', () => {
    expect(uniqueOperators(projects)).toEqual(['All', 'GLOLYNX', 'SOCAR']);
  });
});
