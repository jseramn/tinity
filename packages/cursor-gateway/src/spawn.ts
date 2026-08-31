import { spawn, type ChildProcess, type SpawnOptions } from "node:child_process";
import { resolveModel } from "./config";

export type SpawnImpl = (
  command: string,
  args: readonly string[],
  options?: SpawnOptions,
) => ChildProcess;

let spawnImpl: SpawnImpl = spawn;

export function setSpawnImpl(impl: SpawnImpl): void {
  spawnImpl = impl;
}

export function resetSpawnImpl(): void {
  spawnImpl = spawn;
}

export const STRIP_CHILD_ENV = ["AI_GATEWAY_API_KEY"] as const;

export function sanitizeChildEnv(
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  const next: NodeJS.ProcessEnv = { ...env };
  for (const key of STRIP_CHILD_ENV) delete next[key];
  return next;
}

export function buildAgentArgs(input: {
  workspace: string;
  model: string;
  prompt: string;
}): string[] {
  return [
    "-p",
    "--output-format",
    "stream-json",
    "--trust",
    "--workspace",
    input.workspace,
    "--model",
    resolveModel(input.model),
    input.prompt,
  ];
}

export function spawnCursorAgent(input: {
  bin: string;
  workspace: string;
  model: string;
  prompt: string;
  env?: NodeJS.ProcessEnv;
}): ChildProcess {
  const args = buildAgentArgs(input);
  return spawnImpl(input.bin, args, {
    env: sanitizeChildEnv(input.env ?? process.env),
    stdio: ["ignore", "pipe", "pipe"],
  });
}
