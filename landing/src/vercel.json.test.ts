import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MANIFESTO } from "./experience/copy";

type Rewrite = {
  source: string;
  destination: string;
  has?: { type: string; key: string; value?: string }[];
};

type HeaderGroup = {
  source: string;
  headers: { key: string; value: string }[];
};

type VercelCfg = {
  framework?: string | null;
  outputDirectory?: string;
  installCommand?: string;
  buildCommand?: string;
  cleanUrls?: boolean;
  rewrites?: Rewrite[];
  headers?: HeaderGroup[];
  builds?: unknown;
  functions?: unknown;
};

function readCfg(rel: string): { raw: string; cfg: VercelCfg } {
  const raw = readFileSync(rel, "utf8");
  return { raw, cfg: JSON.parse(raw) as VercelCfg };
}

function assertAgentRouting(cfg: VercelCfg, raw: string) {
  expect(cfg.cleanUrls).toBe(true);
  const catchAll = (cfg.rewrites ?? []).find(
    (rule) => rule.source === "/(.*)" && rule.destination === "/index.html",
  );
  expect(catchAll).toBeUndefined();
  const markdown = (cfg.rewrites ?? []).find(
    (rule) => rule.destination === "/index.md" && rule.source === "/",
  );
  expect(markdown).toBeTruthy();
  expect(markdown?.has?.some((item) => item.key.toLowerCase() === "accept")).toBe(
    true,
  );
  const vary = (cfg.headers ?? []).filter(
    (group) => group.source === "/" || group.source === "/index.html",
  );
  expect(vary.length).toBeGreaterThan(0);
  for (const group of vary) {
    const header = group.headers.find((item) => item.key.toLowerCase() === "vary");
    expect(header?.value).toMatch(/Accept/);
    expect(header?.value).toMatch(/Accept-Encoding/);
  }
  expect(raw).not.toContain("VERCEL_TOKEN");
  expect(raw).not.toContain(MANIFESTO);
}

describe("vercel.json local static host", () => {
  const root = readCfg("../vercel.json");
  const landing = readCfg("vercel.json");

  it("points Vite landing dist without serverless functions", () => {
    expect(root.cfg.outputDirectory).toBe("landing/dist");
    expect(root.cfg.functions).toBeUndefined();
    expect(root.cfg.builds).toBeUndefined();
    expect(root.raw).not.toContain("VERCEL_TOKEN");
    expect(root.raw).not.toContain(MANIFESTO);
  });

  it("installs only landing deps from landing/pnpm-lock.yaml", () => {
    expect(root.cfg.installCommand).toBe(
      "pnpm --dir landing install --frozen-lockfile --ignore-workspace",
    );
    expect(root.cfg.buildCommand).toBe("pnpm --dir landing build");
    expect(root.cfg.installCommand).not.toMatch(/do not install/);
  });

  it("keeps cursor-gateway off the Vercel upload", () => {
    const ignore = readFileSync("../.vercelignore", "utf8");
    expect(ignore).toMatch(/^packages$/m);
  });

  it("does not SPA-fallback unknown paths and negotiates markdown on /", () => {
    const vite = readFileSync("vite.config.ts", "utf8");
    expect(vite).toMatch(/base:\s*"\/"/);
    assertAgentRouting(root.cfg, root.raw);
    assertAgentRouting(landing.cfg, landing.raw);
  });

  it("does not reference /tinity subpath in vite or vercel config", () => {
    const vite = readFileSync("vite.config.ts", "utf8");
    expect(vite).not.toMatch(/base:\s*"\/tinity\//);
    expect(root.raw).not.toMatch(/"source":\s*"\/tinity/);
    expect(landing.raw).not.toMatch(/"source":\s*"\/tinity/);
  });

  it("does not commit a Vercel project link", () => {
    expect(existsSync("../.vercel")).toBe(false);
  });
});
