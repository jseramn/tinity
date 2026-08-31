# Cursor Gateway HTTP Specification

## Purpose

Loopback HTTP API that exposes health and OpenAI-compatible chat completions for harnesses. This capability expands Tinity beyond landing/.

## Requirements

### Requirement: Product expansion

The system MUST add packages/cursor-gateway/ as a first-class Tinity package, and MUST NOT rewrite landing/ to ship this slice.

#### Scenario: Product expansion

- GIVEN the tinity repo with an existing landing/ Vite app
- WHEN change cursor-agent-local-api is applied
- THEN packages/cursor-gateway/ MUST exist, landing/ MUST remain the marketing app, and the product MUST no longer be landing-only

### Requirement: Health and loopback

The system MUST serve GET /health as JSON {ok, version, busy}, MUST bind 127.0.0.1 only, and MUST default to port 4390.

#### Scenario: Health and loopback

- GIVEN the gateway process is started with default config
- WHEN a client calls GET /health on the bound address
- THEN the response MUST be 200 with {ok: true, version: semver, busy: boolean}, the listen address MUST be 127.0.0.1, and the configured port MUST default to 4390

### Requirement: One job mutex

The system MUST allow at most one concurrent cursor-agent job. While a job is running, a new POST /v1/chat/completions MUST fail with 409 Conflict.

#### Scenario: One job mutex

- GIVEN a chat request whose spawned process has not yet exited
- WHEN a second POST /v1/chat/completions arrives
- THEN the second response MUST be 409, GET /health MUST report busy: true, and after the first job ends a later request MUST be accepted

### Requirement: Prompt and OpenAI mapping

The system MUST accept POST /v1/chat/completions with messages[] and stream, MUST assemble the CLI prompt from the last user text plus optional system text, MUST emit SSE OpenAI chunks when stream is true, and MUST return a collected chat.completion object when stream is false. Tests MUST mock spawn and MUST NOT fire a live Grok job.

#### Scenario: Prompt and OpenAI mapping

- GIVEN messages with system and user roles and a mocked CLI that emits stream-json assistant then result
- WHEN stream is true
- THEN the process argv prompt MUST include the system and last user text, and the HTTP body MUST be text/event-stream with data: OpenAI chunks and data: [DONE]
- GIVEN the same messages and mock
- WHEN stream is false
- THEN the response MUST be JSON object chat.completion whose assistant content contains the mocked text
