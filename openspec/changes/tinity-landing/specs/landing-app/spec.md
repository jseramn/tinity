# Landing App Specification

## Purpose

Vite React 19 app under `landing/` with DESIGN.md tokens, Geist, Vitest, and CTA `tinity me`.

## Requirements

### Requirement: Vite React 19 Scaffold

The system MUST ship a Vite + React 19 + TypeScript app at `landing/` only with `base` `/tinity/`, and MUST NOT require an Astro or portfolio mount.

#### Scenario: Base and React 19

- GIVEN a production landing build
- WHEN assets and the manifest are inspected
- THEN public paths MUST start with `/tinity/` and `react` MUST be 19.x

### Requirement: Tokens Geist CTA Vitest

The system MUST apply DESIGN.md dark-first tokens (`#1fdb12` / `#061008`), MUST use Geist Sans/Mono only, MUST NOT edit `landing/DESIGN.md` or add a second accent, MUST show one primary `tinity me` control, and MUST provide Vitest tests that run without WebGL.

#### Scenario: Brand CTA tests

- GIVEN `idle`, no theme override, and a host without WebGL
- WHEN first paint completes, DESIGN.md is compared to pre-change, and the unit suite runs
- THEN dark tokens and `#1fdb12` MUST apply, DESIGN.md MUST be unchanged, one primary `tinity me` MUST be visible, and the suite MUST complete without WebGL
