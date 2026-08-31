import { afterEach, describe, expect, it } from "vitest";
import http from "node:http";
import { loadConfig } from "./config";
import { JobMutex } from "./mutex";
import { createGatewayServer, listenLocal } from "./server";
import { resetSpawnImpl } from "./spawn";
import { createFakeChild, mockSpawn, type FakeSpawnCapture } from "./test-utils";

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
          server.close((err) => (err ? reject(err) : resolve()));
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
});
