# Tasks: cursor-agent-local-api

## Review Workload Forecast

Estimated changed lines: ~700-900 authored. 400-line budget risk: High (size:exception for a running gateway slice). Do not commit unless asked.

## Phase 1: Specs and Workspace

- [x] 1.1 Author OpenSpec artifacts in English, Given/When/Then, RFC 2119. Explicitly expand product beyond landing/.
- [x] 1.2 Add workspace yaml (landing, packages/*) and .npmrc shared-workspace-lockfile=false without rewriting landing.

## Phase 2: Tests First

- [x] 2.1 Health {ok, version, busy}; bind 127.0.0.1; default port 4390.
- [x] 2.2 Mutex 409 while busy; health busy true during a held spawn.
- [x] 2.3 Spawn argv includes -p, stream-json, --trust, --workspace, model grok-4.6[effort=high,fast=false]; never Fast.
- [x] 2.4 Prompt = last user + optional system; SSE vs non-stream collect; mock spawn only.

## Phase 3: Implement

- [x] 3.1 Implement packages/cursor-gateway/src with injectable spawn.
- [x] 3.2 README: start, env vars, cursor-agent status, optional CURSOR_API_KEY, never Fast.
- [x] 3.3 package.json scripts test, start, dev. Tests pass without a live Grok job.

## Phase 4: Verify

- [x] 4.1 landing/ untouched aside from workspace membership. No git commit/push. No CloudAgent.
