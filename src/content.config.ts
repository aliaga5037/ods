import { defineCollection } from 'astro/content/config';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

export const serviceSchema = z.object({
  title: z.string(),
  order: z.number().describe('display order, ascending'),
  icon: z.string().describe('icon key, e.g. "drop", "gear", "flask"'),
  summary: z.string().describe('one-line summary shown on cards'),
});

export const projectSchema = z.object({
  title: z.string(),
  operator: z.string().describe('client/operator, e.g. SOCAR, BP, GLOLYNX'),
  field: z.string(),
  fluidType: z.enum(['WBM', 'OBM', 'brine']).describe('drilling fluid system'),
  year: z.number(),
  location: z.string(),
  outcome: z.string().describe('headline result shown on the card'),
  featured: z.boolean().default(false).describe('show on homepage'),
  image: z.string().optional().describe('path under /public/images'),
});

export const insightSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  author: z.string().default('ODS Team'),
  excerpt: z.string(),
  tags: z.array(z.string()).default([]),
  cover: z.string().optional(),
});

const services = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/services' }), schema: serviceSchema });
const projects = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/projects' }), schema: projectSchema });
const insights = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/insights' }), schema: insightSchema });

export const collections = { services, projects, insights };
