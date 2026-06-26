# Animation Pass — Design Spec

**Date:** 2026-06-26
**Status:** Approved
**Scope:** Front-end motion + branding pass on the ODS Astro site.

## Goal

Add tasteful, performant motion and the company logo to the site. All effects are
**pure CSS + vanilla JS (no new dependencies)** and **respect `prefers-reduced-motion`**
(the global rule in `global.css` already disables CSS animation/transition under it;
JS effects must guard with `matchMedia('(prefers-reduced-motion: reduce)')` and snap to
final state).

## Constraints

- No new dependencies. No UI framework.
- Reduced-motion: count-up shows final value instantly; particle canvas not started
  (static gradient remains); marquee static; scroll-reveal elements visible by default;
  scroll-to-top uses instant jump.
- Performance: hero canvas caps particle count, uses `requestAnimationFrame`, and pauses
  when offscreen or when the tab is hidden.
- Keep existing behavior intact: the hero video (when `videoId` is set) is untouched;
  the particle background only renders when `videoId === ''`.

## Items

1. **Header + footer logo** — use `public/images/logo.jpeg`.
   - `Nav.astro`: replace the `◆ ODS` text mark with `<img src="/images/logo.jpeg">`
     constrained to the 64px nav height (`h-9 w-auto object-contain`), keeping the `ODS`
     wordmark beside it. JPEG has no transparency — accepted by user.
   - `Footer.astro`: show the logo near the top of the footer.

2. **Particle-network hero background** (`Hero.astro`) — a `<canvas>` of brass-tinted
   drifting dots connected by short lines, behind the scrim, **only when `videoId === ''`**.
   Vanilla JS in the component `<script>`; capped particles; rAF; pause offscreen/hidden;
   not started under reduced-motion.

3. **Count-up stats** (`StatBar.astro`) — numbers animate 0→target when scrolled into
   view (IntersectionObserver, once). Uses a pure parser `parseStat(value)` returning
   `{ prefix, number, suffix }` or `{ text }` for non-numeric (`API`). Animates the number,
   preserves prefix/suffix. Reduced-motion → final value immediately.

4. **Scroll-reveal** (site-wide, `BaseLayout.astro` script) — elements with a
   `data-reveal` attribute fade + slide up when entering the viewport; optional
   `data-reveal-delay` for stagger. CSS classes in `global.css`: base hidden state +
   `.is-revealed`. Applied to homepage/section blocks and cards. Reduced-motion → visible.

5. **Hero entrance** (`Hero.astro` + `global.css`) — eyebrow → headline → subhead →
   buttons stagger in on load via CSS animation. Reduced-motion → visible.

6. **Nav on scroll** (`BaseLayout.astro` script + `Nav.astro`) — header gains stronger
   background/blur/border and slight shrink after `scrollY > 50`, via a toggled class.

7. **Operator logos marquee** (`OperatorLogos.astro` + `global.css`) — names auto-scroll
   in a seamless loop (track duplicated for continuity), pause on hover. Reduced-motion →
   static (current layout).

8. **Scroll-to-top button** (`BaseLayout.astro`) — fixed bottom-right, fades in after
   `scrollY > 400`, smooth-scrolls to top (instant under reduced-motion).

## File map

- `src/components/Nav.astro` — logo + nav-on-scroll class hook
- `src/components/Footer.astro` — logo
- `src/components/Hero.astro` — particle canvas (no-video path) + entrance markup
- `src/components/StatBar.astro` — count-up wiring
- `src/components/OperatorLogos.astro` — marquee
- `src/layouts/BaseLayout.astro` — scroll-reveal + nav-on-scroll + scroll-to-top script & button
- `src/styles/global.css` — keyframes, reveal classes, marquee, entrance, reduced-motion already present
- `src/lib/stats.ts` — `parseStat()` pure function
- `src/lib/stats.test.ts` — vitest tests for `parseStat()`

## Testing / acceptance

- `npm run test` — `parseStat` cases pass (`40+`→{number:40,suffix:'+'}, `9`→{number:9},
  `API`→{text:'API'}).
- `npm run build` + `npm run check` pass.
- Manual: count-up triggers on scroll; particle bg appears only with empty `videoId`;
  marquee scrolls; scroll-to-top works; reduced-motion disables motion.
