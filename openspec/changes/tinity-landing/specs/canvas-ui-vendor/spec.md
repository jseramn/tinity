# Canvas UI Vendor Specification

## Purpose

Copied Force Field, Glitch, Decrypt Reveal, `rect-cache`, and impact/burst adapters; square green lattice; no shader edits.

## Requirements

### Requirement: Copied Trio And Rect Cache

The system MUST include copied Canvas UI React Force Field, Glitch, Decrypt Reveal, and `rect-cache`, and MUST NOT add Base UI, MUI, or a full shadcn theme kit.

#### Scenario: Vendor present

- GIVEN the landing source tree
- WHEN sources and dependencies are inspected
- THEN the trio and `rect-cache` MUST be present and those kits MUST be absent

### Requirement: Adapters Lattice And Burst Policy

The system MUST NOT modify vendor shader source. Adapters MUST invoke Force Field `impact` and Glitch `burst`. While Force Field is live, cells MUST be square, scale 8–10, color `#1fdb12`. Glitch MUST NOT auto-burst.

#### Scenario: Shaders and engine calls

- GIVEN copied files and a live Force Field or Glitch
- WHEN shaders are compared to upstream and a ripple or burst is requested
- THEN shader strings MUST be unchanged, and `impact` MUST run at the pointer origin or `burst` once

#### Scenario: Lattice and no auto-burst

- GIVEN `idle` Force Field, then Glitch mounted for post-reveal
- WHEN the field is inspected and no adapter burst was requested
- THEN cells MUST be square, scale 8–10, color `#1fdb12`, and Glitch MUST NOT auto-burst
