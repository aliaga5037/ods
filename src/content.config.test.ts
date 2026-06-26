import { describe, it, expect } from 'vitest';
import { projectSchema, serviceSchema, insightSchema, procedureSchema, productSchema, teamSchema } from './content.config';

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

describe('procedureSchema', () => {
  it('accepts a valid procedure', () => {
    expect(procedureSchema.safeParse({
      title: 'Mud Weight (Density)', category: 'mud-properties', order: 1,
      summary: 'Measure drilling-fluid density with a mud balance.',
    }).success).toBe(true);
  });
  it('rejects an invalid category', () => {
    expect(procedureSchema.safeParse({
      title: 'X', category: 'nonsense', order: 1, summary: 'y',
    }).success).toBe(false);
  });
});

describe('productSchema', () => {
  it('accepts a product without a datasheet', () => {
    expect(productSchema.safeParse({ name: 'Caustic Soda', category: 'alkalinity', order: 1 }).success).toBe(true);
  });
  it('accepts a product with a datasheet path', () => {
    expect(productSchema.safeParse({ name: 'Lime', category: 'alkalinity', order: 2, datasheet: '/datasheets/lime.pdf' }).success).toBe(true);
  });
});

describe('teamSchema', () => {
  it('accepts a member without a photo', () => {
    expect(teamSchema.safeParse({ name: 'Jane Doe', role: 'Mud Engineer', order: 1 }).success).toBe(true);
  });
  it('accepts a member with a photo path', () => {
    expect(teamSchema.safeParse({ name: 'Jane Doe', role: 'Mud Engineer', order: 1, photo: '/images/team/jane-doe.jpg' }).success).toBe(true);
  });
  it('requires name and role', () => {
    expect(teamSchema.safeParse({ name: 'Jane Doe', order: 1 }).success).toBe(false);
  });
});
