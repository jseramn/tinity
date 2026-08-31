# cursor-gateway

Thin localhost HTTP wrap around the existing cursor-agent CLI.
It spawns the CLI; it does not reimplement the agent.
Tinity product expansion beyond landing/.

Bind: 127.0.0.1:4390 (3000 Hermes WhatsApp, 18789 OpenClaw, 7437 Engram).

## Run

From repo root. Package node_modules is already present; do not install.

Use package scripts test, start, and preflight. See package.json.

Tests mock spawn and the preflight CLI. They must not fire a live Grok job or POST :4390.

preflight prints one JSON line (preflightWrap) and exits 0 on ok, 1 on refuse. No spawn. No POST.

## Env

- CURSOR_GATEWAY_PORT: 4390. Host is always 127.0.0.1.
- CURSOR_AGENT_BIN: cursor-agent
- CURSOR_AGENT_MODEL: grok-4.6[effort=high,fast=false] (never Fast)
- CURSOR_AGENT_WORKSPACE: process cwd
- CURSOR_AGENT_TIMEOUT_MS: 600000. Hung child is SIGTERM, 504, mutex released.

## Auth

cursor-agent status (Cursor login). Optional CURSOR_API_KEY is inherited.
Do not use AI_GATEWAY_API_KEY here. The wrap strips it from the child env.

## Spawn argv

cursor-agent -p --output-format stream-json --trust --workspace PATH
--model grok-4.6[effort=high,fast=false] PROMPT

No --force. Prompt is the last argv token. One job at a time. Busy POST returns 409 Conflict with Retry-After: 1.

## Endpoints

- GET /health -> {ok, version, busy, workspace, model, jobTimeoutMs, fast}
- GET /v1/models -> OpenAI list of wrap model (never Fast), no spawn
- POST /v1/chat/completions (messages[], stream)

Request model is ignored. Spawn always uses wrap config (high, never Fast).
Harnesses MUST preflight GET /health then GET /v1/models before POST (inspectHealth / inspectModelsList / preflightWrap, or package script preflight): require workspace+model with explicit fast=false, refuse busy, stale health, models 404, workspace mismatch, or Fast. HTTP timeout 2000ms. Ok forwards jobTimeoutMs and fast when present. Do not send Casos work to a wrap bound to another tree.
Missing or empty messages: 400. Concurrent job: 409 plus Retry-After: 1 and error.retry_after. Prompt over 100000 chars: 413, no spawn. Hung child past CURSOR_AGENT_TIMEOUT_MS: 504, mutex released.

## Invariants tests lock

- Host is always 127.0.0.1
- Default model grok-4.6[effort=high,fast=false]; fast=true is coerced off; omitted fast=false is appended
- Child env drops AI_GATEWAY_API_KEY
- One job; 409 while busy includes Retry-After: 1 and error.retry_after
- Prompt over 100000 chars: 413, no spawn
- Health includes workspace, model, jobTimeoutMs, and fast; model never Fast; fast is false
- GET /v1/models lists wrap model; never Fast; no spawn
- preflight refuses stale health, models 404, busy, workspace mismatch, Fast, model without fast=false, health.fast true, or invalid jobTimeoutMs; missing jobTimeoutMs or fast is live-old ok; when present, jobTimeoutMs and fast are forwarded on ok
- Hung child past job timeout: 504, mutex released
- preflight CLI prints JSON, exits 0/1, no spawn, no POST

## Known limits

- Spawn has no --force; spawn also coerces fast=false and appends it when omitted
- Prompt is last argv; wrap rejects over 100000 chars with 413 before spawn
- streamChild still emits thinking-like assistant deltas as SSE
- Not a Vercel Function
- Default job timeout 600000ms (CURSOR_AGENT_TIMEOUT_MS); GET /health exposes jobTimeoutMs

Commands: package scripts test, start, and preflight from packages/cursor-gateway.
