import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const FORBIDDEN = [
  /Tinity is an eval platform/i,
  /ships a fleet scheduler/i,
  /runs your agents/i,
];

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    if (/\.(ts|tsx|md|json)$/.test(entry.name) && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".test.tsx")) return [full];
    return [];
  });
}

describe("copy lint", () => {
  it("does not claim unshipped product in present tense", () => {
    const files = [
      ...walk("src/marketing"),
      ...walk("src/content"),
      "public/index.md",
      "public/llms.txt",
      "public/about.md",
      "public/contact.md",
      "public/privacy.md",
      "public/developers.md",
    ];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const pattern of FORBIDDEN) {
        expect(text, `${file} matched ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});
