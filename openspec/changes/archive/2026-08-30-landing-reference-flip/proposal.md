# Proposal: landing-reference-flip

## Locked assumptions

User accepted C («Dale»). Snapped rest + tumble identity at 0%/100% (not 10s hero, not unsapped 180°). Mid-flip gray/metallic vs green-glass; idle occupancy stays transparent. Tumble ~8–15deg + modest lift. Settled translucent slab, field through face, neon rim not fill; no `is-settled`. Unflip CSS 180→0; reverse tumble later if pop; no WAAPI.

## Intent

Numbered cubes still hinge as snapped 180° cards. Each CTA-wave cube should read as a thick occupancy glass slab that tumbles mid-flight, then reseats with a neon rim.

## Scope

### In Scope
- Snapped `rotate3d` 0↔180 on `.cube-inner`; keyframed lift/tumble identity at 0% and 100%
- Optional `--flip-tilt` from discarded `flipAxis` perpendicular
- Mid-flip two-face; thickness ~0.10–0.12 * `--cell-css`; 90° rim; settled slab + edge neon
- Keep idle occupancy glass, epicentric stagger, occupancy/CTA unflipped, 720ms linear, reduced-motion instant
- RED Vitest: idle glass, snap, tumble 0%/100%, no `is-settled` / `backdrop-filter` / Force Field edits

### Out of Scope
- `landing/src/components/canvasui/*` (hard freeze), shaders, three.js, WAAPI
- Reverse unflip tumble; 10s hero; unsapped 180; plasma/grain on cube CSS
- Lattice, machine, manifesto, glyph-in-WebGL

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `landing-epicentric-flip`: snapped 180 rest stays; add mid-flight tumble/lift (identity at ends); two-face mid-flip; settled rim slab; spine may light mid-flight.

## Approach

Keep `flipAxis` snap. Tumble is zero-at-ends `@keyframes` (8–15deg + modest lift). Idle front transparent; flipped front may gray/metallic; back green glass + `--text` + rim. Spine 0→peak→0. Strict TDD: `pnpm --dir landing test`.

## Affected Areas

- `landing/src/styles/tokens.css` — Modified: tumble keyframes, thickness, two-face, rim, spine
- `landing/src/experience/delays.ts` — Modified: optional tilt export; keep snap
- `landing/src/experience/delays.test.ts` — Modified: diamond tests stay; tilt if exported
- `landing/src/experience/Stage.tsx` — Modified: tumble wrapper / `--flip-tilt`; memo
- `landing/src/experience/Stage.test.tsx` — Modified: pin tumble 0%/100% + snapped 180

## Risks

- Diamond vs grout (High) — tumble mid-flight only; snap rest
- Unflip pop (Med) — later reverse tumble; no WAAPI
- 90° vanish #747 (Med) — lit rim; linear 720ms
- Wave noise (Med) — cap 8–15deg
- Token regex pins 8px/180 (High) — rewrite tests with C
- Vendor freeze leak (Low) — never edit canvasui

## Rollback Plan

Revert tokens, tilt helper, Stage wrapper/vars/memo, and tests. Overlay snap and Force Field stay.

## Dependencies

Shipped `landing-epicentric-flip`. Strict TDD in `openspec/config.yaml` (ignore Engram `sdd-init` `strict_tdd: false`).

## Success Criteria

- [ ] Idle numbered cubes stay occupancy glass; occupancy/CTA never flip
- [ ] Snapped 180 rest; tumble identity at 0%/100%; ~8–15deg + modest lift
- [ ] Mid-flip two-face; settled slab, field through face, neon rim not fill
- [ ] Unflip 180→0 CSS; no WAAPI; no `is-settled`; no canvasui edits; Vitest green
