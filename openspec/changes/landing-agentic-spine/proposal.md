# Proposal: landing-agentic-spine

## Intent

Turn the single-viewport Tinity lattice into an agent-native marketing page on `/tinity`: nav, Stage as hero, status ribbon, hub topology, honest slices, changelog, community, FAQ, floating windows, and a HUMAN/AGENT surface. Source of truth stays `landing/`. Production stays the portfolio copy at `jseramn.tech/tinity`, synced later by `pnpm tinity:pull`.

## Proposal question round

Locked:

1. **One page.** No subpages. Hash sections. Windows via `?w=`. Agent surface via `?surface=agent`.
2. **Keep.** Stage, CTA name `tinity me`, 17 raster marks, canvasui freeze, accent `#1fdb12`, Geist, no YC badge.
3. **Honesty.** Present tense only for shipped work (landing, cursor-gateway v0.1.0, connector library). Layer 8, eval, Slack bus, fleets, sandboxes are next or later.
4. **Brand.** `brand/tinity-mark.svg` and `brand/tinity-lockup.svg`.
5. **Skills.** Project-level design skills in `.agents/skills/` with `skills-lock.json`. `landing/DESIGN.md` beats skill defaults.

## Scope

### In Scope

- `landing/` marketing spine, content modules, public twins, DESIGN.md §13–15
- Root `CHANGELOG.md`, root `package.json` version `0.1.0`, `scripts/content.mjs`
- OpenSpec change docs and committed skills

### Out of Scope

- Editing `landing/src/components/canvasui/*`
- Live Slack, OpenClaw runtime, eval platform claims
- Portfolio sync script (separate change on `jseramn/portfolio`)
- Changing the CTA accessible name

## Capabilities

### New Capabilities

- `landing-marketing-spine`: scrolling page with hero shell, status, hub, slices, changelog, community, FAQ, footer
- `landing-agent-surface`: `?surface=agent`, markdown twins, Copy page, `llms.txt`
- `landing-windows`: native `<dialog>` windows deep-linked by `?w=`

### Modified Capabilities

- `landing-app`: lift `overflow: hidden` on `html, body, #root`; Stage fills the hero box
- `landing-experience`: Escape unflips only when no dialog is open

## Approach

Compose marketing React sections around the existing Stage. Content is data files. Changelog JSON is generated from `CHANGELOG.md`. Twins are static files under `landing/public/`. Tests stay Vitest/jsdom.

## Affected Areas

New: `landing/src/marketing/`, `landing/src/content/`, `landing/public/`, `scripts/content.mjs`, this OpenSpec change.
Modified: `App.tsx`, `tokens.css`, `credits.css`, `index.html`, `Stage.tsx` (Escape + box sizing), `DESIGN.md`, `README.md`, root `package.json`.
Unchanged: canvasui vendor, cursor-gateway, policy-layer runtime.

## Risks

- Stage still sized itself to the viewport via inline pixels; measuring the parent box is required so the lattice fits under the nav.
- Escape currently means unflip; dialogs must swallow it first.
- Copy can over-claim Layer 8. A copy-lint test forbids present-tense product fiction.

## Rollback Plan

Revert this change. The previous page is Stage + fixed Credits.

## Success Criteria

- [ ] `/tinity` scrolls; Stage remains the hero; `tinity me` is the only accent action
- [ ] Status ribbon shows `RUNS ON v0.1.0` and 17 idle pips
- [ ] Hub has 17 spokes into a Tinity center
- [ ] HUMAN/AGENT switch and `?w=` windows work
- [ ] `pnpm --dir landing test` and `pnpm --dir landing build` pass
