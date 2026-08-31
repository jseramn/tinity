# cursor-gateway

Thin localhost HTTP wrap around the existing cursor-agent CLI.
It spawns the CLI; it does not reimplement the agent.
Tinity product expansion beyond landing/.

Bind: 127.0.0.1:4390 (3000 Hermes WhatsApp, 18789 OpenClaw, 7437 Engram).

## Run

Use package scripts test, start, and dev.

Package scripts: test, start, dev. See package.json.
    pnpm --dir packages/cursor-gateway start
Tests mock spawn and must not fire a live Grok job.

## Env

- CURSOR_GATEWAY_PORT: 4390. Host is always 127.0.0.1.
- CURSOR_AGENT_BIN: cursor-agent
- CURSOR_AGENT_MODEL: grok-4.6[effort=high,fast=false] (never Fast)
- CURSOR_AGENT_WORKSPACE: process cwd

## Auth

cursor-agent status (Cursor login). Optional CURSOR_API_KEY is inherited.
Do not use AI_GATEWAY_API_KEY here.

## Spawn argv

cursor-agent -p --output-format stream-json --trust --workspace PATH
--model grok-4.6[effort=high,fast=false] PROMPT
One job at a time. Busy POST returns 409 Conflict.

## Endpoints

- GET /health -> {ok, version, busy}
- POST /v1/chat/completions (messages[], stream)
