# Design: policy-layer (Tinity Slice 2)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Hermes (me)                         │
│                                                              │
│   policy-layer/                                              │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│   │connector │ │ policy   │ │ audit    │ │escalation│      │
│   └─────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘      │
│         │            │            │            │            │
│         └────────────┴─────┬──────┴────────────┘            │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                  command & observe
                             │
                             ▼
                    ┌─────────────────┐
                    │     OpenClaw    │ (router, :18789)
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │      Slack      │ (bus)
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         ┌─────────┐    ┌─────────┐    ┌─────────┐
         │ cursor  │    │ aider   │    │ grokbot │
         └─────────┘    └─────────┘    └─────────┘
```

## Module breakdown

### src/connector/
- **types.ts** — Connector, ConnectorContext, OutboundMessage, InboundMessage, MessageReceipt, HealthReport, Capability, ConnectorError
- **context.ts** — createContext() factory
- **mock.ts** — MockConnector (for tests and local dev without Slack)
- **index.ts** — barrel

### src/policy/ (Slice 2.1)
- rules engine: YAML or JSON rule definitions
- gates: pre-conditions for actions
- work-unit registry: T1–T7 references

### src/audit/ (Slice 2.1)
- better-sqlite3 schema
- query API (by correlationId, by harness, by type)
- retention + compression

### src/escalation/ (Slice 2.1)
- escalation rules: atomic-action → escalate; reversible → audit
- JR digest generator (weekly)
- conflict resolver (Hermes ↔ GrokBot)

### src/cli/ (Slice 2.1)
- `tinity policy inspect <wu-ref>` — show work-unit template
- `tinity policy simulate <directive>` — dry-run through rules
- `tinity policy replay <correlationId>` — re-run a directive from audit log
- `tinity policy tail` — live audit (requires Slice 2.1)

## Channel reservation map

| Channel | Reserved for | OpenClaw | Hermes | Harnesses |
|---|---|---|---|---|
| `#tinity-ops` | Global ops | ✅ | ✅ | ❌ |
| `#tinity-audit` | Audit log | ✅ (write) | ❌ (read) | ❌ |
| `#tinity-jr` | JR private | ❌ | ✅ | ❌ |
| `#tinity-escalation` | Escalations | ❌ | ✅ | ❌ |
| `#tinity-cursor` | cursor-gateway output | ✅ | ✅ | ✅ (cursor) |
| `#tinity-aider` | Aider output | ✅ | ✅ | ✅ (aider) |
| `#tinity-grokbot` | GrokBot output | ✅ | ✅ | ✅ (grokbot) |
| `#tinity-mirofish` | Mirofish output | ✅ | ✅ | ✅ (mirofish) |

The pattern is **N channels for harnesses, 4 reserved for ops/audit/escalation**. Each harness connector checks channel reservation before posting.

## Contract: Hermes → OpenClaw

```typescript
interface OpenClawDirective {
  directiveId: string;        // UUID, idempotent
  type: 'dispatch' | 'cancel' | 'query' | 'config';
  issuedBy: 'hermes' | 'jr';
  payload: DispatchPayload | CancelPayload | QueryPayload | ConfigPayload;
  ackDeadlineMs: number;     // deadline for ack
}

interface DispatchPayload {
  channel: string;
  workUnitRef: string;
  targetHarness: string;
  correlationId: string;
  metadata: Record<string, unknown>;
}
```

## Contract: OpenClaw → Hermes

```typescript
interface OpenClawReport {
  reportId: string;
  directiveId?: string;       // ref to original
  correlationId: string;
  type: 'ack' | 'started' | 'completed' | 'failed' | 'cancelled' | 'anomaly' | 'escalate';
  harness: string;
  workUnitRef?: string;
  result?: { ok: boolean; summary?: string; error?: SerializedError };
  observedAt: number;
}
```

Anomaly types (auto-escalated):
1. Same harness fails 3 times in a row
2. Channel Slack timeout (30s default)
3. Work-unit ref not in registry
4. Harness posts in channel where forbidden
5. Peer conflict (Hermes ↔ GrokBot disagree on directive interpretation)

## Adoption path

For a new harness to plug in:

1. Implement `Connector<TAction, TResult>` against the harness's natural API.
2. Use `assertHarnessChannel()` to gate every `send()` call.
3. Register in `policy/src/policy/registry.ts` with capabilities.
4. Slack channel auto-allocated: `#tinity-<harness-name>`.

For OpenClaw adoption:
1. Mount `OpenClawDirective` consumer.
2. Mount `OpenClawReport` producer.
3. Mount anomaly watcher (Slice 2.1).

For GrokBot trial:
1. GrokBot implements `Connector` with cloud capabilities.
2. Channel `#tinity-grokbot` allocated.
3. Hermes observes via OpenClaw contract (not direct).
4. Conflict resolver in escalation/ handles disagreements.

## Testing strategy

- All tests mock Slack, OpenClaw, GrokBot, and any network I/O.
- MockConnector covers connector-side scenarios.
- A future MockOpenClaw will cover the OpenClaw side (Slice 2.1).
- Integration test against cursor-gateway is Slice 2.2 (cursor-gateway has its own test mocks; we wrap them).

## Why Slice 2.0 ships the base only

- Connector pattern + contract schema are foundational.
- Audit log SQLite + CLI + Zod are tooling on top.
- Phasing keeps each change under the 400-line review budget when possible.
- Slice 2.0 can be merged without runtime adoption risk; it is a library.

## Why no runtime in Slice 2.0

- Hermes does not yet have an OpenClaw MCP wired in.
- Slack MCP is in JR's existing MCP stack but not as a writable channel for the policy layer.
- Runtime adoption requires a binding contract with OpenClaw (their skill schema, their connection string).
- Until then, Slice 2.0 is a library that **can** be wired up; Slice 2.3+ will do the wiring.

## Open design questions for Slice 2.1

1. **Zod or TypeBox?** Both work. Zod is more popular; TypeBox is faster. JR preference?
2. **better-sqlite3 vs sql.js?** Native vs WASM. Performance vs portability. JR preference?
3. **Audit log location** — `~/.tinity/audit.db` (per-user) or repo-local `~/tinity/.audit/`? Per-user is portable.
4. **Retention policy** — 90 days default, configurable. Compress after to `.tar.gz`? Or just delete?

## Open design questions for Slice 2.2

1. **Work-unit T7 wording** — alignment with peer. Need template content from JR.
2. **Escalation digest format** — Markdown summary? Plain text? HTML? Slack Block Kit?
3. **Conflict resolver heuristic** — first-write-wins? Latest-wins? Manual?
