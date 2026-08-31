import { describe, expect, it } from "vitest";
import { assemblePrompt } from "./prompt";

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
});
