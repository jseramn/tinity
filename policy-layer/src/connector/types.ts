// Connector Pattern — TypeScript interface
// Tinity policy-layer

export type Capability =
  | 'dispatch'
  | 'query'
  | 'status'
  | 'cancel'
  | 'handoff';

export type HealthStatus = 'ok' | 'degraded' | 'down';

export interface HealthReport {
  status: HealthStatus;
  uptimeMs: number;
  lastErrorAt?: number;
  metrics: {
    messagesProcessed: number;
    messagesFailed: number;
    p50LatencyMs: number;
    p99LatencyMs: number;
  };
}

export interface OutboundMessage<T = unknown> {
  channel: string;
  workUnitRef: string;
  payload: T;
  correlationId: string;
  requiresAck: boolean;
  metadata?: Record<string, unknown>;
}

export interface MessageReceipt {
  messageId: string;
  acceptedAt: number;
  routedTo: string;
}

export interface InboundMessage<T = unknown> {
  channel: string;
  from: 'openclaw' | 'hermes' | string;
  workUnitRef: string;
  payload: T;
  correlationId: string;
  receivedAt: number;
}

export type Unsubscribe = () => void;

export interface ConnectorContext {
  logger: {
    info(msg: string, meta?: Record<string, unknown>): void;
    warn(msg: string, meta?: Record<string, unknown>): void;
    error(msg: string, meta?: Record<string, unknown>): void;
  };
  metrics: {
    inc(name: string, value?: number): void;
    observe(name: string, value: number): void;
  };
  cancel: AbortSignal;
}

export interface Connector<TOut = unknown, TIn = unknown> {
  readonly id: string;
  readonly harness: string;
  readonly capabilities: Capability[];

  start(ctx: ConnectorContext): Promise<void>;
  stop(): Promise<void>;
  health(): Promise<HealthReport>;

  send(msg: OutboundMessage<TOut>): Promise<MessageReceipt>;
  on(handler: (msg: InboundMessage<TIn>) => void | Promise<void>): Unsubscribe;

  metrics(): {
    sent: number;
    received: number;
    failed: number;
    acked: number;
  };
}

// Errores tipados
export class ConnectorError extends Error {
  constructor(
    public readonly code:
      | 'BUSY'
      | 'TIMEOUT'
      | 'INVALID_PAYLOAD'
      | 'CHANNEL_FORBIDDEN'
      | 'HARNESS_DOWN'
      | 'UNKNOWN',
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'ConnectorError';
  }
}

// Constantes de canal — los harnesses NO pueden postear en canales reservados
export const RESERVED_CHANNELS = {
  ops: '#tinity-ops',             // OpenClaw + Hermes only
  audit: '#tinity-audit',         // OpenClaw only
  jr: '#tinity-jr',               // JR only
  escalation: '#tinity-escalation', // Hermes escalations
} as const;

export const HARNESS_CHANNELS = [
  '#tinity-cursor',
  '#tinity-aider',
  '#tinity-grokbot',
  '#tinity-mirofish',
] as const;

export function isReservedChannel(channel: string): boolean {
  return Object.values(RESERVED_CHANNELS).includes(channel as any);
}

export function assertHarnessChannel(channel: string, harnessId: string): void {
  // Harness solo puede postear en su canal o en canales de peers (vía OpenClaw)
  if (isReservedChannel(channel)) {
    throw new ConnectorError(
      'CHANNEL_FORBIDDEN',
      `Harness ${harnessId} cannot post to reserved channel ${channel}`,
    );
  }
}
