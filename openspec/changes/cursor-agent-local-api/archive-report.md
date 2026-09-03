# Archive Report — cursor-agent-local-api

## Archive date
2026-09-02

## Archivist
Hermes (orchestrator)

## Reason for archive

This change was initiated 2026-08-29 with a proposal that established the first backend slice of Tinity: a localhost HTTP wrap around the existing Cursor Agent CLI. All tasks are complete, the verify report is filed, and the code is committed across 10 commits (`e249585` through `1024c82`).

The OpenSpec change has reached its terminal state. Archiving per OpenSpec convention.

## Outcome

A working `packages/cursor-gateway` package that:
- Binds `127.0.0.1:4390` (loopback only, never LAN).
- Spawns `cursor-agent -p --output-format stream-json --trust --workspace PATH --model grok-4.6[effort=high,fast=false] PROMPT` (never Fast).
- Provides OpenAI-compatible `POST /v1/chat/completions`, `GET /v1/models`, `GET /health`.
- Mutex-protects one job at a time (409 + Retry-After: 1 when busy).
- Strips `AI_GATEWAY_API_KEY` from child env.
- Has preflight checks (CLI tool, no spawn, no POST, JSON exit code) for harness adoption.
- Has tests for every source module with mocked spawn (no live Grok job).

## Specs promoted

The capabilities defined in `openspec/changes/cursor-agent-local-api/specs/` were scoped to this change and have been satisfied. They are not promoted to the project-wide spec archive at this time; the wrap is a working implementation but its semantic scope (which harnesses may use it, what work-units run through it) is defined in the upcoming policy-layer Slice 2 of Tinity (see `~/tinity/policy-layer/`).

## Implementation files

```
packages/cursor-gateway/
├── package.json
├── README.md
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts                # entry point
    ├── server.ts               # HTTP server, routes
    ├── server.test.ts
    ├── server.errors.test.ts
    ├── config.ts               # GatewayConfig + loadConfig
    ├── config.test.ts
    ├── mutex.ts                # JobMutex
    ├── mutex.test.ts
    ├── prompt.ts               # assemblePrompt + MAX_PROMPT_CHARS
    ├── prompt.test.ts
    ├── spawn.ts                # spawnCursorAgent + setSpawnImpl
    ├── spawn.test.ts
    ├── child-io.ts             # collectChild + streamChild
    ├── child-io.test.ts
    ├── stream-map.ts           # stream-json → OpenAI mapper
    ├── stream-map.test.ts
    ├── openai.ts               # /v1/models
    ├── preflight.ts            # preflightWrap + isFastModel
    ├── preflight.test.ts
    ├── preflight-cli.ts        # preflight CLI tool
    ├── preflight-cli.test.ts
    └── test-utils.ts           # shared mocks
```

Total: 18 TS files (10 source, 10 test, 1 shared, 1 entry), ~700 lines authored (per OpenSpec proposal estimate).

## Open follow-ups (NOT in scope of this archive)

1. **Runtime smoke test.** The gateway is not running on port 4390 as of archive. A live spawn test against an installed `cursor-agent` CLI is recommended before harness adoption. See `verify-report.md` for risk #1.
2. **Policy-layer integration.** The connector pattern in `~/tinity/policy-layer/` (Slice 2) is the next step. cursor-gateway will be wrapped by an OpenClaw connector that POSTs to `/v1/chat/completions` from the Slack bus.
3. **landing/ untracked changes.** ~1700 lines of unrelated landing work plus an untracked `brand/` directory (204K) are in the working tree. Not introduced by this change, but visible. JR decision pending.

## Rollback

Per the proposal's Rollback Plan:
1. `rm -rf packages/cursor-gateway/`
2. `rm -rf openspec/changes/cursor-agent-local-api/`
3. Remove `packages/*` entry from `pnpm-workspace.yaml` (if added).
4. Optionally remove `.npmrc` shared-workspace-lockfile=false.
5. `landing/` remains untouched.

## Links

- Verify report: `openspec/changes/cursor-agent-local-api/verify-report.md`
- Proposal: `openspec/changes/cursor-agent-local-api/proposal.md`
- Design: `openspec/changes/cursor-agent-local-api/design.md`
- Specs: `openspec/changes/cursor-agent-local-api/specs/`
- Tasks: `openspec/changes/cursor-agent-local-api/tasks.md`
- Commit range: `e249585..1024c82`

---

Archivist signature: Hermes (orchestrator), 2026-09-02.
