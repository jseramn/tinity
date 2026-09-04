import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MANIFESTO } from "./experience/copy";

describe("vendor copy", () => {
  it("ships the canvas-ui trio and rect-cache without theme kits", () => {
    const field = readFileSync("src/components/canvasui/ForceField.tsx", "utf8");
    const glitch = readFileSync("src/components/canvasui/Glitch.tsx", "utf8");
    const decrypt = readFileSync("src/components/canvasui/DecryptReveal.tsx", "utf8");
    const cache = readFileSync("src/components/rect-cache.ts", "utf8");
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies: Record<string, string>;
    };

    expect(field).toContain("export function createForceField");
    expect(field).toContain("const FIELD_FRAG = `#version 300 es");
    expect(glitch).toContain("export function createGlitch");
    expect(decrypt).toContain("export function createDecryptReveal");
    expect(cache).toContain("export function createRectCache");
    expect(JSON.stringify(pkg.dependencies)).not.toMatch(/@mui|@base-ui|@radix-ui/);
    expect(pkg.dependencies).not.toHaveProperty("three");
    expect(pkg.dependencies.react).toMatch(/19\./);
  });
});

describe("html shell", () => {
  it("loads the full Geist pair from DESIGN.md", () => {
    const main = readFileSync("src/main.tsx", "utf8");
    const tokens = readFileSync("src/styles/tokens.css", "utf8");
    expect(main).toContain("@fontsource/geist-sans/400.css");
    expect(main).toContain("@fontsource/geist-sans/500.css");
    expect(main).toContain("@fontsource/geist-sans/600.css");
    expect(main).toContain("@fontsource/geist-mono/400.css");
    expect(main).toContain("@fontsource/geist-mono/500.css");
    expect(tokens).toContain('"Geist Sans", "Geist"');
    expect(tokens).toContain('"Geist Mono"');
    expect(tokens).not.toMatch(/backdrop-filter/);
  });

  it("sets title, short manifesto description, and accent theme-color", () => {
    const html = readFileSync("index.html", "utf8");
    expect(html).toMatch(/<title>Tinity<\/title>/);
    expect(html).toMatch(/name="theme-color"\s+content="#1fdb12"/);
    expect(html).toMatch(/name="description"/);
    expect(html).toMatch(/harness-of-harnesses/);
    expect(html).toMatch(/Friend to all harnesses/);
    expect(html).toMatch(/Layer 8 will be agent-based/);
    const description = html.match(
      /name="description"[\s\S]*?content="([^"]+)"/,
    )?.[1];
    expect(description).toBeTruthy();
    expect(description).not.toBe(MANIFESTO);
    expect(description!.length).toBeLessThan(MANIFESTO.length);
    expect(html).toMatch(/rel="alternate"\s+type="text\/markdown"/);
    expect(html).toMatch(/id="tinity-state"/);
    expect(html).toMatch(/SoftwareSourceCode/);
    expect(html).toMatch(/SoftwareApplication/);
    expect(html).toMatch(/property="og:type"\s+content="website"/);
  });
});
