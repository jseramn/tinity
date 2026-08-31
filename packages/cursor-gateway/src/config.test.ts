import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOST,
  DEFAULT_JOB_TIMEOUT_MS,
  DEFAULT_MODEL,
  DEFAULT_PORT,
  loadConfig,
  resolveJobTimeoutMs,
  resolveModel,
} from "./config";

describe("loadConfig", () => {
  it("defaults to loopback 4390 and high effort never Fast", () => {
    const cfg = loadConfig({}, "/tmp/ws");
    expect(cfg.host).toBe(DEFAULT_HOST);
    expect(cfg.host).toBe("127.0.0.1");
    expect(cfg.port).toBe(DEFAULT_PORT);
    expect(cfg.port).toBe(4390);
    expect(cfg.model).toBe(DEFAULT_MODEL);
    expect(cfg.model).toBe("grok-4.6[effort=high,fast=false]");
    expect(cfg.model).not.toMatch(/fast\s*=\s*true/i);
    expect(cfg.agentBin).toBe("cursor-agent");
    expect(cfg.workspace).toBe("/tmp/ws");
    expect(cfg.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("reads env overrides and coerces Fast off", () => {
    const cfg = loadConfig(
      {
        CURSOR_GATEWAY_PORT: "4400",
        CURSOR_AGENT_BIN: "/opt/cursor-agent",
        CURSOR_AGENT_MODEL: "grok-4.6[effort=high,fast=true]",
        CURSOR_AGENT_WORKSPACE: "/repo",
        CURSOR_GATEWAY_HOST: "0.0.0.0",
      },
      "/tmp/ws",
    );
    expect(cfg.port).toBe(4400);
    expect(cfg.agentBin).toBe("/opt/cursor-agent");
    expect(cfg.workspace).toBe("/repo");
    expect(cfg.host).toBe("127.0.0.1");
    expect(cfg.model).toContain("fast=false");
    expect(cfg.model).not.toMatch(/fast\s*=\s*true/i);
  });

  it("falls back to 4390 on invalid ports", () => {
    expect(loadConfig({ CURSOR_GATEWAY_PORT: "nope" }, "/tmp/ws").port).toBe(4390);
    expect(loadConfig({ CURSOR_GATEWAY_PORT: "0" }, "/tmp/ws").port).toBe(4390);
    expect(loadConfig({ CURSOR_GATEWAY_PORT: "-3" }, "/tmp/ws").port).toBe(4390);
  });
});

describe("resolveModel", () => {
  it("uses the wrap default when unset", () => {
    expect(resolveModel()).toBe("grok-4.6[effort=high,fast=false]");
    expect(resolveModel("")).toBe("grok-4.6[effort=high,fast=false]");
    expect(resolveModel("   ")).toBe("grok-4.6[effort=high,fast=false]");
  });

  it("forces fast=false without rewriting other model fields", () => {
    const model = resolveModel("grok-4.6[effort=low,fast=true]");
    expect(model).toBe("grok-4.6[effort=low,fast=false]");
    expect(resolveModel("grok-4.6[fast = TRUE]")).not.toMatch(/fast\s*=\s*true/i);
  });

  it("appends fast=false when the model omits it", () => {
    expect(resolveModel("grok-4.6")).toBe("grok-4.6[fast=false]");
    expect(resolveModel("grok-4.6[effort=high]")).toBe("grok-4.6[effort=high,fast=false]");
  });

});

describe("resolveJobTimeoutMs", () => {
  it("defaults to ten minutes", () => {
    expect(DEFAULT_JOB_TIMEOUT_MS).toBe(600_000);
    expect(resolveJobTimeoutMs()).toBe(600_000);
    expect(resolveJobTimeoutMs("")).toBe(600_000);
    expect(loadConfig({}, "/tmp/ws").jobTimeoutMs).toBe(600_000);
  });

  it("reads CURSOR_AGENT_TIMEOUT_MS and falls back on invalid", () => {
    expect(resolveJobTimeoutMs("80")).toBe(80);
    expect(loadConfig({ CURSOR_AGENT_TIMEOUT_MS: "80" }, "/tmp/ws").jobTimeoutMs).toBe(80);
    expect(resolveJobTimeoutMs("nope")).toBe(600_000);
    expect(resolveJobTimeoutMs("0")).toBe(600_000);
    expect(resolveJobTimeoutMs("-3")).toBe(600_000);
  });
});

