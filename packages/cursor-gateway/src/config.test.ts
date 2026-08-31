import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOST,
  DEFAULT_MODEL,
  DEFAULT_PORT,
  loadConfig,
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
});

describe("resolveModel", () => {
  it("uses the wrap default when unset", () => {
    expect(resolveModel()).toBe("grok-4.6[effort=high,fast=false]");
  });
});
