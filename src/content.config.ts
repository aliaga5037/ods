import { defineCollection } from 'astro/content/config';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

export const serviceSchema = z.object({
  title: z.string(),
  order: z.number().describe('display order, ascending'),
  icon: z.enum(['drop', 'gear', 'flask', 'beaker', 'layers', 'people']).describe('icon key — one of: drop, gear, flask, beaker, layers, people'),
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

export const procedureSchema = z.object({
  title: z.string(),
  category: z.enum(['mud-properties', 'rheology', 'filtration', 'solids', 'chemical', 'other'])
    .describe('procedure category for filtering'),
  order: z.number().describe('display order, ascending'),
  summary: z.string().describe('one-line summary shown on the index'),
});

export const productSchema = z.object({
  name: z.string(),
  category: z.string().describe('product category for filtering, e.g. "alkalinity"'),
  order: z.number().describe('display order, ascending'),
  datasheet: z.string().optional().describe('path under /public/datasheets, e.g. /datasheets/lime.pdf; omit until the PDF exists'),
});

export const teamSchema = z.object({
  name: z.string(),
  role: z.string().describe('job title shown under the name'),
  order: z.number().describe('display order, ascending'),
  photo: z.string().optional().describe('path under /public/images/team, e.g. /images/team/jane-doe.jpg; omit to show an initials avatar until a photo is uploaded'),
});

// Pattern excludes files beginning with `_` (e.g. _template.md) so templates
// never become collection entries / generated pages. The glob loader does NOT
// auto-ignore underscore files, so this must be explicit.
const services = defineCollection({ loader: glob({ pattern: '**/[^_]*.md', base: './src/content/services' }), schema: serviceSchema });
const projects = defineCollection({ loader: glob({ pattern: '**/[^_]*.md', base: './src/content/projects' }), schema: projectSchema });
const insights = defineCollection({ loader: glob({ pattern: '**/[^_]*.md', base: './src/content/insights' }), schema: insightSchema });
const procedures = defineCollection({ loader: glob({ pattern: '**/[^_]*.md', base: './src/content/procedures' }), schema: procedureSchema });
const products = defineCollection({ loader: glob({ pattern: '**/[^_]*.md', base: './src/content/products' }), schema: productSchema });
const team = defineCollection({ loader: glob({ pattern: '**/[^_]*.md', base: './src/content/team' }), schema: teamSchema });

export const collections = { services, projects, insights, procedures, products, team };
