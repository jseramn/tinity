# Landing Experience Specification

## Purpose

`loader → idle → revealed → decrypted → idle` with 17 tiles, manifesto, reduced motion, one WebGL context, and two-click CTA.

## Requirements

### Requirement: Experience State Machine

The system MUST start in `loader` and enter `idle` only when the document and Force Field or documented HTML fallback are ready. First CTA MUST go `idle → revealed`. All tiles face-up MUST go `revealed → decrypted` after one Glitch burst. Second CTA MUST go `revealed|decrypted → idle` (unmount decrypt, unflip). Authored state MUST be unit-testable without WebGL.

#### Scenario: Two-click machine

- GIVEN `idle`
- WHEN `tinity me` is activated, all 17 tiles flip, then `tinity me` is activated again
- THEN state MUST go `revealed` then `decrypted` after one burst, then `idle` with decrypt unmounted and tiles unflipped

#### Scenario: Loader holds

- GIVEN a fresh load before Force Field or documented fallback is ready
- WHEN the gate is evaluated
- THEN state MUST stay `loader` until document and field/fallback are ready, then enter `idle`

### Requirement: Seventeen Tiles And Manifesto

The system MUST present 17 tiles labeled `01`–`17` with no names or logos. In `decrypted` it MUST show: “Tinity is an agentic systems engineering framework designed to build a harness-of-harnesses infrastructure for AI testing and evaluation. MIT license. The vision is not to replace or drive any other harness out of the market. Tinity exists to be a friend to all, to work alongside other harnesses and orchestrate them, putting advanced tools in creative developers' hands. Layer 8 will be agent-based.” Decrypt Reveal MUST use `#1fdb12` on `#050505`.

#### Scenario: Tiles and manifesto

- GIVEN `revealed` then `decrypted`
- WHEN tiles and the decrypt surface are inspected
- THEN tiles MUST be `01`–`17` with no names or logos, and manifesto copy and colors MUST match

### Requirement: Reduced Motion And One WebGL Context

When reduced motion is preferred, the system MUST skip wave and burst, show tiles and manifesto immediately, and keep the two-click toggle. The system MUST NOT keep more than one of Force Field, Glitch, and Decrypt Reveal live. Idle MUST be Force Field only. After reveal without reduced motion, Force Field MUST unmount, one burst MUST run, then Decrypt Reveal MUST be live.

#### Scenario: Reduced motion

- GIVEN `prefers-reduced-motion: reduce` and `idle`
- WHEN `tinity me` is activated twice
- THEN the first MUST show tiles and manifesto immediately without wave or burst, and the second MUST return `idle`

#### Scenario: One context

- GIVEN `idle` then all 17 flipped without reduced motion
- WHEN live Canvas UI effects are counted
- THEN only Force Field MUST be live in `idle`; the three MUST never be live together; Force Field MUST unmount before the single burst; then Decrypt Reveal MUST be live
