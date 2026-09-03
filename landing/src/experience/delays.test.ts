import { describe, expect, it } from "vitest";
import { AGENTS } from "./agents";
import {
  ctaOrigin,
  flipAxis,
  flipDelay,
  flipTargets,
  flipTilt,
  scheduledFlipDelay,
} from "./delays";
import type { Tile } from "./tiles";

const tile: Tile = {
  id: "01",
  role: "number",
  col: 0,
  row: 0,
  x: 100,
  y: 40,
  size: 80,
  inside: true,
};

const cta: Tile = {
  id: "cta",
  role: "cta",
  col: 1,
  row: 1,
  x: 200,
  y: 120,
  size: 80,
  inside: true,
};

const occupancy: Tile = {
  id: "o:2,2",
  role: "occupancy",
  col: 2,
  row: 2,
  x: 300,
  y: 200,
  size: 80,
  inside: true,
};

describe("flipDelay", () => {
  it("is distance to the tile center over speed × minSide", () => {
    const origin = { x: 0, y: 0 };
    const minSide = 900;
    const dist = Math.hypot(100 + 40, 40 + 40);
    expect(flipDelay(tile, origin, 1.6, minSide)).toBe(dist / (1.6 * minSide));
  });

  it("returns 0 when reduced motion is preferred", () => {
    const origin = { x: 400, y: 200 };
    expect(scheduledFlipDelay(tile, origin, 1.6, 720, true)).toBe(0);
    expect(scheduledFlipDelay(tile, origin, 1.6, 720, false)).toBe(
      flipDelay(tile, origin, 1.6, 720),
    );
  });
});

describe("flipTargets and ctaOrigin", () => {
  it("returns only role === number tiles and omits occupancy and CTA", () => {
    const numbered = Array.from({ length: 17 }, (_, i) => ({
      ...tile,
      id: AGENTS[i]?.id ?? String(i + 1),
      col: i,
    }));
    const tiles: Tile[] = [cta, occupancy, occupancy, ...numbered];
    const targets = flipTargets(tiles);
    expect(targets).toHaveLength(numbered.length);
    expect(targets.every((item) => item.role === "number")).toBe(true);
    expect(targets.some((item) => item.role === "occupancy")).toBe(false);
    expect(targets.some((item) => item.role === "cta")).toBe(false);
    expect(ctaOrigin(tiles)).toEqual({
      x: cta.x + cta.size / 2,
      y: cta.y + cta.size / 2,
    });
    expect(ctaOrigin(targets)).toBeNull();
  });

  it("gives delay 0 to a tile whose center coincides with the CTA origin", () => {
    const origin = ctaOrigin([cta, tile, occupancy]);
    expect(origin).not.toBeNull();
    const coinciding: Tile = {
      ...tile,
      x: cta.x,
      y: cta.y,
      size: cta.size,
    };
    expect(flipDelay(coinciding, origin!, 1.6, 720)).toBe(0);
    expect(flipDelay(occupancy, origin!, 1.6, 720)).not.toBe(0);
  });
});

function numberedAt(
  centerX: number,
  centerY: number,
  size = 80,
): Tile {
  return {
    ...tile,
    x: centerX - size / 2,
    y: centerY - size / 2,
    size,
  };
}

describe("flipAxis", () => {
  const origin = { x: 100, y: 100 };

  it("returns compass axes for east west south and north of the origin", () => {
    expect(flipAxis(numberedAt(200, 100), origin)).toEqual({ x: 0, y: -1 });
    expect(flipAxis(numberedAt(0, 100), origin)).toEqual({ x: 0, y: 1 });
    expect(flipAxis(numberedAt(100, 200), origin)).toEqual({ x: 1, y: 0 });
    expect(flipAxis(numberedAt(100, 0), origin)).toEqual({ x: -1, y: 0 });
  });

  it("returns a finite coincidence axis and opposite signs on opposite sides", () => {
    const coincident = flipAxis(numberedAt(100, 100), origin);
    expect(coincident).toEqual({ x: 0, y: -1 });
    expect(Number.isFinite(coincident.x)).toBe(true);
    expect(Number.isFinite(coincident.y)).toBe(true);
    expect(coincident.x).not.toBeNaN();
    expect(coincident.y).not.toBeNaN();

    const east = flipAxis(numberedAt(200, 100), origin);
    const west = flipAxis(numberedAt(0, 100), origin);
    const south = flipAxis(numberedAt(100, 200), origin);
    const north = flipAxis(numberedAt(100, 0), origin);
    expect(east.y).toBe(-west.y);
    expect(south.x).toBe(-north.x);
    expect(east.y).not.toBe(west.y);
    expect(south.x).not.toBe(north.x);
  });

  it("snaps diagonals to one grid axis so 180deg does not diamond the square", () => {
    const northeast = flipAxis(numberedAt(200, 200), origin);
    expect(northeast.x === 0 || northeast.y === 0).toBe(true);
    expect(Math.abs(northeast.x) + Math.abs(northeast.y)).toBe(1);

    const moreEast = flipAxis(numberedAt(200, 120), origin);
    expect(moreEast).toEqual({ x: 0, y: -1 });

    const moreSouth = flipAxis(numberedAt(120, 200), origin);
    expect(moreSouth).toEqual({ x: 1, y: 0 });
  });
});

describe("flipTilt", () => {
  const origin = { x: 100, y: 100 };

  it("returns 0 when the tile center coincides with the origin", () => {
    expect(flipTilt(numberedAt(100, 100), origin)).toBe(0);
  });

  it("returns 0 on compass axes where snap discards nothing", () => {
    expect(flipTilt(numberedAt(200, 100), origin)).toBe(0);
    expect(flipTilt(numberedAt(0, 100), origin)).toBe(0);
    expect(flipTilt(numberedAt(100, 200), origin)).toBe(0);
    expect(flipTilt(numberedAt(100, 0), origin)).toBe(0);
  });

  it("returns opposite leftover signs on opposite diagonals within [-1, 1]", () => {
    const ne = flipTilt(numberedAt(200, 200), origin);
    const sw = flipTilt(numberedAt(0, 0), origin);
    expect(ne).toBeCloseTo(-Math.SQRT1_2);
    expect(sw).toBeCloseTo(Math.SQRT1_2);
    expect(ne).not.toBe(0);
    expect(sw).not.toBe(0);
    expect(Math.sign(ne)).toBe(-Math.sign(sw));
    expect(Math.abs(ne)).toBeLessThanOrEqual(1);
    expect(Math.abs(sw)).toBeLessThanOrEqual(1);

    const nw = flipTilt(numberedAt(0, 200), origin);
    const se = flipTilt(numberedAt(200, 0), origin);
    expect(nw).toBeCloseTo(Math.SQRT1_2);
    expect(se).toBeCloseTo(-Math.SQRT1_2);
    expect(Math.sign(nw)).toBe(-Math.sign(se));
    expect(Math.abs(nw)).toBeLessThanOrEqual(1);
    expect(Math.abs(se)).toBeLessThanOrEqual(1);
  });

  it("keeps the discarded CW component after a non-45 snap within [-1, 1]", () => {
    const moreEast = flipTilt(numberedAt(200, 120), origin);
    const len = Math.hypot(100, 20);
    expect(moreEast).toBeCloseTo(20 / len);
    expect(Math.abs(moreEast)).toBeLessThanOrEqual(1);

    const moreSouth = flipTilt(numberedAt(120, 200), origin);
    expect(moreSouth).toBeCloseTo(-20 / len);
    expect(Math.abs(moreSouth)).toBeLessThanOrEqual(1);
    expect(Math.sign(moreEast)).toBe(-Math.sign(moreSouth));
  });
});
