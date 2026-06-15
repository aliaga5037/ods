# ODS Website — Content Guide for Non-Developers

You do not need to know how to code to update this website. All you need to do is tell your AI coding agent (e.g. Claude Code) exactly what you want changed, and the agent will handle the rest. This guide shows you what to say.

---

## How it works

Every time you want to update the website:

1. Open Claude Code (or your AI agent) in the project folder.
2. Tell it what you want using the example phrases below.
3. Ask the agent to run `npm run build` and confirm it passes.
4. The change goes live automatically when the agent pushes to the `main` branch.

---

## Add a new project / case study

**What to tell the agent:**

> "Add a new project to the website. Here are the details:
> - Title: Gunashli #10 — Lost Circulation Control
> - Operator: BP
> - Field: Gunashli
> - Fluid type: OBM
> - Year: 2025
> - Location: Offshore Azerbaijan
> - Outcome: Eliminated total mud losses in 48 hours using bridging pill program.
> - Featured on homepage: yes
>
> Please create the file in `src/content/projects/`, run `npm run build`, and confirm it passes."

The agent will create a file like `src/content/projects/gunashli-10-2025.md` using this structure:

```yaml
---
title: "Gunashli #10 — Lost Circulation Control"
operator: "BP"
field: "Gunashli"
fluidType: "OBM"
year: 2025
location: "Offshore Azerbaijan"
outcome: "Eliminated total mud losses in 48 hours using bridging pill program."
featured: true
---

Optional longer description here.
```

**Notes:**
- `fluidType` must be one of: `WBM`, `OBM`, or `brine` — tell the agent which one applies.
- Set `featured: true` only if you want it to appear on the homepage; otherwise `featured: false`.
- An optional image can be added if you supply a file at `/public/images/projects/filename.jpg`.

---

## Publish a new article (Insight)

**What to tell the agent:**

> "Publish a new article in the Insights section. Here are the details:
> - Title: How to Prevent Differential Sticking in High-Angle Wells
> - Date: 2026-06-15
> - Author: Seymur Aliyev
> - Excerpt: A practical guide to mud-cake control and filter-cake quality in deviated wellbores.
> - Tags: drilling fluids, stuck pipe
>
> The full article text is: [paste your article text here]
>
> Please create the file in `src/content/insights/`, run `npm run build`, and confirm it passes."

The agent will create a file like `src/content/insights/differential-sticking-guide.md`.

---

## Change phone number, email, or office address

All contact details are in one file: `src/data/site.ts`.

**What to tell the agent:**

> "Update the contact details in `src/data/site.ts`. Change the phone to +994 55 123 4567 and the email to info@oilmends.com. Run `npm run build` and confirm it passes."

---

## Change the homepage statistics

The stats (e.g. "40+ Wells Delivered") are also in `src/data/site.ts`.

**What to tell the agent:**

> "Update the homepage stats in `src/data/site.ts`. Change 'Wells Delivered' from 40+ to 50+. Run `npm run build` and confirm it passes."

---

## Update the operators / clients list

The list of operator names shown on the site is in `src/data/site.ts`.

**What to tell the agent:**

> "Add 'TotalEnergies' to the operators list in `src/data/site.ts`. Run `npm run build` and confirm it passes."

---

## Edit an existing service description

**What to tell the agent:**

> "Update the 'Mud Engineering' service description in `src/content/services/mud-engineering.md`. Change the summary to: 'Real-time wellsite supervision and drilling-fluids optimization for complex well profiles.' Keep everything else the same. Run `npm run build` and confirm it passes."

Existing service files:
- `src/content/services/fluids-program-design.md`
- `src/content/services/laboratory-services.md`
- `src/content/services/manpower.md`
- `src/content/services/mud-engineering.md`
- `src/content/services/solids-control.md`
- `src/content/services/waste-management.md`

---

## After any change — always confirm the build

After every update, ask the agent:

> "Please run `npm run build` and tell me if it passes."

If the build fails, the agent will see an error message pointing to the exact file and field that is wrong. Ask it to fix the error and run the build again until it passes.

Once the build passes and the agent pushes the changes to `main`, the website updates automatically within a few minutes.

---

## What you should NOT ask the agent to change (without a developer)

These files control how the website looks and works. They should only be changed intentionally, with a developer review:

- `src/components/` — page building blocks
- `src/layouts/` — page templates
- `src/pages/` — routing
- `src/styles/global.css` — colors and fonts

If you want a design change (different color, new layout section, etc.), describe what you want and a developer can scope the work.
