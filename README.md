# Tinity

Tinity is an agentic systems engineering framework: a harness-of-harnesses for AI testing and evaluation. It exists to work alongside other harnesses, not to replace them — a friend to all harnesses. Layer 8 will be agent-based: orchestrate runtimes, sandboxes, and fleets so developers can study, evaluate, and ship with advanced tools.

## Current state

This repository ships a marketing landing only. It is a Vite React 19 page (public path `/tinity/`), not the orchestrator runtime. There is no in-tree harness, sandbox controller, or fleet scheduler yet.

The public click path is idle/revealed overlay: numbered tiles plus the `tinity me` control. The manifesto string lives in `landing/src/experience/copy.ts` and is not rendered on screen.

## Stack

| Piece | Role |
|-------|------|
| Vite + React 19 | Landing app under `landing/` |
| Vitest | Unit tests (`jsdom`, no WebGL required) |
| pnpm | Package manager for `landing/` |
| `landing/DESIGN.md` | Brand source of truth (Geist, 4px grid, dark-first, accent `#1fdb12`) |
| OpenSpec | Specs and archived changes under `openspec/` |

## Run

From the repository root. `landing/node_modules` is already present; do not install.

```bash
pnpm --dir landing test
pnpm --dir landing dev
pnpm --dir landing build
```

Vite `base` is `/tinity/`. Production asset URLs start with that prefix.

## License

MIT. Copyright 2026 Jose Ramon. See [LICENSE](LICENSE).

## Related work

WebMCP hackathon work is a separate product, not this repository.

## Community

- [Code of Conduct](CODE_OF_CONDUCT.md) (Contributor Covenant 2.1)
- [LICENSE](LICENSE)
