# Proposal: landing-epicentric-flip

## Proposal question round

Locked (auto; no live round): idle numbered cubes match occupancy (transparent fill, same inset), not gray plates; they flip to `01`–N; occupancy and CTA do not; CTA is the epicenter; `flipDelay` stays; `rotate3d` axis is perpendicular to `(tileCenter − origin)` with inner edge receding; no Force Field/shader/three.js; do not amend `tinity-landing`, `landing-3d-field`, or `landing-field-fusion`. “No glass stacks” forbids `backdrop-filter`, not transparency.

## Intent

Numbered cubes idle as opaque gray cards (#747) and all hinge on one `rotateY(180deg)`. Visitors should see one glass lattice; on `tinity me`, numbered panes should fold away from the CTA.

## Scope

### In Scope
- Occupancy-matched idle; 1–2px hairline spine (not 12px `#0c0c0c`); glyph back without a plate
- Keep #747 rotor: `cube-inner`, backface hidden, 720ms linear, `translateZ`, reduced-motion instant class
- `flipAxis` beside `flipDelay`; Stage `--flip-x`/`--flip-y`; `.is-flipped` → `rotate3d(..., 180deg)`
- Vitest compass, coincidence fallback, opposite-side signs; occupancy/CTA never flipped

### Out of Scope
- Force Field, shaders, three.js, WAAPI, prior OpenSpec folders
- Layout, `cellScale`, number count, manifesto, Glitch/Decrypt, Approach B (gray plates)

## Capabilities

### New Capabilities
- `landing-epicentric-flip`: occupancy-matched glass numbered cubes; epicentric `rotate3d` from CTA; occupancy and CTA stay unflipped.

### Modified Capabilities
- None (`openspec/specs/` empty)

## Approach

Faces A + rotation R1. `flipAxis` returns `{ x: dy/len, y: -dx/len }` (clockwise perpendicular of tile-center minus CTA origin); `len === 0` → `{ x: 0, y: -1 }`. If the inner edge advances in browser check, invert once — do not adopt WAAPI. Glyphs use `--text`. TDD: RED `flipAxis`, then tokens and Stage.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `landing/src/styles/tokens.css` | Modified | Glass idle; thin spine; `rotate3d` vars |
| `landing/src/experience/delays.ts` | Modified | Add `flipAxis` + tests |
| `landing/src/experience/Stage.tsx` | Modified | CSS vars; Cube memo + tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| 90° vanish (#747) | Med | Keep linear 720ms and a visible edge |
| Idle spine bar | Med | 1–2px hairline |
| Axis sign vs CSS Y | Med | Vitest table; one invert if needed |
| Stale Cube memo | Low | Include flip CSS vars or origin |

## Rollback Plan

Revert tokens, `flipAxis`, Stage vars/memo, and tests. Fusion layout stays.

## Dependencies

Implemented `landing-field-fusion` roles and `ctaOrigin`. Vitest `pnpm --dir landing test`. Ignore Engram `sdd-init` `strict_tdd: false`.

## Success Criteria

- [ ] Idle numbered cubes share occupancy inset and transparent fill; field shows through
- [ ] Numbered cubes flip to `01`–N on epicentric axes (inner edge recedes); occupancy and CTA never flip
- [ ] `flipAxis` tested; no Force Field/shader/three.js edits; Vitest green
