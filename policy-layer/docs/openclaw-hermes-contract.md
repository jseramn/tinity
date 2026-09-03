# OpenClaw ↔ Hermes — Contrato de Rendición de Cuentas

## Propósito

Definir cómo OpenClaw le reporta a Hermes qué hizo, qué falló, qué necesita decisión.

## Topología

- OpenClaw = router mecánico (:18789 dual-stack)
- Hermes = policy layer + observador (este módulo)
- Slack = bus donde OpenClaw postea
- Audit = log persistente (Hermes mantiene)

## Comando: Hermes → OpenClaw

```typescript
interface OpenClawDirective {
  directiveId: string;        // UUID, idempotente
  type: 'dispatch' | 'cancel' | 'query' | 'config';
  issuedBy: 'hermes' | 'jr'; // quién lo emite
  payload: DispatchPayload | CancelPayload | QueryPayload | ConfigPayload;
  ackDeadlineMs: number;     // cuándo OpenClaw debe confirmar recepción
}

interface DispatchPayload {
  channel: string;            // canal Slack destino
  workUnitRef: string;        // ref al work-unit template
  targetHarness: string;     // "cursor-agent" | "aider" | ...
  correlationId: string;
  metadata: Record<string, unknown>;
}
```

## Rendición: OpenClaw → Hermes

OpenClaw postea en `#tinity-audit` (canal dedicado) cada:

- Recepción de directiva (`ack`)
- Inicio de dispatch (`started`)
- Resultado de dispatch (`completed` | `failed` | `cancelled`)
- Detección de anomalía (`anomaly`)
- Escalación (`escalate`)

Formato:

```typescript
interface OpenClawReport {
  reportId: string;
  directiveId?: string;       // ref a la directiva original si aplica
  correlationId: string;
  type: 'ack' | 'started' | 'completed' | 'failed' | 'cancelled' | 'anomaly' | 'escalate';
  harness: string;
  workUnitRef?: string;
  result?: { ok: boolean; summary?: string; error?: SerializedError };
  observedAt: number;
}
```

## Anomalías que escalan sin pedir

OpenClaw detecta y reporta como `anomaly` sin esperar Hermes:

1. **Mismo harness falla N veces seguidas** (N=3 default, configurable)
2. **Canal Slack no responde** (timeout 30s)
3. **Work-unit sin template conocido** (referencia rota)
4. **Harness postea donde no debe** (violación de reglas de canal)
5. **Conflicto entre dos harnesses** que OpenClaw no puede resolver con reglas existentes

## Escalaciones que requieren JR

Hermes escala a JR en `#tinity-escalation` cuando:

1. **Conflicto YO↔GrokBot** sobre interpretación de directiva
2. **Decisión humana** irreversible (publicar, mandar mensaje a tercero, gastar dinero)
3. **Regla vigente** que el sistema detectó que se violaría
4. **Cambio de scope** que excede work-unit templates conocidos

JR responde con:

- `acknowledge` (visto, no hay decisión todavía)
- `decide: <opción>` (elige entre las opciones que Hermes presentó)
- `defer: <motivo>` (no es momento)
- `escalate: <motivo>` (sube a otro nivel — futuro)

## Persistencia

- Audit log = SQLite local en `~/.tinity/audit.db`
- Retention: 90 días mínimo, después compresión
- Cada `report` se persiste con timestamp, correlation ID, y ref al work-unit
- Hermes puede buscar por correlation ID, por harness, por tipo

## NO-objetivos

- ❌ No reemplaza Slack — usa Slack como medio.
- ❌ No decide work-units — solo reporta ejecución.
- ❌ No escala automáticamente sin pasar por Hermes — siempre hay un humano (JR) en el loop para acciones irreversibles.

## Estado

| Pieza | Estado |
|---|---|
| Spec del contrato | ✅ este doc |
| Implementación TypeScript | 🚧 pendiente |
| Audit log schema | 🚧 pendiente |
| Tests con OpenClaw mock | 🚧 pendiente |
