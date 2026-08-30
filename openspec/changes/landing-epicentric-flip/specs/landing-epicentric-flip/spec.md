# landing-epicentric-flip Specification

## Purpose

Numbered cubes idle as occupancy-matched glass. On CTA they fold 180° away from the CTA. Occupancy and CTA never flip. Does not amend `tinity-landing`, `landing-3d-field`, or `landing-field-fusion`.

## Requirements

### Requirement: Occupancy-matched glass idle

Idle numbered cubes MUST share occupancy inset and transparent fill so the Force Field shows through. They MUST NOT idle as opaque gray plates or use `backdrop-filter`. The 90° edge MUST be a 1–2px hairline spine and MUST NOT be a 12px `#0c0c0c` bar.

#### Scenario: Idle numbers match occupancy

- GIVEN the experience is idle
- WHEN numbered cubes render
- THEN fronts share occupancy inset and transparent fill
- AND the Force Field shows through
- AND `backdrop-filter` and opaque plates are absent

#### Scenario: Hairline spine not graphite slab

- GIVEN a numbered cube near 90° mid-flip
- WHEN the edge is visible
- THEN the spine is 1–2px hairline, not a 12px `#0c0c0c` slab

### Requirement: Glyph backs without plates

Flipped numbered cubes MUST show `01`–N on the back using `--text`. The back MUST NOT use an opaque plate.

#### Scenario: Flip reveals numbered glyphs

- GIVEN numbered cubes with indices
- WHEN those cubes complete a flip
- THEN backs present matching `01`–N glyphs in `--text` with no opaque gray plate

### Requirement: Epicentric flip from CTA

On `tinity me`, numbered cubes MUST rotate 180° about the clockwise unit perpendicular of `(tileCenter − CTA origin)` so the inner edge recedes. Occupancy and CTA MUST NOT flip. Radial `flipDelay` MUST stay. The system MUST NOT use WAAPI. Zero length MUST yield `{ x: 0, y: -1 }` finite.

#### Scenario: Numbered cubes fold away from CTA

- GIVEN idle numbered cubes and CTA origin
- WHEN the visitor activates `tinity me`
- THEN numbered cubes rotate 180° on epicentric axes with inner edges receding

#### Scenario: Occupancy and CTA never flip

- GIVEN occupancy cubes and the CTA
- WHEN the visitor activates `tinity me`
- THEN occupancy cubes and the CTA are not flipped

#### Scenario: Compass axes and coincidence

- GIVEN centers east, west, south, north of CTA origin, plus a coincident center
- WHEN flip axes are computed
- THEN east is `{ x: 0, y: -1 }`, west `{ x: 0, y: 1 }`, south `{ x: 1, y: 0 }`, north `{ x: -1, y: 0 }`
- AND coincidence yields `{ x: 0, y: -1 }` finite
- AND opposite sides receive opposite signs

#### Scenario: Delay stays radial

- GIVEN numbered cubes at different distances from CTA origin
- WHEN flips are scheduled
- THEN stagger uses existing radial `flipDelay` unchanged

### Requirement: Preserved 3D rotor

Numbered cubes MUST keep an inner 3D rotor, hidden backfaces, 720ms linear timing, and thickness so the 90° edge stays visible. Reduced motion MUST apply the flipped state instantly with no transition.

#### Scenario: Linear 720ms rotor

- GIVEN a numbered cube flipping under normal motion
- WHEN the flip runs
- THEN timing is 720ms linear with hidden backfaces and thickness at 90°

#### Scenario: Reduced motion is instant

- GIVEN reduced motion is requested
- WHEN a numbered cube is flipped
- THEN the flipped state applies with no transition

### Requirement: Force Field and fusion layout unchanged

This change MUST NOT modify Force Field, shaders, or three.js, and MUST NOT add a second WebGL context. Layout, `cellScale`, and number count MUST remain as implemented.

#### Scenario: Force Field and lattice unchanged

- GIVEN implemented fusion roles and Force Field
- WHEN this capability is applied
- THEN Force Field, shader, and three.js sources are unmodified
- AND `cellScale`, number count, and lattice layout stay unchanged
