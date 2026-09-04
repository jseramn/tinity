# Tinity

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/?utm_source=tinity&utm_campaign=oss)
[![made with canvasui](https://img.shields.io/badge/made%20with-canvasui-1fdb12)](https://canvasui.dev)

Tinity is an agentic systems engineering framework: a harness-of-harnesses for AI testing and evaluation. It exists to work alongside other harnesses, not to replace them — a friend to all harnesses. Layer 8 will be agent-based: orchestrate runtimes, sandboxes, and fleets so developers can study, evaluate, and ship with advanced tools.

Current release: **v0.1.0**.

## Links

Production surface: [tinity.jseramn.tech](https://tinity.jseramn.tech). Legacy path [jseramn.tech/tinity](https://www.jseramn.tech/tinity/) will redirect to the subdomain once cutover completes.

- [Changelog](CHANGELOG.md)
- [Agent twin](landing/public/llms.txt)
- X [@jseramn_](https://x.com/jseramn_)
- X [@tinityorch](https://x.com/tinityorch)
- [jseramn.tech](https://jseramn.tech)

## Deploy model

Tinity is a monorepo that deploys the `/landing` sub-project only. The repo root contains `landing/`, `packages/`, `openspec/`. The repo-level `vercel.json` declares `framework: "vite"` and `outputDirectory: "landing/dist"`. The landing's own `landing/vercel.json` declares `outputDirectory: "dist"` (relative to the landing root when Vercel uses root directory `landing/`).

Vercel project for Tinity should:
- Point to this repository
- Set root directory to `landing/`
- Use production domain `tinity.jseramn.tech`
- Use preview domains `*.tinity.jseramn.tech` for PR previews

Portfolio is a separate repo (`github.com/jseramn/portfolio`) on Astro. Portfolio does not contain Tinity source code. Each repo has its own Vercel project and its own domain.

See `openspec/changes/landing-domain-split/` for the full deploy-isolation plan.

## Current state

This repository ships a marketing landing under landing/ (Vite React 19, public path /tinity/) plus packages/cursor-gateway, a localhost HTTP wrap that spawns the existing cursor-agent CLI. There is not yet an in-tree sandbox controller or fleet scheduler.

The landing is a scrolling spine: Stage lattice hero (`tinity me`), status ribbon, hub, slices, changelog, community, FAQ. HUMAN/AGENT is a surface switch on the same URL. The manifesto string also lives in `landing/src/experience/copy.ts`.

## Stack

| Piece | Role |
|-------|------|
| Vite + React 19 | Landing app under `landing/` |
| Vitest | Unit tests (`jsdom`, no WebGL required) |
| pnpm | Package manager for landing/ and packages/ |
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

Intended static host is Vercel (`vercel.json` at the repo root). Live production is the portfolio copy at jseramn.tech/tinity.

Local wrap (127.0.0.1:4390). Package deps already present; do not install. See packages/cursor-gateway/README.md. Tests mock spawn and must not fire a live Grok job.

## License

MIT. Copyright 2026 Jose Ramon. See [LICENSE](LICENSE).

## Related work

WebMCP hackathon work is a separate product, not this repository.

## Community

- [Code of Conduct](CODE_OF_CONDUCT.md) (Contributor Covenant 2.1)
- [Contributing](CONTRIBUTING.md)
- [LICENSE](LICENSE)
