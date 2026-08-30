import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

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
