# Tasks: landing-reference-flip

Approach C. TDD: `pnpm --dir landing test`. Five files only. No `canvasui/*`. Threat matrix N/A.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 360–450 authored |
| 400-line budget risk | High |
| Session 800-line budget | Enough (ceiling ~450) |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 token contract → PR 2 tilt + Stage wrapper |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

Apply TDD 1→5. PRs green-only. First apply: 1.1.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | RED token regex + GREEN `tokens.css` | PR 1 | `pnpm --dir landing test` | N/A — Vitest only | `tokens.css`; token describe in `Stage.test.tsx` |
| 2 | `flipTilt` + `.cube-tumble` wrapper | PR 2 | `pnpm --dir landing test` | N/A — Vitest only | `delays.ts`, `delays.test.ts`, `Stage.tsx`, rest of `Stage.test.tsx` |

Scenarios (20): 1.1 tumble-ends+720ms; 1.2 idle-glass; 1.3 spine/thickness/no-flatten; 1.4 glyphs/two-face/rim; 1.5 compass/diamond/delay; 1.6 fold/occupancy-CTA/unflip/reduced-motion; 1.7 not-hero; 5.1 FF+canvasui N/A-edit.

## Phase 1: RED tests

- [x] 1.1 First apply unit — in `landing/src/experience/Stage.test.tsx` drop `translateZ(8px)`; pin tumble 0%/100% identity (`translateZ(0)` + `0deg`) and inner snapped 0deg/180deg + `720ms linear`.
- [x] 1.2 Keep idle occupancy-glass regex; forbid `backdrop-filter` and opaque plates.
- [x] 1.3 Pin `--cube-thickness` / `0.11 * var(--cell-css)`; forbid `is-settled`; spine hidden at rest, 1–2px not `12px`/`#0c0c0c`; MAY mid-flight `--accent` hairline.
- [x] 1.4 Pin two-face (graphite vs `rgba(31,219,18,0.16)`), `--text` glyphs, rim `accent-ring` not fill, no opaque back.
- [x] 1.5 In `landing/src/experience/delays.test.ts` keep compass/coincidence/diamond/`flipDelay`; add `flipTilt` coincidence 0, opposite signs, `abs(tilt) ≤ 1`.
- [x] 1.6 In `Stage.test.tsx`: numbered-only `.cube-tumble` around `.cube-inner`; `--flip-tilt` on numbers; occupancy/CTA omit both, never `is-flipped`; unflip drops class (CSS 180→0); reduced-motion `animation: none`; no WAAPI. Keep fold-away/glyph/occupancy.
- [x] 1.7 Pin `cube-tumble` 720ms per cube, not a 10s hero. Tests MUST fail after 1.1–1.7.

## Phase 2: GREEN delays

- [x] 2.1 Add `flipTilt` in `landing/src/experience/delays.ts` (discarded CW perp; coincidence 0; [-1,1]); leave `flipAxis`. Delay tests pass; token tests stay RED.

## Phase 3: GREEN tokens

- [x] 3.1 In `landing/src/styles/tokens.css` animate flipped `.cube-tumble` 720ms linear; 0%/100% identity; 50% lift `0.08 * --cell-css` + `var(--flip-tilt) * 12deg`. Keep inner snapped 180. No WAAPI.
- [x] 3.2 Replace `translateZ(8px)` with `--cube-thickness: calc(0.11 * var(--cell-css))`; spine idle hidden; MAY 0→peak→0 `--accent` 1–2px hairline.
- [x] 3.3 Two-face + slab: flipped front graphite below `rgba(17,17,17,0.92)` forbid; back green-glass `--text`; rim `accent-ring` ≤8px halo; never `is-settled` / `backdrop-filter` / inner `rotateY(`. Token tests pass.

## Phase 4: GREEN Stage

- [x] 4.1 In `landing/src/experience/Stage.tsx` wrap numbered `.cube-inner` in `.cube-tumble`; `--flip-tilt` on `cubeBox`; `CubeProps.flipTilt?`; memo includes tilt. Occupancy/CTA omit both.
- [x] 4.2 `pnpm --dir landing test` green. No lattice/machine/copy edits.

## Phase 5: Freeze check

- [x] 5.1 Diff excludes `landing/src/components/canvasui/*`; Force Field/shader/three.js, `cellScale`, count, lattice untouched. (N/A-edit)
