import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { VERSION } from "./version";

describe("version", () => {
  it("matches the repository package.json", () => {
    const root = JSON.parse(readFileSync("../package.json", "utf8")) as {
      version: string;
    };
    expect(VERSION).toBe(root.version);
    expect(VERSION).toBe("0.1.0");
  });
});
