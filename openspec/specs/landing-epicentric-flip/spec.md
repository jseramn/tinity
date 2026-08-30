# Delta for landing-epicentric-flip

## ADDED Requirements

### Requirement: Mid-flight tumble and lift

Numbered-cube flips MUST add a secondary tumble and modest lift that is identity at 0% and 100%. Peak tumble MUST be about 8–15 degrees. Rest and settled poses MUST NOT keep tumble or lift. The contact sheet MUST be per-cube motion language and MUST NOT be a 10s single-object hero.

#### Scenario: Tumble is identity at the ends

- GIVEN a numbered cube flipping under normal motion
- WHEN the flip is at 0% and at 100%
- THEN tumble and lift are identity
- AND peak tumble in flight is about 8–15 degrees with modest lift

#### Scenario: Reference is per-cube, not a hero

- GIVEN the cube-animation contact sheet
- WHEN numbered cubes flip on `tinity me`
- THEN each numbered cube uses that motion language in the 1–N wave
- AND the experience is not a 10s single-object hero

### Requirement: Spine light-pipe during flight

The 90° spine MAY light mid-flight 0 → peak → 0. It MUST stay hidden idle and settled. It MUST be a 1–2px hairline and MUST NOT be a 12px `#0c0c0c` bar.

#### Scenario: Spine hidden at rest

- GIVEN numbered cubes idle or settled after a flip
- WHEN the spine is inspected
- THEN it is hidden (not a visible light-pipe)

#### Scenario: Spine MAY light mid-flight

- GIVEN a numbered cube near 90° mid-flip
- WHEN the edge is visible
- THEN the spine MAY emit a brief 0 → peak → 0 light-pipe
- AND the edge stays a 1–2px hairline, not a 12px `#0c0c0c` slab

## MODIFIED Requirements

### Requirement: Occupancy-matched glass idle

Idle numbered cubes MUST share occupancy inset and transparent fill so the Force Field shows through. Occupancy cubes MUST keep that idle glass and MUST NOT change fill, inset, or flip because numbered cubes flip. Numbered cubes MUST NOT idle as opaque gray plates or use `backdrop-filter`. The 90° edge MUST be a 1–2px hairline spine and MUST NOT be a 12px `#0c0c0c` bar.
(Previously: idle glass and hairline for numbered cubes only; occupancy overlay look was not locked against this change.)

#### Scenario: Idle numbers match occupancy

- GIVEN the experience is idle
- WHEN numbered cubes render
- THEN fronts share occupancy inset and transparent fill
- AND the Force Field shows through
- AND `backdrop-filter` and opaque plates are absent

#### Scenario: Occupancy idle glass unchanged

- GIVEN occupancy cubes at idle glass
- WHEN numbered cubes flip or settle
- THEN occupancy cubes keep the same inset and transparent fill
- AND occupancy cubes are not flipped

#### Scenario: Hairline spine not graphite slab

- GIVEN a numbered cube near 90° mid-flip
- WHEN the edge is visible
- THEN the spine is 1–2px hairline, not a 12px `#0c0c0c` slab

### Requirement: Glyph backs without plates

Flipped numbered cubes MUST show `01`–N on the back using `--text`. Mid-flip MUST read two-face: gray/metallic versus green-glass. Settled cubes MUST stay a translucent slab with the field through the face and a neon rim, not fill. The back MUST NOT use an opaque plate. Settled cubes MUST NOT flatten via `is-settled`.
(Previously: flipped backs showed glyphs without an opaque plate; no two-face, settled rim slab, or flatten ban.)

#### Scenario: Flip reveals numbered glyphs

- GIVEN numbered cubes with indices
- WHEN those cubes complete a flip
- THEN backs present matching `01`–N glyphs in `--text` with no opaque gray plate

#### Scenario: Mid-flip two-face

- GIVEN a numbered cube during the flip (not idle, not yet settled)
- WHEN both faces can be distinguished
- THEN one face reads gray/metallic and the other green-glass

#### Scenario: Settled translucent slab with rim

- GIVEN numbered cubes that have completed a flip
- WHEN they rest in the flipped pose
- THEN each is a translucent slab aligned to its cell
- AND the Force Field shows through the face
- AND neon is a rim, not a fill
- AND `is-settled` flatten is absent

### Requirement: Epicentric flip from CTA

On `tinity me`, numbered cubes MUST rotate 180° about a snapped grid axis: the clockwise unit perpendicular of `(tileCenter − CTA origin)` MUST snap to one axis so rest `rotate3d` 180° does not diamond versus grout. The inner edge MUST recede. Occupancy and CTA MUST NOT flip. Radial `flipDelay` MUST stay. The system MUST NOT use WAAPI. Zero length MUST yield `{ x: 0, y: -1 }` finite.
(Previously: 180° about the unsapped clockwise perpendicular; rest pose could diamond on diagonals.)

#### Scenario: Numbered cubes fold away from CTA

- GIVEN idle numbered cubes and CTA origin
- WHEN the visitor activates `tinity me`
- THEN numbered cubes rotate 180° on epicentric snapped axes with inner edges receding

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

#### Scenario: Diagonals snap so 180 does not diamond

- GIVEN a numbered cube whose unsapped perpendicular has both X and Y nonzero
- WHEN the rest flip axis is computed
- THEN the axis snaps to one grid axis (`x` XOR `y` is zero)
- AND the settled 180° square stays aligned to grout (not diamonded)

#### Scenario: Delay stays radial

- GIVEN numbered cubes at different distances from CTA origin
- WHEN flips are scheduled
- THEN stagger uses existing radial `flipDelay` unchanged

### Requirement: Preserved 3D rotor

Numbered cubes MUST keep an inner 3D rotor, hidden backfaces, 720ms linear timing, and thickness about 0.10–0.12 × `--cell-css` so the 90° edge stays visible. Rest pose MUST be snapped `rotate3d` 180° on that rotor. Unflip MUST be CSS 180° → 0°. Reverse tumble MUST NOT be required in this change. Reduced motion MUST apply the flipped or unflipped state instantly with no transition. The system MUST NOT flatten with `is-settled` and MUST NOT use `backdrop-filter` or WAAPI.
(Previously: 720ms linear rotor with unspecified/absolute thickness; unflip and no-flatten were not restated here.)

#### Scenario: Linear 720ms rotor

- GIVEN a numbered cube flipping under normal motion
- WHEN the flip runs
- THEN timing is 720ms linear with hidden backfaces
- AND thickness is about 0.10–0.12 × `--cell-css` at 90°

#### Scenario: Unflip is CSS 180 to 0

- GIVEN numbered cubes in the flipped rest pose
- WHEN the visitor unflips
- THEN the rotor interpolates 180° → 0° in CSS
- AND reverse tumble is not required
- AND WAAPI is not used

#### Scenario: Reduced motion is instant

- GIVEN reduced motion is requested
- WHEN a numbered cube is flipped or unflipped
- THEN the target rest pose applies with no transition

### Requirement: Force Field and fusion layout unchanged

This change MUST NOT modify Force Field, shaders, or three.js, MUST NOT add a second WebGL context, and MUST NOT require or perform edits under `landing/src/components/canvasui/*`. Layout, `cellScale`, and number count MUST remain as implemented.
(Previously: Force Field / three.js freeze without an explicit canvasui path freeze.)

#### Scenario: Force Field and lattice unchanged

- GIVEN implemented fusion roles and Force Field
- WHEN this capability is applied
- THEN Force Field, shader, and three.js sources are unmodified
- AND `cellScale`, number count, and lattice layout stay unchanged

#### Scenario: Canvas UI vendor freeze

- GIVEN files under `landing/src/components/canvasui/`
- WHEN this capability is applied
- THEN those files are unmodified
- AND no requirement in this change depends on editing them
