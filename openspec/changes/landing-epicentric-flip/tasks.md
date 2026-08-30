# Tasks: landing-epicentric-flip

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 160–240 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Occupancy-matched glass idle + epicentric numbered `rotate3d` | PR 1 | `pnpm --dir landing test` | Browser: inner edge recedes; 90° 1–2px hairline (jsdom does not load `tokens.css`) | Revert only `landing/src/experience/delays.ts`, `delays.test.ts`, `Stage.tsx`, `Stage.test.tsx`, `landing/src/styles/tokens.css` |

## Phase 1: flipAxis (TDD)

- [x] 1.1 RED `landing/src/experience/delays.test.ts`: `flipAxis` compass — east `{x:0,y:-1}`, west `{0,1}`, south `{1,0}`, north `{-1,0}`; coincidence `{0,-1}` finite not `NaN`; opposite sides opposite signs (spec: Compass axes and coincidence). `pnpm --dir landing test`.
- [x] 1.2 GREEN `landing/src/experience/delays.ts`: export `flipAxis` beside `flipDelay` as `{x: dy/len, y: -dx/len}`; `len===0` → `{x:0,y:-1}`. Do not change `flipDelay` / `scheduledFlipDelay` (spec: Delay stays radial).

## Phase 2: Stage vars (TDD)

- [x] 2.1 RED `landing/src/experience/Stage.test.tsx`: idle numbered Cube still two faces + spine; opposite-side `--flip-x`/`--flip-y` opposite signs; occupancy/CTA never `.is-flipped` and never `--flip-*` (spec: Idle numbers match occupancy; Occupancy and CTA never flip; Numbered cubes fold away from CTA).
- [x] 2.2 GREEN `landing/src/experience/Stage.tsx`: merge unitless `--flip-x`/`--flip-y` into numbered `cubeBox` from `flipAxis(tile, ctaOrigin)`; extend Cube memo to compare those vars. Do not edit `ForceField.tsx`.
- [x] 2.3 Keep glyph-back `01`–N and reduced-motion Stage tests (spec: Flip reveals numbered glyphs; Reduced motion is instant).

## Phase 3: Tokens last

- [x] 3.1 `landing/src/styles/tokens.css`: numbered idle matches occupancy inset `calc(0.03 * var(--cell-css))` and `background: transparent`; drop numbered `inset: 0`, front `rgba(17,17,17,0.92)`, spine `12px #0c0c0c`, opaque back plate, `backdrop-filter` (spec: Idle numbers match occupancy; Hairline spine not graphite slab).
- [x] 3.2 `.cube-inner` / `.is-flipped` use `rotate3d(var(--flip-x, 0), var(--flip-y, -1), 0, 0deg|180deg)`; keep `backface-visibility: hidden`, `720ms linear`, `translateZ` thickness, reduced-motion instant (spec: Linear 720ms rotor; Reduced motion is instant).
- [x] 3.3 Back glyphs `color: var(--text)` no plate; spine 1–2px `var(--hairline)`. If 90° vanishes, 1px hairline on rotating faces only.

## Phase 4: Freeze and prove

- [x] 4.1 Do not edit `ForceField.tsx`, `tiles.ts`, `machine.ts`, adapters, or prior OpenSpec folders; `cellScale`, number count, lattice stay (spec: Force Field and lattice unchanged).
- [x] 4.2 `pnpm --dir landing test` green. Browser: inner edge recedes; if it advances, invert `flipAxis` and the compass once — no WAAPI.
