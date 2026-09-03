import { describe, expect, it } from "vitest";
import { reduce, slotFor, type Event, type Phase } from "./machine";

function step(phase: Phase, type: Event["type"], reducedMotion = false): Phase {
  return reduce(phase, { type }, reducedMotion);
}

describe("experience machine", () => {
  it("holds loader until ready and ignores cta while loading", () => {
    expect(step("loader", "cta")).toBe("loader");
    expect(step("loader", "ready")).toBe("idle");
    expect(step("idle", "ready")).toBe("idle");
    expect(step("revealed", "ready")).toBe("revealed");
  });

  it("reveals on cta, stays revealed on a second cta, and returns to idle on escape", () => {
    expect(step("idle", "cta")).toBe("revealed");
    expect(step("revealed", "cta")).toBe("revealed");
    expect(step("revealed", "escape")).toBe("idle");
    expect(step("idle", "escape")).toBe("idle");
    expect(step("loader", "escape")).toBe("loader");
  });

  it("keeps slotFor on field for every phase", () => {
    const phases: Phase[] = ["loader", "idle", "revealed"];
    for (const phase of phases) {
      expect(slotFor(phase)).toBe("field");
    }
  });

  it("does not put bursting or decrypted on the public click path", () => {
    let phase: Phase = "loader";
    phase = step(phase, "ready");
    expect(phase).toBe("idle");
    expect(slotFor(phase)).toBe("field");
    phase = step(phase, "cta");
    expect(phase).toBe("revealed");
    expect(slotFor(phase)).toBe("field");
    phase = step(phase, "cta");
    expect(phase).toBe("revealed");
    expect(slotFor(phase)).toBe("field");
    phase = step(phase, "escape");
    expect(phase).toBe("idle");
    expect(slotFor(phase)).toBe("field");
    const events: Event["type"][] = ["ready", "cta", "escape"];
    expect(events).toEqual(["ready", "cta", "escape"]);
    expect(phase).toBe("idle");
  });
});
