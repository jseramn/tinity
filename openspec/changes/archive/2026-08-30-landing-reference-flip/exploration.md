## Exploration: landing-reference-flip

**Decision:** Approach C (hybrid). Keep occupancy overlay, epicentric stagger, and **snapped rest pose**. Match the reference as a **thick two-face glass slab** with a **mid-flight tumble + lift** that is identity at 0% and 100%. Do not copy the 10s close-up as a single-object landing. Do not edit Force Field. Do not flatten after flip.

### Current State

Vite + React 19 + Vitest under `landing/`. Machine is `loader → idle → revealed → idle`. One WebGL context (Force Field). Numbered glyphs live in a **DOM overlay** (`Stage` → `Cube`), occupancy-matched to `layoutTiles` / `cellScale: 9`.

**Product locks already shipped (`landing-epicentric-flip`):** idle numbered cubes share occupancy inset + transparent fill; only `role === "number"` flips; wave epicenter = CTA; `flipDelay = dist / (1.6 * minSide)`; no `ForceField.tsx` edits; no three.js; no `backdrop-filter`; no `is-settled` flatten (it previously destroyed the 3D cube).

**Verified overlay (CodeGraph + `tokens.css` — CSS is not in the graph):**

| Piece | Today |
| --- | --- |
| Overlay | `.overlay { transform-style: preserve-3d }` |
| Idle numbered cube | `transform-style: flat`; front transparent; grout `inset: calc(0.03 * var(--cell-css))` |
| Flip | `.is-flipped` → `perspective: 560px` + `preserve-3d` |
| Rotor | `.cube-inner` `rotate3d(var(--flip-x), var(--flip-y), 0, 0deg \| 180deg)`, **720ms linear** |
| Thickness | `translateZ(8px)` on flipped front and back (absolute px, not cell-relative) |
| Settled back | `rgba(31, 219, 18, 0.16)` + `inset 0 0 0 1px rgba(31, 219, 18, 0.4)`; glyph `--text` |
| Spine | DOM present; **always** `visibility: hidden; opacity: 0` (never a mid-flip light-pipe) |
| Axis | `flipAxis` takes the CW perpendicular then **snaps to one grid axis** so 180° does not diamond vs grout |
| Twist | `--flip-twist` is 90deg when X-dominant (spine only) |
| Occupancy | Single `.cube-face`; never `.is-flipped`; no `--flip-*` |
| Unflip | Second CTA removes `.is-flipped`; **transition** interpolates 180→0 |

`flipAxis` snap (current, tested):

```ts
const x = dy / len;
const y = -dx / len;
if (Math.abs(x) >= Math.abs(y)) return { x: x < 0 ? -1 : 1, y: 0 };
return { x: 0, y: y < 0 ? -1 : 1 };
```

The original epicentric spec asked for the **unsapped** perpendicular. Apply later snapped diagonals because a 180° `rotate3d` about an off-grid **in-plane** axis leaves the square occupancy-rotated (diamond vs grout). That invariant is real. The reference still wants a **tumble during** the flip, which a constant off-grid axis cannot do without diamonding the **rest** pose.

**Reference (pixels, not summary):** close-up of **one** occupancy-matched slab, 10.005s / 24fps / 240 frames. Sparkle in the corner is generator chrome — ignore.

| Time | Frame | What the pixels show |
| --- | --- | --- |
| 0.0s | 0001 | Flat Force Field grid; checkerboard grain; hairline green. **No overlay slab yet.** Wavy/plasma cell highlight is occupancy shader. |
| ~2.0s | 0048 | Slab lifted; thick plate (~1/8–1/5 width); rounded corners; emissive green face; dark glass sides; **not** a single-hinge card. |
| ~3.0s | 0072 | Dark frosted face; neon edge light-pipe; corners of the plate at different depths (multi-axis). |
| ~4.0s | 0096 | Translucent dark glass; grid faintly through the body; edge bloom `#1fdb12`. |
| ~5.0s | 0120 | **Lighter gray/metallic face** vs green-glass thickness — two-sided material. |
| ~6.0s | 0144 | Gray face + saturated green light-pipe on the rim; still floating. |
| ~7.0s | 0168 | Charcoal/frosted face; thinner-looking edge; still off-axis. |
| 10.0s | 0240 | Settled **translucent glass plate** aligned to the cell; neon outline; grid visible through the face; slight thickness highlight. **Not** a flattened 2D card. |

Apply this as **motion language per numbered cube**, not as a 10s single-object hero. The 1–N CTA wave and occupancy lattice stay.

**Gap vs code (ranked):**

1. **Rest pose is a snapped card flip; the reference tumbles** (lift + two axes) then reseats square.
2. **Material:** idle is correct occupancy glass; mid-flip lacks gray/metallic vs green-glass two-sidedness; settled rim is a 1px inset, not a light-pipe edge; thickness is 8px constant; spine never lights.
3. **Wavy border is Force Field.** Copying plasma into cube CSS would double occupancy and violate the vendor freeze.

### Affected Areas

- `landing/src/styles/tokens.css` — slab thickness, two-face fills, edge glow, keyframed lift/tumble, keep idle occupancy glass; **no** `is-settled` flatten; **no** `backdrop-filter`.
- `landing/src/experience/delays.ts` — keep snap for rest pose; optionally export the **discarded** perpendicular component as `--flip-tilt` so tumble stays epicentric.
- `landing/src/experience/delays.test.ts` — keep diamond-prevention tests; add tilt-component tests if exported.
- `landing/src/experience/Stage.tsx` — optional `--flip-tilt` / tumble wrapper on numbered cubes only; occupancy/CTA markup stays; Cube memo must include new vars.
- `landing/src/experience/Stage.test.tsx` — token regex today **locks** `rotate3d(..., 180deg)` transition, `translateZ(8px)`, hidden spine, green wash `0.16`. Those assertions must move with C, not silently break.
- Not in scope: `landing/src/components/canvasui/ForceField.tsx` (and other canvasui vendor files), shaders, `tiles.ts` lattice, `machine.ts`, `copy.ts`, manifesto, three.js, glyph-in-WebGL, `is-settled`.

### Approaches

1. **A — CSS retune, keep axis snap** — Same `rotate3d(snap, 180deg)` transition. Thicker cell-relative `translateZ`, rounded faces, stronger settled rim, maybe show spine only if it can stay hidden at idle/settled. Duration/easing tweaks. No tumble.
   - Pros: Smallest delta; occupancy matching and unflip stay; well under 800 lines; tests mostly regex updates.
   - Cons: **Misses the stated gap.** Still a pure X or Y card flip. Reference mid-frames are not a hinge.
   - Effort: **Low** (~80–150 authored)

2. **B — Contact-sheet keyframed multi-axis tumble** — Replace the 180 transition with keyframes sampled from the 240 frames (or WAAPI). Unsnapped / changing `rotate3d` axis. Possibly 10s timing language.
   - Pros: Closest 1:1 to the video for a **single** object.
   - Cons: 180° about an off-grid in-plane axis **diamonds** the settled square vs grout. Seventeen cubes doing a long cinematic tumble fights the CTA wave. Token tests and unflip (class removal) get a full rewrite. Easy to blow the 800-line budget and occupancy lock. WAAPI was already rejected in the prior change.
   - Effort: **High** (~400–800+)

3. **C — Hybrid slab + mid-flight tumble, snapped rest (recommended)** — Two transform layers:
   - **Rest / unflip:** keep snapped `rotate3d(var(--flip-x), var(--flip-y), 0, 0deg|180deg)` on `.cube-inner` as a **transition** so second click still interpolates.
   - **Mid-flight:** child (or outer) `@keyframes` that are **identity at 0% and 100%**: `translateZ` lift + limited secondary tilt (use the discarded `flipAxis` component so the wobble stays epicentric). Spine / light-pipe opacity 0 → peak → 0 in the same window.
   - **Material:** idle front stays transparent occupancy glass. During `.is-flipped`, front may take a dark/gray glass wash (backface-hidden at settle). Back stays green glass + `--text` glyph + rim; increase thickness to ~`0.10–0.12 * var(--cell-css)`; slight `border-radius`; neon as **edge**, not body fill. Keep 720ms total so `RIPPLE_SPEED` cadence is unchanged (linear 90° midpoint can become a 50% keyframe on the tumble layer).
   - Pros: Matches reference language (slab, two faces, lift, tumble) without diamonding rest or editing Force Field. Wave, occupancy, reduced-motion instant class, and second-click unflip stay. Authored delta fits 800 lines (likely one auto-chain slice).
   - Cons: Transform on two nodes; unflip may pop the secondary tilt if the animation is cancelled with the class (document; mitigate later only if browser check fails). Token tests that pin a single `rotate3d` transition string must be rewritten to pin **start/end identity of the tumble** plus snapped 180. DESIGN.md “no neon cyberpunk / no glass stacks” still forbids `backdrop-filter` and flooding `#1fdb12` as type — not a 1px occupancy-language rim.
   - Effort: **Medium** (~200–400 authored)

**Reject**

| Reject | Why |
| --- | --- |
| Edit `ForceField.tsx` / shaders | Occupancy/wavy neon already lives there. Hard freeze. |
| Glyphs in WebGL / second context | Overlay lock from `tinity-landing`. |
| `is-settled` flatten | Previously broke the 3D cube. Settled must remain a slab. |
| 10s duration / single-slab hero | Reference is a close-up study, not the 1–N landing. |
| Wavy plasma on cube CSS | Doubles occupancy; not the mesh. |
| Film-grain overlay on faces | Field already has grain; a CSS stamp looks fake. |
| Opaque `#747` plates / 12px graphite spine | Idle occupancy lock. |

### Recommendation

**Approach C.**

Keep `flipAxis` snap as the **rest-pose contract** (Vitest already locks compass + “diagonals snap so 180deg does not diamond”). Encode tumble as a **zero-at-ends** keyframed overlay, optionally driven by the discarded perpendicular so east/west vs north/south still feel epicentric.

Do **not** retune only materials (A): the contact sheet is a tumble, not a thicker hinge. Do **not** unsap the 180 axis (B): that reopens diamond/shear on every numbered cell after the wave.

**TDD:** RED token/Stage tests for (1) idle occupancy glass unchanged, (2) snapped `--flip-x/--flip-y` still one grid axis, (3) tumble keyframes identity at 0% and 100%, (4) no `is-settled`, no `backdrop-filter`, no Force Field edits. Then CSS (+ optional `--flip-tilt`). `pnpm --dir landing test`. Strict TDD is on in `openspec/config.yaml` (ignore stale Engram `sdd-init` `strict_tdd: false`).

**Review budget:** 800 authored lines is enough for C in **one** auto-chain PR if scope stays tokens + delays tilt helper + Stage wrapper/vars + tests. Split only if apply adds a second wrapper file or screenshot goldens.

### Risks

- **Diamond vs grout:** any **constant** 180° axis with both X and Y nonzero reseats the square rotated in-plane. Tumble must be mid-flight only.
- **Unflip pop:** animation on `.is-flipped` is removed with the class; the 180 transition still runs. If the pop reads as a glitch, add a reverse tumble in a later slice — do not jump to WAAPI first.
- **#747 vanish:** transparent faces + linear 720ms was required so 90° is a visible edge. Tumble + lift must keep a lit rim at mid-flip (keyframed spine or face `box-shadow`), not ease-out, not flatten.
- **Idle occupancy mismatch:** gray/metallic fill on the front must not apply when **not** flipping. Occupancy cubes must stay one flat transparent face.
- **DESIGN.md:** no glassmorphism stacks; accent is not body copy; do not invent a second green. Rim may use `--accent` as the field already does.
- **Token regex brittleness:** `Stage.test.tsx` reads `tokens.css` as text; C will fail those tests until they pin the new contracts.
- **Many cubes tumbling:** secondary tilt must stay small (on the order of 8–15deg + modest lift). Full contact-sheet aerobatics on 1–N cells will look noisy.
- **Vendor freeze:** do not “fix” occupancy highlight in cube CSS.

### Ready for Proposal

**Yes.** Recommend C for `landing-reference-flip`. Orchestrator: pause (interactive); present this exploration; then `sdd-propose` if the user accepts hybrid slab + mid-flight tumble with snapped rest, Force Field still frozen.
