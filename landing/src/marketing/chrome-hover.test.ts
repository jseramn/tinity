import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tokens = readFileSync("src/styles/tokens.css", "utf8");
const marketing = readFileSync("src/styles/marketing.css", "utf8");
const credits = readFileSync("src/styles/credits.css", "utf8");
const hub = readFileSync("src/marketing/Hub.tsx", "utf8");

describe("chrome hover matches occupancy cubes", () => {
  it("exposes the cube lift tokens", () => {
    expect(tokens).toMatch(/--hover-perspective:\s*560px;/);
    expect(tokens).toMatch(/--hover-lift:\s*18px;/);
    expect(tokens).toMatch(/--hover-scale:\s*1\.04;/);
    expect(tokens).toMatch(
      /--hover-shadow:\s*0 12px 32px rgba\(0, 0, 0, 0\.55\);/,
    );
  });

  it("lifts marketing chrome with Z + scale + elevation", () => {
    expect(marketing).toMatch(
      /translateZ\(var\(--hover-lift\)\) scale\(var\(--hover-scale\)\)/,
    );
    expect(marketing).toContain("box-shadow: var(--hover-shadow);");
    expect(marketing).toContain(".btn-ghost:not(:disabled)");
    expect(marketing).toContain(".panel");
    expect(marketing).toContain(".lockup");
    expect(marketing).toContain(".nav-menu");
    expect(marketing).toContain(".surface-switch");
    expect(marketing).toContain(".status-pip");
    expect(marketing).toContain(".faq-item summary");
    expect(marketing).toContain(".hub-stack li");
  });

  it("scales hub nodes on an inner group so translate() stays intact", () => {
    expect(hub).toContain('className="hub-node-lift"');
    expect(marketing).toMatch(
      /\.hub-node:hover \.hub-node-lift[\s\S]*transform:\s*scale\(1\.12\)/,
    );
  });

  it("lifts footer credits the same way", () => {
    expect(credits).toMatch(
      /translateZ\(var\(--hover-lift\)\) scale\(var\(--hover-scale\)\)/,
    );
  });

  it("disables lift under reduced motion", () => {
    expect(marketing).toMatch(
      /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*\.hub-node-lift[\s\S]*transform:\s*none/,
    );
    expect(credits).toMatch(
      /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*transform:\s*none/,
    );
  });
});
