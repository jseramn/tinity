import { afterEach, describe, expect, it } from "vitest";
import http from "node:http";
import { loadConfig } from "./config";
import { JobMutex } from "./mutex";
import { createGatewayServer, listenLocal } from "./server";
import { resetSpawnImpl } from "./spawn";
import { inspectHealth, preflightWrap } from "./preflight";
import { createFakeChild, mockSpawn } from "./test-utils";

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

  it("rejects live-old health missing workspace", () => {
    const got = inspectHealth({ ok: true, version: "0.1.0", busy: false }, "/home/jseramn/tinity");
    expect(got).toEqual({ ok: false, reason: "health-stale" });
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
});

describe("preflightWrap", () => {
  it("reads mocked wrap health without spawning", async () => {
    const spawn = mockSpawn([], () => createFakeChild({ lines: assistantLines }));
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
    });
  });

  it("returns unreachable when nothing listens", async () => {
    const got = await preflightWrap({ port: 1, expectedWorkspace: "/tmp/ws-preflight" });
    expect(got).toEqual({ ok: false, reason: "unreachable" });
  });
});
