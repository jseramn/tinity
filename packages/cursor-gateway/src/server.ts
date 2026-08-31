import http from "node:http";
import { randomUUID } from "node:crypto";
import type { ChildProcess } from "node:child_process";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { GatewayConfig } from "./config";
import { JobMutex } from "./mutex";
import { assemblePrompt, MAX_PROMPT_CHARS, type ChatMessage } from "./prompt";
import {
  setSpawnImpl,
  spawnCursorAgent,
  type SpawnImpl,
} from "./spawn";
import { collectChild, streamChild } from "./child-io";
import { modelsList } from "./openai";
import { isFastModel } from "./preflight";

export type GatewayDeps = {
  config: GatewayConfig;
  mutex?: JobMutex;
  spawn?: SpawnImpl;
};

type ChatBody = {
  messages?: ChatMessage[];
  stream?: boolean;
  model?: string;
};

export const BUSY_RETRY_AFTER_SEC = 1;

function json(
  res: ServerResponse,
  status: number,
  body: unknown,
  extraHeaders?: Record<string, string>,
): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    ...extraHeaders,
  });
  res.end(payload);
}

function readBody(req: IncomingMessage, limit = 1_000_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function openaiId(): string {
  return `chatcmpl-${randomUUID()}`;
}

function completionObject(input: {
  id: string;
  created: number;
  model: string;
  text: string;
}) {
  return {
    id: input.id,
    object: "chat.completion",
    created: input.created,
    model: input.model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: input.text },
        finish_reason: "stop",
      },
    ],
  };
}

function chunkObject(input: {
  id: string;
  created: number;
  model: string;
  delta: Record<string, string>;
  finish: string | null;
}) {
  return {
    id: input.id,
    object: "chat.completion.chunk",
    created: input.created,
    model: input.model,
    choices: [
      {
        index: 0,
        delta: input.delta,
        finish_reason: input.finish,
      },
    ],
  };
}

function writeSse(res: ServerResponse, data: unknown): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function createGatewayServer(deps: GatewayDeps): http.Server {
  const mutex = deps.mutex ?? new JobMutex();
  const { config } = deps;
  if (deps.spawn) setSpawnImpl(deps.spawn);

  return http.createServer((req, res) => {
    void handleRequest(req, res, config, mutex);
  });
}

export function listenLocal(
  server: http.Server,
  config: Pick<GatewayConfig, "host" | "port">,
): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const onError = (err: Error) => reject(err);
    server.once("error", onError);
    server.listen(config.port, config.host, () => {
      server.off("error", onError);
      resolve(server);
    });
  });
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  config: GatewayConfig,
  mutex: JobMutex,
): Promise<void> {
  const url = req.url ?? "/";
  const path = url.split("?")[0];

  if (req.method === "GET" && path === "/health") {
    json(res, 200, {
      ok: true,
      version: config.version,
      busy: mutex.busy,
      workspace: config.workspace,
      model: config.model,
      jobTimeoutMs: config.jobTimeoutMs,
      fast: isFastModel(config.model),
    });
    return;
  }

  if (req.method === "GET" && path === "/v1/models") {
    json(res, 200, modelsList(config.model));
    return;
  }

  if (req.method === "POST" && path === "/v1/chat/completions") {
    await handleChat(req, res, config, mutex);
    return;
  }

  json(res, 404, { error: { message: "not found", type: "invalid_request_error" } });
}

async function handleChat(
  req: IncomingMessage,
  res: ServerResponse,
  config: GatewayConfig,
  mutex: JobMutex,
): Promise<void> {
  let raw: string;
  try {
    raw = await readBody(req);
  } catch {
    json(res, 413, { error: { message: "payload too large", type: "invalid_request_error" } });
    return;
  }

  let body: ChatBody;
  try {
    body = raw ? (JSON.parse(raw) as ChatBody) : {};
  } catch {
    json(res, 400, { error: { message: "invalid json", type: "invalid_request_error" } });
    return;
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    json(res, 400, {
      error: { message: "messages is required", type: "invalid_request_error" },
    });
    return;
  }

  const prompt = assemblePrompt(body.messages);
  if (!prompt.trim()) {
    json(res, 400, {
      error: { message: "prompt is empty", type: "invalid_request_error" },
    });
    return;
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    json(res, 413, {
      error: { message: "prompt too large", type: "invalid_request_error" },
    });
    return;
  }

  if (!mutex.tryAcquire()) {
    json(
      res,
      409,
      {
        error: {
          message: "Another agent job is already running",
          type: "conflict",
          code: "busy",
          retry_after: BUSY_RETRY_AFTER_SEC,
        },
      },
      { "Retry-After": String(BUSY_RETRY_AFTER_SEC) },
    );
    return;
  }

  const model = config.model;
  const id = openaiId();
  const created = Math.floor(Date.now() / 1000);
  const stream = body.stream === true;

  let child: ChildProcess;
  try {
    child = spawnCursorAgent({
      bin: config.agentBin,
      workspace: config.workspace,
      model,
      prompt,
    });
  } catch (err) {
    mutex.release();
    json(res, 500, {
      error: { message: err instanceof Error ? err.message : "spawn failed", type: "server_error" },
    });
    return;
  }

  const onAbort = () => {
    if (!child.killed) child.kill("SIGTERM");
  };
  req.on("close", onAbort);

  const work = stream
    ? streamChild(child, res, { id, created, model })
    : collectChild(child).then((text) => {
        json(res, 200, completionObject({ id, created, model, text }));
      });

  try {
    await withJobTimeout(child, config.jobTimeoutMs, work);
  } catch (err) {
    if (isJobTimeout(err)) {
      await work.catch(() => undefined);
      if (!res.headersSent) {
        json(res, 504, {
          error: { message: "job timeout", type: "server_error", code: "timeout" },
        });
      } else {
        res.end();
      }
    } else if (!res.headersSent) {
      json(res, 502, {
        error: {
          message: err instanceof Error ? err.message : "agent failed",
          type: "server_error",
        },
      });
    } else {
      res.end();
    }
  } finally {
    req.off("close", onAbort);
    mutex.release();
  }
}

const JOB_TIMEOUT = "JOB_TIMEOUT";

function isJobTimeout(err: unknown): boolean {
  return err instanceof Error && (err as Error & { code?: string }).code === JOB_TIMEOUT;
}

function withJobTimeout<T>(child: ChildProcess, ms: number, work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      if (!child.killed) child.kill("SIGTERM");
      const err = new Error("job timeout") as Error & { code: string };
      err.code = JOB_TIMEOUT;
      reject(err);
    }, ms);
  });
  return Promise.race([work, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}
