# ODS Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium, mobile-first, AI-agent-editable marketing/credibility website for ODS (Oilmen Drilling Services), positioning it as an independent drilling-fluids & wellsite-engineering consultancy.

**Architecture:** Static Astro site. All editable content lives as markdown in typed (Zod) content collections so pages generate automatically and bad data fails the build. Presentation is centralized (design tokens, layouts, components) and clearly separated from content, with `AGENTS.md` + `CONTENT-GUIDE.md` instructing future AI agents on how to make changes safely. Deploys static to Vercel/Netlify.

**Tech Stack:** Astro 6, Tailwind CSS 4 (CSS-first config via `@tailwindcss/vite`), TypeScript, Vitest (unit tests for content/util logic), Astro content collections + Zod.

---

## File Structure

```
.
├── AGENTS.md                       # AI-agent entry point (rules + task playbook)
├── README.md                       # human dev setup
├── astro.config.mjs                # Astro + Tailwind v4 vite plugin + sitemap
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── docs/
│   └── CONTENT-GUIDE.md            # plain-language content editing guide
├── public/
│   ├── images/                     # logos, hero, project/team photos (placeholders ok)
│   └── robots.txt
└── src/
    ├── content.config.ts           # Zod collection schemas (services, projects, insights)
    ├── content/
    │   ├── services/_template.md   + 6 service entries
    │   ├── projects/_template.md   + seed case studies
    │   └── insights/_template.md   + 1 seed article
    ├── data/
    │   ├── site.ts                 # nav, contact, stats, operators (single source of truth)
    │   └── filters.ts              # pure helpers (project filtering) — unit tested
    ├── styles/
    │   └── global.css              # Tailwind import + @theme Midnight Brass tokens
    ├── layouts/
    │   ├── BaseLayout.astro        # <head>, SEO/OG, fonts, Nav, Footer
    │   └── ArticleLayout.astro     # insight article wrapper
    ├── components/
    │   ├── Nav.astro  MobileNav.astro  Footer.astro
    │   ├── Hero.astro  StatBar.astro  CTA.astro  SectionHeading.astro
    │   ├── ServiceCard.astro  ProjectCard.astro  InsightCard.astro  OperatorLogos.astro
    │   └── ProjectFilter.astro     # client island for operator filtering
    └── pages/
        ├── index.astro
        ├── about.astro
        ├── contact.astro
        ├── services/index.astro   services/[slug].astro
        ├── projects/index.astro   projects/[slug].astro
        └── insights/index.astro   insights/[slug].astro
```

**Convention (enforced in AGENTS.md):** content edits touch only `src/content/**` and `src/data/site.ts`. Everything else is "structure — change with care."

---

## Task 1: Scaffold Astro + Tailwind 4 + TypeScript + Vitest

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/styles/global.css`, `.gitignore` (already exists — verify)

- [ ] **Step 1: Create the Astro project in the current directory**

Run:
```bash
npm create astro@latest -- --template minimal --no-install --no-git --yes .
```
Expected: scaffolds `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`. If it refuses because the dir is non-empty, scaffold in a temp dir and move files: `npm create astro@latest tmp-astro -- --template minimal --no-install --no-git --yes && cp -r tmp-astro/. . && rm -rf tmp-astro`.

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install
npm install tailwindcss @tailwindcss/vite @astrojs/sitemap
npm install -D vitest @types/node
```
Expected: installs without errors; `astro`, `tailwindcss`, `@tailwindcss/vite`, `@astrojs/sitemap`, `vitest` appear in `package.json`.

- [ ] **Step 3: Configure Astro with Tailwind v4 and sitemap**

Replace `astro.config.mjs` with:
```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.oilmends.com',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 4: Add the Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Add the test + dev scripts to package.json**

In `package.json` `"scripts"`, ensure these keys exist:
```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run"
  }
}
```

- [ ] **Step 6: Create the global stylesheet with Midnight Brass tokens**

Create `src/styles/global.css`:
```css
@import "tailwindcss";

@theme {
  --color-ink: #000000;
  --color-navy: #0d1c2e;
  --color-navy-mid: #16467a;
  --color-brass: #b8863b;
  --color-brass-soft: #d8b878;
  --color-text-light: #c5cdd8;
  --color-text-muted: #8a96a4;

  --font-display: "Space Grotesk", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
}

html { scroll-behavior: smooth; }
body { background-color: var(--color-ink); color: var(--color-text-light); font-family: var(--font-body); }
h1,h2,h3 { font-family: var(--font-display); color: #fff; }

/* respect reduced motion for all scroll/parallax animation */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 7: Verify the dev server boots**

Run: `npm run build`
Expected: build completes with no errors (minimal page builds). If `astro check` is referenced but `@astrojs/check`/`typescript` missing, install: `npm install -D @astrojs/check typescript`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro 6 + Tailwind 4 + Vitest"
```

---

## Task 2: Site data single-source-of-truth + filter helpers (with tests)

**Files:**
- Create: `src/data/site.ts`, `src/data/filters.ts`, `src/data/filters.test.ts`

- [ ] **Step 1: Write the failing test for the project filter helper**

Create `src/data/filters.test.ts`:
```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './filters'`.

- [ ] **Step 3: Implement the filter helpers**

Create `src/data/filters.ts`:
```ts
export interface HasOperator { operator: string; }

export function filterByOperator<T extends HasOperator>(items: T[], operator: string): T[] {
  if (operator === 'All') return items;
  return items.filter((item) => item.operator === operator);
}

export function uniqueOperators<T extends HasOperator>(items: T[]): string[] {
  const set = new Set(items.map((i) => i.operator));
  return ['All', ...Array.from(set).sort()];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 3 tests pass.

- [ ] **Step 5: Create the site data file**

Create `src/data/site.ts`:
```ts
export const site = {
  name: 'ODS',
  legalName: 'Oilmen Drilling Services',
  tagline: 'Engineered Solutions. Proven in the Field.',
  headline: 'Independent Drilling Fluids Consultancy & Wellsite Engineering',
  subhead:
    'Expert mud engineering, drilling-fluids optimization, solids-control advisory and operational support for oil & gas operators worldwide.',
  url: 'https://www.oilmends.com',
};

export const contact = {
  phone: '+994 50 404 4402',
  email: 'seymuraliyev@oilmends.com',
  whatsapp: '+994504044402',
  office: 'Baku, Azerbaijan',
};

export const nav = [
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Projects', href: '/projects' },
  { label: 'Insights', href: '/insights' },
  { label: 'Contact', href: '/contact' },
];

// Proof stats — CONFIRM exact figures with ODS before launch (spec §12).
export const stats = [
  { value: '40+', label: 'Wells Delivered' },
  { value: '9', label: 'Parallel Projects' },
  { value: '6+', label: 'Operators Served' },
  { value: 'API', label: 'Certified Engineers' },
];

// Operators/clients — confirm which logos may be shown publicly (spec §12).
export const operators = ['SOCAR', 'BP', 'Azorel', 'GL Group', 'GLOLYNX', 'DH', 'Azeri-MI', 'Swire'];

export const certifications = ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018', 'API Spec Q2 (target 2026)'];
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: site data and tested project-filter helpers"
```

---

## Task 3: Content collection schemas (Zod) with validation test

**Files:**
- Create: `src/content.config.ts`, `src/content.config.test.ts`

- [ ] **Step 1: Write the failing schema test**

Create `src/content.config.test.ts`:
```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './content.config'`.

- [ ] **Step 3: Implement the content config with exported schemas**

Create `src/content.config.ts`:
```ts
import { defineCollection, z } from 'astro:content';
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
```

> Note: `glob` ignores files beginning with `_`, so `_template.md` files are safe to keep in content folders.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all schema tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: typed content collections (services, projects, insights)"
```

---

## Task 4: Seed content (templates + real entries from ODS materials)

**Files:**
- Create: `src/content/services/_template.md` + 6 service files
- Create: `src/content/projects/_template.md` + 5 project files
- Create: `src/content/insights/_template.md` + 1 article

- [ ] **Step 1: Create the service template**

Create `src/content/services/_template.md`:
```md
---
title: "Service Name"
order: 99
icon: "drop"   # drop | gear | flask | layers | beaker | people
summary: "One sentence shown on the service card."
---

Full description of the service in markdown. Explain what ODS does, the
engineering value, and typical scope. 2–4 short paragraphs.
```

- [ ] **Step 2: Create the 6 service files**

Create `src/content/services/mud-engineering.md`:
```md
---
title: "Mud Engineering Consultancy"
order: 1
icon: "drop"
summary: "Field engineering execution, supervision and real-time decision-making."
---

ODS provides API-certified drilling and completion fluids engineers for onshore and
offshore operations. Our approach is built on real-time engineering decisions, practical
field experience, risk-based operational planning and performance-driven execution.

We deliver field supervision, fluid system design for varying conditions, and continuous
performance monitoring to keep wells on programme and reduce non-productive time.
```

Create `src/content/services/fluids-program-design.md`:
```md
---
title: "Drilling & Completion Fluids Program Design"
order: 2
icon: "beaker"
summary: "WBM, OBM and clear-brine systems engineered for the well."
---

We design tailored drilling fluid systems for complex geological and operational
conditions: Water-Based Mud (WBM), Oil-Based Mud (OBM), and clear brine systems
(NaCl, CaCl₂, CaBr₂). Programs cover inhibition and shale stability, filtration and
solids-free completion fluids, fluid compatibility and formation-damage prevention,
and wellbore clean-up and displacement support.
```

Create `src/content/services/solids-control.md`:
```md
---
title: "Solids Control Optimization"
order: 3
icon: "gear"
summary: "Shaker-to-centrifuge optimization that extends fluid life and cuts NPT."
---

ODS provides integrated solids control and chemical management to maintain drilling
fluid performance throughout operations: shale shaker, desander and desilter
optimization, fine solids control and dilution strategies, mud conditioning and
contamination management, and continuous performance monitoring and reporting.
Effective solids control reduces non-productive time and extends fluid life cycle.
```

Create `src/content/services/waste-management.md`:
```md
---
title: "Waste Management Advisory"
order: 4
icon: "layers"
summary: "Dilution, utilization and reservoir-protection strategy."
---

We advise on drilling-waste and mud-utilization strategy to lower cost and environmental
impact while protecting the reservoir, aligning fluid conditioning and disposal with
operational and HSE requirements.
```

Create `src/content/services/laboratory-services.md`:
```md
---
title: "Laboratory Testing, Maintenance & Calibration"
order: 5
icon: "flask"
summary: "OFITE-certified lab equipment maintenance, calibration and fluid testing."
---

ODS offers OFITE-certified drilling-fluids laboratory equipment maintenance and repair,
plus calibration, certification and operational support for laboratory instruments. We
integrate laboratory data with real-time field monitoring to ensure drilling efficiency,
well integrity and operational safety.
```

Create `src/content/services/manpower.md`:
```md
---
title: "Wellsite Mud Engineers & Manpower"
order: 6
icon: "people"
summary: "Specialist drilling & completion fluids engineering manpower, on demand."
---

ODS supplies experienced, API-certified drilling and completion fluids engineers and
solids-control specialists for onshore and offshore campaigns — embedded at the wellsite
or supporting from our engineering base, with in-house hydraulic simulation and modeling
capability.
```

- [ ] **Step 3: Create the project template**

Create `src/content/projects/_template.md`:
```md
---
title: "Field / Well Name"
operator: "SOCAR"            # client/operator name
field: "Field name"
fluidType: "OBM"            # WBM | OBM | brine
year: 2025
location: "Offshore Azerbaijan"
outcome: "One-line headline result."
featured: false             # true = show on homepage
# image: "/images/projects/example.jpg"   # optional
---

Optional longer case-study narrative in markdown.
```

- [ ] **Step 4: Create 5 seed project files**

Create `src/content/projects/garadagh-609.md`:
```md
---
title: "Garadagh #609 — Stuck-Pipe Recovery"
operator: "DH"
field: "Garadagh"
fluidType: "OBM"
year: 2024
location: "Onshore Azerbaijan"
outcome: "Freed stuck pipe after a 7-day differential-sticking event; first dispersed-barite integration on an onshore rig in Azerbaijan."
featured: true
---

At Garadagh Well No. 609, the ODS engineering team applied intensified operational
measures to control drilling-fluid losses, carried out immediate analyses, and freed the
stuck tool after a 7-day differential-sticking event. The team integrated dispersed barite
into the active system for the first time on an onshore drilling rig in Azerbaijan, earning
a Letter of Appreciation from the client.
```

Create `src/content/projects/gl-toc-buzovna.md`:
```md
---
title: "GL TOC — Buzovna-Mashtaga & Qala"
operator: "GL Group"
field: "Buzovna-Mashtaga / Qala"
fluidType: "OBM"
year: 2024
location: "Onshore Azerbaijan"
outcome: "6 wells drilled and handed over; ~30 t/day average production."
featured: true
---

Starting June 2023, ODS managed all fluids operations and solids-control engineering for
GL TOC. Six wells across Buzovna-Mashtaga and Qala were successfully drilled and handed
over, collectively producing an average of approximately 30 tons of oil per day.
```

Create `src/content/projects/gunashli-10.md`:
```md
---
title: "Gunashli-10 — Slim-Hole OBM"
operator: "SOCAR"
field: "Gunashli"
fluidType: "OBM"
year: 2024
location: "Offshore Azerbaijan"
outcome: "Slim-hole well drilled & completed with OBM; ~40 t/day."
featured: true
---

At the Gunashli-10 DSB site, a slim-hole well was successfully drilled and completed using
oil-based drilling fluids over a four-month period and handed over to the client, producing
approximately 40 metric tons per day on preliminary data.
```

Create `src/content/projects/glolynx-bibiheybat.md`:
```md
---
title: "GLOLYNX — Bibiheybat Campaign"
operator: "GLOLYNX"
field: "Bibiheybat"
fluidType: "OBM"
year: 2024
location: "Onshore Azerbaijan"
outcome: "13+ wells delivered with diesel-based fluids; campaign ongoing."
featured: true
---

ODS provides mud engineering consultation for GLOLYNX's drilling operations at Bibiheybat.
Operations began in March 2024; more than 13 wells have been drilled and delivered using
diesel-based drilling fluids, with further wells ongoing.
```

Create `src/content/projects/neft-dashlari.md`:
```md
---
title: "Neft Dashlari — SOCAR Multi-Well"
operator: "SOCAR"
field: "Neft Dashlari"
fluidType: "WBM"
year: 2023
location: "Offshore Azerbaijan"
outcome: "Multiple wells delivered using polymer-based and oil-based fluids."
featured: false
---

ODS provides mud engineering and solids-control equipment supervision at SOCAR's Neft
Dashlari field, ensuring successful drilling and handover of multiple wells using
polymer-based and oil-based drilling fluids.
```

- [ ] **Step 5: Create the insight template + one seed article**

Create `src/content/insights/_template.md`:
```md
---
title: "Article Title"
date: 2026-01-01
author: "ODS Team"
excerpt: "One- or two-sentence summary shown in the article list."
tags: ["drilling fluids"]
# cover: "/images/insights/example.jpg"
---

Article body in markdown.
```

Create `src/content/insights/dispersed-barite-onshore.md`:
```md
---
title: "First Dispersed-Barite Integration on an Onshore Rig in Azerbaijan"
date: 2024-09-01
author: "ODS Team"
excerpt: "How the ODS engineering team integrated dispersed barite into the active system to manage density during a complex onshore operation."
tags: ["solids control", "barite", "case study"]
---

During operations at Garadagh #609, the ODS engineering team integrated dispersed barite
into the active mud system for the first time on an onshore rig in Azerbaijan. This article
outlines the engineering rationale, the equipment integration approach, and the operational
outcome that earned a client Letter of Appreciation.
```

- [ ] **Step 6: Verify content builds against the schemas**

Run: `npm run build`
Expected: build succeeds; no Zod validation errors. If a field is rejected, the error names the file and field — fix the frontmatter.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "content: seed services, projects, insights with templates"
```

---

## Task 5: Base layout, SEO/OpenGraph, fonts, robots

**Files:**
- Create: `src/layouts/BaseLayout.astro`, `public/robots.txt`
- Modify: depends on `src/components/Nav.astro`, `Footer.astro` (created in Task 6 — for now include placeholders, wired in Task 6)

- [ ] **Step 1: Create robots.txt**

Create `public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://www.oilmends.com/sitemap-index.xml
```

- [ ] **Step 2: Create BaseLayout with SEO + fonts**

Create `src/layouts/BaseLayout.astro`:
```astro
---
import '../styles/global.css';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import { site } from '../data/site';

interface Props { title?: string; description?: string; image?: string; }
const { title, description = site.subhead, image = '/images/og-default.jpg' } = Astro.props;
const pageTitle = title ? `${title} — ${site.name}` : `${site.name} — ${site.headline}`;
const canonical = new URL(Astro.url.pathname, Astro.site).href;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{pageTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={pageTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={new URL(image, Astro.site).href} />
    <meta property="og:url" content={canonical} />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body class="min-h-screen flex flex-col">
    <Nav />
    <main class="flex-1"><slot /></main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 3: Commit (build verified after Task 6 wires Nav/Footer)**

```bash
git add -A
git commit -m "feat: base layout with SEO/OpenGraph and fonts"
```

---

## Task 6: Navigation (mobile-first) + Footer

**Files:**
- Create: `src/components/Nav.astro`, `src/components/MobileNav.astro`, `src/components/Footer.astro`

- [ ] **Step 1: Create the mobile menu island**

Create `src/components/MobileNav.astro`:
```astro
---
import { nav } from '../data/site';
---
<div class="md:hidden">
  <button id="navToggle" aria-label="Open menu" aria-expanded="false"
    class="text-text-light p-2 text-2xl leading-none">☰</button>
  <div id="navPanel" hidden
    class="fixed inset-0 z-50 bg-ink/95 backdrop-blur flex-col items-center justify-center gap-8 text-xl hidden">
    <button id="navClose" aria-label="Close menu" class="absolute top-5 right-6 text-3xl">×</button>
    {nav.map((item) => (
      <a href={item.href} class="block py-3 text-text-light hover:text-brass">{item.label}</a>
    ))}
  </div>
</div>
<script>
  const toggle = document.getElementById('navToggle');
  const panel = document.getElementById('navPanel');
  const close = document.getElementById('navClose');
  const open = () => { panel?.removeAttribute('hidden'); panel?.classList.remove('hidden'); panel?.classList.add('flex'); toggle?.setAttribute('aria-expanded','true'); };
  const shut = () => { panel?.setAttribute('hidden',''); panel?.classList.add('hidden'); panel?.classList.remove('flex'); toggle?.setAttribute('aria-expanded','false'); };
  toggle?.addEventListener('click', open);
  close?.addEventListener('click', shut);
  panel?.querySelectorAll('a').forEach((a) => a.addEventListener('click', shut));
</script>
```

- [ ] **Step 2: Create the Nav**

Create `src/components/Nav.astro`:
```astro
---
import { nav, site } from '../data/site';
import MobileNav from './MobileNav.astro';
---
<header class="sticky top-0 z-40 bg-ink/80 backdrop-blur border-b border-brass/20">
  <nav class="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
    <a href="/" class="font-display font-bold tracking-wide text-white text-lg">◆ {site.name}</a>
    <div class="hidden md:flex items-center gap-8 text-sm">
      {nav.map((item) => (
        <a href={item.href} class="text-text-light hover:text-brass transition-colors">{item.label}</a>
      ))}
      <a href="/contact" class="bg-brass text-ink font-semibold px-4 py-2 rounded-md hover:bg-brass-soft transition-colors">Talk to an Engineer</a>
    </div>
    <MobileNav />
  </nav>
</header>
```

- [ ] **Step 3: Create the Footer**

Create `src/components/Footer.astro`:
```astro
---
import { site, contact, nav, certifications } from '../data/site';
---
<footer class="bg-navy border-t border-brass/20 mt-24">
  <div class="max-w-7xl mx-auto px-5 py-14 grid gap-10 md:grid-cols-3">
    <div>
      <div class="font-display font-bold text-white text-lg">◆ {site.legalName}</div>
      <p class="text-text-muted text-sm mt-3 max-w-xs">{site.tagline}</p>
    </div>
    <div>
      <h3 class="text-sm uppercase tracking-widest text-brass mb-4">Navigate</h3>
      <ul class="space-y-2 text-sm">
        {nav.map((item) => <li><a href={item.href} class="text-text-light hover:text-brass">{item.label}</a></li>)}
      </ul>
    </div>
    <div>
      <h3 class="text-sm uppercase tracking-widest text-brass mb-4">Contact</h3>
      <ul class="space-y-2 text-sm text-text-light">
        <li>{contact.office}</li>
        <li><a href={`tel:${contact.phone.replace(/\s/g,'')}`} class="hover:text-brass">{contact.phone}</a></li>
        <li><a href={`mailto:${contact.email}`} class="hover:text-brass">{contact.email}</a></li>
      </ul>
    </div>
  </div>
  <div class="border-t border-brass/10 py-5 text-center text-xs text-text-muted">
    {certifications.join(' · ')} — © {new Date().getFullYear()} {site.legalName}
  </div>
</footer>
```

- [ ] **Step 4: Verify build with Nav/Footer wired**

Run: `npm run build`
Expected: build succeeds; home page renders header + footer.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: mobile-first nav and footer"
```

---

## Task 7: Shared UI components (Hero, StatBar, SectionHeading, CTA, cards)

**Files:**
- Create: `src/components/SectionHeading.astro`, `Hero.astro`, `StatBar.astro`, `CTA.astro`, `ServiceCard.astro`, `ProjectCard.astro`, `InsightCard.astro`, `OperatorLogos.astro`

- [ ] **Step 1: SectionHeading**

Create `src/components/SectionHeading.astro`:
```astro
---
interface Props { eyebrow?: string; title: string; sub?: string; center?: boolean; }
const { eyebrow, title, sub, center = false } = Astro.props;
---
<div class={center ? 'text-center max-w-2xl mx-auto' : 'max-w-2xl'}>
  {eyebrow && <div class="text-xs tracking-[0.3em] uppercase text-brass font-semibold mb-3">{eyebrow}</div>}
  <h2 class="text-3xl md:text-4xl font-bold leading-tight">{title}</h2>
  {sub && <p class="text-text-muted mt-4">{sub}</p>}
</div>
```

- [ ] **Step 2: Hero (cinematic banner)**

Create `src/components/Hero.astro`:
```astro
---
import { site } from '../data/site';
---
<section class="relative min-h-[88vh] flex items-center overflow-hidden">
  <div class="absolute inset-0 -z-10 bg-cover bg-center"
       style="background-image:url('/images/hero.jpg');"></div>
  <div class="absolute inset-0 -z-10 bg-gradient-to-br from-ink/90 via-ink/80 to-navy/70"></div>
  <div class="max-w-7xl mx-auto px-5 w-full">
    <div class="max-w-2xl">
      <div class="text-xs tracking-[0.3em] uppercase text-brass font-semibold mb-5">Independent Drilling Fluids Consultancy</div>
      <h1 class="text-4xl md:text-6xl font-bold leading-[1.05]">Wellsite Engineering,<br />Proven in the Field.</h1>
      <p class="text-text-light mt-6 text-lg max-w-xl">{site.subhead}</p>
      <div class="flex flex-wrap gap-4 mt-9">
        <a href="/services" class="bg-brass text-ink font-semibold px-6 py-3 rounded-md hover:bg-brass-soft transition-colors">Our Services</a>
        <a href="/contact" class="border border-brass text-brass font-semibold px-6 py-3 rounded-md hover:bg-brass/10 transition-colors">Talk to an Engineer</a>
      </div>
    </div>
  </div>
</section>
```

> Provide a placeholder `public/images/hero.jpg` (any dark rig image, or a solid-color placeholder) so the build references resolve.

- [ ] **Step 3: StatBar**

Create `src/components/StatBar.astro`:
```astro
---
import { stats } from '../data/site';
---
<section class="bg-navy border-y border-brass/25">
  <div class="max-w-7xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 divide-x divide-brass/15">
    {stats.map((s) => (
      <div class="py-8 text-center">
        <div class="text-3xl md:text-4xl font-bold text-brass font-display">{s.value}</div>
        <div class="text-xs tracking-widest uppercase text-text-muted mt-2">{s.label}</div>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 4: CTA band**

Create `src/components/CTA.astro`:
```astro
---
import { contact } from '../data/site';
---
<section class="max-w-7xl mx-auto px-5 my-24">
  <div class="bg-gradient-to-br from-navy to-ink border border-brass/25 rounded-2xl px-8 py-14 text-center">
    <h2 class="text-3xl font-bold">Planning a well? Talk to an engineer.</h2>
    <p class="text-text-muted mt-3 max-w-xl mx-auto">Independent advice on drilling fluids, solids control and wellsite operations.</p>
    <a href="/contact" class="inline-block mt-7 bg-brass text-ink font-semibold px-7 py-3 rounded-md hover:bg-brass-soft transition-colors">Contact ODS</a>
  </div>
</section>
```

- [ ] **Step 5: Cards (Service, Project, Insight) + OperatorLogos**

Create `src/components/ServiceCard.astro`:
```astro
---
interface Props { title: string; summary: string; icon: string; href: string; }
const { title, summary, icon, href } = Astro.props;
const icons: Record<string,string> = { drop:'🛢', gear:'⚙', flask:'🔬', beaker:'⚗', layers:'♺', people:'👷' };
---
<a href={href} class="block bg-navy/60 border border-brass/15 rounded-xl p-6 hover:border-brass/50 hover:-translate-y-1 transition-all">
  <div class="text-3xl mb-4">{icons[icon] ?? '◆'}</div>
  <h3 class="text-lg font-semibold text-white">{title}</h3>
  <p class="text-text-muted text-sm mt-2">{summary}</p>
</a>
```

Create `src/components/ProjectCard.astro`:
```astro
---
interface Props { title: string; operator: string; fluidType: string; year: number; location: string; outcome: string; href: string; }
const { title, operator, fluidType, year, location, outcome, href } = Astro.props;
---
<a href={href} class="block bg-navy/60 border border-brass/15 rounded-xl p-6 hover:border-brass/50 transition-colors" data-operator={operator}>
  <div class="flex items-center justify-between text-xs">
    <span class="text-brass font-semibold tracking-wide uppercase">{operator}</span>
    <span class="text-text-muted">{fluidType} · {year}</span>
  </div>
  <h3 class="text-lg font-semibold text-white mt-3">{title}</h3>
  <p class="text-text-muted text-sm mt-1">{location}</p>
  <p class="text-text-light text-sm mt-3">{outcome}</p>
</a>
```

Create `src/components/InsightCard.astro`:
```astro
---
interface Props { title: string; excerpt: string; date: Date; href: string; tags: string[]; }
const { title, excerpt, date, href, tags } = Astro.props;
const dateStr = date.toLocaleDateString('en-GB', { year:'numeric', month:'short' });
---
<a href={href} class="block bg-navy/60 border border-brass/15 rounded-xl p-6 hover:border-brass/50 transition-colors">
  <div class="text-xs text-brass uppercase tracking-widest">{tags[0] ?? 'Insight'} · {dateStr}</div>
  <h3 class="text-lg font-semibold text-white mt-3">{title}</h3>
  <p class="text-text-muted text-sm mt-2">{excerpt}</p>
</a>
```

Create `src/components/OperatorLogos.astro`:
```astro
---
import { operators } from '../data/site';
---
<section class="max-w-7xl mx-auto px-5 py-16">
  <p class="text-center text-xs uppercase tracking-[0.3em] text-text-muted mb-8">Trusted on operations for</p>
  <div class="flex flex-wrap justify-center gap-x-12 gap-y-6 opacity-80">
    {operators.map((o) => <span class="font-display text-xl text-text-light">{o}</span>)}
  </div>
</section>
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: build succeeds (components compile; not yet used until pages).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: shared UI components (hero, stats, cards, CTA)"
```

---

## Task 8: Homepage

**Files:**
- Modify/Create: `src/pages/index.astro`

- [ ] **Step 1: Build the homepage**

Replace `src/pages/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import StatBar from '../components/StatBar.astro';
import SectionHeading from '../components/SectionHeading.astro';
import ServiceCard from '../components/ServiceCard.astro';
import ProjectCard from '../components/ProjectCard.astro';
import InsightCard from '../components/InsightCard.astro';
import OperatorLogos from '../components/OperatorLogos.astro';
import CTA from '../components/CTA.astro';

const services = (await getCollection('services')).sort((a, b) => a.data.order - b.data.order);
const featured = (await getCollection('projects')).filter((p) => p.data.featured);
const insights = (await getCollection('insights')).sort((a, b) => +b.data.date - +a.data.date).slice(0, 3);
---
<BaseLayout>
  <Hero />
  <StatBar />

  <section class="max-w-7xl mx-auto px-5 py-24">
    <SectionHeading eyebrow="What we do" title="Engineering-led drilling fluid solutions"
      sub="Engineering and consultancy first — materials and field services second." />
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-12">
      {services.map((s) => <ServiceCard title={s.data.title} summary={s.data.summary} icon={s.data.icon} href={`/services/${s.id}`} />)}
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-5 pb-8">
    <SectionHeading eyebrow="Track record" title="Selected projects" />
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
      {featured.map((p) => <ProjectCard {...p.data} href={`/projects/${p.id}`} />)}
    </div>
  </section>

  <OperatorLogos />

  <section class="max-w-7xl mx-auto px-5 py-8">
    <SectionHeading eyebrow="Insights" title="Technical notes & case studies" />
    <div class="grid gap-6 md:grid-cols-3 mt-12">
      {insights.map((i) => <InsightCard title={i.data.title} excerpt={i.data.excerpt} date={i.data.date} tags={i.data.tags} href={`/insights/${i.id}`} />)}
    </div>
  </section>

  <CTA />
</BaseLayout>
```

- [ ] **Step 2: Verify build + visual check**

Run: `npm run build && npm run preview`
Expected: home page shows hero, stats, services grid, featured projects, operators, insights, CTA. Open the preview URL and confirm mobile layout (narrow the window).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: homepage"
```

---

## Task 9: Services pages (overview + detail)

**Files:**
- Create: `src/pages/services/index.astro`, `src/pages/services/[slug].astro`

- [ ] **Step 1: Services overview**

Create `src/pages/services/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import SectionHeading from '../../components/SectionHeading.astro';
import ServiceCard from '../../components/ServiceCard.astro';
const services = (await getCollection('services')).sort((a, b) => a.data.order - b.data.order);
---
<BaseLayout title="Services" description="Drilling and completion fluids engineering services from ODS.">
  <section class="max-w-7xl mx-auto px-5 py-20">
    <SectionHeading eyebrow="Services" title="Drilling & completion fluids engineering"
      sub="Independent consultancy, field engineering and laboratory capability." />
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-12">
      {services.map((s) => <ServiceCard title={s.data.title} summary={s.data.summary} icon={s.data.icon} href={`/services/${s.id}`} />)}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Service detail page**

Create `src/pages/services/[slug].astro`:
```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const services = await getCollection('services');
  return services.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}
const { entry } = Astro.props;
const { Content } = await render(entry);
---
<BaseLayout title={entry.data.title} description={entry.data.summary}>
  <article class="max-w-3xl mx-auto px-5 py-20">
    <div class="text-xs tracking-[0.3em] uppercase text-brass font-semibold mb-3">Service</div>
    <h1 class="text-4xl font-bold">{entry.data.title}</h1>
    <p class="text-text-muted mt-4 text-lg">{entry.data.summary}</p>
    <div class="prose-invert mt-8 text-text-light leading-relaxed space-y-5"><Content /></div>
    <a href="/contact" class="inline-block mt-10 bg-brass text-ink font-semibold px-6 py-3 rounded-md">Discuss this service</a>
  </article>
</BaseLayout>
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: `/services` and `/services/mud-engineering` etc. generate. Confirm 6 service pages built.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: services overview and detail pages"
```

---

## Task 10: Projects pages (listing with filter island + detail)

**Files:**
- Create: `src/components/ProjectFilter.astro`, `src/pages/projects/index.astro`, `src/pages/projects/[slug].astro`

- [ ] **Step 1: Filter island (client-side, progressive)**

Create `src/components/ProjectFilter.astro`:
```astro
---
import { uniqueOperators } from '../data/filters';
interface Props { operators: { operator: string }[]; }
const list = uniqueOperators(Astro.props.operators);
---
<div class="flex flex-wrap gap-2 mb-8" id="projectFilter">
  {list.map((op) => (
    <button data-filter={op}
      class="text-sm px-4 py-2 rounded-full border border-brass/30 text-text-light hover:border-brass data-[active=true]:bg-brass data-[active=true]:text-ink"
      data-active={op === 'All' ? 'true' : 'false'}>{op}</button>
  ))}
</div>
<script>
  const bar = document.getElementById('projectFilter');
  const cards = Array.from(document.querySelectorAll('[data-operator]'));
  bar?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button');
    if (!btn) return;
    const filter = btn.dataset.filter;
    bar.querySelectorAll('button').forEach((b) => b.setAttribute('data-active', String(b === btn)));
    cards.forEach((c) => {
      const show = filter === 'All' || (c as HTMLElement).dataset.operator === filter;
      (c as HTMLElement).style.display = show ? '' : 'none';
    });
  });
</script>
```

- [ ] **Step 2: Projects listing**

Create `src/pages/projects/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import SectionHeading from '../../components/SectionHeading.astro';
import ProjectCard from '../../components/ProjectCard.astro';
import ProjectFilter from '../../components/ProjectFilter.astro';
const projects = (await getCollection('projects')).sort((a, b) => b.data.year - a.data.year);
const operators = projects.map((p) => ({ operator: p.data.operator }));
---
<BaseLayout title="Projects" description="ODS drilling-fluids project track record across the Caspian and beyond.">
  <section class="max-w-7xl mx-auto px-5 py-20">
    <SectionHeading eyebrow="Track record" title="Projects"
      sub="Supporting drilling operations across the Caspian region, Middle East and international markets." />
    <div class="mt-12"><ProjectFilter operators={operators} /></div>
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => <ProjectCard {...p.data} href={`/projects/${p.id}`} />)}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 3: Project detail**

Create `src/pages/projects/[slug].astro`:
```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}
const { entry } = Astro.props;
const { Content } = await render(entry);
const d = entry.data;
---
<BaseLayout title={d.title} description={d.outcome}>
  <article class="max-w-3xl mx-auto px-5 py-20">
    <div class="text-xs tracking-[0.3em] uppercase text-brass font-semibold mb-3">{d.operator} · {d.field}</div>
    <h1 class="text-4xl font-bold">{d.title}</h1>
    <div class="flex flex-wrap gap-4 text-sm text-text-muted mt-4">
      <span>{d.fluidType}</span><span>{d.year}</span><span>{d.location}</span>
    </div>
    <p class="text-text-light text-lg mt-6">{d.outcome}</p>
    <div class="mt-8 text-text-light leading-relaxed space-y-5"><Content /></div>
  </article>
</BaseLayout>
```

- [ ] **Step 4: Verify build + filter works**

Run: `npm run build && npm run preview`
Expected: `/projects` lists all projects; clicking an operator chip filters the grid; each `/projects/<slug>` page renders.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: projects listing with operator filter and detail pages"
```

---

## Task 11: Insights pages (listing + article) with ArticleLayout

**Files:**
- Create: `src/layouts/ArticleLayout.astro`, `src/pages/insights/index.astro`, `src/pages/insights/[slug].astro`

- [ ] **Step 1: ArticleLayout**

Create `src/layouts/ArticleLayout.astro`:
```astro
---
import BaseLayout from './BaseLayout.astro';
interface Props { title: string; date: Date; author: string; excerpt: string; }
const { title, date, author, excerpt } = Astro.props;
const dateStr = date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
---
<BaseLayout title={title} description={excerpt}>
  <article class="max-w-3xl mx-auto px-5 py-20">
    <div class="text-xs tracking-[0.3em] uppercase text-brass font-semibold mb-3">Insight · {dateStr}</div>
    <h1 class="text-4xl font-bold leading-tight">{title}</h1>
    <p class="text-text-muted mt-3">By {author}</p>
    <div class="mt-10 text-text-light leading-relaxed space-y-5"><slot /></div>
  </article>
</BaseLayout>
```

- [ ] **Step 2: Insights listing**

Create `src/pages/insights/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import SectionHeading from '../../components/SectionHeading.astro';
import InsightCard from '../../components/InsightCard.astro';
const insights = (await getCollection('insights')).sort((a, b) => +b.data.date - +a.data.date);
---
<BaseLayout title="Insights" description="Technical articles and case studies from the ODS engineering team.">
  <section class="max-w-7xl mx-auto px-5 py-20">
    <SectionHeading eyebrow="Insights" title="Technical notes & case studies" />
    <div class="grid gap-6 md:grid-cols-3 mt-12">
      {insights.map((i) => <InsightCard title={i.data.title} excerpt={i.data.excerpt} date={i.data.date} tags={i.data.tags} href={`/insights/${i.id}`} />)}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 3: Article page**

Create `src/pages/insights/[slug].astro`:
```astro
---
import { getCollection, render } from 'astro:content';
import ArticleLayout from '../../layouts/ArticleLayout.astro';
export async function getStaticPaths() {
  const insights = await getCollection('insights');
  return insights.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}
const { entry } = Astro.props;
const { Content } = await render(entry);
---
<ArticleLayout title={entry.data.title} date={entry.data.date} author={entry.data.author} excerpt={entry.data.excerpt}>
  <Content />
</ArticleLayout>
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: `/insights` and the seed article page build.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: insights listing and article pages"
```

---

## Task 12: About page

**Files:**
- Create: `src/pages/about.astro`

- [ ] **Step 1: Build the About page**

Create `src/pages/about.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SectionHeading from '../components/SectionHeading.astro';
import StatBar from '../components/StatBar.astro';
import CTA from '../components/CTA.astro';
import { certifications } from '../data/site';

const approach = [
  ['Real-time engineering', 'Decisions made at the wellsite from live data, not from a desk.'],
  ['Practical field experience', 'API-certified engineers with onshore and offshore track record.'],
  ['Risk-based planning', 'Operational plans built around well integrity and NPT reduction.'],
  ['Performance-driven execution', 'Measured against delivery, cost and fluid-life outcomes.'],
];
---
<BaseLayout title="About" description="ODS is an engineering-driven drilling & completion fluids consultancy.">
  <section class="max-w-7xl mx-auto px-5 py-20">
    <SectionHeading eyebrow="About ODS" title="An engineering-driven fluids consultancy"
      sub="ODS (Oilmen Drilling Services) provides drilling and completion fluids engineering and specialist manpower for onshore and offshore projects — built on a highly experienced team with a proven operational background across international and regional projects." />
  </section>
  <StatBar />
  <section class="max-w-7xl mx-auto px-5 py-20 grid gap-12 md:grid-cols-2">
    <div>
      <h2 class="text-2xl font-bold mb-6">Our approach</h2>
      <ul class="space-y-5">
        {approach.map(([h, p]) => (
          <li><div class="text-brass font-semibold">{h}</div><p class="text-text-muted text-sm mt-1">{p}</p></li>
        ))}
      </ul>
    </div>
    <div>
      <h2 class="text-2xl font-bold mb-6">Mission & certifications</h2>
      <p class="text-text-light">Deliver high-quality, safely executed engineering services with zero harm to personnel and no adverse impact on the environment — reducing operational risk and cost for our clients.</p>
      <div class="flex flex-wrap gap-2 mt-6">
        {certifications.map((c) => <span class="text-xs border border-brass/30 text-brass px-3 py-1.5 rounded-full">{c}</span>)}
      </div>
    </div>
  </section>
  <CTA />
</BaseLayout>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: `/about` builds and renders approach + certifications.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: about page"
```

---

## Task 13: Contact page + static form

**Files:**
- Create: `src/pages/contact.astro`

- [ ] **Step 1: Build the contact page with a Netlify/Formspree-ready form**

Create `src/pages/contact.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SectionHeading from '../components/SectionHeading.astro';
import { contact } from '../data/site';
const wa = `https://wa.me/${contact.whatsapp}`;
---
<BaseLayout title="Contact" description="Talk to an ODS drilling-fluids engineer.">
  <section class="max-w-5xl mx-auto px-5 py-20 grid gap-12 md:grid-cols-2">
    <div>
      <SectionHeading eyebrow="Contact" title="Talk to an engineer" />
      <ul class="space-y-4 mt-8 text-text-light">
        <li><span class="text-brass">Office</span><br />{contact.office}</li>
        <li><span class="text-brass">Phone</span><br /><a href={`tel:${contact.phone.replace(/\s/g,'')}`} class="hover:text-brass">{contact.phone}</a></li>
        <li><span class="text-brass">Email</span><br /><a href={`mailto:${contact.email}`} class="hover:text-brass">{contact.email}</a></li>
        <li><span class="text-brass">WhatsApp</span><br /><a href={wa} class="hover:text-brass">{contact.phone}</a></li>
      </ul>
    </div>
    <form name="contact" method="POST" data-netlify="true" class="space-y-4">
      <input type="hidden" name="form-name" value="contact" />
      <input name="name" required placeholder="Name" class="w-full bg-navy border border-brass/25 rounded-md px-4 py-3 text-white placeholder:text-text-muted" />
      <input name="email" type="email" required placeholder="Email" class="w-full bg-navy border border-brass/25 rounded-md px-4 py-3 text-white placeholder:text-text-muted" />
      <input name="company" placeholder="Company" class="w-full bg-navy border border-brass/25 rounded-md px-4 py-3 text-white placeholder:text-text-muted" />
      <textarea name="message" required rows="5" placeholder="How can we help?" class="w-full bg-navy border border-brass/25 rounded-md px-4 py-3 text-white placeholder:text-text-muted"></textarea>
      <button type="submit" class="bg-brass text-ink font-semibold px-7 py-3 rounded-md hover:bg-brass-soft transition-colors">Send</button>
    </form>
  </section>
</BaseLayout>
```

> Form posts to Netlify Forms when deployed there. For Formspree instead, change `method`/`action` to the Formspree endpoint and drop the hidden field. Document the chosen path in AGENTS.md.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: `/contact` builds with form + contact details.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: contact page with static form"
```

---

## Task 14: AI-agent authoring docs + human README

**Files:**
- Create: `AGENTS.md`, `docs/CONTENT-GUIDE.md`, `README.md`

- [ ] **Step 1: Write AGENTS.md (the agent entry point)**

Create `AGENTS.md`:
```md
# AGENTS.md — How to work on the ODS website

This is the **ODS (Oilmen Drilling Services)** marketing website: a static **Astro 6 +
Tailwind 4** site. Read this file fully before making changes.

## Golden rules
1. **Content changes touch ONLY these locations:**
   - `src/content/services/*.md` — the 6 services
   - `src/content/projects/*.md` — project case studies
   - `src/content/insights/*.md` — blog/technical articles
   - `src/data/site.ts` — nav, contact details, homepage stats, operator list
2. **Do NOT edit** `src/components/`, `src/layouts/`, `src/pages/`, or `src/styles/` for
   content changes. Those are structure — change with care and only on explicit request.
3. After ANY change, run `npm run build`. If it fails, the error names the file and field.
   Fix it before finishing. Never leave the build broken.
4. Match the existing file format exactly. Copy an existing file or the `_template.md`.

## Project map
- Pages auto-generate from content. Add a markdown file → a page appears. No routing edits.
- Design tokens (colors/fonts) live in `src/styles/global.css` under `@theme`.
- Allowed `fluidType` values: `WBM`, `OBM`, `brine`. Allowed `icon` keys: `drop`, `gear`,
  `flask`, `beaker`, `layers`, `people`.

## Task playbook
**Add a project:** copy `src/content/projects/_template.md` to a new
`src/content/projects/<short-name>.md`, fill the frontmatter (title, operator, field,
fluidType, year, location, outcome; `featured: true` to show on the homepage), write the
body, run `npm run build`.

**Publish an article:** copy `src/content/insights/_template.md` to
`src/content/insights/<slug>.md`, set title/date/excerpt/tags, write the body, build.

**Edit a service:** open the matching file in `src/content/services/` and edit the body or
summary. Do not change `order` unless reordering all six.

**Change homepage stats / phone / email / operators:** edit `src/data/site.ts`.

## Run / preview / deploy
- Install: `npm install`
- Preview locally: `npm run dev` → open the printed URL
- Production build: `npm run build` (must pass before deploy)
- Tests: `npm test`
- Deploy: push to the main branch; Vercel/Netlify builds and deploys automatically.
```

- [ ] **Step 2: Write docs/CONTENT-GUIDE.md (plain-language human version)**

Create `docs/CONTENT-GUIDE.md`:
```md
# Editing the ODS website — plain-language guide

You do not need to be a developer. You can ask an AI coding agent to make these changes;
this guide (and `AGENTS.md`) tells the agent exactly what to do.

## Add a new project
Tell the agent: *"Add a project: <title>, operator <name>, fluid <WBM/OBM/brine>, year
<YYYY>, <onshore/offshore location>, outcome: <one line>. Featured: yes/no."*
The agent creates a file in `src/content/projects/` from the template below.

```
---
title: "Field / Well Name"
operator: "SOCAR"
field: "Field name"
fluidType: "OBM"        # WBM, OBM, or brine
year: 2025
location: "Offshore Azerbaijan"
outcome: "One-line headline result."
featured: false          # true shows it on the homepage
---
Longer description here.
```

## Publish an article
Tell the agent the title, date, a one-sentence summary, and the article text. It creates a
file in `src/content/insights/`.

## Change phone, email, address, or the homepage numbers
These live in one file: `src/data/site.ts`. Ask the agent to update the value there.

## After any change
Ask the agent to run `npm run build` and confirm it passes. Then the site can be deployed.
```

- [ ] **Step 3: Write README.md**

Create `README.md`:
```md
# ODS Website

Static marketing site for Oilmen Drilling Services. Astro 6 + Tailwind 4 + TypeScript.

## Develop
```bash
npm install
npm run dev      # local preview
npm run build    # production build (run before deploy)
npm test         # unit tests
```

## Editing content
See `AGENTS.md` (for AI agents) and `docs/CONTENT-GUIDE.md` (plain language). All editable
content is markdown under `src/content/` plus `src/data/site.ts`.

## Deploy
Connect the repo to Vercel or Netlify; pushes to `main` build and deploy automatically.
Build command `npm run build`, output directory `dist/`.
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: AGENTS.md, content guide, and README for AI-agent editing"
```

---

## Task 15: Deploy config, polish, and final verification

**Files:**
- Create: `netlify.toml` (and/or `vercel.json`), `public/favicon.svg`, placeholder images

- [ ] **Step 1: Add Netlify config**

Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"
```

- [ ] **Step 2: Add favicon + placeholder hero/og images**

Create `public/favicon.svg` (simple brass diamond):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#000"/><path d="M16 6l8 10-8 10-8-10z" fill="#b8863b"/></svg>
```
Add placeholder `public/images/hero.jpg` and `public/images/og-default.jpg` (any dark
rig/industrial image, or generate solid-navy placeholders). Note in AGENTS.md that ODS
should replace these with real photography.

- [ ] **Step 3: Full verification pass**

Run: `npm test && npm run build`
Expected: all unit tests pass; build completes with sitemap generated in `dist/`. Confirm these routes exist in `dist/`: `index.html`, `about/index.html`, `services/index.html` + 6 service pages, `projects/index.html` + 5 project pages, `insights/index.html` + article, `contact/index.html`.

- [ ] **Step 4: Manual mobile + a11y spot check**

Run: `npm run preview`
Expected: at a 375px-wide viewport — hamburger menu opens/closes, all pages are readable, tap targets are comfortable, no horizontal scroll. Tab order reaches nav links and the contact form.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: deploy config, favicon, placeholders, final verification"
```

---

## Self-Review Notes (coverage map spec → tasks)

- Positioning/messaging (spec §1,§3): Task 2 (`site.ts`), Task 7 (Hero), Task 12 (About).
- IA / all pages (spec §4): Tasks 8–13.
- 6 services (spec §5): Task 4 content + Task 9 pages.
- Seed content incl. BP/operators/case studies (spec §6): Task 4, Task 2 (operators/stats).
- Privacy (no reference contacts published): honored — no contact names seeded anywhere.
- Tech architecture + schemas (spec §7): Tasks 1,3.
- AI-agent authoring (spec §8): Task 14 (AGENTS.md, CONTENT-GUIDE, templates in Task 4),
  self-documenting schemas in Task 3.
- Mobile-first (spec §9): Task 6 (mobile nav), responsive grids throughout, Task 15 §4 check.
- Midnight Brass design system (spec §9): Task 1 (`global.css` `@theme`).
- Testing & deploy (spec §10): Tasks 2,3 (vitest), Task 15 (netlify config, verification).
- Out of scope (spec §11): no CMS, no i18n, no auth — honored.
- Open items (spec §12): stats/operators flagged "confirm" in `site.ts`; images flagged as
  placeholders in Task 15.
```
