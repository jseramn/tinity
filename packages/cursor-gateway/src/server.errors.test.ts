import { afterEach, describe, expect, it } from "vitest";
import http from "node:http";
import { loadConfig } from "./config";
import { JobMutex } from "./mutex";
import { createGatewayServer, listenLocal, shutdownGateway } from "./server";
import { resetSpawnImpl } from "./spawn";
import { createFakeChild, mockSpawn, type FakeSpawnCapture } from "./test-utils";
import { MAX_PROMPT_CHARS } from "./prompt";

const assistantLines = [
  JSON.stringify({
    type: "assistant",
    message: { role: "assistant", content: [{ type: "text", text: "Hi" }] },
  }),
  JSON.stringify({ type: "result", subtype: "success", result: "Hi" }),
];

type HttpResult = { status: number; text: string };

function call(
  port: number,
  method: string,
  path: string,
  body?: unknown,
  raw?: string,
): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path,
        method,
        headers: { "Content-Type": "application/json" },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            text: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    req.on("error", reject);
    if (raw !== undefined) req.write(raw);
    else if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
}

const servers: http.Server[] = [];

afterEach(async () => {
  resetSpawnImpl();
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((err) => {
            if (!err) {
              resolve();
              return;
            }
            const code = (err as NodeJS.ErrnoException).code;
            if (code === "ERR_SERVER_NOT_RUNNING") resolve();
            else reject(err);
          });
        }),
    ),
  );
});

async function startGateway() {
  const capture: FakeSpawnCapture[] = [];
  const spawn = mockSpawn(capture, () => createFakeChild({ lines: assistantLines }));
  const mutex = new JobMutex();
  const config = loadConfig({ CURSOR_GATEWAY_PORT: "0" }, "/tmp/ws");
  const server = createGatewayServer({ config, mutex, spawn });
  await listenLocal(server, { host: "127.0.0.1", port: 0 });
  const addr = server.address();
  if (!addr || typeof addr === "string") throw new Error("no address");
  servers.push(server);
  return { port: addr.port, capture };
}

describe("cursor-gateway errors", () => {
  it("returns 404 for unknown paths without spawning", async () => {
    const g = await startGateway();
    const res = await call(g.port, "GET", "/nope");
    expect(res.status).toBe(404);
    expect(g.capture).toHaveLength(0);
  });

  it("returns 400 when messages are missing or empty", async () => {
    const g = await startGateway();
    const missing = await call(g.port, "POST", "/v1/chat/completions", {});
    expect(missing.status).toBe(400);
    const empty = await call(g.port, "POST", "/v1/chat/completions", { messages: [] });
    expect(empty.status).toBe(400);
    expect(g.capture).toHaveLength(0);
  });

  it("returns 400 on invalid json", async () => {
    const g = await startGateway();
    const res = await call(g.port, "POST", "/v1/chat/completions", undefined, "{");
    expect(res.status).toBe(400);
    expect(g.capture).toHaveLength(0);
  });

  it("ignores request model so Fast cannot sneak in", async () => {
    const g = await startGateway();
    const res = await call(g.port, "POST", "/v1/chat/completions", {
      model: "grok-4.6[effort=low,fast=true]",
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(res.status).toBe(200);
    expect(g.capture[0]?.args).toContain("grok-4.6[effort=high,fast=false]");
    expect(g.capture[0]?.args.join(" ")).not.toMatch(/fast\s*=\s*true/);
  });

  it("returns 413 when assembled prompt exceeds argv budget without spawning", async () => {
    const g = await startGateway();
    const res = await call(g.port, "POST", "/v1/chat/completions", {
      model: "grok-4.6[effort=low,fast=true]",
      messages: [{ role: "user", content: "x".repeat(MAX_PROMPT_CHARS + 1) }],
    });
    expect(res.status).toBe(413);
    expect(g.capture).toHaveLength(0);
  });
});

describe("cursor-gateway job timeout", () => {
  it("returns 504, kills the child, and releases the mutex", async () => {
    const capture: FakeSpawnCapture[] = [];
    const fake = createFakeChild({ lines: assistantLines, hold: true });
    let n = 0;
    const spawn = mockSpawn(capture, () => {
      n += 1;
      if (n === 1) return fake;
      return createFakeChild({ lines: assistantLines });
    });
    const mutex = new JobMutex();
    const config = loadConfig(
      { CURSOR_GATEWAY_PORT: "0", CURSOR_AGENT_TIMEOUT_MS: "80" },
      "/tmp/ws",
    );
    expect(config.jobTimeoutMs).toBe(80);
    const server = createGatewayServer({ config, mutex, spawn });
    await listenLocal(server, { host: "127.0.0.1", port: 0 });
    servers.push(server);
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("no address");
    const port = addr.port;

    const res = await call(port, "POST", "/v1/chat/completions", {
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(res.status).toBe(504);
    const body = JSON.parse(res.text) as { error: { code?: string; message: string } };
    expect(body.error.code).toBe("timeout");
    expect(body.error.message).toBe("job timeout");
    expect(mutex.busy).toBe(false);
    expect(fake.child.killed).toBe(true);
    expect(capture).toHaveLength(1);

    const follow = await call(port, "POST", "/v1/chat/completions", {
      messages: [{ role: "user", content: "Again" }],
    });
    expect(follow.status).toBe(200);
    expect(capture).toHaveLength(2);
    expect(JSON.parse(follow.text).choices[0].message.content).toBe("Hi");
  });
});


describe("cursor-gateway shutdown", () => {
  it("closes listen when idle without spawning", async () => {
    const g = await startGateway();
    const server = servers[servers.length - 1];
    await shutdownGateway(server);
    await expect(call(g.port, "GET", "/health")).rejects.toMatchObject({
      code: "ECONNREFUSED",
    });
    expect(g.capture).toHaveLength(0);
  });

  it("SIGTERMs a held child, releases the mutex, and closes listen", async () => {
    const capture: FakeSpawnCapture[] = [];
    const fake = createFakeChild({ lines: assistantLines, hold: true });
    const spawn = mockSpawn(capture, () => fake);
    const mutex = new JobMutex();
    const config = loadConfig({ CURSOR_GATEWAY_PORT: "0" }, "/tmp/ws");
    const server = createGatewayServer({ config, mutex, spawn });
    await listenLocal(server, { host: "127.0.0.1", port: 0 });
    servers.push(server);
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("no address");
    const port = addr.port;

    const pending = call(port, "POST", "/v1/chat/completions", {
      messages: [{ role: "user", content: "Hello" }],
    });
    for (let i = 0; i < 50 && !mutex.busy; i += 1) {
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(mutex.busy).toBe(true);
    expect(capture).toHaveLength(1);

    await shutdownGateway(server);
    expect(fake.child.killed).toBe(true);
    expect(mutex.busy).toBe(false);
    await expect(call(port, "GET", "/health")).rejects.toMatchObject({
      code: "ECONNREFUSED",
    });
    await pending.catch(() => undefined);
  });
});
