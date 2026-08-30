# Proposal: Tinity Landing

## Intent

Ship a Vite React 19 app under `landing/` (`base: '/tinity/'`) for later jseramn.tech/tinity. Today only `landing/DESIGN.md` exists.

## Proposal question round

Locked:

1. **17 tiles:** labels `01`–`17` only; no names/logos in v1.
2. **Manifesto (English):** Tinity is an agentic systems engineering framework designed to build a harness-of-harnesses infrastructure for AI testing and evaluation. MIT license. The vision is not to replace or drive any other harness out of the market. Tinity exists to be a friend to all, to work alongside other harnesses and orchestrate them, putting advanced tools in creative developers' hands. Layer 8 will be agent-based.
3. **Toggle:** first CTA reveals 1–17; all flipped → one Glitch.burst then Decrypt Reveal. Second CTA unmounts decrypt, unflips, idle.
4. **Reduced motion:** skip wave/glitch; instant flip/manifesto; same two-click toggle.
5. **WebGL:** never three contexts. Idle = Force Field only. After reveal, swap to Glitch burst then Decrypt Reveal (one live context).
6. **Ship:** `landing/` Vite app only.
7. **Non-goals:** Base UI/MUI, Astro mount, origin-trial token, custom shaders, extra tile labels.

## Scope

### In Scope

Vite/React 19/TS/Vitest; DESIGN.md tokens; CTA `tinity me`; Canvas UI + `rect-cache` + adapters; 17-tile experience. Two `ask-on-risk` PRs: vendor copy, then experience. `size:exception` allowed if a running dev server was already demanded this session.

### Out of Scope

Astro mount, origin trial, Base UI/MUI, shader rewrite, extra labels, DESIGN.md edits.

## Capabilities

### New Capabilities

- `landing-app`: Vite React 19 scaffold, `base: '/tinity/'`, DESIGN.md tokens, Geist, Vitest, CTA.
- `canvas-ui-vendor`: copied Canvas UI React files, `rect-cache`, `impact`/`burst` adapters.
- `landing-experience`: `loader → idle → revealed → decrypted → idle`, 17 tiles, manifesto, reduced motion, WebGL swap.

### Modified Capabilities

- None

## Approach

Approach A locked. Copy `@canvas-ui/*-react` to `landing/src/components/canvasui/` plus `rect-cache.ts`. Square lattice, `cellScale` 8–10, brand green. DOM tiles use `squareCell` math; flips from `onHit` + `rippleSpeed`. Adapters for `impact`/`burst`; no shader edits. Idle Force Field only. `allFlipped`: unmount field → one `burst()` (raise Glitch `interval`) → Decrypt Reveal (`#1fdb12` / `#050505`). Vendor ~3068 lines vs 400 authored budget → two slices.

## Affected Areas

New: `landing/` app, `canvasui/`, `rect-cache.ts`, `experience/`. Unchanged: `landing/DESIGN.md`. Later: `openspec/config.yaml` testing.

## Risks

Vendor ~3k vs 400-line budget (two PRs; optional `size:exception`); `onHit` origin-only (JS timing); hidden engine refs (adapters); WebGL context budget (one live); missing `rect-cache` (hand copy); Decrypt/Glitch defaults (brand color; no auto-burst).

## Rollback Plan

Delete all `landing/` application files except `landing/DESIGN.md`. Revert `openspec/changes/tinity-landing/`.

## Dependencies

shadcn `@canvas-ui` trio + `rect-cache.ts`; Geist; Vite; React 19; Vitest.

## Success Criteria

- [ ] Idle Force Field + `tinity me`; two-click toggle (`01`–`17` → burst+decrypt → idle)
- [ ] Reduced-motion instant path; one WebGL context; Vitest machine without WebGL; `base: '/tinity/'`
