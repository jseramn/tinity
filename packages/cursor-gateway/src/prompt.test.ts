import { describe, expect, it } from "vitest";
import { assemblePrompt, MAX_PROMPT_CHARS } from "./prompt";

describe("assemblePrompt", () => {
  it("uses the last user text", () => {
    expect(
      assemblePrompt([
        { role: "user", content: "first" },
        { role: "assistant", content: "ok" },
        { role: "user", content: "Hello" },
      ]),
    ).toBe("Hello");
  });

  it("prefixes optional system text", () => {
    expect(
      assemblePrompt([
        { role: "system", content: "Be brief" },
        { role: "user", content: "Hello" },
      ]),
    ).toBe("System:\nBe brief\n\nUser:\nHello");
  });

  it("joins array content parts", () => {
    expect(
      assemblePrompt([
        {
          role: "user",
          content: [{ type: "text", text: "Hi" }, { type: "text", text: " there" }],
        },
      ]),
    ).toBe("Hi there");
  });

  it("joins multiple system messages", () => {
    expect(
      assemblePrompt([
        { role: "system", content: "A" },
        { role: "system", content: "B" },
        { role: "user", content: "Hi" },
      ]),
    ).toBe("System:\nA\n\nB\n\nUser:\nHi");
  });

  it("returns empty when there is no user text", () => {
    expect(assemblePrompt([])).toBe("");
    expect(assemblePrompt([{ role: "assistant", content: "x" }])).toBe("");
  });
});

describe("MAX_PROMPT_CHARS", () => {
  it("caps argv prompt at 100000", () => {
    expect(MAX_PROMPT_CHARS).toBe(100_000);
  });
});
