# Proposal: policy-layer (Tinity Slice 2)

## Intent

Promote the existing `~/tinity/policy-layer/` skeleton to a full Slice 2 of Tinity: a connector pattern, audit log, escalation rules, and work-unit dispatcher that runs **above** OpenClaw and **alongside** Slack as the bus. The policy layer is the surface Hermes (orchestrator) uses to command OpenClaw, observe harnesses, and escalate to JR. It is the implementation of the JR↔Hermes↔OpenClaw↔Slack↔Harnesses hierarchy confirmed on 2026-09-02.

## Proposal question round

Locked with JR on 2026-09-02 ~17:50 (see Engram #1097):

1. **Hermes is the connector.** The policy layer implements Hermes's view of the system, not the routers'.
2. **OpenClaw is the chief of Slack.** OpenClaw executes mechanics (routing, translation, posting). The policy layer does not replace it; it commands it.
3. **GrokBot is the cloud peer.** GrokBot has parity rank with Hermes and operates cloud via me (Hermes) as its observable bridge (see Engram #1096).
4. **Slack is the bus.** All inter-agent communication goes through Slack via OpenClaw. There are no peer-to-peer paths.
5. **JR is the architect.** JR receives weekly digests and approves escalations. JR does not micro-manage.

## Scope

### In Scope

- OpenSpec change `policy-layer/`
- `packages/policy-layer/` Node TypeScript package (Vitest, no live Slack/OpenClaw dependencies in tests)
- Connector pattern: `Connector<TAction, TResult>` interface, `ConnectorContext`, `MockConnector` for tests
- OpenClaw contract: `OpenClawDirective`, `OpenClawReport`, anomaly escalations
- Work-unit templates: T1–T6 plus a new T7 (alignment with peer agent)
- Audit log schema: SQLite-backed, queryable by correlation ID
- Escalation rules: when to escalate to JR, when to JR-callback, format of escalations
- Channel reservation: `#tinity-ops`, `#tinity-audit`, `#tinity-jr`, `#tinity-escalation` are Hermes-only or reserved
- CLI tool: `tinity policy <command>` to inspect, simulate, and replay
- README and examples

### Out of Scope

- Reimplementing OpenClaw (it is the router; we do not replace it)
- Building a Slack bot or alternative bus (Slack is the bus; we use it)
- Adopting a real Slack/OpenClaw backend in tests (mocks only — same convention as cursor-gateway)
- Cursor-agent spawn logic (lives in cursor-gateway)
- GrokBot internals (it is closed source; we observe via the contract)
- committing to a run-time (Slice 2 ships a library + CLI; runtime adoption is Slice 3)

## Capabilities

### New Capabilities

- `policy-connector-pattern`: standard interface for any harness to talk to Slack via OpenClaw. Validates channel reservations, prevents harnesses from posting in reserved channels.
- `policy-openclaw-contract`: directives and reports between Hermes and OpenClaw. Includes anomaly detection (3-strike failure, channel timeout, unknown work-unit, channel violation, peer conflict).
- `policy-audit-log`: persistent SQLite log keyed by `correlationId`. Retention 90 days minimum, compressible after. Hermes is the only writer.
- `policy-escalation`: rules for raising things to JR. Atomic actions (publish, send, spend) always escalate. Reversible actions can execute with audit.
- `policy-work-units`: T1–T7 templates. T1–T6 from Engram #1089. T7 is alignment with peer (used during trial with GrokBot).

### Modified Capabilities

- None. policy-layer is additive; it does not change cursor-gateway or landing.

## Approach

- Node + TypeScript (matching landing and cursor-gateway)
- Vitest with mocks (no live Slack, no live OpenClaw, no live GrokBot)
- SQLite via `better-sqlite3` for audit log (sync, fast, embedded)
- Channel reservation enforced in `Connector.send` (throws `ConnectorError.CHANNEL_FORBIDDEN` for harnesses posting in reserved channels)
- Anomaly detection in `OpenClawDirective.receive` (consumed by a watcher, posts to `#tinity-escalation`)
- Work-unit templates as TS const objects with Zod validation (when added in Slice 2.1)

## Affected Areas

- New: `packages/policy-layer/`, this OpenSpec change, README
- Unchanged: `landing/`, `packages/cursor-gateway/`

## Risks

1. **SQLite in a TypeScript package** adds native dep. Mitigation: better-sqlite3 is widely used, prebuilt for Node 24.
2. **Channel reservation enforcement** requires every connector to use the policy layer. If a harness bypasses, security leaks. Mitigation: documented adoption path; OpenClaw is the only Slack poster by design.
3. **Anomaly detection false positives** could flood `#tinity-escalation`. Mitigation: configurable thresholds (default 3 strikes), per-harness rate limits.
4. **Work-unit template drift** between Hermes (redactor) and OpenClaw (executor). Mitigation: shared Zod schema (Slice 2.1).
5. **GrokBot parity** changes the trust model. If GrokBot can post to a peer channel, Hermes must observe (covered by `policy-audit-log`).

## Rollback Plan

Delete `packages/policy-layer/` and this OpenSpec change. landing/ and cursor-gateway remain untouched. No runtime adoption yet, so nothing breaks at runtime.

## Dependencies

- Node + TypeScript (already used by landing)
- Vitest (already used)
- `better-sqlite3` (new, prebuilt)
- Slack MCP (already in Grok3 stack via existing `mcp.json`)

## Success Criteria

- [ ] OpenSpec artifacts in English with Given/When/Then and RFC 2119
- [ ] Connector pattern compiles, types exported, MockConnector passes tests
- [ ] OpenClaw contract schema documented and validated with Zod (Slice 2.1)
- [ ] Audit log SQLite schema with retention policy
- [ ] Escalation rules codified (atomic vs reversible)
- [ ] Work-un T7 added to existing T1–T6 (alignment with peer)
- [ ] Channel reservation enforced in connector implementation
- [ ] CLI `tinity policy` inspect + simulate + replay
- [ ] Tests mock Slack and OpenClaw, do not hit network
- [ ] Files unstaged; no commit (per repo convention)

## Estimated changed lines

~800-1100 authored. 400-line budget risk: Medium. `size:exception` may be needed if audit log + escalation + work-units are all in one change.

## Proposed phasing

- **Slice 2.0** (this change): connector pattern + OpenClaw contract + mock tests + docs
- **Slice 2.1**: Zod validation + audit log SQLite + CLI tool
- **Slice 2.2**: Work-unit T7 + escalation rules + integration with cursor-gateway

This change covers 2.0. Subsequent slices will be separate OpenSpec changes.

## Notes for JR

- Slice 1 (cursor-gateway) is archived, tag v0.1.0 in place.
- landing/ has 1700+ untracked lines and an untracked `brand/` dir. Not introduced by this change. Out of scope.
- GrokBot trial (peered at #1096) will require Slice 2.1+ before it can plug in.
