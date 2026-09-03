# Tasks: policy-layer (Tinity Slice 2)

## Review Workload Forecast

Estimated changed lines: ~800-1100 authored across Slice 2.0 (this change), 2.1, 2.2.
400-line budget risk: Medium. `size:exception` requested for 2.0 if needed.
Do not commit unless asked.

## Phase 1: Specs and skeleton

- [x] 1.1 Author OpenSpec artifacts in English, Given/When/Then, RFC 2119.
- [x] 1.2 Create `packages/policy-layer/` skeleton with src/{connector,policy,audit,escalation}, tests, docs.
- [x] 1.3 Document hierarchy (Hermes ↔ OpenClaw ↔ Slack ↔ Harnesses) in package README.

## Phase 2: Tests first

- [x] 2.1 Connector interface (`Connector`, ConnectorContext, OutboundMessage, InboundMessage).
- [x] 2.2 Channel reservation: isReservedChannel(), assertHarnessChannel() — throws CHANNEL_FORBIDDEN.
- [x] 2.3 MockConnector: start, stop, health, send, on, unsubscribe, injectInbound.
- [x] 2.5 ConnectorError with codes: BUSY, TIMEOUT, INVALID_PAYLOAD, CHANNEL_FORBIDDEN, HARNESS_DOWN, UNKNOWN.

## Phase 3: Implement

- [x] 3.1 types.ts: Connector, ConnectorContext, MessageReceipt, HealthReport.
- [x] 3.2 context.ts: createContext() factory with logger, metrics, cancel signal.
- [x] 3.3 mock.ts: MockConnector implementation with alwaysFail and ackDelay options.
- [x] 3.4 index.ts: barrel export.
- [x] 3.5 docs/connector-pattern.md: spec of the interface and channel rules.
- [x] 3.6 docs/openclaw-hermes-contract.md: OpenClawDirective, OpenClawReport schema (informal until Zod).

## Phase 4: Verify

- [x] 4.1 tests/connector.test.ts: channel reservation, error codes (10 tests).
- [x] 4.2 tests/mock.test.ts: MockConnector lifecycle, send/receive, failure modes (6 tests).
- [x] 4.3 All tests pass without network access (16 tests total, 199ms).
- [x] 4.4 landing/ and cursor-gateway/ untouched.

## Slice 2.0 scope (this change)

This change ships the base. Slice 2.1 will add:
- Zod validation for OpenClawDirective/OpenClawReport
- better-sqlite3 audit log
- CLI tool (`tinity policy`)
- Escalation rule engine

Slice 2.2 will add:
- Work-unit T7 (peer alignment)
- Integration test against cursor-gateway (mocked)
- Channel reservation tests with live Slack MCP (out-of-repo)

## Open questions for JR (deferred to Slice 2.1)

1. **Audit log retention** — 90 days minimum OK? Compress after?
2. **Escalation thresholds** — 3 strikes default OK? Configurable per harness?
3. **CLI scope** — `inspect` + `simulate` + `replay` enough, or also `tail` for live audit?
4. **Work-unit T7 wording** — "alignment with peer" precise enough, or do we need a template?

## Follow-ups (out of scope of any slice)

- landing/ untracked changes + brand/ — JR decision.
- GrokBot trial requires Slice 2.1+ to be functional.
