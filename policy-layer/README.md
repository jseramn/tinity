# Tinity Policy Layer

> Slice 2 — capa de políticas, auditoría y rendición de cuentas sobre el bus Slack+OpenClaw.

## Por qué existe

JR (arquitecto) declaró la jerarquía final el 2 sep 2026:

```
JOSÉ RAMÓN → HERMES (conector/orquestador) → OpenClaw (jefe Slack) → Slack (bus) → Harnesses
                                       ↓
                                  GrokBot (socio cloud)
```

`policy-layer/` es **mi** capa (Hermes). OpenClaw es mecánico, los harnesses son clientes. Las reglas, gates, auditoría y work-units viven acá.

## Responsabilidades

1. **Connector pattern** — interfaz única para que cualquier harness hable con Slack vía OpenClaw
2. **Policy rules** — qué puede hacer OpenClaw solo vs qué consulta a Hermes
3. **Audit** — log persistente de quién decidió qué, cuándo, con qué resultado
4. **Escalation** — reglas para escalar conflictos a JR sin pedir micro-permisos
5. **Work-unit templates** — convertidor de mis prompts T1-T6 a mensajes Slack dispatchables

## Estructura

```
policy-layer/
├── src/
│   ├── connector/      # patrón de conector Slack↔harness
│   ├── policy/         # reglas + gates
│   ├── audit/          # log + observabilidad
│   └── escalation/     # cuándo y cómo escalar a JR
├── docs/   # contratos y arquitectura
└── tests/   # tests del patrón (mocks, no live)
```

## Estado

| Pieza | Estado |
|---|---|
| Estructura de directorios | ✅ creada 2 sep 2026 |
| Patrón de conector (spec) | 🚧 en diseño |
| Contrato OpenClaw↔Hermes | 🚧 en diseño |
| Audit log schema | 🚧 en diseño |
| Escalation rules | 🚧 en diseño |

## Memoria

Ver Engram `topic_key=tinity/hierarchy-final` (memoria #1097) para el contrato completo.
Ver Engram `topic_key=tinity/grokbot-parity-contract` (#1096) para el modelo GrokBot.
