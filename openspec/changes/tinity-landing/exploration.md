## Exploration: tinity-landing

Recommend **Approach A**: a Vite + React 19 + TypeScript app under `landing/` that copies Canvas UI Force Field / Glitch / Decrypt Reveal and drives numbers 1–17 as a **DOM overlay** synced to the click wave. Do not put glyphs in the shader. Do not ship a Chrome origin-trial token in v1.

### Current State

The repo is greenfield product intent, not an application.

| Present | Absent |
|---------|--------|
| `README.md`, MIT `LICENSE`, `landing/DESIGN.md` (brand tokens only) | `package.json`, Vite/Vitest, `src/`, tests, CI |
| `openspec/` bootstrap (`config.yaml`, empty `specs/` and `changes/`) | `openspec/changes/tinity-landing/` besides this file |
| `.engram/config.json` (`project` + `project_name`: tinity) | Application symbols in CodeGraph |
| `.codegraph/` index (empty of app code) | Portfolio/Astro mount, Base UI, MUI |

`sdd-init/tinity` matches this: intended landing is Vite + React 19 + Vitest under `landing/`. Brand source of truth is **`landing/DESIGN.md`** (accent `#1fdb12`, Geist Sans/Mono, dark-first, 4px grid). Do not use a Descargas `DESIGN.md`. CodeGraph `codegraph_explore` on this tree returned no symbols; filesystem listing is the evidence.

Canvas UI (verified 2026-08-29 against https://canvasui.dev):

| Fact | Evidence |
|------|----------|
| Install | `npx shadcn@latest add @canvas-ui/force-field-react @canvas-ui/glitch-react @canvas-ui/decrypt-reveal-react` |
| Target copy path | CLI default `components/canvasui/`; this change uses `landing/src/components/canvasui/` |
| `shape: "square"` | `ForceFieldShape = "hexagon" \| "triangle" \| "square"`; default `"hexagon"` |
| `cellScale` | Cells across the **shorter** axis (4–80). Default **16**. **8–10 means fewer, larger cells** |
| Color | Default `[0.15, 0.68, 1]` cyan. Brand green is `[31, 219, 18]/255` ≈ `[0.122, 0.859, 0.071]` |
| Ripple | Default `rippleSpeed` 0.5, `rippleWidth` 0.045, `rippleBlend` 1. Target ~1.4–1.8 / 0.015–0.022 / 0.15–0.35 |
| `onHit` | Fired once per pointerdown with CSS-pixel coords relative to the output canvas — **not** per lattice cell |
| `impact(x, y)` | Engine API spawns a ripple; React wrappers **do not** `forwardRef` |
| `burst()` | Glitch engine API; React wrapper **does not** expose it |
| html-in-canvas | Chrome experimental (`chrome://flags/#canvas-draw-element`) + domain-bound origin trial. Components probe `drawElementImage` + `requestPaint` and fall back to live HTML + WebGL overlay |
| Vendor size | ForceField **1337**, Glitch **541**, DecryptReveal **1163** lines; **~3041** with **zero npm deps**. Plus `src/lib/rect-cache.ts` (**27** lines) imported as `../rect-cache` but **not** listed as a registry dependency |

`DecryptReveal` default cipher color is `#4ade80` (not brand). Override to `#1fdb12`, backdrop `#050505`. Glitch default `interval: 3` auto-bursts; v1 must raise interval so only `burst()` runs.

### Affected Areas

- `landing/` — entire first application (scaffold, `vite.config` `base`, experience, tests)
- `landing/DESIGN.md` — read-only brand tokens (do not fork a second palette)
- `landing/src/components/canvasui/` — vendor ForceField, Glitch, DecryptReveal
- `landing/src/components/rect-cache.ts` — vendor helper required by ForceField and DecryptReveal (`import { createRectCache } from "../rect-cache"`)
- `landing/src/experience/` — authored state machine, tile overlay, CTA, loader (new)
- `openspec/config.yaml` `testing:` — flip `strict_tdd` and `test_command` once Vitest exists
- Portfolio `jseramn.tech/tinity` mount — **out of scope**; only `base: '/tinity/'` prepares asset URLs
- `Descargas/DESIGN.md` — **do not touch or copy**

### Approaches

1. **A — Vite + React 19 + copied Canvas UI + DOM tile overlay (plan default)**
   - Copy `@canvas-ui/*-react` into `landing/src/components/canvasui/`. Keep the lattice as a shader. Place 17 numbered tiles in the DOM, positioned on the square grid using the same `min(width,height)/cellScale` math as `squareCell`. Sync flips to the wave with a JS delay from `onHit`/`impact` origin and `rippleSpeed` (onHit is click origin, not a per-cell callback). Thin authored adapters `forwardRef` `impact` / `burst` / `onReady` without editing shader strings.
   - Pros: Matches the brief; official React 19 files; typed `shape`/`cellScale`/`onHit`; HTML fallback without origin trial; tests can own a pure state machine without WebGL.
   - Cons: ~3k vendor lines blow the 400-line review budget; React wrappers hide engine refs; `rect-cache` must be copied by hand; stacking three WebGL2 contexts is unsafe on mobile if all stay mounted.
   - Effort: Medium

2. **B — Vite + vanilla TypeScript Canvas UI flavors**
   - Same shaders via `force-field-vanilla` / `glitch-vanilla` / `decrypt-reveal-vanilla`. `impact` and `burst` are already on the instance. React 19 is dropped.
   - Pros: No hidden refs; slightly less wrapper code.
   - Cons: Still ~3k shader bytes; more manual DOM/lifecycle; fights the requested React 19 + Vitest shape; overlay/state UI still needs a view layer.
   - Effort: Medium–High

3. **C — Custom WebGL, no Canvas UI**
   - Write a square lattice + ripple + decrypt glyph pass.
   - Pros: Overlay math can share uniforms with the shader; vendor diff disappears.
   - Cons: Reimplements Force Field, Glitch, and Decrypt Reveal (glyph atlas matcher is non-trivial). High risk, high lines, no html-in-canvas fallback pedigree.
   - Effort: High

### Recommendation

**A.** Vanilla (B) does not shrink the review bomb and drops the requested React 19 wrappers. Custom WebGL (C) is a product rewrite. A is the only path that ships the named Canvas UI components, square lattice, brand green, and testable machine without inventing a renderer.

**First-slice must land**

1. `landing/` Vite + React 19 + TypeScript. `base: '/tinity/'` (trailing slash is the Vite-safe form of `'/tinity'`).
2. CSS tokens from `landing/DESIGN.md` only. CTA label `tinity me` (primary fill `#1fdb12`, on-accent `#061008`).
3. Vendor: three React files + `rect-cache.ts`. Do not add Base UI, MUI, or a full shadcn theme kit.
4. Authored adapters that expose `impact`, `burst`, and canvas-ready (WebGL2 instance or documented fallback).
5. Pure state machine: `loader → idle → revealed → decrypted → idle`, Vitest, no WebGL in unit tests.
6. Loader until DOM + Force Field instance (or fallback). Idle: full-viewport square field, `cellScale` 8–10, green, faster/narrower ripple.
7. CTA click/tap: wave + schedule 17 DOM tiles (relief = hairline + `surface` flip, **not** drop shadows). Second click from `revealed` or `decrypted` resets tiles and unmounts decrypt.
8. When 17 are face-up: `burst()`, then mount Decrypt Reveal over the manifesto (cursor `radius`, brand color). Keep **one** heavy WebGL effect live; do not stack Force Field + Glitch + Decrypt Reveal.
9. Copy (English): Tinity is an agentic systems engineering framework / harness of harnesses for AI testing and evaluation; MIT; friend to all harnesses, does not replace them; Layer 8 will be agent-based.
10. No origin-trial meta/header. No Astro/portfolio integration.

**Suggested machine (lock in propose)**

- `ready` → `idle`
- `cta` from `idle` → `revealed` (spawn wave; flip tiles by distance / `rippleSpeed`)
- `allFlipped` → glitch burst then `decrypted`
- `cta` from `revealed` or `decrypted` → `idle` (unflip, unmount decrypt)

### Risks

- **400-line review budget (primary).** Vendor copy is ~3041 + 27 lines. Authored experience can stay under 400; the combined diff cannot. Delivery must chain PRs or mark the vendor slice `size:exception`. Forecast: `Decision needed before apply: Yes`, `Chained PRs recommended: Yes`, `400-line budget risk: High`.
- **`onHit` is not per-cell.** Tile sync is a JS replica of ripple timing; mismatch vs the shader ring is a visual bug, not an API.
- **React wrappers hide `impact`/`burst`.** Adapters are required; do not fork shaders to add refs.
- **`rect-cache` missing from registry item.** `npx shadcn add` alone will not compile Force Field / Decrypt Reveal until `../rect-cache` exists.
- **html-in-canvas is Chrome-only.** v1 relies on documented HTML + WebGL overlay fallback. Origin trial is out of scope; canvasui.dev’s token does not apply to `jseramn.tech`.
- **WebGL2 context budget.** Mount Glitch only for the burst, then Decrypt Reveal; tear down Force Field when decrypting (or the reverse). Never three contexts at once.
- **Lattice vs overlay math.** Square `cellScale` is tractable; hex would not be. Resize must recompute tile positions.
- **Decrypt default green `#4ade80` and Glitch `interval: 3`.** Easy to ship the wrong brand and a looping glitch.
- **Strict TDD is currently false** (no runner). After Vitest lands, update `openspec/config.yaml` and `sdd/tinity/testing-capabilities`.
- **Geist.** DESIGN.md requires Geist Sans/Mono; include them in the Vite app, not system-only.

### Ready for Proposal

Yes. Orchestrator should run `sdd-propose` for `tinity-landing` with Approach A, hybrid store, `ask-on-risk`, and an explicit vendor-vs-authored PR split. No clarification is required for exploration; propose should still freeze tile placement (which 17 squares) and reduced-motion behavior.
