import { afterEach, describe, expect, it } from "vitest";
import http from "node:http";
import { collectChild } from "./child-io";
import { loadConfig } from "./config";
import { JobMutex } from "./mutex";
import { createGatewayServer, listenLocal } from "./server";
import { resetSpawnImpl } from "./spawn";
import { createFakeChild, mockSpawn, type FakeSpawnCapture } from "./test-utils";

const thinkingLines = [
  JSON.stringify({
    type: "assistant",
    message: { role: "assistant", content: [{ type: "text", text: "thinking: scratch work" }] },
  }),
  JSON.stringify({ type: "result", subtype: "success", result: "final answer" }),
];

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

type HttpResult = { status: number; headers: http.IncomingHttpHeaders; text: string };

function call(port: number, body: unknown): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path: "/v1/chat/completions",
        method: "POST",
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
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function startGateway(lines: string[]) {
  const capture: FakeSpawnCapture[] = [];
  const spawn = mockSpawn(capture, () => createFakeChild({ lines }));
  const mutex = new JobMutex();
  const config = loadConfig({ CURSOR_GATEWAY_PORT: "0" }, "/tmp/ws");
  const server = createGatewayServer({ config, mutex, spawn });
  await listenLocal(server, { host: "127.0.0.1", port: 0 });
  const addr = server.address();
  if (!addr || typeof addr === "string") throw new Error("no address");
  servers.push(server);
  return { port: addr.port, capture };
}

describe("collectChild result preference", () => {
  it("uses result text when thinking deltas differ from result", async () => {
    const { child } = createFakeChild({ lines: thinkingLines });
    await expect(collectChild(child)).resolves.toBe("final answer");
  });
});

describe("non-stream thinking vs result", () => {
  it("sets message.content to result not concatenated thinking", async () => {
    const g = await startGateway(thinkingLines);
    const res = await call(g.port, {
      messages: [{ role: "user", content: "Hello" }],
      stream: false,
    });
    expect(res.status).toBe(200);
    const body = JSON.parse(res.text) as { choices: { message: { content: string } }[] };
    expect(body.choices[0]?.message.content).toBe("final answer");
    expect(body.choices[0]?.message.content).not.toContain("thinking");
  });
});

describe("stream thinking deltas", () => {
  it("emits assistant deltas without duplicating result", async () => {
    const g = await startGateway(thinkingLines);
    const res = await call(g.port, {
      messages: [{ role: "user", content: "Hello" }],
      stream: true,
    });
    expect(res.status).toBe(200);
    expect(String(res.headers["content-type"])).toMatch(/text\/event-stream/);
    expect(res.text).toContain("thinking: scratch work");
    expect(res.text.match(/final answer/g) ?? []).toHaveLength(0);
    expect(res.text).toContain("data: [DONE]");
  });
});
