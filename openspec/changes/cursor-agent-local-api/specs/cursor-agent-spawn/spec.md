# Cursor Agent Spawn Specification

## Purpose

Spawn the existing cursor-agent CLI. Do not reimplement the agent. Do not use Hermes/OpenClaw/Vercel AI Gateway credentials.

## Requirements

### Requirement: CLI spawn and model

The wrap MUST spawn cursor-agent (or CURSOR_AGENT_BIN) with -p, --output-format stream-json, --trust, --workspace PATH, and --model. The default model MUST be grok-4.6[effort=high,fast=false]. The wrap MUST NOT enable Fast. The wrap MUST NOT reimplement agent tools.

#### Scenario: CLI spawn and model

- GIVEN default config and a mocked spawn
- WHEN a chat completion is handled
- THEN spawn MUST be called with -p, --output-format, stream-json, --trust, --workspace, --model, and grok-4.6[effort=high,fast=false], and the model string MUST NOT contain fast=true

### Requirement: Auth and env isolation

The wrap MUST authenticate via Cursor login already present on the host and MAY pass CURSOR_API_KEY through to the child. The wrap MUST NOT pass AI_GATEWAY_API_KEY into the child environment.

#### Scenario: Auth and env isolation

- GIVEN a parent environment that contains both CURSOR_API_KEY and AI_GATEWAY_API_KEY
- WHEN cursor-agent is spawned
- THEN the child env MUST include CURSOR_API_KEY and MUST NOT include AI_GATEWAY_API_KEY

### Requirement: Faithful stream-json mapping

The wrap MUST map documented assistant text events to OpenAI content deltas and MUST treat result as terminal. If an event type is unknown, the wrap SHOULD pass through assistant text from JSON fields it can parse and MUST ignore lines it cannot parse.

#### Scenario: Faithful stream-json mapping

- GIVEN NDJSON assistant Hi then result Hi
- WHEN events are mapped
- THEN the collected assistant text MUST be Hi without duplicating the terminal result when assistant deltas already supplied it
- GIVEN an unknown event with parseable message text Wow
- WHEN events are mapped
- THEN the mapper SHOULD emit Wow as assistant text
