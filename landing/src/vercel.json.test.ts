import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MANIFESTO } from "./experience/copy";

describe("vercel.json local static host", () => {
  const raw = readFileSync("../vercel.json", "utf8");
  const cfg = JSON.parse(raw) as {
    framework?: string;
    outputDirectory?: string;
    rewrites?: { source: string; destination: string }[];
    builds?: unknown;
    functions?: unknown;
  };

  it("points Vite landing dist without serverless functions", () => {
    expect(cfg.framework).toBe("vite");
    expect(cfg.outputDirectory).toBe("landing/dist");
    expect(cfg.functions).toBeUndefined();
    expect(cfg.builds).toBeUndefined();
    expect(raw).not.toContain("VERCEL_TOKEN");
    expect(raw).not.toContain(MANIFESTO);
  });

  it("rewrites /tinity prefix to match Vite base", () => {
    const vite = readFileSync("vite.config.ts", "utf8");
    expect(vite).toMatch(/base:\s*"\/tinity\/"/);
    const sources = (cfg.rewrites ?? []).map((r) => r.source);
    expect(sources).toContain("/tinity");
    expect(sources).toContain("/tinity/assets/:path*");
    const assets = (cfg.rewrites ?? []).find(
      (r) => r.source === "/tinity/assets/:path*",
    );
    expect(assets?.destination).toBe("/assets/:path*");
  });

  it("does not commit a Vercel project link", () => {
    expect(existsSync("../.vercel")).toBe(false);
  });
});
