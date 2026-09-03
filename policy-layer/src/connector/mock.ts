// MockConnector — implementation for tests and local dev.
// In production, real connectors wrap the actual harness (cursor-agent, aider, etc).
import type {
  Connector,
  ConnectorContext,
  HealthReport,
  OutboundMessage,
  InboundMessage,
  MessageReceipt,
  Unsubscribe,
} from './types.js';

type Handler = (msg: InboundMessage<unknown>) => void | Promise<void>;

interface MockOptions {
  alwaysFail?: boolean;
  ackDelayMs?: number;
}

export class MockConnector implements Connector {
  readonly id: string;
  readonly harness: string;
  readonly capabilities = ['dispatch', 'query', 'status', 'cancel', 'handoff'] as const;

  private startedAt = 0;
  private handlers: Handler[] = [];
  private counter = { sent: 0, received: 0, failed: 0, acked: 0 };
  private opts: MockOptions;

  constructor(id: string, harness: string, opts: MockOptions = {}) {
    this.id = id;
    this.harness = harness;
    this.opts = opts;
  }

  async start(_ctx: ConnectorContext): Promise<void> {
    this.startedAt = Date.now();
  }

  async stop(): Promise<void> {
    this.handlers = [];
  }

  async health(): Promise<HealthReport> {
    return {
      status: this.opts.alwaysFail ? 'down' : 'ok',
      uptimeMs: this.startedAt > 0 ? Date.now() - this.startedAt : 0,
      lastErrorAt: this.opts.alwaysFail ? Date.now() : undefined,
      metrics: {
        messagesProcessed: this.counter.sent,
        messagesFailed: this.counter.failed,
        p50LatencyMs: 5,
        p99LatencyMs: 25,
      },
    };
  }

  async send(msg: OutboundMessage<unknown>): Promise<MessageReceipt> {
    this.counter.sent++;
    if (this.opts.alwaysFail) {
      this.counter.failed++;
      throw new Error(`MockConnector ${this.id} configured to always fail`);
    }
    const delay = this.opts.ackDelayMs ?? 0;
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }
    this.counter.acked++;
    return {
      messageId: `${this.id}-${this.counter.sent}`,
      acceptedAt: Date.now(),
      routedTo: 'mock-bus',
    };
  }

  on(handler: Handler): Unsubscribe {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  // Test helper: simulate inbound message
  async injectInbound(msg: InboundMessage<unknown>): Promise<void> {
    this.counter.received++;
    for (const h of this.handlers) {
      await h(msg);
    }
  }

  metrics() {
    return { ...this.counter };
  }
}
