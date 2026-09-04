import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MANIFESTO } from "./experience/copy";

describe("vercel.json local static host", () => {
  const raw = readFileSync("../vercel.json", "utf8");
  const cfg = JSON.parse(raw) as {
    framework?: string;
    outputDirectory?: string;
    installCommand?: string;
    buildCommand?: string;
    rewrites?: { source: string; destination: string }[];
    builds?: unknown;
    functions?: unknown;
  };

  it("points Vite landing dist without serverless functions", () => {
    expect(cfg.outputDirectory).toBe("landing/dist");
    expect(cfg.functions).toBeUndefined();
    expect(cfg.builds).toBeUndefined();
    expect(raw).not.toContain("VERCEL_TOKEN");
    expect(raw).not.toContain(MANIFESTO);
  });

  it("installs only landing deps from landing/pnpm-lock.yaml", () => {
    expect(cfg.installCommand).toBe(
      "pnpm --dir landing install --frozen-lockfile --ignore-workspace",
    );
    expect(cfg.buildCommand).toBe("pnpm --dir landing build");
    expect(cfg.installCommand).not.toMatch(/do not install/);
  });

  it("keeps cursor-gateway off the Vercel upload", () => {
    const ignore = readFileSync("../.vercelignore", "utf8");
    expect(ignore).toMatch(/^packages$/m);
  });

  it("rewrites root path to match Vite base", () => {
    const vite = readFileSync("vite.config.ts", "utf8");
    expect(vite).toMatch(/base:\s*"\/"/);
    const sources = (cfg.rewrites ?? []).map((r) => r.source);
    expect(sources).toContain("/(.*)");
    const root = (cfg.rewrites ?? []).find(
      (r) => r.source === "/(.*)",
    );
    expect(root?.destination).toBe("/index.html");
  });

  it("does not reference /tinity subpath in vite or vercel config", () => {
    const vite = readFileSync("vite.config.ts", "utf8");
    expect(vite).not.toMatch(/base:\s*"\/tinity\//);
    expect(raw).not.toMatch(/"source":\s*"\/tinity/);
  });

  it("does not commit a Vercel project link", () => {
    expect(existsSync("../.vercel")).toBe(false);
  });
});
