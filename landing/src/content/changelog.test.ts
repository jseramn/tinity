import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHANGELOG, datedChangelog } from "../content/changelog";
import { VERSION } from "../content/version";

describe("changelog", () => {
  it("matches CHANGELOG.md and includes the root version", () => {
    const json = JSON.parse(
      readFileSync("src/content/changelog.json", "utf8"),
    ) as typeof CHANGELOG;
    expect(json).toEqual(CHANGELOG);
    expect(json.some((entry) => entry.version === VERSION)).toBe(true);
    const md = readFileSync("../CHANGELOG.md", "utf8");
    for (const entry of json) {
      expect(md).toContain(`[${entry.version}]`);
    }
    expect(datedChangelog(json)[0]?.version).toBe(VERSION);
  });
});
