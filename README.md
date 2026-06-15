# ODS — Oilmen Drilling Services Website

Static marketing website for ODS, built with **Astro 6**, **Tailwind 4**, and **TypeScript**.

---

## Tech stack

- **Framework:** Astro 6 (static output, Content Layer API)
- **Styling:** Tailwind CSS 4 (design tokens in `src/styles/global.css`)
- **Language:** TypeScript with strict Astro type checking
- **Testing:** Vitest
- **Forms:** Netlify Forms (no backend required)

---

## Develop

```bash
npm install        # install dependencies
npm run dev        # start dev server at http://localhost:4321
npm run build      # production build → dist/
npm run preview    # preview production build locally
npm test           # run unit tests (Vitest)
npm run check      # Astro TypeScript type check
```

The build must pass (`npm run build`) before any change is merged or deployed.

---

## Where content lives

All editable content is in two places:

| Location | What it controls |
|---|---|
| `src/content/services/*.md` | Service pages |
| `src/content/projects/*.md` | Project / case study pages |
| `src/content/insights/*.md` | Articles and insights |
| `src/data/site.ts` | Nav, contact details, homepage stats, operators, certifications |

Pages auto-generate from markdown files — adding a file creates a page, removing a file removes it.

For detailed editing instructions, see:
- **[AGENTS.md](./AGENTS.md)** — guide for AI coding agents (field names, enum values, task playbook)
- **[docs/CONTENT-GUIDE.md](./docs/CONTENT-GUIDE.md)** — plain-language guide for non-developers instructing an AI agent

---

## Content schemas

Schemas are defined in `src/content.config.ts`. Key constraints:

- **`fluidType`** (projects): `WBM` | `OBM` | `brine`
- **`icon`** (services): `drop` | `gear` | `flask` | `beaker` | `layers` | `people`

Template files (`_template.md`) exist in each content folder and are excluded from the build.

---

## Deploy

Connect the repository to **Vercel** or **Netlify**:

- **Build command:** `npm run build`
- **Output directory:** `dist/`
- **Node version:** 20+

Push to `main` triggers an automatic build and deploy. The contact form is handled by Netlify Forms — no additional configuration required.
