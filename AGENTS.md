# AGENTS.md — AI Agent Editing Guide

ODS marketing website — static Astro 6 + Tailwind 4.

This file is the entry point for any AI coding agent working on this project. Read it fully before touching any file.

---

## Golden Rules

1. **Content changes touch ONLY these files/folders:**
   - `src/content/services/*.md`
   - `src/content/projects/*.md`
   - `src/content/insights/*.md`
   - `src/data/site.ts` (nav, contact, homepage stats, operators, certifications)

2. **Do NOT edit** `src/components/`, `src/layouts/`, `src/pages/`, or `src/styles/` for content-only tasks. Those are structural files — change them only when explicitly asked to alter design or layout.

3. **After ANY change, run `npm run build`.** If it fails, the error message will name the exact file and field that is wrong. Fix it before finishing. Never leave the build broken.

4. **Match existing file format exactly.** Before creating a new file, open the `_template.md` in the same folder and copy its structure. Files starting with `_` are excluded from the build automatically — they are safe to read but must not be renamed.

---

## Project Map

### How pages are generated

Pages auto-generate from content files using Astro's Content Layer + `getStaticPaths`. Adding a `.md` file to a content folder creates a new page with no routing changes needed. Removing a file removes its page.

### Content folders and URLs

| Folder | URL pattern | Purpose |
|---|---|---|
| `src/content/services/*.md` | `/services/[slug]` | Service detail pages |
| `src/content/projects/*.md` | `/projects/[slug]` | Case study pages |
| `src/content/insights/*.md` | `/insights/[slug]` | Articles / blog posts |

### Global site data

`src/data/site.ts` holds:
- `site` — name, tagline, headline, URL
- `contact` — phone, email, whatsapp, office address
- `nav` — navigation links
- `stats` — homepage proof stats (e.g. "40+ Wells Delivered")
- `operators` — client/operator names shown on the site
- `certifications` — certification list

### Allowed enum values (Zod-validated — wrong values break the build)

**`fluidType`** (projects only): `WBM` | `OBM` | `brine`

**`icon`** (services only): `drop` | `gear` | `flask` | `beaker` | `layers` | `people`

### Design tokens

Colors and fonts are defined in `src/styles/global.css` under the `@theme` block. Change them only when the user explicitly asks to alter the visual design.

---

## Required Frontmatter Fields

### Service (`src/content/services/*.md`)

```yaml
---
title: "Service Name"
order: 1            # display order, ascending integer
icon: "drop"        # drop | gear | flask | beaker | layers | people
summary: "One sentence shown on the service card."
---
```

Body: 2–4 paragraphs of markdown describing the service.

### Project (`src/content/projects/*.md`)

```yaml
---
title: "Field / Well Name"
operator: "SOCAR"             # client/operator name
field: "Field name"
fluidType: "OBM"              # WBM | OBM | brine
year: 2025                    # integer
location: "Offshore Azerbaijan"
outcome: "One-line headline result."
featured: false               # true = show on homepage
# image: "/images/projects/example.jpg"   # optional
---
```

Body: optional markdown case-study narrative.

### Insight / Article (`src/content/insights/*.md`)

```yaml
---
title: "Article Title"
date: 2026-01-01              # YYYY-MM-DD
author: "ODS Team"
excerpt: "One- or two-sentence summary shown in the article list."
tags: ["drilling fluids"]     # array of strings
# cover: "/images/insights/example.jpg"   # optional
---
```

Body: full article in markdown.

---

## Task Playbook

### Add a new project

1. Create `src/content/projects/<slug>.md` — use a short, hyphenated filename, e.g. `gunashli-offshore-2025.md`.
2. Copy the frontmatter from `src/content/projects/_template.md`.
3. Fill in all required fields. Set `featured: true` only if it should appear on the homepage.
4. Add optional body text below the `---` closing fence.
5. Run `npm run build` and confirm it passes.

### Publish an article (insight)

1. Create `src/content/insights/<slug>.md`, e.g. `lost-circulation-guide.md`.
2. Copy the frontmatter from `src/content/insights/_template.md`.
3. Set `date` to today's date (`YYYY-MM-DD`). Fill all required fields.
4. Write the article body in markdown below the frontmatter.
5. Run `npm run build` and confirm it passes.

### Edit a service

1. Open the relevant file in `src/content/services/`. Existing files: `fluids-program-design.md`, `laboratory-services.md`, `manpower.md`, `mud-engineering.md`, `solids-control.md`, `waste-management.md`.
2. Edit the frontmatter fields or body text as needed.
3. If changing `icon`, use only allowed values: `drop | gear | flask | beaker | layers | people`.
4. Run `npm run build` and confirm it passes.

### Add a new service

1. Create `src/content/services/<slug>.md`.
2. Copy the frontmatter from `src/content/services/_template.md`.
3. Set `order` to an integer higher than existing services (check existing files for the highest value).
4. Run `npm run build` and confirm it passes.

### Change homepage stats

Open `src/data/site.ts` and edit the `stats` array:

```ts
export const stats = [
  { value: '40+', label: 'Wells Delivered' },
  { value: '9',   label: 'Parallel Projects' },
  ...
];
```

Run `npm run build` and confirm it passes.

### Change phone / email / address

Open `src/data/site.ts` and edit the `contact` object:

```ts
export const contact = {
  phone: '+994 50 404 4402',
  email: 'seymuraliyev@oilmends.com',
  whatsapp: '+994504044402',
  office: 'Baku, Azerbaijan',
};
```

Run `npm run build` and confirm it passes.

### Change operators list

Open `src/data/site.ts` and edit the `operators` array:

```ts
export const operators = ['SOCAR', 'BP', 'Azorel', ...];
```

Run `npm run build` and confirm it passes.

### Change certifications

Open `src/data/site.ts` and edit the `certifications` array:

```ts
export const certifications = ['ISO 9001:2015', 'ISO 14001:2015', ...];
```

Run `npm run build` and confirm it passes.

---

## Run / Preview / Deploy Commands

| Command | Purpose |
|---|---|
| `npm install` | Install dependencies (first time or after `package.json` changes) |
| `npm run dev` | Start local dev server (hot-reload preview at `http://localhost:4321`) |
| `npm run build` | Production build — must pass before any work is considered done |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run unit tests (Vitest) |
| `npm run check` | Astro TypeScript type-check |

### Deploy

Deployment is automatic: push to `main` → Vercel/Netlify detects the push and runs `npm run build`. Output directory is `dist/`. The contact form uses Netlify Forms — no backend needed.
