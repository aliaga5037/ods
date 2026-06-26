# Engineering Tools Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the legacy oilmen site's five engineering tools (unit conversions, mud calculations, system treatment, lab procedures, product datasheets) into the current Astro site under a `/tools` hub, rebuilt to the new architecture and design.

**Architecture:** Calculator math lives in pure, vitest-tested TypeScript modules in `src/lib/calculators/`. Astro pages render forms and wire inputs to those pure functions with small vanilla `<script>` islands — no UI framework, no new runtime deps. Lab procedures and products are editable markdown content collections, matching the existing services/projects/insights pattern.

**Tech Stack:** Astro 6, Tailwind 4, TypeScript, vitest, Zod (via `astro/zod`), glob content loader.

## Global Constraints

- **No new dependencies.** Calculators are pure TS + vanilla `<script>`. (Spec §2 decision 4)
- **`npm run build` must pass after every task** (AGENTS.md golden rule 3).
- **Content collections exclude `_`-prefixed files** via glob pattern `**/[^_]*.md` (existing convention in `content.config.ts`).
- **Dark theme only.** Reuse tokens: `--color-navy`, `--color-brass`, `--color-brass-soft`, `--color-text-light`, `--color-text-muted`, `--color-ink`. Headings use `font-display` (Space Grotesk), body `font-body` (Inter). No dark-mode toggle. (Spec §6, §7)
- **Validation belongs in pure functions**, returned as typed errors in `CalcResult` — never `alert()`/`throw` for user-input errors. (Spec §3.4)
- **Pre-formatted display:** pure functions return strings in `CalcResult.values`; the Astro layer is display-only. (Spec §3.5)
- **No invented petroleum-engineering formulas.** Legacy formulas are ported verbatim; the slug calculator and barite→tons conversion are flagged in-code and in results for ODS sign-off. (Spec §5)
- **Constants:** SG→ppg = 8.33, barite SG = 4.2, barite weight = 35 ppg, 94 lb/sack, 42 gal/bbl, lb→kg = 0.453592.

---

### Task 1: Scaffolding — nav link + content collection schemas

**Files:**
- Modify: `src/data/site.ts` (add Tools nav entry)
- Modify: `src/content.config.ts` (add `procedures` + `products` collections)
- Test: `src/content.config.test.ts` (add schema cases)

**Interfaces:**
- Produces: `procedureSchema`, `productSchema` (exported Zod schemas); collections `procedures`, `products`.

- [ ] **Step 1: Add the Tools nav link**

In `src/data/site.ts`, change the `nav` array to insert `Tools` after `Projects`:

```ts
export const nav = [
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Projects', href: '/projects' },
  { label: 'Tools', href: '/tools' },
  { label: 'Insights', href: '/insights' },
  { label: 'Contact', href: '/contact' },
];
```

- [ ] **Step 2: Write failing schema tests**

Append to `src/content.config.test.ts`:

```ts
import { procedureSchema, productSchema } from './content.config';

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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test -- src/content.config.test.ts`
Expected: FAIL — `procedureSchema`/`productSchema` are not exported.

- [ ] **Step 4: Add schemas and collections**

In `src/content.config.ts`, add before the `defineCollection` lines:

```ts
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
```

Add the collections and register them:

```ts
const procedures = defineCollection({ loader: glob({ pattern: '**/[^_]*.md', base: './src/content/procedures' }), schema: procedureSchema });
const products = defineCollection({ loader: glob({ pattern: '**/[^_]*.md', base: './src/content/products' }), schema: productSchema });

export const collections = { services, projects, insights, procedures, products };
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- src/content.config.test.ts`
Expected: PASS.

- [ ] **Step 6: Create placeholder content so the build doesn't error on empty collections**

Create `src/content/procedures/_template.md`:

```markdown
---
title: Procedure Title
category: mud-properties   # mud-properties | rheology | filtration | solids | chemical | other
order: 99
summary: One-line description shown on the procedures index.
---

## Purpose

What this measures and why.

## Equipment

- Item one
- Item two

## Procedure

1. Step one
2. Step two

## Notes

Any cautions or reference values.
```

Create `src/content/products/_template.md`:

```markdown
---
name: Product Name
category: category-key
order: 99
# datasheet: /datasheets/product-name.pdf   # uncomment once the PDF is uploaded
---

Optional short description of the product.
```

- [ ] **Step 7: Commit**

```bash
git add src/data/site.ts src/content.config.ts src/content.config.test.ts src/content/procedures/_template.md src/content/products/_template.md
git commit -m "feat(tools): add Tools nav link and procedures/products collection schemas"
```

---

### Task 2: Shared tool types, components, and `/tools` hub

**Files:**
- Create: `src/lib/calculators/types.ts`
- Create: `src/components/tools/ResultPanel.astro`
- Create: `src/components/tools/ToolTabs.astro`
- Create: `src/components/tools/ToolCard.astro`
- Create: `src/pages/tools/index.astro`

**Interfaces:**
- Produces: `CalcValue`, `CalcResult` types; `ResultPanel` (renders a `CalcResult` by id), `ToolTabs` (tab strip), `ToolCard` (hub card).

- [ ] **Step 1: Create the shared result types**

`src/lib/calculators/types.ts`:

```ts
export type CalcValue = { label: string; value: string };

export type CalcResult = {
  ok: boolean;
  values: CalcValue[];
  notes?: string[];
  warnings?: string[];
  error?: string;
};

export const fail = (error: string): CalcResult => ({ ok: false, values: [], error });
```

- [ ] **Step 2: Create ResultPanel**

`src/components/tools/ResultPanel.astro` — a display container the page script fills client-side. It renders nothing until populated.

```astro
---
interface Props { id: string; }
const { id } = Astro.props;
---
<div id={id} class="mt-6 hidden rounded-xl border border-brass/20 bg-navy/60 p-5" role="status" aria-live="polite">
  <p class="js-error hidden text-sm font-medium text-brass-soft"></p>
  <dl class="js-values grid gap-2 text-sm"></dl>
  <ul class="js-notes mt-3 hidden list-disc space-y-1 pl-5 text-xs text-text-muted"></ul>
  <ul class="js-warnings mt-3 hidden list-disc space-y-1 pl-5 text-xs text-brass-soft"></ul>
</div>
<script>
  // Shared renderer: window.renderResult(panelId, CalcResult)
  // Defined once; safe to include on every tool page.
  (window as any).renderResult = function (panelId: string, r: any) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const err = panel.querySelector('.js-error') as HTMLElement;
    const values = panel.querySelector('.js-values') as HTMLElement;
    const notes = panel.querySelector('.js-notes') as HTMLElement;
    const warnings = panel.querySelector('.js-warnings') as HTMLElement;
    panel.classList.remove('hidden');
    values.innerHTML = ''; notes.innerHTML = ''; warnings.innerHTML = '';
    notes.classList.add('hidden'); warnings.classList.add('hidden'); err.classList.add('hidden');
    if (!r.ok) { err.textContent = r.error || 'Invalid input'; err.classList.remove('hidden'); return; }
    for (const v of r.values) {
      const dt = document.createElement('dt'); dt.className = 'text-text-muted'; dt.textContent = v.label;
      const dd = document.createElement('dd'); dd.className = 'font-semibold text-white mb-1'; dd.textContent = v.value;
      values.appendChild(dt); values.appendChild(dd);
    }
    if (r.notes?.length) { notes.classList.remove('hidden'); for (const n of r.notes) { const li = document.createElement('li'); li.textContent = n; notes.appendChild(li); } }
    if (r.warnings?.length) { warnings.classList.remove('hidden'); for (const w of r.warnings) { const li = document.createElement('li'); li.textContent = w; warnings.appendChild(li); } }
  };
</script>
```

- [ ] **Step 3: Create ToolTabs**

`src/components/tools/ToolTabs.astro` — renders a button per tab; page script toggles panels by `data-tab`.

```astro
---
interface Props { tabs: { id: string; label: string }[]; }
const { tabs } = Astro.props;
---
<div class="flex flex-wrap gap-2" role="tablist">
  {tabs.map((t, i) => (
    <button type="button" data-tab={t.id} role="tab" aria-selected={i === 0 ? 'true' : 'false'}
      class="js-tab rounded-md border border-brass/20 px-4 py-2 text-sm text-text-light transition-colors hover:border-brass/50 aria-selected:bg-brass aria-selected:text-ink aria-selected:font-semibold">
      {t.label}
    </button>
  ))}
</div>
```

- [ ] **Step 4: Create ToolCard**

`src/components/tools/ToolCard.astro` (same visual language as ServiceCard):

```astro
---
interface Props { title: string; summary: string; icon: string; href: string; }
const { title, summary, icon, href } = Astro.props;
const icons: Record<string,string> = { convert:'⇄', mud:'🛢', treatment:'⚗', lab:'🔬', products:'📄' };
---
<a href={href} class="block bg-navy/60 border border-brass/15 rounded-xl p-6 hover:border-brass/50 hover:-translate-y-1 transition-all">
  <div class="text-3xl mb-4" aria-hidden="true">{icons[icon] ?? '◆'}</div>
  <h3 class="text-lg font-semibold text-white">{title}</h3>
  <p class="text-text-muted text-sm mt-2">{summary}</p>
</a>
```

- [ ] **Step 5: Create the hub page**

`src/pages/tools/index.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import SectionHeading from '../../components/SectionHeading.astro';
import ToolCard from '../../components/tools/ToolCard.astro';
const tools = [
  { title: 'Unit Conversions', summary: 'Length, volume, pressure, temperature, weight and density — including bbl↔m³ and SG↔ppg.', icon: 'convert', href: '/tools/unit-conversions' },
  { title: 'Mud Calculations', summary: 'Barite weight-up, dilution, fluid mixing, OWR adjustment and slug design.', icon: 'mud', href: '/tools/mud-calculations' },
  { title: 'System Treatment', summary: 'Add light premix and maintain chemical concentration across the active system.', icon: 'treatment', href: '/tools/system-treatment' },
  { title: 'Lab Procedures', summary: 'Reference sheets for standard drilling-fluid laboratory tests.', icon: 'lab', href: '/tools/lab-procedures' },
  { title: 'Product Datasheets', summary: 'Searchable catalog of drilling-fluid products and their datasheets.', icon: 'products', href: '/tools/products' },
];
---
<BaseLayout title="Tools" description="Engineering calculators and reference tools for drilling-fluids work from ODS.">
  <section class="max-w-7xl mx-auto px-5 py-20">
    <SectionHeading eyebrow="Tools" title="Engineering calculators & references"
      sub="Field-ready calculators and laboratory references for drilling-fluids work." />
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-12">
      {tools.map((t) => <ToolCard {...t} />)}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: PASS; `/tools` route generated.

- [ ] **Step 7: Commit**

```bash
git add src/lib/calculators/types.ts src/components/tools/ src/pages/tools/index.astro
git commit -m "feat(tools): shared calc types, result/tabs/card components, and /tools hub"
```

---

### Task 3: Unit conversions module + tests

**Files:**
- Create: `src/lib/calculators/units.ts`
- Test: `src/lib/calculators/units.test.ts`

**Interfaces:**
- Produces: `Category` type, `conversions` table, `convert(category, pairId, value): number`.

- [ ] **Step 1: Write failing tests**

`src/lib/calculators/units.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { convert, conversions } from './units';

describe('convert — linear factors', () => {
  it('meters to feet', () => { expect(convert('length', 'm-ft', 10)).toBeCloseTo(32.8084, 3); });
  it('barrels to cubic meters', () => { expect(convert('volume', 'bbl-m3', 100)).toBeCloseTo(15.8987, 3); });
  it('SG to ppg', () => { expect(convert('density', 'sg-ppg', 1.2)).toBeCloseTo(9.996, 3); });
});

describe('convert — temperature', () => {
  it('celsius to fahrenheit', () => { expect(convert('temperature', 'c-f', 100)).toBeCloseTo(212, 6); });
  it('celsius to kelvin', () => { expect(convert('temperature', 'c-k', 0)).toBeCloseTo(273.15, 6); });
});

describe('conversions table', () => {
  it('has all six categories', () => {
    expect(Object.keys(conversions).sort()).toEqual(
      ['density', 'length', 'pressure', 'temperature', 'volume', 'weight']);
  });
  it('every pair has a unique id within its category', () => {
    for (const cat of Object.values(conversions)) {
      const ids = cat.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/lib/calculators/units.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

`src/lib/calculators/units.ts` (factors ported verbatim from legacy `js/unit-conversions.js`):

```ts
export type Category = 'length' | 'volume' | 'pressure' | 'temperature' | 'weight' | 'density';

export type ConversionPair = {
  id: string;
  label: string;
  from: string;
  to: string;
  factor?: number;
  convert?: (v: number) => number;
};

export const conversions: Record<Category, ConversionPair[]> = {
  length: [
    { id: 'm-ft', label: 'Meter → Feet', from: 'm', to: 'ft', factor: 3.28084 },
    { id: 'ft-m', label: 'Feet → Meter', from: 'ft', to: 'm', factor: 0.3048 },
    { id: 'km-mi', label: 'Kilometer → Mile', from: 'km', to: 'mi', factor: 0.621371 },
    { id: 'mi-km', label: 'Mile → Kilometer', from: 'mi', to: 'km', factor: 1.60934 },
    { id: 'in-cm', label: 'Inch → Centimeter', from: 'in', to: 'cm', factor: 2.54 },
    { id: 'cm-in', label: 'Centimeter → Inch', from: 'cm', to: 'in', factor: 0.393701 },
  ],
  volume: [
    { id: 'bbl-m3', label: 'Barrel (bbl) → Cubic Meter (m³)', from: 'bbl', to: 'm³', factor: 0.158987 },
    { id: 'm3-bbl', label: 'Cubic Meter (m³) → Barrel (bbl)', from: 'm³', to: 'bbl', factor: 6.28981 },
    { id: 'bbl-gal', label: 'Barrel → Gallon (US)', from: 'bbl', to: 'gal', factor: 42 },
    { id: 'gal-bbl', label: 'Gallon (US) → Barrel', from: 'gal', to: 'bbl', factor: 0.0238095 },
    { id: 'l-gal', label: 'Liter → Gallon (US)', from: 'L', to: 'gal', factor: 0.264172 },
    { id: 'gal-l', label: 'Gallon (US) → Liter', from: 'gal', to: 'L', factor: 3.78541 },
  ],
  pressure: [
    { id: 'psi-atm', label: 'PSI → Atmosphere (atm)', from: 'psi', to: 'atm', factor: 0.068046 },
    { id: 'atm-psi', label: 'Atmosphere (atm) → PSI', from: 'atm', to: 'psi', factor: 14.6959 },
    { id: 'psi-bar', label: 'PSI → Bar', from: 'psi', to: 'bar', factor: 0.0689476 },
    { id: 'bar-psi', label: 'Bar → PSI', from: 'bar', to: 'psi', factor: 14.5038 },
    { id: 'psi-kpa', label: 'PSI → kPa', from: 'psi', to: 'kPa', factor: 6.89476 },
    { id: 'kpa-psi', label: 'kPa → PSI', from: 'kPa', to: 'psi', factor: 0.145038 },
  ],
  temperature: [
    { id: 'c-f', label: 'Celsius → Fahrenheit', from: '°C', to: '°F', convert: (v) => (v * 9) / 5 + 32 },
    { id: 'f-c', label: 'Fahrenheit → Celsius', from: '°F', to: '°C', convert: (v) => ((v - 32) * 5) / 9 },
    { id: 'c-k', label: 'Celsius → Kelvin', from: '°C', to: 'K', convert: (v) => v + 273.15 },
    { id: 'k-c', label: 'Kelvin → Celsius', from: 'K', to: '°C', convert: (v) => v - 273.15 },
    { id: 'f-k', label: 'Fahrenheit → Kelvin', from: '°F', to: 'K', convert: (v) => ((v - 32) * 5) / 9 + 273.15 },
    { id: 'k-f', label: 'Kelvin → Fahrenheit', from: 'K', to: '°F', convert: (v) => ((v - 273.15) * 9) / 5 + 32 },
  ],
  weight: [
    { id: 'lb-kg', label: 'Pound (lb) → Kilogram (kg)', from: 'lb', to: 'kg', factor: 0.453592 },
    { id: 'kg-lb', label: 'Kilogram (kg) → Pound (lb)', from: 'kg', to: 'lb', factor: 2.20462 },
    { id: 'ton-kg', label: 'Ton (US) → Kilogram', from: 'ton', to: 'kg', factor: 907.185 },
    { id: 'kg-ton', label: 'Kilogram → Ton (US)', from: 'kg', to: 'ton', factor: 0.00110231 },
    { id: 'oz-g', label: 'Ounce → Gram', from: 'oz', to: 'g', factor: 28.3495 },
    { id: 'g-oz', label: 'Gram → Ounce', from: 'g', to: 'oz', factor: 0.035274 },
  ],
  density: [
    { id: 'sg-ppg', label: 'Specific Gravity (SG) → PPG', from: 'SG', to: 'ppg', factor: 8.33 },
    { id: 'ppg-sg', label: 'PPG → Specific Gravity (SG)', from: 'ppg', to: 'SG', factor: 0.120048 },
    { id: 'ppg-kgm3', label: 'PPG → kg/m³', from: 'ppg', to: 'kg/m³', factor: 119.826 },
    { id: 'kgm3-ppg', label: 'kg/m³ → PPG', from: 'kg/m³', to: 'ppg', factor: 0.00834541 },
    { id: 'sg-kgm3', label: 'SG → kg/m³', from: 'SG', to: 'kg/m³', factor: 1000 },
    { id: 'kgm3-sg', label: 'kg/m³ → SG', from: 'kg/m³', to: 'SG', factor: 0.001 },
  ],
};

export function convert(category: Category, pairId: string, value: number): number {
  const pair = conversions[category]?.find((p) => p.id === pairId);
  if (!pair) throw new Error(`Unknown conversion: ${category}/${pairId}`);
  return pair.convert ? pair.convert(value) : value * (pair.factor as number);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- src/lib/calculators/units.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calculators/units.ts src/lib/calculators/units.test.ts
git commit -m "feat(tools): unit conversion module with tests"
```

---

### Task 4: Unit conversions page

**Files:**
- Create: `src/pages/tools/unit-conversions.astro`

**Interfaces:**
- Consumes: `conversions` from `units.ts`, `ResultPanel`, `ToolTabs`, `convert` (imported into the client script).

- [ ] **Step 1: Build the page**

`src/pages/tools/unit-conversions.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import SectionHeading from '../../components/SectionHeading.astro';
import ToolTabs from '../../components/tools/ToolTabs.astro';
import { conversions } from '../../lib/calculators/units';

const categories = Object.keys(conversions) as (keyof typeof conversions)[];
const tabs = categories.map((c) => ({ id: c, label: c.charAt(0).toUpperCase() + c.slice(1) }));
---
<BaseLayout title="Unit Conversions" description="Convert drilling-fluid units: bbl↔m³, SG↔ppg, pressure, temperature and more.">
  <section class="max-w-3xl mx-auto px-5 py-20">
    <SectionHeading eyebrow="Tools" title="Unit Conversions" sub="Select a category, choose a conversion, enter a value." />
    <div class="mt-10"><ToolTabs tabs={tabs} /></div>
    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      <label class="block">
        <span class="text-xs uppercase tracking-wide text-text-muted">Conversion</span>
        <select id="conversion-select" class="mt-1 w-full rounded-md border border-brass/20 bg-ink px-3 py-2 text-white"></select>
      </label>
      <label class="block">
        <span class="text-xs uppercase tracking-wide text-text-muted">Value</span>
        <input id="conversion-input" type="number" step="any" class="mt-1 w-full rounded-md border border-brass/20 bg-ink px-3 py-2 text-white" />
      </label>
    </div>
    <p id="conversion-result" class="mt-6 hidden rounded-xl border border-brass/20 bg-navy/60 p-5 text-lg font-semibold text-white"></p>
  </section>

  <script>
    import { conversions, convert } from '../../lib/calculators/units';
    type Cat = keyof typeof conversions;
    let active: Cat = 'length';
    const select = document.getElementById('conversion-select') as HTMLSelectElement;
    const input = document.getElementById('conversion-input') as HTMLInputElement;
    const result = document.getElementById('conversion-result') as HTMLElement;

    function populate(cat: Cat) {
      select.innerHTML = '';
      for (const p of conversions[cat]) {
        const o = document.createElement('option'); o.value = p.id; o.textContent = p.label; select.appendChild(o);
      }
    }
    function run() {
      const v = parseFloat(input.value);
      if (Number.isNaN(v)) { result.classList.add('hidden'); return; }
      const pair = conversions[active].find((p) => p.id === select.value)!;
      const out = convert(active, select.value, v);
      result.textContent = `${v} ${pair.from} = ${out.toFixed(4)} ${pair.to}`;
      result.classList.remove('hidden');
    }
    document.querySelectorAll<HTMLButtonElement>('.js-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.js-tab').forEach((b) => b.setAttribute('aria-selected', 'false'));
        btn.setAttribute('aria-selected', 'true');
        active = btn.dataset.tab as Cat;
        populate(active); input.value = ''; result.classList.add('hidden');
      });
    });
    select.addEventListener('change', run);
    input.addEventListener('input', run);
    populate(active);
  </script>
</BaseLayout>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS; `/tools/unit-conversions` generated.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`, open `/tools/unit-conversions`. Switch tabs, pick "Barrel (bbl) → Cubic Meter", enter 100 → expect `15.8987 m³`. Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/pages/tools/unit-conversions.astro
git commit -m "feat(tools): unit conversions page"
```

---

### Task 5: Mud calculations module + tests

**Files:**
- Create: `src/lib/calculators/mud.ts`
- Test: `src/lib/calculators/mud.test.ts`

**Interfaces:**
- Consumes: `CalcResult`, `fail` from `./types`.
- Produces: `bariteRequired`, `addKnownBarite`, `cutWeight`, `mixFluids`, `owrAdjust`, `slugCalc` — each `(input) => CalcResult`. Input shapes are defined inline in the module and re-used by the page.

- [ ] **Step 1: Write failing tests**

`src/lib/calculators/mud.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { bariteRequired, addKnownBarite, cutWeight, mixFluids, owrAdjust, slugCalc } from './mud';

const num = (r: { values: { label: string; value: string }[] }, label: string) =>
  parseFloat(r.values.find((v) => v.label.startsWith(label))!.value);

describe('mixFluids', () => {
  it('blends two fluids by mass', () => {
    const r = mixFluids({ fluids: [{ density: 1.2, volume: 100 }, { density: 1.5, volume: 50 }] });
    expect(r.ok).toBe(true);
    expect(num(r, 'Mixed')).toBeCloseTo(1.3, 4);     // (120+75)/150
    expect(num(r, 'Total')).toBeCloseTo(150, 4);
  });
  it('requires at least two fluids', () => {
    expect(mixFluids({ fluids: [{ density: 1.2, volume: 100 }] }).ok).toBe(false);
  });
});

describe('cutWeight (variable volume)', () => {
  it('computes dilution volume', () => {
    const r = cutWeight({ initialWeight: 1.5, volume: 100, desiredWeight: 1.3, dilutionDensity: 1.0, constantVolume: false });
    expect(r.ok).toBe(true);
    expect(num(r, 'Dilution')).toBeCloseTo(66.6667, 3);   // 100*(0.2)/(0.3)
    expect(num(r, 'Final Volume')).toBeCloseTo(166.6667, 3);
  });
  it('rejects desired >= initial', () => {
    expect(cutWeight({ initialWeight: 1.3, volume: 100, desiredWeight: 1.5, dilutionDensity: 1.0, constantVolume: false }).ok).toBe(false);
  });
});

describe('bariteRequired (variable volume)', () => {
  it('returns a positive tonnage and flags it pending verification', () => {
    const r = bariteRequired({ initialWeight: 1.2, desiredWeight: 1.5, volume: 100, constantVolume: false });
    expect(r.ok).toBe(true);
    expect(num(r, 'Barite')).toBeGreaterThan(0);
    expect(r.warnings?.some((w) => /verif/i.test(w))).toBe(true);
  });
  it('rejects desired <= initial', () => {
    expect(bariteRequired({ initialWeight: 1.5, desiredWeight: 1.2, volume: 100, constantVolume: false }).ok).toBe(false);
  });
});

describe('addKnownBarite', () => {
  it('increases mud weight', () => {
    const r = addKnownBarite({ initialWeight: 1.2, volume: 100, bariteAdded: 5 });
    expect(r.ok).toBe(true);
    expect(num(r, 'New Mud Weight')).toBeGreaterThan(1.2);
  });
});

describe('owrAdjust', () => {
  it('returns a result for a valid adjustment', () => {
    const r = owrAdjust({ currentOWR: 70, oilPercent: 70, volume: 100, desiredOWR: 80, density: 0.85 });
    expect(r.ok).toBe(true);
  });
});

describe('slugCalc', () => {
  it('returns a result and flags it pending ODS verification', () => {
    const r = slugCalc({ pipeLength: 100, mudWeight: 1.5, pipeCapacity: 0.0178, slugVolume: 20 });
    expect(r.ok).toBe(true);
    expect(r.warnings?.some((w) => /verif/i.test(w))).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/lib/calculators/mud.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

`src/lib/calculators/mud.ts` (formulas ported verbatim from legacy `js/mud-calculations.js`; see Global Constraints for the verification flags):

```ts
import { type CalcResult, fail } from './types';

const PPG_PER_SG = 8.33;
const BARITE_PPG = 35;
const BARITE_SG = 4.2;
const fixed = (n: number, d = 2) => n.toFixed(d);

export function bariteRequired(i: { initialWeight: number; desiredWeight: number; volume: number; constantVolume: boolean }): CalcResult {
  const { initialWeight, desiredWeight, volume, constantVolume } = i;
  if ([initialWeight, desiredWeight, volume].some(Number.isNaN)) return fail('Please fill in all fields.');
  if (desiredWeight <= initialWeight) return fail('Desired weight must be greater than initial weight.');
  const initialPPG = initialWeight * PPG_PER_SG;
  const desiredPPG = desiredWeight * PPG_PER_SG;
  let bariteTons: number, finalVolume: number;
  const notes: string[] = [];
  if (constantVolume) {
    const volumeToRemove = (volume * (desiredPPG - initialPPG)) / (BARITE_PPG - initialPPG);
    bariteTons = (volumeToRemove * BARITE_PPG * 42) / 2000;
    finalVolume = volume;
    notes.push('Constant volume: remove mud before adding barite.');
  } else {
    const sacks = (1470 * volume * (desiredPPG - initialPPG)) / (BARITE_PPG - desiredPPG);
    bariteTons = (sacks * 94) / 2000;
    finalVolume = volume + sacks / (94 * BARITE_SG);
  }
  return {
    ok: true,
    values: [
      { label: 'Barite Required', value: `${fixed(bariteTons)} tons` },
      { label: 'Final Mud Weight', value: `${fixed(desiredWeight)} sg (${fixed(desiredWeight * PPG_PER_SG)} ppg)` },
      { label: 'Final Volume', value: `${fixed(finalVolume)} bbl` },
    ],
    notes,
    warnings: ['Barite tonnage uses legacy sack/lb assumptions — pending ODS verification.'],
  };
}

export function addKnownBarite(i: { initialWeight: number; volume: number; bariteAdded: number }): CalcResult {
  const { initialWeight, volume, bariteAdded } = i;
  if ([initialWeight, volume, bariteAdded].some(Number.isNaN)) return fail('Please fill in all fields.');
  const initialPPG = initialWeight * PPG_PER_SG;
  const bariteBarrels = (bariteAdded * 2000) / (BARITE_PPG * 42);
  const newVolume = volume + bariteBarrels;
  const newPPG = (initialPPG * volume + BARITE_PPG * bariteBarrels) / newVolume;
  const newSG = newPPG / PPG_PER_SG;
  return {
    ok: true,
    values: [
      { label: 'New Mud Weight', value: `${fixed(newSG)} sg (${fixed(newPPG)} ppg)` },
      { label: 'Final Volume', value: `${fixed(newVolume)} bbl` },
      { label: 'Weight Increase', value: `${fixed(newSG - initialWeight)} sg` },
    ],
  };
}

export function cutWeight(i: { initialWeight: number; volume: number; desiredWeight: number; dilutionDensity: number; constantVolume: boolean }): CalcResult {
  const { initialWeight, volume, desiredWeight, dilutionDensity, constantVolume } = i;
  if ([initialWeight, volume, desiredWeight, dilutionDensity].some(Number.isNaN)) return fail('Please fill in all fields.');
  if (desiredWeight >= initialWeight) return fail('Desired weight must be less than initial weight for dilution.');
  if (dilutionDensity >= desiredWeight) return fail('Dilution fluid density should be less than desired weight.');
  let dilutionVolume: number, finalVolume: number;
  const notes: string[] = [];
  if (constantVolume) {
    dilutionVolume = (volume * (initialWeight - desiredWeight)) / (initialWeight - dilutionDensity);
    finalVolume = volume;
    notes.push(`Constant volume: remove ${fixed(dilutionVolume)} bbl of mud before adding dilution fluid.`);
  } else {
    dilutionVolume = (volume * (initialWeight - desiredWeight)) / (desiredWeight - dilutionDensity);
    finalVolume = volume + dilutionVolume;
  }
  return {
    ok: true,
    values: [
      { label: 'Dilution Fluid Required', value: `${fixed(dilutionVolume)} bbl` },
      { label: 'Final Mud Weight', value: `${fixed(desiredWeight)} sg` },
      { label: 'Final Volume', value: `${fixed(finalVolume)} bbl` },
    ],
    notes,
  };
}

export function mixFluids(i: { fluids: { density: number; volume: number }[] }): CalcResult {
  const valid = i.fluids.filter((f) => !Number.isNaN(f.density) && !Number.isNaN(f.volume) && f.volume > 0);
  if (valid.length < 2) return fail('Please provide at least two fluids (density and volume).');
  const totalVolume = valid.reduce((s, f) => s + f.volume, 0);
  const totalMass = valid.reduce((s, f) => s + f.density * f.volume, 0);
  const mixed = totalMass / totalVolume;
  return {
    ok: true,
    values: [
      { label: 'Mixed Mud Density', value: `${fixed(mixed)} sg (${fixed(mixed * PPG_PER_SG)} ppg)` },
      { label: 'Total Volume', value: `${fixed(totalVolume)} bbl` },
    ],
    notes: ['Mixed Density = Σ(Dᵢ×Vᵢ) / ΣVᵢ'],
  };
}

export function owrAdjust(i: { currentOWR: number; oilPercent: number; volume: number; desiredOWR: number; density: number }): CalcResult {
  const { currentOWR, oilPercent, volume, desiredOWR, density } = i;
  if ([currentOWR, oilPercent, volume, desiredOWR, density].some(Number.isNaN)) return fail('Please fill in all fields.');
  const currentOilVolume = (oilPercent / 100) * volume;
  const desiredTotalOil = (desiredOWR / (desiredOWR + 1)) * volume;
  const oilToAdd = desiredTotalOil - currentOilVolume;
  const newOilPct = (desiredOWR / (desiredOWR + 1)) * 100;
  if (oilToAdd > 0) {
    return {
      ok: true,
      values: [
        { label: 'Oil to Add', value: `${fixed(oilToAdd)} bbl` },
        { label: 'New OWR', value: `${fixed(desiredOWR)} (${fixed(newOilPct, 1)}% oil)` },
        { label: 'Final Volume', value: `${fixed(volume + oilToAdd)} bbl` },
      ],
    };
  }
  const waterToAdd = Math.abs(oilToAdd) * (1 / desiredOWR);
  return {
    ok: true,
    values: [
      { label: 'Water to Add', value: `${fixed(waterToAdd)} bbl` },
      { label: 'New OWR', value: `${fixed(desiredOWR)} (${fixed(newOilPct, 1)}% oil)` },
      { label: 'Final Volume', value: `${fixed(volume + waterToAdd)} bbl` },
    ],
  };
}

export function slugCalc(i: { pipeLength: number; mudWeight: number; pipeCapacity: number; slugVolume: number }): CalcResult {
  const { pipeLength, mudWeight, pipeCapacity, slugVolume } = i;
  if ([pipeLength, mudWeight, pipeCapacity, slugVolume].some(Number.isNaN)) return fail('Please fill in all fields.');
  // NOTE: legacy slug math is suspect (a no-op 8.33/8.33). This is a defensible
  // placeholder implementation; numbers must be confirmed by an ODS engineer.
  const slugWeight = mudWeight + (pipeLength * 0.052) / pipeCapacity;
  const volumeInPipe = pipeLength * pipeCapacity;
  return {
    ok: true,
    values: [
      { label: 'Required Slug Weight', value: `${fixed(slugWeight)} sg` },
      { label: 'Slug Volume in Pipe', value: `${fixed(volumeInPipe)} bbl` },
      { label: 'Dry Pipe Length', value: `${fixed(pipeLength)} m` },
    ],
    warnings: ['Slug formula is a provisional implementation — pending ODS engineer verification before field use.'],
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- src/lib/calculators/mud.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calculators/mud.ts src/lib/calculators/mud.test.ts
git commit -m "feat(tools): mud calculations module with tests (slug/barite flagged for verification)"
```

---

### Task 6: Mud calculations page

**Files:**
- Create: `src/pages/tools/mud-calculations.astro`

**Interfaces:**
- Consumes: mud functions, `ToolTabs`, `ResultPanel`, `window.renderResult`.

- [ ] **Step 1: Build the page**

`src/pages/tools/mud-calculations.astro`. Six tab panels, one per calculator; each has a form whose fields map to the function inputs. Use `ResultPanel` per calculator. Pattern below shows the structure; replicate for all six panels.

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import SectionHeading from '../../components/SectionHeading.astro';
import ToolTabs from '../../components/tools/ToolTabs.astro';
import ResultPanel from '../../components/tools/ResultPanel.astro';
const tabs = [
  { id: 'barite-required', label: 'Barite Required' },
  { id: 'add-known-barite', label: 'Add Known Barite' },
  { id: 'cut-weight', label: 'Cut Weight' },
  { id: 'mix-fluids', label: 'Mix Fluids' },
  { id: 'owr-adjust', label: 'OWR Adjust' },
  { id: 'slug', label: 'Slug' },
];
const field = 'mt-1 w-full rounded-md border border-brass/20 bg-ink px-3 py-2 text-white';
const lbl = 'block text-sm'; const cap = 'text-xs uppercase tracking-wide text-text-muted';
---
<BaseLayout title="Mud Calculations" description="Barite weight-up, dilution, fluid mixing, OWR adjustment and slug design calculators.">
  <section class="max-w-3xl mx-auto px-5 py-20">
    <SectionHeading eyebrow="Tools" title="Mud Calculations" sub="Choose a calculation, enter the parameters, and calculate." />
    <div class="mt-10"><ToolTabs tabs={tabs} /></div>

    <!-- Barite Required -->
    <div data-panel="barite-required" class="js-panel mt-8">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class={lbl}><span class={cap}>Initial Weight (sg)</span><input id="br-initial" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Desired Weight (sg)</span><input id="br-desired" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Volume (bbl)</span><input id="br-volume" type="number" step="any" class={field} /></label>
        <label class="flex items-center gap-2 text-sm mt-6"><input id="br-constant" type="checkbox" /> Constant volume</label>
      </div>
      <button data-calc="barite-required" class="js-run mt-4 rounded-md bg-brass px-5 py-2 font-semibold text-ink hover:bg-brass-soft">Calculate</button>
      <ResultPanel id="br-result" />
    </div>

    <!-- Add Known Barite -->
    <div data-panel="add-known-barite" class="js-panel mt-8 hidden">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class={lbl}><span class={cap}>Initial Weight (sg)</span><input id="akb-initial" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Volume (bbl)</span><input id="akb-volume" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Barite Added (tons)</span><input id="akb-barite" type="number" step="any" class={field} /></label>
      </div>
      <button data-calc="add-known-barite" class="js-run mt-4 rounded-md bg-brass px-5 py-2 font-semibold text-ink hover:bg-brass-soft">Calculate</button>
      <ResultPanel id="akb-result" />
    </div>

    <!-- Cut Weight -->
    <div data-panel="cut-weight" class="js-panel mt-8 hidden">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class={lbl}><span class={cap}>Initial Weight (sg)</span><input id="cw-initial" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Volume (bbl)</span><input id="cw-volume" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Desired Weight (sg)</span><input id="cw-desired" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Dilution Density (sg)</span><input id="cw-dilution" type="number" step="any" class={field} /></label>
        <label class="flex items-center gap-2 text-sm mt-6"><input id="cw-constant" type="checkbox" /> Constant volume</label>
      </div>
      <button data-calc="cut-weight" class="js-run mt-4 rounded-md bg-brass px-5 py-2 font-semibold text-ink hover:bg-brass-soft">Calculate</button>
      <ResultPanel id="cw-result" />
    </div>

    <!-- Mix Fluids -->
    <div data-panel="mix-fluids" class="js-panel mt-8 hidden">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class={lbl}><span class={cap}>Density 1 (sg)</span><input id="mf-d1" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Volume 1 (bbl)</span><input id="mf-v1" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Density 2 (sg)</span><input id="mf-d2" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Volume 2 (bbl)</span><input id="mf-v2" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Density 3 (sg, optional)</span><input id="mf-d3" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Volume 3 (bbl, optional)</span><input id="mf-v3" type="number" step="any" class={field} /></label>
      </div>
      <button data-calc="mix-fluids" class="js-run mt-4 rounded-md bg-brass px-5 py-2 font-semibold text-ink hover:bg-brass-soft">Calculate</button>
      <ResultPanel id="mf-result" />
    </div>

    <!-- OWR Adjust -->
    <div data-panel="owr-adjust" class="js-panel mt-8 hidden">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class={lbl}><span class={cap}>Current OWR</span><input id="owr-current" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Oil %</span><input id="owr-percent" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Volume (bbl)</span><input id="owr-volume" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Desired OWR</span><input id="owr-desired" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Oil Density (sg)</span><input id="owr-density" type="number" step="any" class={field} /></label>
      </div>
      <button data-calc="owr-adjust" class="js-run mt-4 rounded-md bg-brass px-5 py-2 font-semibold text-ink hover:bg-brass-soft">Calculate</button>
      <ResultPanel id="owr-result" />
    </div>

    <!-- Slug -->
    <div data-panel="slug" class="js-panel mt-8 hidden">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class={lbl}><span class={cap}>Pipe Length (m)</span><input id="slug-length" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Mud Weight (sg)</span><input id="slug-weight" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Pipe Capacity (bbl/m)</span><input id="slug-capacity" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Slug Volume (bbl)</span><input id="slug-volume" type="number" step="any" class={field} /></label>
      </div>
      <button data-calc="slug" class="js-run mt-4 rounded-md bg-brass px-5 py-2 font-semibold text-ink hover:bg-brass-soft">Calculate</button>
      <ResultPanel id="slug-result" />
    </div>
  </section>

  <script>
    import { bariteRequired, addKnownBarite, cutWeight, mixFluids, owrAdjust, slugCalc } from '../../lib/calculators/mud';
    const n = (id: string) => parseFloat((document.getElementById(id) as HTMLInputElement).value);
    const chk = (id: string) => (document.getElementById(id) as HTMLInputElement).checked;

    document.querySelectorAll<HTMLButtonElement>('.js-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.js-tab').forEach((b) => b.setAttribute('aria-selected', 'false'));
        btn.setAttribute('aria-selected', 'true');
        const id = btn.dataset.tab;
        document.querySelectorAll<HTMLElement>('.js-panel').forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== id));
      });
    });

    const handlers: Record<string, () => any> = {
      'barite-required': () => bariteRequired({ initialWeight: n('br-initial'), desiredWeight: n('br-desired'), volume: n('br-volume'), constantVolume: chk('br-constant') }),
      'add-known-barite': () => addKnownBarite({ initialWeight: n('akb-initial'), volume: n('akb-volume'), bariteAdded: n('akb-barite') }),
      'cut-weight': () => cutWeight({ initialWeight: n('cw-initial'), volume: n('cw-volume'), desiredWeight: n('cw-desired'), dilutionDensity: n('cw-dilution'), constantVolume: chk('cw-constant') }),
      'mix-fluids': () => mixFluids({ fluids: [{ density: n('mf-d1'), volume: n('mf-v1') }, { density: n('mf-d2'), volume: n('mf-v2') }, { density: n('mf-d3'), volume: n('mf-v3') }] }),
      'owr-adjust': () => owrAdjust({ currentOWR: n('owr-current'), oilPercent: n('owr-percent'), volume: n('owr-volume'), desiredOWR: n('owr-desired'), density: n('owr-density') }),
      'slug': () => slugCalc({ pipeLength: n('slug-length'), mudWeight: n('slug-weight'), pipeCapacity: n('slug-capacity'), slugVolume: n('slug-volume') }),
    };
    const resultIds: Record<string, string> = {
      'barite-required': 'br-result', 'add-known-barite': 'akb-result', 'cut-weight': 'cw-result',
      'mix-fluids': 'mf-result', 'owr-adjust': 'owr-result', 'slug': 'slug-result',
    };
    document.querySelectorAll<HTMLButtonElement>('.js-run').forEach((btn) => {
      btn.addEventListener('click', () => {
        const calc = btn.dataset.calc!;
        (window as any).renderResult(resultIds[calc], handlers[calc]());
      });
    });
  </script>
</BaseLayout>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Manual smoke test**

`npm run dev` → `/tools/mud-calculations`. On "Mix Fluids", enter D1=1.2 V1=100, D2=1.5 V2=50 → expect Mixed Density `1.30 sg`. Switch to "Slug" → confirm the verification warning appears. Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/pages/tools/mud-calculations.astro
git commit -m "feat(tools): mud calculations page"
```

---

### Task 7: System treatment module + tests

**Files:**
- Create: `src/lib/calculators/treatment.ts`
- Test: `src/lib/calculators/treatment.test.ts`

**Interfaces:**
- Consumes: `CalcResult`, `fail` from `./types`.
- Produces: `addLightPremix`, `maintainConcentration`, `CONTAINERS`.

- [ ] **Step 1: Write failing tests**

`src/lib/calculators/treatment.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { addLightPremix, maintainConcentration } from './treatment';

const num = (r: { values: { label: string; value: string }[] }, label: string) =>
  parseFloat(r.values.find((v) => v.label.startsWith(label))!.value);

describe('addLightPremix', () => {
  it('computes premix volume and circulation time', () => {
    const r = addLightPremix({ volume: 500, pumpRate: 400, currentWeight: 1.5, desiredWeight: 1.3, premixDensity: 1.0 });
    expect(r.ok).toBe(true);
    expect(num(r, 'Premix Volume')).toBeCloseTo(333.33, 1);   // 500*0.2/0.3
    expect(num(r, 'Circulation Time')).toBeCloseTo(52.5, 1);   // 500/(400/42)
  });
  it('rejects desired >= current', () => {
    expect(addLightPremix({ volume: 500, pumpRate: 400, currentWeight: 1.3, desiredWeight: 1.5, premixDensity: 1.0 }).ok).toBe(false);
  });
});

describe('maintainConcentration', () => {
  it('computes number of containers', () => {
    const r = maintainConcentration({ volume: 500, pumpRate: 400, containerType: 'sack-25', customCapacity: NaN, chemicalDensity: 1.0, currentConcentration: 2, desiredConcentration: 5 });
    expect(r.ok).toBe(true);
    expect(num(r, 'Containers')).toBeCloseTo(27.22, 1);   // 3*500*0.453592/25
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/lib/calculators/treatment.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

`src/lib/calculators/treatment.ts` (ported from legacy `js/system-treatment.js`):

```ts
import { type CalcResult, fail } from './types';

const LB_PER_KG = 0.453592;
const GAL_PER_BBL = 42;
const fixed = (n: number, d = 2) => n.toFixed(d);

export const CONTAINERS = [
  { id: 'sack-25', label: '25 kg Sack' },
  { id: 'drum-55', label: '55 gal Drum' },
  { id: 'ibc-1000', label: '1000 L IBC' },
  { id: 'can-30', label: '30 L Can' },
] as const;

export function addLightPremix(i: { volume: number; pumpRate: number; currentWeight: number; desiredWeight: number; premixDensity: number }): CalcResult {
  const { volume, pumpRate, currentWeight, desiredWeight, premixDensity } = i;
  if ([volume, pumpRate, currentWeight, desiredWeight, premixDensity].some(Number.isNaN)) return fail('Please fill in all fields.');
  if (desiredWeight >= currentWeight) return fail('Desired weight must be less than current weight.');
  if (premixDensity >= desiredWeight) return fail('Premix density should be less than desired weight.');
  const premixVolume = (volume * (currentWeight - desiredWeight)) / (desiredWeight - premixDensity);
  const circulationTime = volume / (pumpRate / GAL_PER_BBL);
  const dilutionRate = premixVolume / circulationTime;
  return {
    ok: true,
    values: [
      { label: 'Premix Volume', value: `${fixed(premixVolume, 1)} bbl` },
      { label: 'Dilution Rate', value: `${fixed(dilutionRate)} bbl/min` },
      { label: 'Circulation Time', value: `${fixed(circulationTime, 1)} min` },
      { label: 'Divert to Reserve', value: `${fixed(premixVolume, 1)} bbl` },
    ],
  };
}

export function maintainConcentration(i: { volume: number; pumpRate: number; containerType: string; customCapacity: number; chemicalDensity: number; currentConcentration: number; desiredConcentration: number }): CalcResult {
  const { volume, pumpRate, containerType, customCapacity, chemicalDensity, currentConcentration, desiredConcentration } = i;
  if ([volume, pumpRate, chemicalDensity, currentConcentration, desiredConcentration].some(Number.isNaN)) return fail('Please fill in all required fields.');
  const capacities: Record<string, number> = {
    'sack-25': 25,
    'drum-55': 55 * 3.78541 * chemicalDensity,
    'ibc-1000': 1000 * chemicalDensity,
    'can-30': 30 * chemicalDensity,
  };
  const capacity = !Number.isNaN(customCapacity) && customCapacity > 0 ? customCapacity : capacities[containerType];
  const chemicalKg = (desiredConcentration - currentConcentration) * volume * LB_PER_KG;
  const containers = chemicalKg / capacity;
  const circulationTime = volume / (pumpRate / GAL_PER_BBL);
  const additionRate = containers / circulationTime;
  const label = CONTAINERS.find((c) => c.id === containerType)?.label ?? 'container';
  return {
    ok: true,
    values: [
      { label: 'Containers', value: `${fixed(containers, 1)} × ${label}` },
      { label: 'Addition Rate', value: `${fixed(additionRate)} per min` },
      { label: 'Circulation Time', value: `${fixed(circulationTime, 1)} min` },
    ],
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- src/lib/calculators/treatment.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calculators/treatment.ts src/lib/calculators/treatment.test.ts
git commit -m "feat(tools): system treatment module with tests"
```

---

### Task 8: System treatment page

**Files:**
- Create: `src/pages/tools/system-treatment.astro`

**Interfaces:**
- Consumes: `addLightPremix`, `maintainConcentration`, `CONTAINERS`, `ToolTabs`, `ResultPanel`, `window.renderResult`.

- [ ] **Step 1: Build the page**

`src/pages/tools/system-treatment.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import SectionHeading from '../../components/SectionHeading.astro';
import ToolTabs from '../../components/tools/ToolTabs.astro';
import ResultPanel from '../../components/tools/ResultPanel.astro';
import { CONTAINERS } from '../../lib/calculators/treatment';
const tabs = [
  { id: 'add-light-premix', label: 'Add Light Premix' },
  { id: 'maintain-concentration', label: 'Maintain Concentration' },
];
const field = 'mt-1 w-full rounded-md border border-brass/20 bg-ink px-3 py-2 text-white';
const lbl = 'block text-sm'; const cap = 'text-xs uppercase tracking-wide text-text-muted';
---
<BaseLayout title="System Treatment" description="Add light premix and maintain chemical concentration in the active drilling-fluid system.">
  <section class="max-w-3xl mx-auto px-5 py-20">
    <SectionHeading eyebrow="Tools" title="System Treatment" sub="Plan dilution and chemical maintenance for the active system." />
    <div class="mt-10"><ToolTabs tabs={tabs} /></div>

    <div data-panel="add-light-premix" class="js-panel mt-8">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class={lbl}><span class={cap}>System Volume (bbl)</span><input id="alp-volume" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Pump Rate (gpm)</span><input id="alp-pump" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Current Weight (sg)</span><input id="alp-current" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Desired Weight (sg)</span><input id="alp-desired" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Premix Density (sg)</span><input id="alp-premix" type="number" step="any" class={field} /></label>
      </div>
      <button data-calc="add-light-premix" class="js-run mt-4 rounded-md bg-brass px-5 py-2 font-semibold text-ink hover:bg-brass-soft">Calculate</button>
      <ResultPanel id="alp-result" />
    </div>

    <div data-panel="maintain-concentration" class="js-panel mt-8 hidden">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class={lbl}><span class={cap}>System Volume (bbl)</span><input id="mc-volume" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Pump Rate (gpm)</span><input id="mc-pump" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Container Type</span>
          <select id="mc-container" class={field}>{CONTAINERS.map((c) => <option value={c.id}>{c.label}</option>)}</select>
        </label>
        <label class={lbl}><span class={cap}>Custom Capacity (kg, optional)</span><input id="mc-custom" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Chemical Density (sg)</span><input id="mc-density" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Current Concentration (lb/bbl)</span><input id="mc-current" type="number" step="any" class={field} /></label>
        <label class={lbl}><span class={cap}>Desired Concentration (lb/bbl)</span><input id="mc-desired" type="number" step="any" class={field} /></label>
      </div>
      <button data-calc="maintain-concentration" class="js-run mt-4 rounded-md bg-brass px-5 py-2 font-semibold text-ink hover:bg-brass-soft">Calculate</button>
      <ResultPanel id="mc-result" />
    </div>
  </section>

  <script>
    import { addLightPremix, maintainConcentration } from '../../lib/calculators/treatment';
    const n = (id: string) => parseFloat((document.getElementById(id) as HTMLInputElement).value);
    const val = (id: string) => (document.getElementById(id) as HTMLInputElement).value;

    document.querySelectorAll<HTMLButtonElement>('.js-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.js-tab').forEach((b) => b.setAttribute('aria-selected', 'false'));
        btn.setAttribute('aria-selected', 'true');
        const id = btn.dataset.tab;
        document.querySelectorAll<HTMLElement>('.js-panel').forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== id));
      });
    });

    const handlers: Record<string, () => any> = {
      'add-light-premix': () => addLightPremix({ volume: n('alp-volume'), pumpRate: n('alp-pump'), currentWeight: n('alp-current'), desiredWeight: n('alp-desired'), premixDensity: n('alp-premix') }),
      'maintain-concentration': () => maintainConcentration({ volume: n('mc-volume'), pumpRate: n('mc-pump'), containerType: val('mc-container'), customCapacity: n('mc-custom'), chemicalDensity: n('mc-density'), currentConcentration: n('mc-current'), desiredConcentration: n('mc-desired') }),
    };
    const resultIds: Record<string, string> = { 'add-light-premix': 'alp-result', 'maintain-concentration': 'mc-result' };
    document.querySelectorAll<HTMLButtonElement>('.js-run').forEach((btn) => {
      btn.addEventListener('click', () => { const c = btn.dataset.calc!; (window as any).renderResult(resultIds[c], handlers[c]()); });
    });
  </script>
</BaseLayout>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Manual smoke test**

`npm run dev` → `/tools/system-treatment`. Add Light Premix: vol 500, pump 400, current 1.5, desired 1.3, premix 1.0 → expect Premix Volume `333.3 bbl`, Circulation Time `52.5 min`. Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/pages/tools/system-treatment.astro
git commit -m "feat(tools): system treatment page"
```

---

### Task 9: Lab procedures content + pages

**Files:**
- Create: `src/content/procedures/*.md` (16 files)
- Create: `src/pages/tools/lab-procedures/index.astro`
- Create: `src/pages/tools/lab-procedures/[slug].astro`

**Interfaces:**
- Consumes: `procedures` collection (Task 1).

**Source:** legacy `~/Desktop/oilmen/pages/lab-procedures.html` — each procedure is a `*-content` block. Transcribe its heading/steps into markdown bodies. Use these exact filenames, categories, and order:

| # | filename | title | category |
|---|---|---|---|
| 1 | `mud-weight.md` | Mud Weight (Density) | mud-properties |
| 2 | `marsh-funnel.md` | Marsh Funnel Viscosity | rheology |
| 3 | `rheology.md` | Rheology (Viscometer) | rheology |
| 4 | `api-filtration.md` | API Filtration | filtration |
| 5 | `hpht-filtration.md` | HPHT Filtration | filtration |
| 6 | `retort.md` | Retort (Oil/Water/Solids) | solids |
| 7 | `emulsion-stability.md` | Emulsion Stability (ES) | chemical |
| 8 | `ph.md` | pH & Alkalinity | chemical |
| 9 | `cation-exchange.md` | Cation Exchange (MBT) | chemical |
| 10 | `sand-content.md` | Sand Content | solids |
| 11 | `production-screen.md` | Production Screen Test | solids |
| 12 | `permeability-plugging.md` | Permeability Plugging (PPT) | filtration |
| 13 | `ppt-slot.md` | PPT Slotted Disc | filtration |
| 14 | `ultracap.md` | UltraCap Capsule Test | chemical |
| 15 | `ultrahib.md` | UltraHib Inhibition Test | chemical |
| 16 | `dry-sieve.md` | Dry Sieve Analysis | solids |

- [ ] **Step 1: Read the legacy source**

Read `~/Desktop/oilmen/pages/lab-procedures.html` and locate each `*-content` block listed in the legacy `procedureMap` (`mud-weight-content`, `marsh-funnel-content`, etc.).

- [ ] **Step 2: Create one fully-worked example file**

Create `src/content/procedures/mud-weight.md` using the legacy `mud-weight-content` text, in the `_template.md` format:

```markdown
---
title: Mud Weight (Density)
category: mud-properties
order: 1
summary: Measure drilling-fluid density with a calibrated mud balance.
---

## Purpose

Determine the density (weight) of the drilling fluid, the primary control on hydrostatic pressure.

## Equipment

- Mud balance with cup and lid
- Calibration fluid (fresh water)

## Procedure

1. Fill the clean, dry cup with the mud sample to the brim.
2. Seat the lid with a twisting motion; wipe off displaced mud.
3. Place the knife edge on the fulcrum and slide the rider until balanced.
4. Read the density at the rider's edge.

## Notes

Calibrate with fresh water (8.33 ppg / 1.00 sg) before use. Report in sg and ppg.
```

> If the legacy block contains richer/different text, prefer the legacy content — this file's structure is the contract; its wording comes from the source.

- [ ] **Step 3: Create the remaining 15 files**

For each remaining row in the table, create `src/content/procedures/<filename>` with frontmatter (title/category/order from the table, a one-line `summary`) and a markdown body transcribed from the matching legacy `*-content` block, following the same section structure as Step 2.

- [ ] **Step 4: Build the index page**

`src/pages/tools/lab-procedures/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import SectionHeading from '../../../components/SectionHeading.astro';
const procedures = (await getCollection('procedures')).sort((a, b) => a.data.order - b.data.order);
const categories = [...new Set(procedures.map((p) => p.data.category))].sort();
---
<BaseLayout title="Lab Procedures" description="Reference sheets for standard drilling-fluid laboratory tests.">
  <section class="max-w-5xl mx-auto px-5 py-20">
    <SectionHeading eyebrow="Tools" title="Lab Procedures" sub="Standard drilling-fluid laboratory test references." />
    <div class="mt-8 flex flex-wrap gap-2">
      <button type="button" data-filter="all" class="js-filter rounded-md border border-brass/20 px-3 py-1.5 text-sm text-text-light aria-pressed:bg-brass aria-pressed:text-ink" aria-pressed="true">All</button>
      {categories.map((c) => (
        <button type="button" data-filter={c} class="js-filter rounded-md border border-brass/20 px-3 py-1.5 text-sm text-text-light aria-pressed:bg-brass aria-pressed:text-ink" aria-pressed="false">{c.replace('-', ' ')}</button>
      ))}
    </div>
    <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {procedures.map((p) => (
        <a href={`/tools/lab-procedures/${p.id}`} data-cat={p.data.category}
           class="js-card block rounded-xl border border-brass/15 bg-navy/60 p-5 hover:border-brass/50 transition-colors">
          <div class="text-xs uppercase tracking-wide text-brass">{p.data.category.replace('-', ' ')}</div>
          <h3 class="mt-2 font-semibold text-white">{p.data.title}</h3>
          <p class="mt-1 text-sm text-text-muted">{p.data.summary}</p>
        </a>
      ))}
    </div>
  </section>
  <script>
    const filters = document.querySelectorAll<HTMLButtonElement>('.js-filter');
    const cards = document.querySelectorAll<HTMLElement>('.js-card');
    filters.forEach((f) => f.addEventListener('click', () => {
      filters.forEach((b) => b.setAttribute('aria-pressed', 'false'));
      f.setAttribute('aria-pressed', 'true');
      const want = f.dataset.filter;
      cards.forEach((c) => c.classList.toggle('hidden', want !== 'all' && c.dataset.cat !== want));
    }));
  </script>
</BaseLayout>
```

- [ ] **Step 5: Build the detail page**

`src/pages/tools/lab-procedures/[slug].astro`:

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';
export async function getStaticPaths() {
  const procedures = await getCollection('procedures');
  return procedures.map((p) => ({ params: { slug: p.id }, props: { procedure: p } }));
}
const { procedure } = Astro.props;
const { Content } = await render(procedure);
---
<BaseLayout title={procedure.data.title} description={procedure.data.summary}>
  <section class="max-w-3xl mx-auto px-5 py-20">
    <a href="/tools/lab-procedures" class="text-sm text-brass hover:text-brass-soft">← All procedures</a>
    <div class="mt-3 text-xs uppercase tracking-wide text-brass">{procedure.data.category.replace('-', ' ')}</div>
    <h1 class="mt-2 text-3xl md:text-4xl font-bold">{procedure.data.title}</h1>
    <div class="prose-tools mt-8 space-y-4 text-text-light [&_h2]:font-display [&_h2]:text-white [&_h2]:text-xl [&_h2]:mt-6 [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-5 [&_ul]:pl-5">
      <Content />
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: PASS; 16 procedure pages + index generated.

- [ ] **Step 7: Manual smoke test**

`npm run dev` → `/tools/lab-procedures`. Filter by a category; open a procedure; confirm body renders. Stop server.

- [ ] **Step 8: Commit**

```bash
git add src/content/procedures src/pages/tools/lab-procedures
git commit -m "feat(tools): lab procedures content collection and pages"
```

---

### Task 10: Product datasheets catalog

**Files:**
- Create: `public/datasheets/README.md`
- Create: `src/content/products/*.md` (15 files)
- Create: `src/pages/tools/products/index.astro`

**Interfaces:**
- Consumes: `products` collection (Task 1).

**Source:** legacy `~/Desktop/oilmen/js/product-data.js` `productPDFs` keys give the product slugs. The legacy `pages/product-data.html` cards give display names. Build catalog entries with `datasheet` **omitted** (PDFs not yet available).

- [ ] **Step 1: Create the datasheets folder README**

`public/datasheets/README.md`:

```markdown
# Product Datasheets

Drop product datasheet PDFs in this folder, then reference them from the matching
product file in `src/content/products/<slug>.md` by uncommenting and setting:

    datasheet: /datasheets/<filename>.pdf

Until a `datasheet:` path is set, the product shows "Datasheet coming soon" and the
link is disabled. Use lowercase, hyphenated filenames matching the product slug
(e.g. `lime.pdf`, `caustic-soda.pdf`).
```

- [ ] **Step 2: Create the 15 product files**

For each legacy `productPDFs` key, create `src/content/products/<key>.md`. Use the display name from the legacy product card, a sensible `category`, ascending `order`, and **no `datasheet` field**. Example `src/content/products/lime.md`:

```markdown
---
name: Lime
category: alkalinity
order: 1
# datasheet: /datasheets/lime.pdf   # uncomment once the PDF is uploaded
---

Calcium hydroxide used for alkalinity and lime-mud systems.
```

Create the remaining 14 from these keys (name them from the legacy cards; pick a category per product): `safe-break-mp`, `amylose-b`, `asphosol`, `bicarb`, `safe-solv-oe`, `safe-surf-we`, `cabromide`, `calcium-chloride`, `calcium-chloride-brine`, `caustic-soda`, `celpol-sl`, `cmc-ehv`, `driscal-d`, `graphite`.

- [ ] **Step 3: Build the catalog page**

`src/pages/tools/products/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import SectionHeading from '../../../components/SectionHeading.astro';
const products = (await getCollection('products')).sort((a, b) => a.data.order - b.data.order);
---
<BaseLayout title="Product Datasheets" description="Searchable catalog of ODS drilling-fluid products and datasheets.">
  <section class="max-w-5xl mx-auto px-5 py-20">
    <SectionHeading eyebrow="Tools" title="Product Datasheets" sub="Search the drilling-fluid product catalog." />
    <input id="product-search" type="search" placeholder="Search products…"
      class="mt-8 w-full rounded-md border border-brass/20 bg-ink px-4 py-2 text-white" />
    <div id="product-grid" class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <div class="js-product rounded-xl border border-brass/15 bg-navy/60 p-5" data-name={p.data.name}>
          <div class="text-xs uppercase tracking-wide text-brass">{p.data.category}</div>
          <h3 class="js-product-name mt-2 font-semibold text-white">{p.data.name}</h3>
          {p.data.datasheet
            ? <a href={p.data.datasheet} target="_blank" rel="noopener" class="mt-3 inline-block text-sm font-medium text-brass hover:text-brass-soft">View datasheet →</a>
            : <span class="mt-3 inline-block text-sm text-text-muted">Datasheet coming soon</span>}
        </div>
      ))}
    </div>
    <p id="product-empty" class="mt-8 hidden text-text-muted">No products match your search.</p>
  </section>
  <script>
    const search = document.getElementById('product-search') as HTMLInputElement;
    const cards = document.querySelectorAll<HTMLElement>('.js-product');
    const empty = document.getElementById('product-empty') as HTMLElement;
    const norm = (s: string) => s.toLowerCase().replace(/[-\s]/g, '');
    search.addEventListener('input', () => {
      const q = norm(search.value.trim());
      let visible = 0;
      cards.forEach((c) => {
        const match = norm(c.dataset.name || '').includes(q);
        c.classList.toggle('hidden', !match);
        if (match) visible++;
      });
      empty.classList.toggle('hidden', visible !== 0);
    });
  </script>
</BaseLayout>
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: PASS; `/tools/products` generated.

- [ ] **Step 5: Manual smoke test**

`npm run dev` → `/tools/products`. Type "caustic" → only Caustic Soda shows. Type "xyz" → empty message. Confirm "Datasheet coming soon" on cards. Stop server.

- [ ] **Step 6: Commit**

```bash
git add public/datasheets src/content/products src/pages/tools/products
git commit -m "feat(tools): product datasheet catalog with PDF slot for later uploads"
```

---

### Task 11: Final integration & verification

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `npm run test`
Expected: PASS — all calculator + schema tests green.

- [ ] **Step 2: Full build**

Run: `npm run build`
Expected: PASS — all `/tools/*` routes present in `dist/`.

- [ ] **Step 3: Astro type check**

Run: `npm run check`
Expected: no errors in new files.

- [ ] **Step 4: Nav & cross-link smoke test**

`npm run dev`. From the homepage, click `Tools` in the nav → hub shows 5 cards → each card opens its page. Confirm the verification warnings render on the slug calculator. Stop server.

- [ ] **Step 5: Final commit (if any cleanup was needed)**

```bash
git add -A
git commit -m "chore(tools): final verification pass for engineering tools migration"
```

---

## Self-Review Notes

- **Spec coverage:** §3.1 URLs → Tasks 2,4,6,8,9,10. §3.2 layout → all tasks. §3.3 collections → Task 1. §3.4/§3.5 interactivity & result contract → Task 2 (types/ResultPanel) + calc tasks. §4.1–4.5 per-tool → Tasks 3–10. §5 verification → Tasks 3,5 (flags + warnings), Task 11 (full suite). §6 design → reused tokens throughout. §7 out-of-scope → nothing built for toggle/animation/feedback/copyright.
- **Type consistency:** `CalcResult`/`CalcValue`/`fail` defined in Task 2, consumed identically in Tasks 3/5/7; `window.renderResult` defined in Task 2's ResultPanel, called in Tasks 6/8; container ids in `CONTAINERS` (Task 7) match the page select (Task 8).
- **Open item carried into implementation:** procedure summaries and product display names/categories come from legacy source text read during Tasks 9/10 (content transcription, not invented logic).
