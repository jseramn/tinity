import { describe, expect, it } from "vitest";
import { FIELD_OPTIONS } from "./adapters/options";
import { AGENTS } from "./agents";
import {
  layoutTiles,
  nearestCell,
  numberStride,
  type Layout,
  type Tile,
} from "./tiles";

const LOCK_W = 1280;
const LOCK_H = 720;

function tilesOf(
  w: number,
  h: number,
  dpr = 1,
  options?: Parameters<typeof layoutTiles>[3],
): Tile[] {
  return layoutTiles(w, h, dpr, options).tiles;
}

function chebyshev(
  a: Pick<Tile, "col" | "row">,
  b: Pick<Tile, "col" | "row">,
) {
  return Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
}

function numberKeys(layout: Layout): string[] {
  return layout.tiles
    .filter((tile) => tile.role === "number")
    .map((tile) => `${tile.col},${tile.row}`)
    .sort();
}

describe("layoutTiles lattice occupancy", () => {
  it("locks 1280×720 dpr=1 to cellCss 80, 16×9 occupancy, and (0,0) at (0,640)", () => {
    const layout = layoutTiles(LOCK_W, LOCK_H, 1);
    const tiles = layout.tiles;
    expect(FIELD_OPTIONS.cellScale).toBe(9);
    expect(tiles).toHaveLength(144);
    expect(new Set(tiles.map((tile) => tile.size)).size).toBe(1);
    expect(tiles[0]?.size).toBe(80);
    expect(layout.cellCss).toBe(80);
    expect(layout.cols).toBe(16);
    expect(layout.rows).toBe(9);
    expect(layout.offsetX).toBe(0);
    expect(layout.offsetY).toBe(0);
    expect(layout.padX).toBe(0);
    expect(layout.padY).toBe(0);
    const origin = tiles.find((tile) => tile.col === 0 && tile.row === 0);
    expect(origin).toMatchObject({ x: 0, y: 640, size: 80 });
    expect(Math.max(...tiles.map((tile) => tile.col))).toBe(15);
    expect(Math.max(...tiles.map((tile) => tile.row))).toBe(8);
  });

  it("splits leftover landscape columns equally left and right", () => {
    const exact = layoutTiles(LOCK_W, LOCK_H, 1);
    const wide = layoutTiles(1300, LOCK_H, 1);
    expect(wide.cols).toBeGreaterThan(exact.cols);
    expect(wide.padY).toBe(0);
    expect(wide.padX).toBeGreaterThan(0);
    expect(wide.offsetX).toBe(-wide.padX);
    const left = wide.tiles.find((tile) => tile.col === 0);
    const right = wide.tiles.find((tile) => tile.col === wide.cols - 1);
    expect(left).toBeDefined();
    expect(right).toBeDefined();
    const leftClip = 0 - left!.x;
    const rightClip = right!.x + right!.size - 1300;
    expect(leftClip).toBeCloseTo(rightClip);
    expect(leftClip).toBeCloseTo(wide.padX);
  });

  it("uses floor-center CTA (8,4) at (640,320) and keeps integer p on id p", () => {
    const layout = layoutTiles(LOCK_W, LOCK_H, 1);
    const tiles = layout.tiles;
    const ctas = tiles.filter((tile) => tile.role === "cta");
    expect(ctas).toHaveLength(1);
    expect(ctas[0]).toMatchObject({
      id: "cta",
      col: 8,
      row: 4,
      x: 640,
      y: 320,
      size: 80,
    });
    expect(layout.cta).toEqual({ col: 8, row: 4 });
    expect(ctas[0]?.col).toBe(8);
    expect(Number.isInteger((LOCK_W / 2 / LOCK_H) * FIELD_OPTIONS.cellScale)).toBe(
      true,
    );
  });

  it("places a viewport-scaled irregular mix of clustered and isolated numbers", () => {
    expect(numberStride(16, 9)).toBe(3);
    const tiles = tilesOf(LOCK_W, LOCK_H, 1);
    const again = tilesOf(LOCK_W, LOCK_H, 1);
    expect(tiles).toHaveLength(144);
    const cta = tiles.find((tile) => tile.role === "cta");
    expect(cta).toMatchObject({ col: 8, row: 4 });
    const numbers = tiles.filter((tile) => tile.role === "number");
    const occupancy = tiles.filter((tile) => tile.role === "occupancy");
    expect(numbers).toHaveLength(17);
    expect(occupancy).toHaveLength(126);
    expect(
      again
        .filter((tile) => tile.role === "number")
        .map((tile) => `${tile.col},${tile.row}`),
    ).toEqual(numbers.map((tile) => `${tile.col},${tile.row}`));
    const visual = [...numbers].sort((a, b) =>
      a.y === b.y ? a.x - b.x : a.y - b.y,
    );
    expect(visual.map((tile) => tile.id)).toEqual(AGENTS.map((agent) => agent.id));
    const strideKeys = new Set<string>();
    for (const col of [2, 5, 8, 11, 14]) {
      for (const row of [1, 4, 7]) {
        if (col === 8 && row === 4) continue;
        strideKeys.add(`${col},${row}`);
      }
    }
    expect(new Set(numbers.map((tile) => `${tile.col},${tile.row}`))).not.toEqual(
      strideKeys,
    );
    let clustered = 0;
    let isolated = 0;
    for (const tile of numbers) {
      const nearest = Math.min(
        ...numbers
          .filter((other) => other !== tile)
          .map((other) => chebyshev(tile, other)),
      );
      if (nearest === 1) clustered += 1;
      if (nearest >= 2) isolated += 1;
    }
    expect(clustered).toBeGreaterThan(0);
    expect(isolated).toBeGreaterThan(0);
    expect(
      Math.max(...numbers.map((tile) => tile.col)) -
        Math.min(...numbers.map((tile) => tile.col)),
    ).toBeGreaterThanOrEqual(8);
    expect(
      Math.max(...numbers.map((tile) => tile.row)) -
        Math.min(...numbers.map((tile) => tile.row)),
    ).toBeGreaterThanOrEqual(4);
    expect(numbers.every((tile) => tile.col !== 8 || tile.row !== 4)).toBe(true);
    for (const tile of occupancy) {
      expect(tile.id).toBe(`o:${tile.col},${tile.row}`);
    }
  });

  it("keeps the 17-agent catalog across viewports and changes composition with aspect", () => {
    const portrait = tilesOf(390, 844, 1);
    const landscape = tilesOf(LOCK_W, LOCK_H, 1);
    const ultrawide = tilesOf(1300, LOCK_H, 1);
    const portraitNumbers = portrait.filter((tile) => tile.role === "number");
    const landscapeNumbers = landscape.filter((tile) => tile.role === "number");
    const ultrawideNumbers = ultrawide.filter((tile) => tile.role === "number");
    expect(portraitNumbers).toHaveLength(AGENTS.length);
    expect(landscapeNumbers).toHaveLength(AGENTS.length);
    expect(ultrawideNumbers).toHaveLength(AGENTS.length);
    const visualIds = (tiles: Tile[]) =>
      [...tiles]
        .sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y))
        .map((tile) => tile.id);
    expect(visualIds(portraitNumbers)).toEqual(AGENTS.map((agent) => agent.id));
    expect(visualIds(landscapeNumbers)).toEqual(AGENTS.map((agent) => agent.id));
    expect(
      portraitNumbers.map((tile) => `${tile.col},${tile.row}`).sort(),
    ).not.toEqual(landscapeNumbers.map((tile) => `${tile.col},${tile.row}`).sort());
    expect(Math.max(...portraitNumbers.map((tile) => tile.row))).toBeGreaterThan(
      Math.max(...landscapeNumbers.map((tile) => tile.row)),
    );
  });

  it("never assigns an agent to a cell clipped by the viewport edge", () => {
    const viewports: [number, number, number][] = [
      [1728.888916015625, 807.77783203125, 0.8999999761581421],
      [1024, 486, 1],
      [1366, 768, 1.25],
      [390, 844, 3],
    ];
    for (const [w, h, dpr] of viewports) {
      const tiles = tilesOf(w, h, dpr);
      const numbers = tiles.filter((tile) => tile.role === "number");
      expect(numbers).toHaveLength(AGENTS.length);
      for (const tile of numbers) {
        expect(tile.inside).toBe(true);
        expect(tile.x + tile.size).toBeLessThanOrEqual(w + 0.5);
        expect(tile.y + tile.size).toBeLessThanOrEqual(h + 0.5);
        expect(tile.x).toBeGreaterThanOrEqual(-0.5);
        expect(tile.y).toBeGreaterThanOrEqual(-0.5);
      }
    }
  });

  it("locks 1728×807 dpr 0.9 to nine short-axis cells and first-column offsetX", () => {
    const w = 1728;
    const h = 807;
    const layout = layoutTiles(w, h, 0.9);
    expect(9 * layout.cellCss).toBe(h);
    expect(layout.rows).toBe(9);
    const first = layout.tiles.find((tile) => tile.col === 0 && tile.row === 0);
    expect(first).toBeDefined();
    expect(first!.x).toBe(layout.offsetX);
    expect(first!.x + layout.padX).toBe(0);
  });

  it("fits landscape short-axis rows inside the viewport including dpr 0.9", () => {
    const viewports: [number, number, number][] = [
      [1728, 807, 0.9],
      [2074, 1166, 1],
      [1366, 768, 1.25],
    ];
    for (const [w, h, dpr] of viewports) {
      const layout = layoutTiles(w, h, dpr);
      expect(w).toBeGreaterThanOrEqual(h);
      expect(layout.padY).toBe(0);
      expect(layout.rows * layout.cellCss).toBeLessThanOrEqual(h + 0.5);
      const inside = layout.tiles.filter((tile) => tile.inside);
      expect(inside.length).toBeGreaterThan(0);
      for (const tile of inside) {
        expect(tile.y).toBeGreaterThanOrEqual(-0.5);
        expect(tile.y + tile.size).toBeLessThanOrEqual(h + 0.5);
      }
      const agents = layout.tiles.filter((tile) => tile.role === "number");
      expect(agents).toHaveLength(AGENTS.length);
      expect(agents.every((tile) => tile.inside)).toBe(true);
    }
  });

  it("returns an empty layout when width or height is not positive and keeps stride equal to size", () => {
    expect(layoutTiles(0, LOCK_H, 1).tiles).toEqual([]);
    expect(layoutTiles(LOCK_W, 0).tiles).toEqual([]);
    expect(layoutTiles(-10, 720, 1).tiles).toEqual([]);
    const tiles = tilesOf(LOCK_W, LOCK_H, 1);
    const origin = tiles.find((tile) => tile.col === 0 && tile.row === 0);
    const right = tiles.find((tile) => tile.col === 1 && tile.row === 0);
    const above = tiles.find((tile) => tile.col === 0 && tile.row === 1);
    expect(origin).toBeDefined();
    expect(right).toBeDefined();
    expect(above).toBeDefined();
    expect(right!.x - origin!.x).toBe(origin!.size);
    expect(origin!.y - above!.y).toBe(origin!.size);
    expect(right!.x - origin!.x - origin!.size).toBe(0);
  });

  it("aligns leftover landscape 1728×807 so both long-axis columns clip equally", () => {
    const w = 1728;
    const h = 807;
    const layout = layoutTiles(w, h, 1);
    expect(layout.padY).toBe(0);
    expect(layout.padX).toBeGreaterThan(0);
    expect(layout.offsetX).toBeCloseTo(-layout.padX);
    const origin = layout.tiles.find((tile) => tile.col === 0 && tile.row === 0);
    expect(origin).toBeDefined();
    expect(origin!.x).toBeCloseTo(layout.offsetX);
    expect(origin!.y).toBeCloseTo(h + layout.padY - layout.cellCss);
    const left = layout.tiles.find((tile) => tile.col === 0)!;
    const right = layout.tiles.find((tile) => tile.col === layout.cols - 1)!;
    const leftClip = 0 - left.x;
    const rightClip = right.x + right.size - w;
    expect(leftClip).toBeCloseTo(rightClip);
    expect(left.inside).toBe(false);
    expect(right.inside).toBe(false);
  });

  it("aligns leftover portrait 440×956 so top and bottom rows clip equally", () => {
    const w = 440;
    const h = 956;
    const layout = layoutTiles(w, h, 1);
    expect(layout.padX).toBe(0);
    expect(layout.padY).toBeGreaterThan(0);
    expect(layout.offsetY).toBeCloseTo(-layout.padY);
    const origin = layout.tiles.find((tile) => tile.col === 0 && tile.row === 0);
    expect(origin).toBeDefined();
    expect(origin!.x).toBeCloseTo(layout.offsetX);
    expect(origin!.y).toBeCloseTo(h + layout.padY - layout.cellCss);
    const bottom = layout.tiles.find((tile) => tile.row === 0)!;
    const top = layout.tiles.find((tile) => tile.row === layout.rows - 1)!;
    const topClip = 0 - top.y;
    const bottomClip = bottom.y + bottom.size - h;
    expect(topClip).toBeCloseTo(bottomClip);
    expect(top.y).toBeLessThan(0);
    expect(bottom.y + bottom.size).toBeGreaterThan(h);
    expect(top.inside).toBe(false);
    expect(bottom.inside).toBe(false);
  });

  it("keeps 1280×720 16×9 exact offsets at 0 matching today's coordinates", () => {
    const layout = layoutTiles(LOCK_W, LOCK_H, 1);
    expect(layout.offsetX).toBe(0);
    expect(layout.offsetY).toBe(0);
    expect(layout.padX).toBe(0);
    expect(layout.padY).toBe(0);
    const origin = layout.tiles.find((tile) => tile.col === 0 && tile.row === 0);
    expect(origin).toMatchObject({ x: 0, y: 640, size: 80, inside: true });
  });

  it("keeps reservedRows=1 free of agents on the bottom row", () => {
    const layout = layoutTiles(LOCK_W, LOCK_H, 1, { reservedRows: 1 });
    const numbers = layout.tiles.filter((tile) => tile.role === "number");
    expect(numbers).toHaveLength(AGENTS.length);
    expect(numbers.every((tile) => tile.row !== 0)).toBe(true);
    expect(layout.reservedRows).toBe(1);
  });

  it("counts reservedRows from the first fully visible row on portrait", () => {
    const w = 390;
    const h = 844;
    const layout = layoutTiles(w, h, 2, { reservedRows: 1 });
    expect(layout.padY).toBeGreaterThan(0);
    const numbers = layout.tiles.filter((tile) => tile.role === "number");
    expect(numbers).toHaveLength(AGENTS.length);
    const lowest = Math.max(...numbers.map((tile) => tile.y + tile.size));
    expect(h - lowest).toBeGreaterThanOrEqual(layout.cellCss - 0.5);
  });

  it("changes composition with seed 1 while keeping 17 agents", () => {
    const zero = layoutTiles(LOCK_W, LOCK_H, 1, { seed: 0 });
    const one = layoutTiles(LOCK_W, LOCK_H, 1, { seed: 1 });
    expect(zero.tiles.filter((tile) => tile.role === "number")).toHaveLength(17);
    expect(one.tiles.filter((tile) => tile.role === "number")).toHaveLength(17);
    expect(numberKeys(zero)).not.toEqual(numberKeys(one));
  });

  it("picks the nearest fully-inside tile and ignores clipped cells", () => {
    const layout = layoutTiles(1728, 807, 1);
    const cta = layout.tiles.find((tile) => tile.role === "cta")!;
    expect(
      nearestCell(
        layout.tiles,
        cta.x + cta.size / 2,
        cta.y + cta.size / 2,
      )?.id,
    ).toBe("cta");
    const clipped = layout.tiles.find((tile) => !tile.inside);
    expect(clipped).toBeDefined();
    const nearest = nearestCell(
      layout.tiles,
      clipped!.x + clipped!.size / 2,
      clipped!.y + clipped!.size / 2,
    );
    expect(nearest).toBeDefined();
    expect(nearest!.inside).toBe(true);
    expect(nearest).not.toBe(clipped);
  });
});
