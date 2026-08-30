import { describe, expect, it } from "vitest";
import { FIELD_OPTIONS } from "./adapters/options";
import { layoutTiles, numberStride, type Tile } from "./tiles";

const LOCK_W = 1280;
const LOCK_H = 720;

function chebyshev(
  a: Pick<Tile, "col" | "row">,
  b: Pick<Tile, "col" | "row">,
) {
  return Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
}

describe("layoutTiles lattice occupancy", () => {
  it("locks 1280×720 dpr=1 to cellCss 80, 16×9 occupancy, and (0,0) at (0,640)", () => {
    const tiles = layoutTiles(LOCK_W, LOCK_H, 1);
    expect(FIELD_OPTIONS.cellScale).toBe(9);
    expect(tiles).toHaveLength(144);
    expect(new Set(tiles.map((tile) => tile.size)).size).toBe(1);
    expect(tiles[0]?.size).toBe(80);
    const origin = tiles.find((tile) => tile.col === 0 && tile.row === 0);
    expect(origin).toMatchObject({ x: 0, y: 640, size: 80 });
    expect(Math.max(...tiles.map((tile) => tile.col))).toBe(15);
    expect(Math.max(...tiles.map((tile) => tile.row))).toBe(8);
  });

  it("places leftover landscape columns on the right", () => {
    const exact = layoutTiles(LOCK_W, LOCK_H, 1);
    const wide = layoutTiles(1300, LOCK_H, 1);
    const exactMaxCol = Math.max(...exact.map((tile) => tile.col));
    const wideMaxCol = Math.max(...wide.map((tile) => tile.col));
    expect(wideMaxCol).toBeGreaterThan(exactMaxCol);
    const leftover = wide.filter((tile) => tile.col > exactMaxCol);
    expect(leftover.length).toBeGreaterThan(0);
    const exactRight = Math.max(...exact.map((tile) => tile.x));
    expect(leftover.every((tile) => tile.x > exactRight)).toBe(true);
  });

  it("uses floor-center CTA (8,4) at (640,320) and keeps integer p on id p", () => {
    const tiles = layoutTiles(LOCK_W, LOCK_H, 1);
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
    expect(ctas[0]?.col).toBe(8);
    expect(Number.isInteger((LOCK_W / 2 / LOCK_H) * FIELD_OPTIONS.cellScale)).toBe(
      true,
    );
  });

  it("places a viewport-scaled irregular mix of clustered and isolated numbers", () => {
    expect(numberStride(16, 9)).toBe(3);
    const tiles = layoutTiles(LOCK_W, LOCK_H, 1);
    const again = layoutTiles(LOCK_W, LOCK_H, 1);
    expect(tiles).toHaveLength(144);
    const cta = tiles.find((tile) => tile.role === "cta");
    expect(cta).toMatchObject({ col: 8, row: 4 });
    const numbers = tiles.filter((tile) => tile.role === "number");
    const occupancy = tiles.filter((tile) => tile.role === "occupancy");
    expect(numbers).toHaveLength(14);
    expect(occupancy).toHaveLength(129);
    expect(
      again
        .filter((tile) => tile.role === "number")
        .map((tile) => `${tile.col},${tile.row}`),
    ).toEqual(numbers.map((tile) => `${tile.col},${tile.row}`));
    const byId = [...numbers].sort((a, b) => a.id.localeCompare(b.id));
    expect(byId.map((tile) => tile.id)).toEqual(
      Array.from({ length: 14 }, (_, i) => String(i + 1).padStart(2, "0")),
    );
    const visual = [...numbers].sort((a, b) =>
      a.y === b.y ? a.x - b.x : a.y - b.y,
    );
    expect(byId.map((tile) => `${tile.col},${tile.row}`)).toEqual(
      visual.map((tile) => `${tile.col},${tile.row}`),
    );
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

  it("changes number count and composition with viewport aspect", () => {
    const portrait = layoutTiles(390, 844, 1);
    const landscape = layoutTiles(LOCK_W, LOCK_H, 1);
    const ultrawide = layoutTiles(1300, LOCK_H, 1);
    const portraitNumbers = portrait.filter((tile) => tile.role === "number");
    const landscapeNumbers = landscape.filter((tile) => tile.role === "number");
    const ultrawideNumbers = ultrawide.filter((tile) => tile.role === "number");
    expect(portraitNumbers.length).not.toBe(landscapeNumbers.length);
    expect(Math.max(...portraitNumbers.map((tile) => tile.row))).toBeGreaterThan(
      Math.max(...landscapeNumbers.map((tile) => tile.row)),
    );
    expect(ultrawideNumbers.length).toBeGreaterThanOrEqual(landscapeNumbers.length);
  });

  it("returns [] when width or height is not positive and keeps stride equal to size", () => {
    expect(layoutTiles(0, LOCK_H, 1)).toEqual([]);
    expect(layoutTiles(LOCK_W, 0)).toEqual([]);
    expect(layoutTiles(-10, 720, 1)).toEqual([]);
    const tiles = layoutTiles(LOCK_W, LOCK_H, 1);
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
});
