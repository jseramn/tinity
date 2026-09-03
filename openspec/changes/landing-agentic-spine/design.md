# Design: landing-agentic-spine

Vite + React 19 in `landing/` (`base: '/tinity/'`). Marketing sections wrap the existing Stage. Tokens from `landing/DESIGN.md` only. Skills inform craft; DESIGN.md wins on conflict (no GSAP, no second accent, no em-dash rewrites of locked copy).

## Technical Approach

1. Lift the viewport lock on `html, body, #root`. `.stage` is `height: 100%` inside a `100svh` hero grid (`auto 1fr auto`: Nav / Stage / caption).
2. Stage measures its box via `getBoundingClientRect`, falling back to `visualViewport` when the box is `0` (jsdom).
3. Credits become a flow footer. `reservedRows` stays for the lattice bottom.
4. Content modules (`harnesses`, `slices`, `faq`, `community`, `changelog.json`) feed the sections.
5. `scripts/content.mjs` parses `CHANGELOG.md`, copies DESIGN.md, writes twins under `landing/public/`.
6. `useSurface` / `useWindow` sync `?surface=` and `?w=` through the History API.
7. Windows are one native `<dialog>`. Stage ignores Escape while `dialog[open]`.

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|----------|---------|----------|--------|
| Routing | subpages / hash+query | Subpages need a router and break the Vite SPA contract | **One page** |
| Nav | sticky mega-nav / hero-row lockup | Mega-nav fights the lattice | **52px lockup row** |
| Trust bar | vendor logos / readiness | User refused "works with" | **RUNS ON v0.1.0 + idle pips** |
| Hub | CSS grid / SVG ring | Need spokes and motion | **SVG + hubLayout.ts** |
| Changelog | hand JSON / generated | Drift | **CHANGELOG.md → json** |
| Agent twin | separate host / same origin | Agents must not navigate away | **`?surface=agent` + public markdown** |
| Windows | custom modal / `<dialog>` | Focus trap and ESC for free | **`<dialog>`** |

## Data Flow

```
CHANGELOG.md --content.mjs--> changelog.json + public/changelog.md
DESIGN.md   --content.mjs--> public/design.md
agents.ts   --> harnesses.ts (status: idle)
App --> HeroShell(Nav, Stage, Caption) --> StatusBar --> Hub --> Slices --> Changelog --> Community --> Faq --> Footer
?surface=agent --> AgentSurface (index.md + Copy page)
?w=docs|changelog --> WindowHost <dialog>
```

## Risks

Hero Stage used to set inline `100dvh` pixels, so min(rect, view) never shrank. Measure the parent box; do not write viewport pixels back onto `.stage`.
