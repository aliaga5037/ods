# ODS Website — Design Specification

**Date:** 2026-06-15
**Project:** Marketing/credibility website for ODS (Oilmen Drilling Services)
**Status:** Approved design — ready for implementation planning

---

## 1. Overview

ODS (Oilmen Drilling Services) is an engineering-driven company providing drilling
& completion fluids engineering, consultancy, and specialist manpower for onshore
and offshore drilling projects. The website must position ODS as an **independent
expert engineering consultancy** — not a chemical-product vendor.

Guiding principle: **Engineering Consultancy First → Fluid Services Second.**
A visitor should first conclude "these are expert engineers and consultants," and
only second "they can also supply materials and field services."

Reference companies for tone/structure: ADNOC Drilling Integrated Services, Wood plc,
Petrofac, RPS Group, Exceed Energy. Visual reference: SLB, Newpark Fluid Systems.

Brand tagline (from existing brochure): *"Engineered Solutions. Proven in the Field."*

## 2. Decisions (locked)

| Decision | Choice |
|---|---|
| Languages | **English only** (extensible later) |
| Content editing | **Markdown / data files in repo**, developer-maintained |
| Hosting | **Static deploy to Vercel / Netlify** (CDN, auto HTTPS, deploy on git push) |
| Tech stack | **Astro + Tailwind CSS + TypeScript** |
| Color palette | **"Midnight Brass"** |
| Homepage hero | **Cinematic full-bleed banner** |

## 3. Positioning & key messaging

- **Headline:** Independent Drilling Fluids Consultancy & Wellsite Engineering
- **Sub-headline:** Expert mud engineering, drilling-fluids optimization, solids-control
  advisory and operational support for oil & gas operators worldwide.
- **Why ODS:** Independent consultancy · Experienced field engineers · Cost optimization ·
  Operational risk reduction · International project experience · API/OFITE-certified.

## 4. Information architecture (site map)

| Page | Purpose / contents |
|---|---|
| **Home** | Cinematic hero → positioning statement → services grid (icons) → proof stats bar → featured projects → operators/clients logos → insights teaser → contact CTA |
| **About** | Company story; mission & vision; approach (real-time engineering decisions, practical field experience, risk-based operational planning, performance-driven execution); certifications (ISO 9001:2015, 14001:2015, 45001:2018; API Spec Q2 targeted 2026); API-certified engineers & OFITE lab capability |
| **Services** | Overview page + 6 service detail sections (see §5) |
| **Projects** | Track-record grid, filterable by operator; individual case-study detail pages |
| **Insights** | Technical blog — articles & conference papers, markdown-authored |
| **Contact** | Baku office, phone, email, WhatsApp, inquiry form |

Primary nav: About · Services · Projects · Insights · Contact.

## 5. Services (6)

1. **Mud Engineering Consultancy** — field engineering execution, supervision, real-time
   decision-making.
2. **Drilling & Completion Fluids Program Design** — WBM, OBM, clear brine systems
   (NaCl, CaCl₂, CaBr₂), inhibition/shale stability, filtration & solids-free completion
   fluids, fluid compatibility & formation-damage prevention.
3. **Solids Control Optimization** — shale shaker/desander/desilter optimization, fine
   solids control & dilution strategies, mud conditioning, equipment integration support.
4. **Waste Management Advisory** — waste/dilution strategy, mud utilization, reservoir
   protection.
5. **Laboratory Testing, Maintenance & Calibration** — OFITE-certified lab equipment
   maintenance/repair, calibration & certification, testing and on-site fluid management.
6. **Wellsite Mud Engineers & Manpower** — specialist engineering manpower for onshore
   and offshore campaigns.

Folded-in capabilities (shown on Services/About, not standalone pages): hydraulic
simulation & modeling, hole-cleaning optimization, narrow-margin PPFG support,
procurement & supply-chain coordination, training & technical audits.

## 6. Seed content (from ODS brochure + business/technical presentation)

- **Proof stats:** 40+ wells delivered · 9 parallel projects (CDF framework) · 6+
  operators served · API-certified engineers. (Final figures to be confirmed with ODS.)
- **Operators / clients:** SOCAR (CDWT), Azorel LLC, GL TOC / GL Group, GLOLYNX,
  DH (Demirören Holding / Neft Servis), Azeri-MI / **BP** (ACG, Shah Deniz, Babek, Bulla),
  Swire Energy Services, CDF.
- **Flagship case studies:**
  - Garadagh #609 — freed stuck pipe after 7-day differential-sticking event; first
    dispersed-barite integration on an onshore rig in Azerbaijan → Letter of Appreciation.
  - GL TOC Buzovna-Mashtaga & Qala — 6 wells, ~30 t/day average production.
  - Gunashli-10 — slim-hole OBM well, ~40 t/day.
  - GLOLYNX Bibiheybat — 13+ wells delivered, campaign ongoing.
  - Neft Dashlari (SOCAR) — multiple wells, polymer & oil-based fluids.
- **Certifications:** ISO 9001/14001/45001; API Spec Q2 (target Q2 2026).

**Privacy note:** named reference contacts from the presentation (SOCAR/GL/DH/ENIGMA
individuals) stay **private** — not published. Real photos/logos/exact stats to be
supplied by ODS; clean placeholders used where assets are missing.

## 7. Technical architecture

```
src/
├── content/                # markdown — the editable content layer
│   ├── services/           # one .md per service (icon, summary, body)
│   ├── projects/           # one .md per case study (operator, field, fluid type, outcome)
│   └── insights/           # blog / technical articles
├── content.config.ts       # typed (Zod) collection schemas — enforce consistent data
├── components/             # Hero, ServiceCard, ProjectCard, StatBar, OperatorLogos,
│                           #   Nav, Footer, CTA, InsightCard
├── layouts/                # BaseLayout (SEO/fonts), PageLayout, ArticleLayout
├── pages/                  # index, about, services/[...slug], projects/[...slug],
│                           #   insights/[...slug], contact
└── styles/                 # Tailwind theme + Midnight Brass tokens
```

- **Astro content collections** with Zod schemas: adding a project/service/article = drop
  a markdown file with frontmatter; grids, filters, and detail pages generate automatically.
- **Zero JS by default.** Interactive islands only where needed: mobile nav, project
  operator-filter, subtle hero motion, stats count-up.
- **Contact form:** static-host-native (Netlify Forms or Formspree) — no backend to maintain.
- **SEO/perf:** per-page meta + OpenGraph, generated sitemap & robots.txt, optimized
  images via Astro `<Image>`. Target Lighthouse 95+ across the board.

### Content schemas (indicative)

- **service:** `title, slug, icon, order, summary, body(md)`
- **project:** `title, slug, operator, field, fluidType(WBM|OBM|brine), year, location,
  outcome, featured(bool), body(md), image?`
- **insight:** `title, slug, date, author, excerpt, tags[], body(md), cover?`

## 8. Design system — "Midnight Brass"

- **Color tokens:** `ink #000000` · `navy #0D1C2E` · `navy-mid #16467A` ·
  `brass #B8863B` · `text-light #C5CDD8`.
- **Typography:** geometric/grotesk display face for headlines (e.g. Space Grotesk / Sora),
  clean sans for body (e.g. Inter). Final pairing confirmed visually during build.
- **Hero:** full-bleed dark rig/mud-plant imagery or video, centered statement, brass
  primary CTA + ghost secondary CTA.
- **Motion:** restrained — fade/slide on scroll, hero parallax, brass underline hovers.
  Premium = calm and precise, not flashy.
- **Responsive:** mobile-first, fully responsive.

## 9. Testing & deployment

- Build-time content validation (invalid frontmatter / broken internal links fail the build).
- Astro `astro check` type-checking in CI.
- Lighthouse CI performance/SEO/a11y budget.
- Link checker on build output.
- Deploy via Git → Vercel/Netlify with preview deploys per change; point a production
  domain (oilmends.com or new) at launch.

## 10. Out of scope (YAGNI)

- Multilingual content (English only for now; architecture leaves room to add later).
- Headless CMS / admin panel (markdown-authored).
- Client portal, dashboards, e-commerce, or any authenticated app surface.
- Live data integrations.

## 11. Open items to confirm with ODS

- Final/approved proof statistics (well counts, project counts).
- Which operator logos may be displayed publicly (esp. BP/SOCAR brand usage).
- Real team photos, engineer bios, and operator/field imagery.
- Production domain choice (reuse oilmends.com vs. new).
