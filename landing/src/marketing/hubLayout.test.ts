import { describe, expect, it } from "vitest";
import { AGENTS } from "../experience/agents";
import { MARK_VIEWBOX } from "./Lockup";
import {
  HUB_CX,
  HUB_CY,
  HUB_EDGE_COUNTS,
  HUB_HALF,
  hubLayout,
  markHubTransform,
  sendPath,
  spokePath,
} from "./hubLayout";

const IDS = AGENTS.map((agent) => agent.id);

describe("hubLayout", () => {
  it("places 17 nodes on a square rack with four sectional edges", () => {
    const nodes = hubLayout(IDS);
    expect(nodes).toHaveLength(17);
    expect(nodes[0]?.id).toBe("grok-bot");
    expect(nodes.filter((n) => n.edge === "north")).toHaveLength(
      HUB_EDGE_COUNTS.north,
    );
    expect(nodes.filter((n) => n.edge === "east")).toHaveLength(
      HUB_EDGE_COUNTS.east,
    );
    expect(nodes.filter((n) => n.edge === "south")).toHaveLength(
      HUB_EDGE_COUNTS.south,
    );
    expect(nodes.filter((n) => n.edge === "west")).toHaveLength(
      HUB_EDGE_COUNTS.west,
    );
    for (const node of nodes) {
      const chebyshev = Math.max(
        Math.abs(node.x - HUB_CX),
        Math.abs(node.y - HUB_CY),
      );
      expect(chebyshev).toBeCloseTo(HUB_HALF, 8);
    }
    const first = nodes[0]!;
    expect(first.edge).toBe("north");
    expect(first.x).toBeCloseTo(HUB_CX - HUB_HALF, 8);
    expect(first.y).toBeCloseTo(HUB_CY - HUB_HALF, 8);
    const again = hubLayout(IDS);
    expect(again.map((n) => `${n.edge}:${n.x}:${n.y}`)).toEqual(
      nodes.map((n) => `${n.edge}:${n.x}:${n.y}`),
    );
  });

  it("traces orthogonal paths that share the LED origin", () => {
    const nodes = hubLayout(IDS);
    const inbound = spokePath(nodes[0]!);
    const outbound = sendPath(nodes[0]!);
    expect(inbound).toBe("M64.000 64.000 L64.000 400.000 L400.000 400.000");
    expect(outbound).toBe("M400.000 400.000 L64.000 400.000 L64.000 64.000");
    expect(spokePath(nodes[1]!)).toBe(
      "M198.400 64.000 L198.400 400.000 L400.000 400.000",
    );
  });

  it("offsets the mark so viewBox (0,0) is the hub origin", () => {
    expect(markHubTransform()).toContain(
      `translate(${MARK_VIEWBOX.minX} ${MARK_VIEWBOX.minY})`,
    );
    expect(markHubTransform()).toMatch(/^translate\(400 400\) scale\(36\) /);
  });
});
