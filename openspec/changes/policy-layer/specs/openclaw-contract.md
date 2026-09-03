# Capability: policy-openclaw-contract

## Purpose

Define the directives Hermes issues to OpenClaw and the reports OpenClaw sends back. The contract is the audit-friendly interface for the router layer.

## Requirements

### Requirement: OpenClawDirective schema

The system MUST define `OpenClawDirective` with `directiveId` (UUID, idempotent), `type` ('dispatch' | 'cancel' | 'query' | 'config'), `issuedBy` ('hermes' | 'jr'), `payload`, and `ackDeadlineMs`.

### Requirement: OpenClawReport schema

The system MUST define `OpenClawReport` with `reportId`, optional `directiveId`, `correlationId`, `type` ('ack' | 'started' | 'completed' | 'failed' | 'cancelled' | 'anomaly' | 'escalate'), `harness`, optional `workUnitRef`, optional `result`, `observedAt`.

### Requirement: Anomaly auto-escalation

The system MUST auto-escalate to `#tinity-escalation` when:
- The same harness fails 3 times in a row
- A Slack channel times out (>30s default)
- A work-unit ref is not in the registry
- A harness posts in a channel where forbidden
- A peer conflict is detected (Hermes ↔ GrokBot)

#### Scenario: 3 strikes on same harness

- G- harness X fails directive 1, fails directive 2, fails directive 3
- W- the third failure is observed
- T- an anomaly report of type 'anomaly' is posted to `#tinity-escalation`

### Requirement: Reports are durable

The system MUST persist every `OpenClawReport` in the audit log keyed by `correlationId`.

## Status

Schema is documented in `docs/openclaw-hermes-contract.md`. Slice 2.1 will add Zod validation and `better-sqlite3` persistence.
