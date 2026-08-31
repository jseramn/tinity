import { describe, expect, it } from "vitest";
import { mapStreamJsonEvent, parseNdjsonLine } from "./stream-map";

describe("mapStreamJsonEvent", () => {
  it("maps assistant text and does not duplicate result", () => {
    const delta = mapStreamJsonEvent({
      type: "assistant",
      message: { role: "assistant", content: [{ type: "text", text: "Hi" }] },
    });
    const finish = mapStreamJsonEvent({
      type: "result",
      subtype: "success",
      result: "Hi",
    });
    expect(delta).toEqual({ kind: "delta", text: "Hi" });
    expect(finish).toEqual({ kind: "finish", text: "Hi" });
  });

  it("passes through unknown events with parseable assistant text", () => {
    const mapped = mapStreamJsonEvent({
      type: "mystery",
      message: { content: [{ text: "Wow" }] },
    });
    expect(mapped).toEqual({ kind: "delta", text: "Wow" });
  });

  it("skips documented duplicate assistant flushes", () => {
    const mapped = mapStreamJsonEvent({
      type: "assistant",
      timestamp_ms: 1,
      model_call_id: "abc",
      message: { content: [{ type: "text", text: "dup" }] },
    });
    expect(mapped).toEqual({ kind: "ignore" });
  });

  it("ignores system user and tool_call", () => {
    expect(mapStreamJsonEvent({ type: "system" }).kind).toBe("ignore");
    expect(mapStreamJsonEvent({ type: "user" }).kind).toBe("ignore");
    expect(mapStreamJsonEvent({ type: "tool_call" }).kind).toBe("ignore");
  });

  it("maps thinking-like assistant text as a delta (stream still forwards it)", () => {
    const mapped = mapStreamJsonEvent({
      type: "assistant",
      message: { content: [{ type: "text", text: "thinking: scratch work" }] },
    });
    expect(mapped).toEqual({ kind: "delta", text: "thinking: scratch work" });
  });

  it("finishes with empty text when result is not a string", () => {
    expect(mapStreamJsonEvent({ type: "result", result: { ok: true } })).toEqual({
      kind: "finish",
      text: "",
    });
  });
});

describe("parseNdjsonLine", () => {
  it("parses objects and skips junk", () => {
    expect(parseNdjsonLine("")).toBeUndefined();
    expect(parseNdjsonLine("   ")).toBeUndefined();
    expect(parseNdjsonLine("not-json")).toBeUndefined();
    expect(parseNdjsonLine('{"type":"assistant"}')).toEqual({ type: "assistant" });
  });
});
