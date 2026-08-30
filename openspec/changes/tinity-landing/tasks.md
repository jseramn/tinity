# Tasks: Tinity Landing

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~3500–3800 total (~450–650 authored; ~3068 vendor in total only) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 vendor → PR 2 experience |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

`size:exception` OK this session for running `pnpm --dir landing dev`; later PRs still V then E.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| V | Scaffold, tokens, CTA, vendor+adapters, idle field | PR 1 | `pnpm --dir landing test` | `pnpm --dir landing dev` idle+CTA | `landing/` except DESIGN.md and E files |
| E | Machine, tiles, delays, slot swap, reduced motion | PR 2 | `pnpm --dir landing test` | `pnpm --dir landing dev` two-click | `landing/src/experience/{machine,tiles,delays,Stage}*` |

## Phase 1: Scaffold and Tests

- [x] 1.1 Create `landing/{package.json,vite.config.ts,index.html,tsconfig*.json,src/main.tsx,src/App.tsx}`: Vite+React 19+TS+Vitest; `base:'/tinity/'`. Verify react 19.x; prod paths `/tinity/` (Base and React 19).
- [x] 1.2 Create `landing/src/styles/tokens.css` from DESIGN.md `:root` (`#1fdb12`/`#061008`/`#050505`); Geist Sans+Mono only; do not edit DESIGN.md or add a second accent. One primary `tinity me` (fill `#1fdb12`, text `#061008`) (Brand CTA tests).
- [x] 1.3 Set `openspec/config.yaml` `strict_tdd: true`, `testing.strict_tdd: true`, `runner: vitest`, `test_command`/`apply.test_command`=`pnpm --dir landing test`, `apply.tdd: true`.
- [x] 1.4 RED: `landing/src/experience/{machine,tiles,delays}.test.ts` — loader until `ready`; idle+cta→revealed; allFlipped→bursting; burstDone→decrypted; cta revealed|decrypted→idle; reducedMotion skips bursting and delay=0; 17 ids `01`–`17` row-major, nearest center, `cellSize=min(w,h)/9`; `flipDelay=dist/(speed×minSide)` speed 1.6 (Loader holds; Two-click machine; Reduced motion; Tiles and manifesto).
- [x] 1.5 GREEN: `landing/src/experience/{machine,tiles,delays}.ts`. `pnpm --dir landing test` passes with no WebGL (Brand CTA tests).

## Phase 2: Vendor and Adapters

- [x] 2.1 Add `landing/components.json` targeting `@canvas-ui`. `npx shadcn@latest add` Force Field, Glitch, Decrypt Reveal into `landing/src/components/canvasui/`. No Base UI/MUI/full theme kit (Vendor present).
- [x] 2.2 Hand-copy `landing/src/components/rect-cache.ts` (`../rect-cache` from canvasui). Do not edit vendor shaders (Shaders and engine calls).
- [x] 2.3 Create `landing/src/experience/adapters/{forceField,glitch,decryptReveal}.tsx` wrapping `createForceField`/`createGlitch`/`createDecryptReveal` via `forwardRef` (`impact`,`burst`,`onReady`). Field: `gridReveal:"always"`, `color:[0.122,0.859,0.071]`, square, `cellScale:9`, `clickRipples:false`. Glitch: `interval:1e6`, one `burst()` (Lattice and no auto-burst; Shaders and engine calls).

## Phase 3: Experience Loop

- [x] 3.1 Create `landing/src/experience/Stage.tsx` Slot `"field"|"glitch"|"decrypt"|"none"`. Start `loader`; `onReady(instance|null)`→idle (GL fail still idle). Idle Force Field only; never three live (Loader holds; One context).
- [x] 3.2 Wire CTA two-click: `impact`+delays; 17 Geist Mono tiles, no names/logos; `allFlipped` unmounts field, one `burst()`, Decrypt `#1fdb12`/`#050505` manifesto; reset remounts field, unflips, unmounts decrypt (Two-click machine; Tiles and manifesto; One context). Overlay `pointer-events:none`; origin=CTA stage px.
- [x] 3.3 Reduced motion: delays=0, skip wave/burst, instant tiles+manifesto, same two-click (Reduced motion).

## Phase 4: Polish and Dev Server

- [x] 4.1 Confirm DESIGN.md unchanged; one `tinity me`; idle Force Field only; shaders upstream-equal (Brand CTA tests; One context; Shaders and engine calls).
- [x] 4.2 `pnpm --dir landing test` (no WebGL), `pnpm --dir landing build` (`/tinity/` assets), `pnpm --dir landing dev` running.
