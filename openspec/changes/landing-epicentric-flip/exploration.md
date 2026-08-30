## Exploration: landing-epicentric-flip

Follow-up to implemented `landing-field-fusion` (full lattice occupancy, CSS 3D number cards) and Engram bugfix #747 (opaque number faces so a 90° flip would not vanish). New change — do not amend `tinity-landing`, `landing-3d-field`, or `landing-field-fusion`.

**Product lock (do not reopen):**

1. Idle numbered cubes visually match occupancy: transparent fill, same grout inset. Force Field shows through.
2. Numbered cubes still flip and show `01`–N on the back. Occupancy and CTA do not flip.
3. Wave epicenter = CTA origin. Delay stays radial `flipDelay`. Axis = perpendicular to `(tileCenter − origin)`; rotation sense opposite the outgoing wave (inner edge recedes).
4. Do not edit `landing/src/components/canvasui/ForceField.tsx` or shaders.
5. No three.js. One WebGL context (Force Field). Tests: `pnpm --dir landing test`.

**DESIGN.md note:** “No glass stacks” forbids glassmorphism (`backdrop-filter` blur stacks), not occupancy transparency. Numbered idle must look like occupancy panes in the grout, not frosted cards.

### Current State

Vite + React 19 + Vitest under `landing/`. Overlay is one cube per Force Field cell (`layoutTiles` mirrors `cellScale: 9`, bottom-left origin, CSS Y-flip). Roles: `cta` (center button `tinity me`), `number` (subset `01`–N), `occupancy` (rest). Machine is `loader → idle → revealed → idle`. Force Field stays mounted. `flipTargets` is `role === "number"` only. `ctaOrigin` is the CTA cell center. `flipDelay = dist / (1.6 * minSide)` from tile center to that origin — already epicentric in **time**, not in **axis**.

**Why numbered cubes look gray**

Verified in `landing/src/styles/tokens.css` (CodeGraph does not index CSS; tokens were read directly):

| Selector | Idle occupancy | Numbered (today) |
| --- | --- | --- |
| Face inset | `calc(0.03 * var(--cell-css))` | `inset: 0` (`.cube--number .cube-face`) |
| Front fill | `background: transparent` | `rgba(17, 17, 17, 0.92)` (`--surface` at 92%) |
| Spine | none | `#0c0c0c`, width `12px`, `rotateY(90deg)` |
| Back fill | n/a | `rgba(8, 8, 8, 0.96)` |

Occupancy is a single `.cube-face` with `transform-style: flat`. Numbered cubes are a CSS 3D card: `.cube-inner` + `.cube-face--front` + `.cube-spine` + `.cube-face--back`.

**Why every cube rotates the same way**

```css
.cube.is-flipped .cube-inner { transform: rotateY(180deg); }
```

One global Y axis. A cube east of the CTA and a cube west of the CTA both hinge as if the wave came from the left.

**Why #747 made faces opaque**

Glass fronts (`rgba(0,0,0,0)`) plus a 180ms ease-out looked like a 2D overlay: at ~90° a fill-less plane is a hairline, and ease-out skips the edge. The fix was a literal card (inner rotor, opaque plates, `translateZ(6px)`, 12px graphite spine, 720ms **linear** so 90° is the midpoint). Occupancy was left transparent. That tradeoff is the gray the user rejected.

**What to keep from #747:** `cube-inner` rotor, `backface-visibility: hidden`, linear 720ms, `translateZ` thickness, reduced-motion instant class (no transition). **What to drop:** opaque `--surface` plates and the 12px `#0c0c0c` spine as a mid-flip gray slab.

**CodeGraph (projectPath `/home/jseramn/tinity`):** `Stage` → `scheduledFlipDelay` → `flipDelay`; `Cube` in `Stage.tsx` L32–75; occupancy vs number markup as above. `ForceField.tsx` is out of edit scope.

`sdd-init/tinity` still says `strict_tdd: false`; `openspec/config.yaml` already has `strict_tdd: true` and `pnpm --dir landing test`. Do not re-run init in this change.

### Affected Areas

- `landing/src/styles/tokens.css` — number idle = occupancy glass (transparent, same inset); rim/spine for 90° without gray plates; back glyph without an opaque plate; keep `.cube.is-flipped` but switch `rotateY` to `rotate3d(var(--flip-x), var(--flip-y), 0, 180deg)`.
- `landing/src/experience/delays.ts` — add unit-testable `flipAxis(tile, origin) => { x, y }`. Delay math stays.
- `landing/src/experience/delays.test.ts` — lock axis sign (east/west/north/south, coinciding origin, no NaN).
- `landing/src/experience/Stage.tsx` — set `--flip-x` / `--flip-y` on numbered cubes from `flipAxis` + `ctaOrigin`; extend `Cube` memo to those vars (or pass `origin`). Occupancy and CTA stay non-flipping.
- `landing/src/experience/Stage.test.tsx` — idle number faces occupancy-like (no `is-flipped`; structure still two-face); opposite-side cubes get opposite axis signs; occupancy/CTA never `.is-flipped`.
- Not in scope: `ForceField.tsx`, shaders, three.js, prior OpenSpec change folders, Glitch/Decrypt.

### Approaches

#### Faces (readable 3D without gray plates)

1. **A — Glass faces + hairline rim + thin spine (recommended)** — Idle: numbered front uses the same `transparent` fill and `0.03 * var(--cell-css)` inset as occupancy so the field shows through. Keep the #747 rotor (`cube-inner`, backface hidden, 720ms linear, `translateZ` thickness). Replace the 12px `#0c0c0c` spine with a 1–2px `var(--hairline)` (or equivalent faint rim) so at 90° the viewer sees a glass-pane edge, not a graphite slab. Back: transparent (or at most a wash well below a gray plate) with Geist Mono `01`–N. No `backdrop-filter`.
   - Pros: Honors the occupancy lock; keeps a real 3D flip; #747’s actual lesson was **edge thickness + linear timing**, not fill; no new deps; Vitest can lock inset/class/CSS vars; DESIGN.md hairline language, not glassmorphism.
   - Cons: A 1px idle hairline is a slight delta vs occupancy (occupancy has no CSS border; grout is the shader). At 0° a spine that is already `rotateY(90deg)` is nearly edge-on; keep it thin so idle does not grow a center bar. Glyph contrast on the field needs `--text` (optional 1px dark text-shadow, not a plate).
   - Effort: **Low**

2. **B — Keep gray cards** — Leave `rgba(17,17,17,0.92)` / `#0c0c0c` / opaque back.
   - Pros: 90° never vanishes; already shipped.
   - Cons: **Rejected by the user.** Numbered idle cannot match occupancy; field does not show through.
   - Effort: None (do not take)

3. **C — Other 3D without fill** — (C1) Keyframed WAAPI/CSS that fades a spine in only near 90°. (C2) Flip only the glyph as a thin plane (occupancy-looking idle, number rotates alone). (C3) Second WebGL/three.js meshes.
   - Pros: C1 can hide the rim at rest more strictly. C2 is the smallest idle delta.
   - Cons: C1 duplicates the existing class+transition and is harder to unit-test. C2 stops looking like the **cube** reacting to the wave (product is occupancy cubes that still flip). C3 violates one-context / no three.js.
   - Effort: C1 Medium; C2 Low but wrong product; C3 High and forbidden

#### Rotation (epicentric axis)

1. **R1 — CSS `rotate3d` + per-cube CSS variables (recommended)** — Pure `flipAxis(tile, origin)` returns `{ x, y }` for `rotate3d(x, y, 0, angle)`. Stage sets `--flip-x` / `--flip-y` on numbered cubes. Unflipped: angle 0 (or identity). `.is-flipped`: `rotate3d(var(--flip-x), var(--flip-y), 0, 180deg)`. Keep today’s timeout stagger + CSS transition.
   - Pros: Same architecture as now; delay stays in `flipDelay`; reduced motion still instant class (transition already off); jsdom can assert CSS vars; no WAAPI cancel on second click; axis is unit-testable without WebGL.
   - Cons: Custom properties in `rotate3d` must be unitless numbers. `Cube` memo must include the vars. Degenerate `len === 0` needs a fallback axis (numbered cells are not the CTA; still guard NaN).
   - Effort: **Low**

2. **R2 — JS Web Animations API** — `element.animate` from `rotate3d(..., 0)` to `rotate3d(..., 180)` with the existing delay as WAAPI `delay` or by keeping `setTimeout`.
   - Pros: Axis is a transform string per element; easy to cancel.
   - Cons: Two motion systems (class `is-flipped` vs WAAPI) or a rewrite of `startFlips` and idle reset; jsdom Web Animations is uneven; reduced-motion and second-click unflip need explicit `cancel()`; little gain over CSS vars.
   - Effort: **Medium**

3. **R3 — Other** — Motion library, GSAP, three.js `InstancedMesh` rotation.
   - Pros: None that CSS 3D lacks for ~24 numbered cubes.
   - Cons: New deps, second WebGL, or both. Out of lock.
   - Effort: **High**

### Recommendation

**Faces A + rotation R1.**

Put `flipAxis` next to `flipDelay` in `delays.ts` (same inputs: tile + CTA origin).

```ts
export function flipAxis(
  tile: Tile,
  origin: { x: number; y: number },
): { x: number; y: number } {
  const dx = tile.x + tile.size / 2 - origin.x;
  const dy = tile.y + tile.size / 2 - origin.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: 0, y: -1 };
  // CW perpendicular of R = (dx, dy): inner edge recedes (CSS +Z toward viewer).
  return { x: dy / len, y: -dx / len };
}
```

Lock in Vitest (illustrative):

| Tile center vs origin | Expected `{ x, y }` |
| --- | --- |
| East `(+1, 0)` | `{ x: 0, y: -1 }` |
| West `(-1, 0)` | `{ x: 0, y: 1 }` |
| South `(0, +1)` (CSS Y down) | `{ x: 1, y: 0 }` |
| North `(0, -1)` | `{ x: -1, y: 0 }` |
| Coinciding | fallback, finite, not `NaN` |

If apply-phase browser check shows the inner edge advancing rather than receding, invert the perpendicular once and invert the table — do not switch to WAAPI.

**Idle glass:** delete numbered overrides that set `inset: 0` and opaque `background`. Numbered `.cube-face` must share occupancy inset and `background: transparent`. Optional 1px `--hairline` on the **rotating** faces for the 90° rim; do not restore `--surface` plates. Spine: 1–2px hairline color, not 12px `#0c0c0c`. Back: number glyph, no `rgba(8,8,8,0.96)` plate.

**Motion path unchanged:** `onCta` → `impact(origin)` + `startFlips` delays → `is-flipped`. Occupancy/CTA markup unchanged. Per-cube `perspective: 300px` can stay (helps variable axes).

**TDD:** RED `flipAxis` tests in `delays.test.ts`, then implement; then tokens + Stage vars; extend `Stage.test.tsx` for opposite-side axis signs and occupancy still never flipped.

**Review budget:** authored delta is tokens + `flipAxis` + Stage style/memo + tests — well under 400 lines. `ask-on-risk` should not need a chain for this slice.

### Risks

- **#747 regression:** transparent faces can look like a 2D pop if the rim/spine is too thin or timing returns to ease-out. Keep linear 720ms and a visible **edge**, not a fill.
- **Idle spine bar:** a wide spine is edge-on at 0° but still reads as a center line if it is dark and thick. Keep 1–2px hairline.
- **Idle hairline vs occupancy:** a CSS border on numbered cubes is a small mismatch. Prefer matching inset+fill first; add rim only if 90° vanishes in browser check.
- **CSS Y-down vs right-hand rule:** `flipAxis` sign might be inverted relative to `rotate3d`. Unit tests lock one convention; one browser flip of the perpendicular is the fallback, not a new approach.
- **Cube memo:** omitting `--flip-x`/`--flip-y` (or `origin`) from the comparator would freeze the first axis after resize.
- **Glyph contrast:** transparent back + green lattice; use `--text`, not a gray plate. Do not use `#1fdb12` for numbers (DESIGN.md: accent is not body copy).
- **Do not reopen fusion layout:** number count, lattice math, and `cellScale` stay as implemented.
- **Stale sdd-init:** ignore `strict_tdd: false` in Engram init; runner is Vitest as in `openspec/config.yaml`.

### Ready for Proposal

**Yes.** Recommend glass occupancy-matched numbered faces (Approach A) plus CSS `rotate3d` per cube from `flipAxis` (R1). Do not keep gray cards. Do not add three.js or WAAPI. Do not edit Force Field. Next: `sdd-propose` for `landing-epicentric-flip`.
