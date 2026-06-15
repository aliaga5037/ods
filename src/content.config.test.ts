import { describe, it, expect } from 'vitest';
import { projectSchema, serviceSchema, insightSchema } from './content.config';

describe('projectSchema', () => {
  it('accepts a valid project', () => {
    const ok = projectSchema.safeParse({
      title: 'Garadagh #609', operator: 'DH', field: 'Garadagh',
      fluidType: 'OBM', year: 2024, location: 'Onshore Azerbaijan',
      outcome: 'Freed stuck pipe after 7 days', featured: true,
    });
    expect(ok.success).toBe(true);
  });
  it('rejects an invalid fluidType', () => {
    const bad = projectSchema.safeParse({
      title: 'X', operator: 'DH', field: 'Y', fluidType: 'plasma',
      year: 2024, location: 'Z', outcome: 'W',
    });
    expect(bad.success).toBe(false);
  });
});

describe('serviceSchema', () => {
  it('requires title, order, summary', () => {
    expect(serviceSchema.safeParse({ title: 'Mud Engineering', order: 1, summary: 'x', icon: 'drop' }).success).toBe(true);
    expect(serviceSchema.safeParse({ title: 'Mud Engineering' }).success).toBe(false);
  });
});

describe('insightSchema', () => {
  it('requires a date and title', () => {
    expect(insightSchema.safeParse({ title: 'A', date: new Date('2026-01-01'), excerpt: 'x' }).success).toBe(true);
  });
});
