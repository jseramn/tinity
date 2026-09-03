import { describe, expect, it } from "vitest";
import { AGENTS } from "../experience/agents";
import { HUB_CX, HUB_CY, hubLayout, spokePath } from "./hubLayout";

describe("hubLayout", () => {
  it("places 17 spokes at deterministic angles starting at north", () => {
    const ids = AGENTS.map((agent) => agent.id);
    const nodes = hubLayout(ids);
    expect(nodes).toHaveLength(17);
    expect(nodes[0]?.id).toBe("grok-bot");
    expect(nodes[0]?.angle).toBeCloseTo(-Math.PI / 2, 8);
    expect(nodes[0]?.x).toBeCloseTo(HUB_CX, 8);
    expect(nodes[0]!.y).toBeLessThan(HUB_CY);
    const again = hubLayout(ids);
    expect(again.map((n) => n.angle)).toEqual(nodes.map((n) => n.angle));
    expect(spokePath(nodes[0]!)).toMatch(/^M[\d.]+ [\d.]+ L400\.000 400\.000$/);
  });
});
