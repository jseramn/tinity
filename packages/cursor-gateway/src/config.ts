export const PACKAGE_VERSION = "0.1.0";
export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 4390;
export const DEFAULT_MODEL = "grok-4.6[effort=high,fast=false]";
export const DEFAULT_AGENT_BIN = "cursor-agent";
export const DEFAULT_JOB_TIMEOUT_MS = 600_000;

export type GatewayConfig = {
  host: string;
  port: number;
  agentBin: string;
  model: string;
  workspace: string;
  version: string;
  jobTimeoutMs: number;
};

export function resolveModel(raw?: string): string {
  const model = (raw && raw.trim()) || DEFAULT_MODEL;
  return model.replace(/fast\s*=\s*true/gi, "fast=false");
}

export function resolveJobTimeoutMs(raw?: string): number {
  const n = raw && raw.trim() ? Number(raw) : DEFAULT_JOB_TIMEOUT_MS;
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_JOB_TIMEOUT_MS;
  return n;
}

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd(),
): GatewayConfig {
  const portRaw = env.CURSOR_GATEWAY_PORT;
  const port = portRaw ? Number(portRaw) : DEFAULT_PORT;
  return {
    host: DEFAULT_HOST,
    port: Number.isFinite(port) && port > 0 ? port : DEFAULT_PORT,
    agentBin: env.CURSOR_AGENT_BIN?.trim() || DEFAULT_AGENT_BIN,
    model: resolveModel(env.CURSOR_AGENT_MODEL),
    workspace: env.CURSOR_AGENT_WORKSPACE?.trim() || cwd,
    version: PACKAGE_VERSION,
    jobTimeoutMs: resolveJobTimeoutMs(env.CURSOR_AGENT_TIMEOUT_MS),
  };
}
