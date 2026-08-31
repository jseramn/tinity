import http from "node:http";
import { randomUUID } from "node:crypto";
import type { ChildProcess } from "node:child_process";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { GatewayConfig } from "./config";
import { JobMutex } from "./mutex";
import { assemblePrompt, type ChatMessage } from "./prompt";
import {
  setSpawnImpl,
  spawnCursorAgent,
  type SpawnImpl,
} from "./spawn";
import { collectChild, streamChild } from "./child-io";

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

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
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
    });
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

  if (!mutex.tryAcquire()) {
    json(res, 409, {
      error: { message: "Another agent job is already running", type: "conflict", code: "busy" },
    });
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

  try {
    if (stream) {
      await streamChild(child, res, { id, created, model });
    } else {
      const text = await collectChild(child);
      json(res, 200, completionObject({ id, created, model, text }));
    }
  } catch (err) {
    if (!res.headersSent) {
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
