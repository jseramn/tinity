# Proposal: cursor-agent-local-api

## Intent

Add Tinity's first backend slice: a thin localhost HTTP wrap around the existing Cursor Agent CLI (cursor-agent). The wrap MUST spawn the CLI; it MUST NOT reimplement the agent, talk to Vercel AI Gateway, or mix with Hermes/OpenClaw credentials. This change **explicitly expands the product beyond landing/**.

## Proposal question round

Locked:

1. Spawn, do not reimplement. packages/cursor-gateway/ execs cursor-agent -p --output-format stream-json --trust --workspace PATH --model grok-4.6[effort=high,fast=false] plus the assembled prompt.
2. Local only. Bind 127.0.0.1 port 4390 (3000 Hermes WhatsApp, 18789 OpenClaw, 7437 Engram).
3. One job. Mutex; a second request MUST receive 409 Conflict while busy.
4. OpenAI-compat enough for harnesses. POST /v1/chat/completions with messages[] and stream. GET /health returns {ok, version, busy}.
5. Never Fast. Default model is grok-4.6[effort=high,fast=false]. Auth is Cursor login and optional CURSOR_API_KEY only.
6. Tests mock spawn. Unit tests MUST NOT fire a live Grok job.
7. Non-goals: native serve HTTP, Cloud Agent VMs, landing/ rewrites, Vercel OSS application, git commit/push.

## Scope

### In Scope

OpenSpec change cursor-agent-local-api; packages/cursor-gateway/ Node TypeScript HTTP wrap; Vitest with mocked spawn; workspace entries that MUST NOT break landing/; README for run/env/auth.

### Out of Scope

Reimplementing the agent; Fast models; AI_GATEWAY_API_KEY / Vercel / Minimax; binding 0.0.0.0; concurrent jobs; landing/ UI work; live CLI prompts in tests; git commit or push.

## Capabilities

### New Capabilities

- cursor-gateway-http: loopback OpenAI-compatible HTTP API, health, mutex, SSE vs collect.
- cursor-agent-spawn: CLI argument assembly, model default, env sanitization, stream-json to OpenAI mapping.

### Modified Capabilities

- None (product expansion; landing/ unchanged).

## Approach

Node (Vitest) matching landing. Runtime is node:http. Spawn the installed cursor-agent binary. Inject spawn in tests.

## Affected Areas

New: this OpenSpec change, packages/cursor-gateway/, workspace yaml. Unchanged: landing/.

## Risks

stream-json field drift; argv prompt length; workspace hoisting vs landing lockfile; mutex is process-local only.

## Rollback Plan

Delete packages/cursor-gateway/, this OpenSpec change, workspace yaml, root .npmrc if added, and any new root package.json. Leave landing/ untouched.

## Dependencies

Existing cursor-agent CLI; Node already used by landing; TypeScript; Vitest. No Cursor Cloud VM.

## Success Criteria

- [ ] OpenSpec artifacts in English with Given/When/Then and RFC 2119
- [ ] gateway tests pass with mocked spawn (no live Grok job)
- [ ] Bind 127.0.0.1:4390; default model grok-4.6[effort=high,fast=false]; busy to 409
- [ ] Files unstaged; no commit
