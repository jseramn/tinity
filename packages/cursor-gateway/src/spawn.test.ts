import { describe, expect, it } from "vitest";
import { buildAgentArgs, sanitizeChildEnv } from "./spawn";
import { DEFAULT_MODEL } from "./config";

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
    expect(args.join(" ")).not.toMatch(/fast\s*=\s*true/);
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
