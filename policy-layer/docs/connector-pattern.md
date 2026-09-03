# Connector Pattern — Spec

## Propósito

Definir la interfaz única que cualquier harness usa para hablar con Slack vía OpenClaw. Hoy cada connector es bespoke (Aider no habla igual que Cursor no habla igual que Vesper). El patrón estandariza.

## Tipos de comunicación

### A. Mensajes agente → bus
- work-unit dispatch (herramienta ejecuta una tarea)
- status update (heartbeat, progreso)
- result delivery (output terminado)

### B. Mensajes bus → agente
- command (herramienta recibe orden de OpenClaw)
- query (herramienta debe responder algo)
- cancel (herramienta debe abortar)

### C. Mensajes peer-to-bus (vía OpenClaw)
- handoff (A pasa trabajo a B; OpenClaw media)
- shared resource lock (mutex distribuido)

## Interfaz del conector

```typescript
interface Connector<TAction, TResult> {
  // Identidad
  readonly id: string;             // "tinity-cursor-agent"
  readonly harness: string;        // "cursor"
  readonly capabilities: Capability[];

  // Lifecycle
  start(ctx: ConnectorContext): Promise<void>;
  stop(): Promise<void>;
  health(): Promise<HealthReport>;

  // Mensajería
  send(msg: OutboundMessage<TAction>): Promise<MessageReceipt>;
  on(handler: (msg: InboundMessage<TResult>) => void): Unsubscribe;

  // Métricas
  metrics(): ConnectorMetrics;
}

interface OutboundMessage<T> {
  channel: string;           // ej: "#tinity-cursor"
  workUnit: WorkUnitRef;     // ref al work-unit template
  payload: T;
  correlationId: string;     // para tracing
  requiresAck: boolean;
}

interface InboundMessage<T> {
  channel: string;
  from: string;              // "openclaw" o "hermes"
  workUnit: WorkUnitRef;
  payload: T;
  correlationId: string;
  receivedAt: number;
}
```

## Canales Slack reservados

| Canal | Uso |
|---|---|
| `#tinity-ops` | Operaciones globales, decisiones de Hermes, escalaciones a JR |
| `#tinity-cursor` | Output del cursor-gateway (Slice 1) |
| `#tinity-aider` | Output de Aider |
| `#tinity-grokbot` | Output de GrokBot (Vesper + 13 agentes) |
| `#tinity-audit` | Log inmutable de decisiones (read-only para harnesses) |
| `#tinity-escalation` | Conflictos y escalaciones a JR |

## Reglas

1. **Harnesses NO postean en `#tinity-ops`** — solo OpenClaw y Hermes.
2. **Harnesses NO postean en `#tinity-audit`** — solo OpenClaw.
3. **JR es el único que puede postear en `#tinity-jr`** (canal privado para escalaciones).
4. **Conflictos YO↔GrokBot** van a `#tinity-escalation`, JR decide.
5. **Outputs normales** van al canal del harness. Si el output es grande (>10k tokens), resumen en canal + link a storage persistente.

## Mocks para tests

Cada conector implementable debe poder mockearse. Test pattern:
- harness fake envía mensaje → connector real recibe
- OpenClaw mock recibe → redistribuye según reglas
- audit log captura todo
- assert: ninguna acción real del harness, ningún POST a Slack real

## NO-objetivos

- ❌ No reemplaza OpenClaw — usa OpenClaw como router.
- ❌ No es un bus alternativo a Slack — es el patrón que usa Slack.
- ❌ No decide work-units — solo estandariza cómo se mueven.
- ❌ No escala automáticamente — escala siguiendo reglas del módulo `escalation/`.

## Próximos pasos

1. Implementar `ConnectorContext` (logger, metrics, cancel token)
2. Implementar `Connector` interface en TypeScript
3. Crear ejemplo mínimo: connector Slack↔filesystem (no necesita Slack real)
4. Tests con mocks
5. Documentar adoption path para Aider, Cursor, Vesper
