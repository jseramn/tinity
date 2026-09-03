import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AGENTS } from "./agents";
import { cellKey, layoutTiles, type Layout } from "./tiles";
import { useBoard, type BoardPositions } from "./useBoard";

const AGENT_IDS = AGENTS.map((agent) => agent.id);
const LOCK = layoutTiles(1280, 720, 1);

function snapshot(positions: BoardPositions) {
  return [...positions.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function numbersOf(layout: Layout): BoardPositions {
  return new Map(
    layout.tiles
      .filter((tile) => tile.role === "number")
      .map((tile) => [tile.id, cellKey(tile.col, tile.row)]),
  );
}

function center(tile: { x: number; y: number; size: number }) {
  return { x: tile.x + tile.size / 2, y: tile.y + tile.size / 2 };
}

describe("useBoard", () => {
  it("shuffles positions and keeps 17 agents", () => {
    const { result } = renderHook(() => useBoard(LOCK, AGENT_IDS));
    expect(result.current.positions.size).toBe(17);
    expect(snapshot(result.current.positions)).toEqual(snapshot(numbersOf(LOCK)));
    act(() => {
      result.current.shuffle();
    });
    expect(result.current.positions.size).toBe(17);
    expect(snapshot(result.current.positions)).not.toEqual(
      snapshot(numbersOf(LOCK)),
    );
    expect(snapshot(result.current.positions)).toEqual(
      snapshot(numbersOf(layoutTiles(1280, 720, 1, { seed: 1 }))),
    );
    expect(
      result.current.tilesWithAgents.filter((tile) => tile.role === "number"),
    ).toHaveLength(17);
  });

  it("moves an agent onto an empty cell", () => {
    const { result } = renderHook(() => useBoard(LOCK, AGENT_IDS));
    const agentId = AGENT_IDS[0]!;
    const from = result.current.positions.get(agentId)!;
    const fromTile = result.current.tilesWithAgents.find(
      (tile) => cellKey(tile.col, tile.row) === from,
    )!;
    const empty = result.current.tilesWithAgents.find(
      (tile) => tile.role === "occupancy" && tile.inside,
    )!;
    const fromCenter = center(fromTile);
    const destCenter = center(empty);
    act(() => {
      result.current.drag.begin(agentId, 0, 0);
    });
    act(() => {
      result.current.drag.move(destCenter.x - fromCenter.x, destCenter.y - fromCenter.y);
    });
    let drop: ReturnType<typeof result.current.drag.end> = null;
    act(() => {
      drop = result.current.drag.end();
    });
    const to = cellKey(empty.col, empty.row);
    expect(drop).toMatchObject({ agentId, from, to });
    expect(result.current.positions.get(agentId)).toBe(to);
    expect(
      result.current.tilesWithAgents.find(
        (tile) => tile.col === empty.col && tile.row === empty.row,
      ),
    ).toMatchObject({ id: agentId, role: "number" });
  });

  it("swaps when dropping onto another agent", () => {
    const { result } = renderHook(() => useBoard(LOCK, AGENT_IDS));
    const a = AGENT_IDS[0]!;
    const b = AGENT_IDS[1]!;
    const fromA = result.current.positions.get(a)!;
    const fromB = result.current.positions.get(b)!;
    const tileA = result.current.tilesWithAgents.find(
      (tile) => cellKey(tile.col, tile.row) === fromA,
    )!;
    const tileB = result.current.tilesWithAgents.find(
      (tile) => cellKey(tile.col, tile.row) === fromB,
    )!;
    const start = center(tileA);
    const dest = center(tileB);
    act(() => {
      result.current.drag.begin(a, 0, 0);
    });
    act(() => {
      result.current.drag.move(dest.x - start.x, dest.y - start.y);
    });
    let drop: ReturnType<typeof result.current.drag.end> = null;
    act(() => {
      drop = result.current.drag.end();
    });
    expect(drop).toMatchObject({
      agentId: a,
      from: fromA,
      to: fromB,
      swappedWith: b,
    });
    expect(result.current.positions.get(a)).toBe(fromB);
    expect(result.current.positions.get(b)).toBe(fromA);
  });

  it("returns to origin when dropped on the CTA", () => {
    const { result } = renderHook(() => useBoard(LOCK, AGENT_IDS));
    const agentId = AGENT_IDS[0]!;
    const from = result.current.positions.get(agentId)!;
    const fromTile = result.current.tilesWithAgents.find(
      (tile) => cellKey(tile.col, tile.row) === from,
    )!;
    const cta = result.current.tilesWithAgents.find((tile) => tile.role === "cta")!;
    const start = center(fromTile);
    const dest = center(cta);
    act(() => {
      result.current.drag.begin(agentId, 0, 0);
    });
    act(() => {
      result.current.drag.move(dest.x - start.x, dest.y - start.y);
    });
    let drop: ReturnType<typeof result.current.drag.end> = null;
    act(() => {
      drop = result.current.drag.end();
    });
    expect(drop).toMatchObject({ agentId, from, to: from });
    expect(result.current.positions.get(agentId)).toBe(from);
  });

  it("keeps moved false under 6px", () => {
    const { result } = renderHook(() => useBoard(LOCK, AGENT_IDS));
    act(() => {
      result.current.drag.begin(AGENT_IDS[0]!, 10, 10);
    });
    expect(result.current.drag.moved).toBe(false);
    act(() => {
      result.current.drag.move(13, 14);
    });
    expect(result.current.drag.moved).toBe(false);
    expect(Math.hypot(3, 4)).toBe(5);
  });

  it("returns dropX/dropY at the target center", () => {
    const { result } = renderHook(() => useBoard(LOCK, AGENT_IDS));
    const agentId = AGENT_IDS[0]!;
    const from = result.current.positions.get(agentId)!;
    const fromTile = result.current.tilesWithAgents.find(
      (tile) => cellKey(tile.col, tile.row) === from,
    )!;
    const empty = result.current.tilesWithAgents.find(
      (tile) => tile.role === "occupancy" && tile.inside,
    )!;
    const start = center(fromTile);
    const dest = center(empty);
    act(() => {
      result.current.drag.begin(agentId, 0, 0);
    });
    act(() => {
      result.current.drag.move(dest.x - start.x, dest.y - start.y);
    });
    let drop: ReturnType<typeof result.current.drag.end> = null;
    act(() => {
      drop = result.current.drag.end();
    });
    expect(drop?.dropX).toBeCloseTo(dest.x);
    expect(drop?.dropY).toBeCloseTo(dest.y);
  });

  it("re-picks deterministically on layout resize using the current seed", () => {
    const { result, rerender } = renderHook(
      ({ layout }) => useBoard(layout, AGENT_IDS),
      { initialProps: { layout: LOCK } },
    );
    act(() => {
      result.current.shuffle();
    });
    const portrait = layoutTiles(390, 844, 1);
    rerender({ layout: portrait });
    expect(snapshot(result.current.positions)).toEqual(
      snapshot(numbersOf(layoutTiles(390, 844, 1, { seed: 1 }))),
    );
    expect(result.current.positions.size).toBe(17);
  });
});
