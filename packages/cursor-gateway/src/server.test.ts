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

type HttpResult = { status: number; headers: http.IncomingHttpHeaders; text: string };

function call(
  port: number,
  method: string,
  path: string,
  body?: unknown,
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
            headers: res.headers,
            text: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    req.on("error", reject);
    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
}

async function startGateway(spawn = mockSpawn([], () => createFakeChild({ lines: assistantLines }))) {
  const capture: FakeSpawnCapture[] = [];
  const wrapped = mockSpawn(capture, () => {
    const inner = spawn("cursor-agent", [], {});
    return { child: inner };
  });
  const mutex = new JobMutex();
  const config = loadConfig({ CURSOR_GATEWAY_PORT: "0" }, "/home/jseramn/tinity");
  const server = createGatewayServer({ config, mutex, spawn: wrapped });
  await listenLocal(server, { host: config.host, port: 0 });
  const addr = server.address();
  if (!addr || typeof addr === "string") throw new Error("no address");
  return { server, port: addr.port, address: addr.address, capture, mutex, config };
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

describe("cursor-gateway http", () => {
  it("serves health on 127.0.0.1", async () => {
    const g = await startGateway();
    servers.push(g.server);
    expect(g.address).toBe("127.0.0.1");
    expect(g.config.port).toBe(4390);
    const res = await call(g.port, "GET", "/health");
    expect(res.status).toBe(200);
    const body = JSON.parse(res.text) as {
      ok: boolean;
      version: string;
      busy: boolean;
      workspace: string;
      model: string;
    };
    expect(body.ok).toBe(true);
    expect(body.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(body.busy).toBe(false);
    expect(body.workspace).toBe("/home/jseramn/tinity");
    expect(body.model).toBe("grok-4.6[effort=high,fast=false]");
    expect(body.model).not.toMatch(/fast\s*=\s*true/i);
  });

  it("collects non-stream completions from mocked stream-json", async () => {
    const g = await startGateway();
    servers.push(g.server);
    const res = await call(g.port, "POST", "/v1/chat/completions", {
      messages: [
        { role: "system", content: "Be brief" },
        { role: "user", content: "Hello" },
      ],
      stream: false,
    });
    expect(res.status).toBe(200);
    const body = JSON.parse(res.text) as {
      object: string;
      choices: { message: { content: string } }[];
    };
    expect(body.object).toBe("chat.completion");
    expect(body.choices[0]?.message.content).toBe("Hi");
    expect(g.capture[0]?.args).toContain("-p");
    expect(g.capture[0]?.args).toContain("stream-json");
    expect(g.capture[0]?.args).toContain("--trust");
    expect(g.capture[0]?.args).toContain("--workspace");
    expect(g.capture[0]?.args).toContain("grok-4.6[effort=high,fast=false]");
    const prompt = g.capture[0]?.args.at(-1);
    expect(prompt).toContain("Be brief");
    expect(prompt).toContain("Hello");
  });
});

describe("sse and mutex", () => {
  it("streams OpenAI SSE chunks when stream is true", async () => {
    const g = await startGateway();
    servers.push(g.server);
    const res = await call(g.port, "POST", "/v1/chat/completions", {
      messages: [{ role: "user", content: "Hello" }],
      stream: true,
    });
    expect(res.status).toBe(200);
    expect(String(res.headers["content-type"])).toMatch(/text\/event-stream/);
    expect(res.text).toContain("data: ");
    expect(res.text).toContain("chat.completion.chunk");
    expect(res.text).toContain("Hi");
    expect(res.text).toContain("data: [DONE]");
  });

  it("returns 409 while a job is held", async () => {
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

    const first = call(port, "POST", "/v1/chat/completions", {
      messages: [{ role: "user", content: "Hello" }],
      stream: false,
    });
    await new Promise((r) => setTimeout(r, 25));
    const health = await call(port, "GET", "/health");
    const busyBody = JSON.parse(health.text) as { busy: boolean; workspace: string; model: string };
    expect(busyBody.busy).toBe(true);
    expect(busyBody.workspace).toBe("/tmp/ws");
    expect(busyBody.model).not.toMatch(/fast\s*=\s*true/i);
    const second = await call(port, "POST", "/v1/chat/completions", {
      messages: [{ role: "user", content: "Nope" }],
    });
    expect(second.status).toBe(409);
    fake.release();
    const done = await first;
    expect(done.status).toBe(200);
    const idle = await call(port, "GET", "/health");
    expect(JSON.parse(idle.text).busy).toBe(false);
  });
});
