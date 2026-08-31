import { describe, expect, it } from "vitest";
import { runPreflightCli } from "./preflight-cli";

describe("runPreflightCli", () => {
  it("prints ok JSON and returns 0 without hitting live wrap", async () => {
    const lines: string[] = [];
    let called = 0;
    const code = await runPreflightCli({
      env: {
        CURSOR_GATEWAY_PORT: "4390",
        CURSOR_AGENT_WORKSPACE: "/home/jseramn/tinity",
      },
      cwd: "/tmp/cli-preflight",
      preflight: async (input) => {
        called += 1;
        expect(input.port).toBe(4390);
        expect(input.host).toBe("127.0.0.1");
        expect(input.expectedWorkspace).toBe("/home/jseramn/tinity");
        return {
          ok: true,
          workspace: "/home/jseramn/tinity",
          model: "grok-4.6[effort=high,fast=false]",
          jobTimeoutMs: 600000,
        };
      },
      write: (line) => lines.push(line),
    });
    expect(called).toBe(1);
    expect(code).toBe(0);
    expect(JSON.parse(lines.join("\n"))).toEqual({
      ok: true,
      workspace: "/home/jseramn/tinity",
      model: "grok-4.6[effort=high,fast=false]",
      jobTimeoutMs: 600000,
    });
  });

  it("returns 1 on unreachable without spawning", async () => {
    const lines: string[] = [];
    const code = await runPreflightCli({
      env: { CURSOR_GATEWAY_PORT: "1", CURSOR_AGENT_WORKSPACE: "/tmp/ws" },
      preflight: async () => ({ ok: false, reason: "unreachable" }),
      write: (line) => lines.push(line),
    });
    expect(code).toBe(1);
    expect(JSON.parse(lines[0]!)).toEqual({ ok: false, reason: "unreachable" });
  });

  it("prints busy retry_after and returns 1", async () => {
    const lines: string[] = [];
    const code = await runPreflightCli({
      env: { CURSOR_GATEWAY_PORT: "4390", CURSOR_AGENT_WORKSPACE: "/tmp/ws" },
      preflight: async () => ({ ok: false, reason: "busy", retry_after: 1 }),
      write: (line) => lines.push(line),
    });
    expect(code).toBe(1);
    expect(JSON.parse(lines[0]!)).toEqual({ ok: false, reason: "busy", retry_after: 1 });
  });
});
