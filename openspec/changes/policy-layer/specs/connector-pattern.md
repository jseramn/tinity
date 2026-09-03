# Capability: policy-connector-pattern

## Purpose

Define the standard interface that any harness uses to talk to Slack via OpenClaw. The connector pattern enforces channel reservation, exposes health, and provides typed messaging.

## Requirements

### Requirement: Connector interface

The system MUST export a generic `Connector<TAction, TResult>` interface with `id`, `harness`, `capabilities`, `start`, `stop`, `health`, `send`, `on`, `metrics`.

#### Scenario: harness implements Connector

- G- a harness wrapper class
- W- `start()` is called with a `ConnectorContext`
- T- the connector is ready to send/receive messages

#### Scenario: connector reports health

- G- a running connector
- W- `health()` is called
- T- it returns a `HealthReport` with status, uptimeMs, and metrics

### Requirement: Channel reservation enforcement

The system MUST throw `ConnectorError.CHANNEL_FORBIDDEN` when a harness connector attempts to send to a reserved channel.

#### Scenario: harness posts in reserved channel

- G- a harness connector with `id = 'tinity-cursor'`
- W- it calls `send({ channel: '#tinity-ops', ... })`
- T- the call throws `ConnectorError` with code `CHANNEL_FORBIDDEN`

#### Scenario: harness posts in own channel

- G- a cursor connector
- W- it calls `send({ channel: '#tinity-cursor', ... })`
- T- the call succeeds

### Requirement: MockConnector for tests

The system MUST ship a `MockConnector` implementation that supports `start`, `stop`, `health`, `send`, `on`, `injectInbound`, `metrics`, and `alwaysFail` / `ackDelayMs` options.

#### Scenario: mock connector sends message

- G- a MockConnector started with `createContext`
- W- `send({ ... })` is called
- T- it returns a `MessageReceipt` with `messageId`, `acceptedAt`, `routedTo: 'mock-bus'`

#### Scenario: mock connector fails when configured

- G- a MockConnector with `alwaysFail: true`
- W- `send()` is called
- T- it throws an error and increments `failed` metric
