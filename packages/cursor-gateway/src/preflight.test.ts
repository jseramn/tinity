import { afterEach, describe, expect, it } from "vitest";
import http from "node:http";
import { loadConfig } from "./config";
import { JobMutex } from "./mutex";
import { createGatewayServer, listenLocal } from "./server";
import { resetSpawnImpl } from "./spawn";
import {
  inspectHealth,
  inspectModelsList,
  isFastModel,
  preflightWrap,
} from "./preflight";
import { createFakeChild, mockSpawn, type FakeSpawnCapture } from "./test-utils";

const assistantLines = [
  JSON.stringify({
    type: "assistant",
    message: { role: "assistant", content: [{ type: "text", text: "Hi" }] },
  }),
  JSON.stringify({ type: "result", subtype: "success", result: "Hi" }),
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

async function listenRaw(
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void,
): Promise<number> {
  const server = http.createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  servers.push(server);
  const addr = server.address();
  if (!addr || typeof addr === "string") throw new Error("no address");
  return addr.port;
}

describe("isFastModel", () => {
  it("treats missing fast=false as Fast", () => {
    expect(isFastModel("grok-4.6")).toBe(true);
    expect(isFastModel("grok-4.6[effort=high]")).toBe(true);
    expect(isFastModel("grok-4.6[effort=high,fast=true]")).toBe(true);
    expect(isFastModel("grok-4.6[effort=high,fast=false]")).toBe(false);
  });
});

describe("inspectHealth", () => {
  it("accepts wrap health with matching workspace and never Fast", () => {
    const got = inspectHealth(
      {
        ok: true,
        version: "0.1.0",
        busy: false,
        workspace: "/home/jseramn/tinity",
        model: "grok-4.6[effort=high,fast=false]",
      },
      "/home/jseramn/tinity",
    );
    expect(got).toEqual({
      ok: true,
      workspace: "/home/jseramn/tinity",
      model: "grok-4.6[effort=high,fast=false]",
    });
  });

  it("normalizes trailing slash on workspace", () => {
    const got = inspectHealth(
      {
        ok: true,
        busy: false,
        workspace: "/home/jseramn/tinity/",
        model: "grok-4.6[effort=high,fast=false]",
      },
      "/home/jseramn/tinity",
    );
    expect(got).toEqual({
      ok: true,
      workspace: "/home/jseramn/tinity",
      model: "grok-4.6[effort=high,fast=false]",
    });
  });

  it("rejects live-old health missing workspace", () => {
    const got = inspectHealth({ ok: true, version: "0.1.0", busy: false }, "/home/jseramn/tinity");
    expect(got).toEqual({ ok: false, reason: "health-stale" });
  });

  it("rejects whitespace workspace and model without fast=false", () => {
    expect(
      inspectHealth(
        {
          ok: true,
          busy: false,
          workspace: "   ",
          model: "grok-4.6[effort=high,fast=false]",
        },
        "/home/jseramn/tinity",
      ),
    ).toEqual({ ok: false, reason: "health-stale" });
    expect(
      inspectHealth(
        {
          ok: true,
          busy: false,
          workspace: "/home/jseramn/tinity",
          model: "grok-4.6[effort=high]",
        },
        "/home/jseramn/tinity",
      ),
    ).toEqual({ ok: false, reason: "fast-model" });
  });

  it("rejects busy, mismatch, and Fast model", () => {
    expect(
      inspectHealth(
        {
          ok: true,
          busy: true,
          workspace: "/home/jseramn/tinity",
          model: "grok-4.6[effort=high,fast=false]",
        },
        "/home/jseramn/tinity",
      ),
    ).toEqual({ ok: false, reason: "busy" });
    expect(
      inspectHealth(
        {
          ok: true,
          busy: false,
          workspace: "/tmp/yunque-gw-probe",
          model: "grok-4.6[effort=high,fast=false]",
        },
        "/home/jseramn/webmcp-caso",
      ),
    ).toEqual({ ok: false, reason: "workspace-mismatch" });
    expect(
      inspectHealth(
        {
          ok: true,
          busy: false,
          workspace: "/home/jseramn/tinity",
          model: "grok-4.6[effort=low,fast=true]",
        },
        "/home/jseramn/tinity",
      ),
    ).toEqual({ ok: false, reason: "fast-model" });
  });

  it("forwards positive jobTimeoutMs and rejects invalid", () => {
    expect(
      inspectHealth(
        {
          ok: true,
          busy: false,
          workspace: "/home/jseramn/tinity",
          model: "grok-4.6[effort=high,fast=false]",
          jobTimeoutMs: 600000,
        },
        "/home/jseramn/tinity",
      ),
    ).toEqual({
      ok: true,
      workspace: "/home/jseramn/tinity",
      model: "grok-4.6[effort=high,fast=false]",
      jobTimeoutMs: 600000,
    });
    expect(
      inspectHealth(
        {
          ok: true,
          busy: false,
          workspace: "/home/jseramn/tinity",
          model: "grok-4.6[effort=high,fast=false]",
          jobTimeoutMs: 0,
        },
        "/home/jseramn/tinity",
      ),
    ).toEqual({ ok: false, reason: "health-stale" });
  });

  it("treats explicit fast true as Fast and invalid fast as stale", () => {
    expect(
      inspectHealth(
        {
          ok: true,
          busy: false,
          workspace: "/home/jseramn/tinity",
          model: "grok-4.6[effort=high,fast=false]",
          fast: false,
        },
        "/home/jseramn/tinity",
      ),
    ).toEqual({
      ok: true,
      workspace: "/home/jseramn/tinity",
      model: "grok-4.6[effort=high,fast=false]",
    });
    expect(
      inspectHealth(
        {
          ok: true,
          busy: false,
          workspace: "/home/jseramn/tinity",
          model: "grok-4.6[effort=high,fast=false]",
          fast: true,
        },
        "/home/jseramn/tinity",
      ),
    ).toEqual({ ok: false, reason: "fast-model" });
    expect(
      inspectHealth(
        {
          ok: true,
          busy: false,
          workspace: "/home/jseramn/tinity",
          model: "grok-4.6[effort=high,fast=false]",
          fast: "no",
        },
        "/home/jseramn/tinity",
      ),
    ).toEqual({ ok: false, reason: "health-stale" });
  });
});

describe("inspectModelsList", () => {
  const model = "grok-4.6[effort=high,fast=false]";

  it("accepts OpenAI list of wrap model", () => {
    expect(
      inspectModelsList(
        { object: "list", data: [{ id: model, object: "model", created: 0, owned_by: "tinity" }] },
        model,
      ),
    ).toEqual({ ok: true });
  });

  it("rejects empty list, id mismatch, and Fast id", () => {
    expect(inspectModelsList({ object: "list", data: [] }, model)).toEqual({
      ok: false,
      reason: "health-stale",
    });
    expect(
      inspectModelsList(
        { object: "list", data: [{ id: "grok-4.6[effort=low,fast=false]" }] },
        model,
      ),
    ).toEqual({ ok: false, reason: "health-stale" });
    expect(
      inspectModelsList(
        { object: "list", data: [{ id: "grok-4.6[effort=high,fast=true]" }] },
        "grok-4.6[effort=high,fast=true]",
      ),
    ).toEqual({ ok: false, reason: "fast-model" });
  });
});

describe("preflightWrap", () => {
  it("reads mocked wrap health and models without spawning", async () => {
    const capture: FakeSpawnCapture[] = [];
    const spawn = mockSpawn(capture, () => createFakeChild({ lines: assistantLines }));
    const mutex = new JobMutex();
    const config = loadConfig({ CURSOR_GATEWAY_PORT: "0" }, "/tmp/ws-preflight");
    const server = createGatewayServer({ config, mutex, spawn });
    await listenLocal(server, { host: "127.0.0.1", port: 0 });
    servers.push(server);
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("no address");
    const got = await preflightWrap({
      port: addr.port,
      expectedWorkspace: "/tmp/ws-preflight",
    });
    expect(got).toEqual({
      ok: true,
      workspace: "/tmp/ws-preflight",
      model: "grok-4.6[effort=high,fast=false]",
      jobTimeoutMs: 600000,
    });
    expect(capture).toEqual([]);
  });

  it("returns unreachable when nothing listens", async () => {
    const got = await preflightWrap({ port: 1, expectedWorkspace: "/tmp/ws-preflight" });
    expect(got).toEqual({ ok: false, reason: "unreachable" });
  });

  it("treats live-old wrap with models 404 as health-stale", async () => {
    const port = await listenRaw((req, res) => {
      if (req.url === "/health") {
        res.setHeader("content-type", "application/json");
        res.end(
          JSON.stringify({
            ok: true,
            version: "0.1.0",
            busy: false,
            workspace: "/tmp/ws-preflight",
            model: "grok-4.6[effort=high,fast=false]",
          }),
        );
        return;
      }
      res.statusCode = 404;
      res.end();
    });
    const got = await preflightWrap({ port, expectedWorkspace: "/tmp/ws-preflight" });
    expect(got).toEqual({ ok: false, reason: "health-stale" });
  });

  it("treats non-JSON health as health-stale", async () => {
    const port = await listenRaw((_req, res) => {
      res.statusCode = 200;
      res.end("not-json");
    });
    const got = await preflightWrap({ port, expectedWorkspace: "/tmp/ws-preflight" });
    expect(got).toEqual({ ok: false, reason: "health-stale" });
  });
});
