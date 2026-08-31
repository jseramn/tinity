# Design: cursor-agent-local-api

Thin node:http wrap in packages/cursor-gateway/ that **spawns** cursor-agent. Does not reimplement the agent. Product expands beyond landing/. Tokens in landing/DESIGN.md are unused here (no UI).

## Technical Approach

TypeScript + Vitest matching landing. Listen on 127.0.0.1:4390. One in-process mutex. Translate OpenAI messages[] into a CLI prompt (last user text + optional system). Map stream-json NDJSON to OpenAI SSE chunks, or collect when stream is false. Tests inject spawn; they MUST NOT exec a live prompt.

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|----------|---------|----------|--------|
| Runtime | A node:http / B Hono / C Express | B/C add deps | **A node:http** |
| Agent | Wrap CLI / reimplement HTTP client | Reimplement fights Cursor login | **Spawn CLI** |
| Model | CLI default low / wrap high | Fast is forbidden | **grok-4.6[effort=high,fast=false]** |
| Bind | 127.0.0.1 / 0.0.0.0 | Public bind races other local APIs | **127.0.0.1:4390** |
| Concurrency | Mutex / queue / parallel | CLI + Grok load | **Mutex, 409 if busy** |
| Auth | Cursor login / CURSOR_API_KEY / AI Gateway | Gateway keys MUST NOT leak in | **Login + optional CURSOR_API_KEY** |
| Stream | stream-json / text / json | Need SSE mapping | **stream-json** |
| Tests | Live CLI / mock spawn | Live costs and load | **mock spawn** |

## Data Flow

POST /v1/chat/completions parses messages, assembles prompt, try-acquires mutex (else 409), spawns cursor-agent, maps NDJSON. stream=true yields SSE; stream=false collects JSON. Mutex is released on end or error. Child past CURSOR_AGENT_TIMEOUT_MS (default 600000) is SIGTERM; non-stream clients get 504 and the mutex is released.

## File Changes

New: this OpenSpec folder, packages/cursor-gateway/, workspace yaml, .npmrc, root package.json. Modify openspec/config.yaml context. Keep landing/ unchanged.

## Interfaces / Contracts

GET /health -> {ok, version, busy, workspace, model, jobTimeoutMs}. workspace is the spawn --workspace path. model is wrap config after Fast-off. GET /v1/models -> OpenAI list with that same model (never Fast), no spawn. POST /v1/chat/completions with messages[] and stream. Spawn argv: -p --output-format stream-json --trust --workspace --model plus prompt.

Harness preflight (inspectHealth / inspectModelsList / preflightWrap) MUST GET /health then GET /v1/models. Refuse when health lacks workspace or model (live-old process), /v1/models is 404, busy, workspace mismatches the job tree, model is Fast, or model omits fast=false. HTTP timeout 2000ms. Do not POST Casos work at a wrap bound to another tree.

stream-json: assistant text -> OpenAI delta; result -> stop; unknown JSON SHOULD pass through parseable assistant text.

## Open Questions

Future stream-json fields. Whether a later slice should pass --stream-partial-output.
