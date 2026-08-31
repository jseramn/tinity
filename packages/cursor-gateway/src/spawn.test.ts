import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_MODEL } from "./config";
import {
  buildAgentArgs,
  resetSpawnImpl,
  sanitizeChildEnv,
  setSpawnImpl,
  spawnCursorAgent,
} from "./spawn";
import { createFakeChild, mockSpawn, type FakeSpawnCapture } from "./test-utils";

afterEach(() => {
  resetSpawnImpl();
});

describe("buildAgentArgs", () => {
  it("spawns print stream-json with default high model", () => {
    const args = buildAgentArgs({
      workspace: "/home/jseramn/tinity",
      model: DEFAULT_MODEL,
      prompt: "Hello",
    });
    expect(args).toEqual([
      "-p",
      "--output-format",
      "stream-json",
      "--trust",
      "--workspace",
      "/home/jseramn/tinity",
      "--model",
      "grok-4.6[effort=high,fast=false]",
      "Hello",
    ]);
    expect(args).not.toContain("--force");
    expect(args.join(" ")).not.toMatch(/fast\s*=\s*true/);
    expect(args.at(-1)).toBe("Hello");
  });
});

describe("sanitizeChildEnv", () => {
  it("keeps CURSOR_API_KEY and drops AI_GATEWAY_API_KEY", () => {
    const env = sanitizeChildEnv({
      CURSOR_API_KEY: "cursor-secret",
      AI_GATEWAY_API_KEY: "gateway-secret",
      PATH: "/usr/bin",
    });
    expect(env.CURSOR_API_KEY).toBe("cursor-secret");
    expect(env.AI_GATEWAY_API_KEY).toBeUndefined();
    expect(env.PATH).toBe("/usr/bin");
  });
});

describe("spawnCursorAgent", () => {
  it("uses mocked spawn, loopback stdio, and stripped child env", () => {
    const capture: FakeSpawnCapture[] = [];
    setSpawnImpl(mockSpawn(capture, () => createFakeChild({ lines: [] })));
    spawnCursorAgent({
      bin: "/home/jseramn/.local/bin/cursor-agent",
      workspace: "/tmp/ws",
      model: DEFAULT_MODEL,
      prompt: "ping",
      env: {
        PATH: "/usr/bin",
        AI_GATEWAY_API_KEY: "gateway-secret",
        CURSOR_API_KEY: "cursor-secret",
      },
    });
    expect(capture).toHaveLength(1);
    expect(capture[0]?.command).toBe("/home/jseramn/.local/bin/cursor-agent");
    expect(capture[0]?.args).not.toContain("--force");
    expect(capture[0]?.options?.stdio).toEqual(["ignore", "pipe", "pipe"]);
    const env = capture[0]?.options?.env as NodeJS.ProcessEnv;
    expect(env.AI_GATEWAY_API_KEY).toBeUndefined();
    expect(env.CURSOR_API_KEY).toBe("cursor-secret");
  });
});

describe("buildAgentArgs Fast-off", () => {
  it("coerces fast=true at spawn even if config was skipped", () => {
    const args = buildAgentArgs({
      workspace: "/tmp/ws",
      model: "grok-4.6[effort=high,fast=true]",
      prompt: "Hello",
    });
    expect(args).toContain("grok-4.6[effort=high,fast=false]");
    expect(args.join(" ")).not.toMatch(/fast\s*=\s*true/);
    expect(args).not.toContain("--force");
  });
});
