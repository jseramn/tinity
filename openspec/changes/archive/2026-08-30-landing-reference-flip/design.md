# Design: landing-reference-flip

Numbered cubes keep snapped 180° rest on `.cube-inner` plus an outer `.cube-tumble` whose 720ms `@keyframes` are identity at 0% and 100% (lift + 12deg tilt). Materials follow `landing/DESIGN.md`. Spec may land in parallel; this is locked Approach C.

## Technical Approach

Keep `flipAxis` snap, `RIPPLE_SPEED` stagger, occupancy/CTA unflipped, and class-driven unflip (180→0). Tumble is a wrapper animation so it cannot residual-rotate rest. Replace `translateZ(8px)` with `--cube-thickness: calc(0.11 * var(--cell-css))`. Spine lights only mid-flight. RED token regex before CSS.

Brand SoT: `#1fdb12` is a LED, not body type. Glyphs stay `--text`. No glass stacks, cube plasma, or second accent. Rim: `--accent-ring` plus ≤8px live-node halo.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Two nodes vs one | Extra DOM vs animation fighting 180 | **Outer** `.cube-tumble` wraps `.cube-inner` (not a child of the hinge). |
| Unsnapped 180 / B / 10s / WAAPI / three.js | Close-up match; diamonds rest; blows wave | Rejected. Snap + CSS transition/`@keyframes` only. |
| A — materials only | Smallest diff; still a hinge | Rejected. Contact sheet is a tumble. |
| `is-settled` flatten | Hides 90° edge; previously killed 3D | **Never.** Settled stays `preserve-3d`. |
| `flipTilt` leftover CW perp | Extra helper vs generic same tilt | **Export** `calc(var(--flip-tilt) * 12deg)`. |
| Thickness `8px` vs cell-relative | Absolute px shears on resize | **0.11 * `--cell-css`** (0.10–0.12 lock). |
| `backdrop-filter` / cube plasma | Glass stacks; doubles occupancy | Forbidden. Never edit `canvasui/*`. |

## Data Flow

```mermaid
sequenceDiagram
  participant CTA
  participant Stage
  participant Inner as cube-inner
  participant Tumble as cube-tumble
  CTA->>Stage: click idle→revealed
  Stage->>Inner: is-flipped rotate3d 0→180 720ms linear
  Stage->>Tumble: 0% id → 50% lift+tilt → 100% id
  Note over Inner,Tumble: spine 0→peak→0; settle snapped 180 + identity + rim
  CTA->>Stage: click revealed→idle
  Stage->>Tumble: class drop cancels animation
  Stage->>Inner: transition 180→0
```

Idle numbered: flat, transparent front, grout `inset: calc(0.03 * var(--cell-css))`. Occupancy: one face, no `--flip-*`. Reduced motion: instant class, `animation: none`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `landing/src/styles/tokens.css` | Modify | Tumble keyframes; thickness; two-face; rim; spine mid-flight; keep 720ms inner; no `is-settled` / `backdrop-filter` |
| `landing/src/experience/delays.ts` | Modify | Add `flipTilt`; do not change `flipAxis` snap |
| `landing/src/experience/delays.test.ts` | Modify | Keep diamond/compass; add tilt sign/magnitude |
| `landing/src/experience/Stage.tsx` | Modify | Numbered-only wrapper; `--flip-tilt` on `cubeBox`; memo includes `flipTilt` |
| `landing/src/experience/Stage.test.tsx` | Modify | RED: drop `8px` pin; pin tumble 0%/100% identity + snapped 180 |
| `landing/src/components/canvasui/*` | **None** | Hard freeze |

No new files. No lattice/machine/copy edits.

## Interfaces / Contracts

```ts
export function flipTilt(tile: Tile, origin: { x: number; y: number }): number;
// discarded CW perpendicular after snap; coincidence → 0; range [-1, 1]
```

Tumble axis is the **swapped** snap so tilt is not the 180 hinge:

```css
.cube--number.is-flipped .cube-tumble { animation: cube-tumble 720ms linear; }
@keyframes cube-tumble {
  0%, 100% { transform: translateZ(0) rotate3d(var(--flip-y, 0), var(--flip-x, 0), 0, 0deg); }
  50% {
    transform: translateZ(calc(0.08 * var(--cell-css)))
      rotate3d(var(--flip-y, 0), var(--flip-x, 0), 0, calc(var(--flip-tilt, 0) * 12deg));
  }
}
```

Front flipped: `translateZ(var(--cube-thickness))` + graphite wash below the `rgba(17,17,17,0.92)` forbid. Back: `rotate3d(..., 180deg) translateZ(var(--cube-thickness))`, `rgba(31,219,18,0.16)`, `--text`, rim `0 0 0 1px var(--accent-ring)` ≤8px halo. Radius `min(8px, calc(0.04 * var(--cell-css)))`. Spine idle hidden; mid-flight `--accent` hairline. `CubeProps` adds `flipTilt?: number`. Occupancy/CTA omit wrapper and tilt.

## Testing Strategy

`pnpm --dir landing test`. RED token/Stage tests first, then CSS/helper.

| Layer | What to Test | Approach |
|-------|----------------|----------|
| Unit tokens (RED) | Idle glass; no `backdrop-filter` / `is-settled` / inner `rotateY(` | Keep idle regex. **Remove** `translateZ(8px)`. Pin `--cube-thickness` / `0.11 * var(--cell-css)`, inner 0deg/180deg + `720ms linear`, tumble 0%/100% `translateZ(0)` + `0deg`. |
| Unit delays | Snap compass + diamond; tilt leftover | Keep `flipAxis`. Add coincidence 0, opposite signs, `abs(tilt) ≤ 1`. |
| Unit Stage | `--flip-tilt` and `.cube-tumble` on numbers only | Occupancy/CTA never flipped. Reduced-motion instant. Second click clears class. |
| Integration / E2E | — | N/A (Vitest only). |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR, or process-integration boundary.

## Migration / Rollout

No migration required. Rollback = revert the five files above.

## Open Questions

- [ ] Unflip pop if cancelled tumble glitches — later reverse tumble, not WAAPI. Does not block apply.
