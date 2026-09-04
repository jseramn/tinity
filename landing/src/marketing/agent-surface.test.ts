import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AGENTS } from "../experience/agents";
import { VERSION } from "../content/version";

describe("agent twins", () => {
  it("exposes llms.txt and index.md with version and 17 harnesses", () => {
    const index = readFileSync("public/index.md", "utf8");
    const llms = readFileSync("public/llms.txt", "utf8");
    const changelog = readFileSync("public/changelog.md", "utf8");
    const design = readFileSync("public/design.md", "utf8");
    expect(index).toContain(`Version: ${VERSION}`);
    expect(llms).toContain(`v${VERSION}`);
    expect(changelog).toContain(`[${VERSION}]`);
    expect(design).toContain("# Tinity — DESIGN.md");
    for (const agent of AGENTS) {
      expect(index).toContain(agent.label);
      expect(index).toContain(agent.id);
    }
    expect(AGENTS).toHaveLength(17);
    expect(index).toContain("https://tinity.jseramn.tech/");
    expect(index).not.toContain("https://www.jseramn.tech/tinity");
    expect(llms).toContain("https://tinity.jseramn.tech/");
    expect(llms).not.toContain("https://www.jseramn.tech/tinity");
    expect(llms).toMatch(/When to use/i);
    expect(llms).toMatch(/When not to use/i);
    const generator = readFileSync("../scripts/content.mjs", "utf8");
    expect(generator).toContain("https://tinity.jseramn.tech");
    expect(generator).not.toContain("https://www.jseramn.tech/tinity");
  });
});
