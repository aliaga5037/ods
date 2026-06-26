# Engineering Tools Migration — Design Spec

**Date:** 2026-06-26
**Status:** Approved (design phase)
**Source:** `~/Desktop/oilmen` (legacy static HTML/CSS/JS site for the same company)
**Target:** `~/ods` (current Astro 6 + Tailwind 4 marketing site)

---

## 1. Goal

Migrate the legacy site's five interactive engineering tools into the current Astro
site, **rebuilt** to match the new architecture and visual design rather than copied
verbatim. The tools are both a **public credibility/SEO feature** and a **genuinely
useful field utility** for ODS engineers, so correctness (tested math) and on-brand
design both matter.

The five tools:

1. **Unit Conversions** — 6-category converter (length, volume, pressure, temperature, weight, density).
2. **Mud Calculations** — 6 calculators (barite required, add known barite, cut weight, mix fluids, OWR adjust, slug).
3. **System Treatment** — 2 calculators (add light premix, maintain concentration).
4. **Lab Procedures** — 16 reference sheets, editable by non-technical staff.
5. **Product Data** — searchable datasheet catalog with room for PDFs uploaded later.

---

## 2. Decisions (locked during brainstorming)

| # | Decision | Choice |
|---|---|---|
| 1 | Audience/purpose | **Both** — public-facing marketing/SEO *and* practical field utility |
| 2 | Information architecture | **`/tools` hub + per-tool pages**, one `Tools` link in main nav (mirrors `/services`) |
| 3a | Lab Procedures format | **Editable markdown content collection** (non-technical staff edit `.md` files) |
| 3b | Product Data | **Build catalog now; PDF slot for later** — datasheets dropped into a folder auto-wire in |
| 4 | Calculator implementation | **Pure TS math modules (vitest-tested) + vanilla `<script>` Astro islands** — zero new dependencies |

---

## 3. Architecture

### 3.1 URL structure

| URL | Source | Purpose |
|---|---|---|
| `/tools` | `src/pages/tools/index.astro` | Hub with a card per tool |
| `/tools/unit-conversions` | page + `units.ts` | Unit converter |
| `/tools/mud-calculations` | page + `mud.ts` | Mud calculators |
| `/tools/system-treatment` | page + `treatment.ts` | System-treatment calculators |
| `/tools/lab-procedures` | `procedures` collection | Procedure index (list + category filter) |
| `/tools/lab-procedures/[slug]` | `procedures` collection | Single procedure |
| `/tools/products` | `products` collection | Searchable datasheet catalog |

### 3.2 File layout

```
src/lib/calculators/
  units.ts             # conversion tables + convert() — pure
  units.test.ts
  mud.ts               # 6 mud calcs — pure functions returning structured results
  mud.test.ts
  treatment.ts         # 2 system-treatment calcs — pure
  treatment.test.ts
  types.ts             # shared CalcResult / CalcError types

src/components/tools/
  ToolCard.astro       # hub card (title, blurb, icon, href)
  ToolTabs.astro       # reusable tab strip (used by calculators with multiple modes)
  ResultPanel.astro    # shared result/notes/warning display

src/content/
  procedures/
    _template.md       # excluded from build (leading underscore)
    <16 procedure files>.md
  products/
    _template.md
    <product files>.md

src/pages/tools/
  index.astro
  unit-conversions.astro
  mud-calculations.astro
  system-treatment.astro
  lab-procedures/index.astro
  lab-procedures/[slug].astro
  products/index.astro

public/datasheets/
  README.md            # naming convention + how to add a PDF later
```

### 3.3 Content collections (registered in `src/content.config.ts`)

**`procedures`** (Zod schema):
- `title: string`
- `category: enum` — e.g. `mud-properties` | `rheology` | `filtration` | `solids` | `chemical` | `other` (final list confirmed from legacy content during implementation)
- `order: number`
- `summary: string`
- body: markdown (the procedure steps/notes)

**`products`** (Zod schema):
- `name: string`
- `category: string`
- `order: number`
- `datasheet?: string` — optional path under `/datasheets/`. **Absent → "Datasheet coming soon" (disabled). Present → link opens the PDF.**

### 3.4 Interactivity model

- **Math lives in `src/lib/calculators/*.ts`** as pure functions. No DOM access. Each
  validation rule (e.g. "desired weight must exceed initial weight") returns a typed
  error in the result object — never `alert()` or `throw` for user-input errors.
- **Astro components render the form** and contain a small vanilla `<script>` that:
  reads inputs → calls the pure function → renders `result.values` / `notes` /
  `warnings` into `ResultPanel`. No global functions, no inline `onclick`, no reliance
  on the deprecated global `event.target`.
- **No UI framework** added. **No bundler runtime dependency** beyond what Astro ships.

### 3.5 Result contract (shared `types.ts`)

```ts
type CalcValue = { label: string; value: string };      // pre-formatted for display
type CalcResult = {
  ok: boolean;
  values: CalcValue[];        // shown on success
  notes?: string[];           // informational (e.g. "constant volume" guidance)
  warnings?: string[];        // non-fatal cautions
  error?: string;             // set when ok === false (validation failure)
};
```

Pure functions take a typed input object and return `CalcResult`. The Astro layer is
display-only.

---

## 4. Per-tool specification

### 4.1 Unit Conversions (`units.ts`)

Six categories, each a table of conversion pairs. Linear pairs use a `factor`;
temperature uses explicit `convert(value)` functions. Factors ported verbatim from
legacy `js/unit-conversions.js` (standard values). `convert(category, pairId, value)`
returns the numeric result; UI formats it.

Drilling-relevant pairs preserved: bbl↔m³, bbl↔gal, SG↔ppg, ppg↔kg/m³, SG↔kg/m³,
PSI↔atm/bar/kPa, plus standard length/weight/temperature.

UI: category tabs → conversion dropdown → numeric input → live result line.

### 4.2 Mud Calculations (`mud.ts`)

Six pure functions, each returning `CalcResult`:

| Function | Inputs | Output |
|---|---|---|
| `bariteRequired` | initial wt (SG), desired wt (SG), volume (bbl), constantVolume (bool) | barite (tons), final wt, final volume + note |
| `addKnownBarite` | initial wt, volume, barite added (tons) | new wt (SG/ppg), final volume, wt increase |
| `cutWeight` | initial wt, volume, desired wt, dilution density, constantVolume | dilution fluid (bbl), final wt, final volume + note |
| `mixFluids` | 2–3 × (density, volume) | mixed density (SG/ppg), total volume |
| `owrAdjust` | current OWR, oil %, volume, desired OWR, density | oil or water to add (bbl), new OWR, final volume |
| `slugCalc` | pipe length, mud wt, pipe capacity, slug volume | **see verification note §5** |

Constants centralized: barite SG = 4.2, barite weight = 35 ppg, 8.33 ppg per SG,
94 lb/sack, 42 gal/bbl.

### 4.3 System Treatment (`treatment.ts`)

| Function | Inputs | Output |
|---|---|---|
| `addLightPremix` | system vol, pump rate (gpm), current wt, desired wt, premix density | premix vol (bbl), dilution rate (bbl/min), circulation time, divert vol |
| `maintainConcentration` | system vol, pump rate, container type (sack-25 / drum-55 / ibc-1000 / can-30 / custom), chemical density, current & desired concentration | # containers, addition rate, circulation time |

Container capacities computed as in legacy code; custom capacity overrides the preset.

### 4.4 Lab Procedures

16 markdown files seeded from legacy `pages/lab-procedures.html` content (mud weight,
Marsh funnel, rheology, API filtration, HPHT filtration, retort, emulsion, pH, cation,
sand, production screen, permeability, PPT slot, ultracap, ultrahib, dry sieve).
Index page lists them with a category filter; `[slug]` renders full body. A
`_template.md` documents the format for staff.

### 4.5 Product Data

Catalog rendered from `products` collection. Client-side search normalizes the query
(strips hyphens/spaces, case-insensitive) — same flexible matching as legacy code.
Optional category filter. Each card: name + datasheet link (if `datasheet` set) or a
disabled "Datasheet coming soon" state. `public/datasheets/README.md` documents how to
add a PDF and reference it from a product file.

---

## 5. Formula verification (correctness gate)

The tools are used in the field, so math must be verified, not assumed:

- Every pure function gets vitest cases with **hand-computed expected values**.
- Standard conversion factors and the well-known mud formulas (weight-up, dilution,
  mixing, OWR) are verified against textbook values.
- **Flagged for ODS domain sign-off (not silently shipped):**
  - **Slug calculator** — legacy `slugDensity = slugWeight * 8.33 / 8.33` is a no-op and
    appears incorrect. We implement a defensible version and mark it for confirmation.
  - **Barite "tons" conversions** — legacy mixes sacks/lb assumptions across the
    constant- vs variable-volume branches; we document the assumptions chosen.
- **We will not invent petroleum-engineering formulas.** Where legacy code is ambiguous,
  the ambiguity is surfaced for the user to confirm rather than guessed.

---

## 6. Visual design

- Reuse the existing dark theme tokens (`--color-navy`, `--color-brass`, etc.),
  Space Grotesk headings, Inter body, and existing card/button styles.
- Tools hub mirrors `/services` card grid; calculator pages use a consistent
  form + result-panel layout via the shared `tools/` components.
- Fully responsive; respects the existing `prefers-reduced-motion` rule.

---

## 7. Out of scope (YAGNI)

- Dark-mode toggle (site is dark-only — legacy toggle dropped).
- Canvas "network animation".
- Legacy feedback form (superseded by existing `/contact`).
- Standalone copyright page (footer already handles copyright).
- The legacy PDFs themselves (not in either repo) — slot built; files added later.

---

## 8. Testing & acceptance

- `npm run test` — vitest unit tests pass for every function in `src/lib/calculators/`.
- `npm run build` — passes (mandatory per AGENTS.md; surfaces any content-schema error).
- Manual smoke test of all 7 pages via `npm run dev`.
- Nav shows a single `Tools` link; all tool pages reachable and on-brand.
- Procedures and products are editable via markdown without touching structural files.
