import { FIELD_OPTIONS } from "./adapters/options";

export type Tile = {
  id: string;
  role: "cta" | "number" | "occupancy";
  col: number;
  row: number;
  x: number;
  y: number;
  size: number;
};

type Cell = Omit<Tile, "id" | "role">;

export function numberStride(colCount: number, rowCount: number): number {
  return Math.max(2, Math.round(Math.sqrt((colCount * rowCount) / 16)));
}

function aligned(n: number, origin: number, stride: number): boolean {
  return ((n - origin) % stride + stride) % stride === 0;
}

function chebyshev(
  a: Pick<Cell, "col" | "row">,
  b: Pick<Cell, "col" | "row">,
) {
  return Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
}

function cellKey(cell: Pick<Cell, "col" | "row">) {
  return `${cell.col},${cell.row}`;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const current = out[i]!;
    out[i] = out[j]!;
    out[j] = current;
  }
  return out;
}

function wouldFillSquare(cell: Cell, taken: Set<string>): boolean {
  for (const dc of [-1, 0]) {
    for (const dr of [-1, 0]) {
      const square = [
        `${cell.col + dc},${cell.row + dr}`,
        `${cell.col + dc + 1},${cell.row + dr}`,
        `${cell.col + dc},${cell.row + dr + 1}`,
        `${cell.col + dc + 1},${cell.row + dr + 1}`,
      ];
      if (square.every((key) => key === cellKey(cell) || taken.has(key))) {
        return true;
      }
    }
  }
  return false;
}

function strideTargetCount(
  colCount: number,
  rowCount: number,
  ctaCol: number,
  ctaRow: number,
): number {
  const stride = numberStride(colCount, rowCount);
  let count = 0;
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      if (col === ctaCol && row === ctaRow) continue;
      if (aligned(col, ctaCol, stride) && aligned(row, ctaRow, stride)) {
        count += 1;
      }
    }
  }
  return count;
}

function pickNumbered(
  cells: Cell[],
  ctaCol: number,
  ctaRow: number,
  colCount: number,
  rowCount: number,
): Cell[] {
  const target = strideTargetCount(colCount, rowCount, ctaCol, ctaRow);
  const eligible = cells.filter(
    (cell) => !(cell.col === ctaCol && cell.row === ctaRow),
  );
  const seed =
    ((colCount * 73856093) ^
      (rowCount * 19349663) ^
      (ctaCol * 83492791) ^
      (ctaRow * 50331653)) >>>
    0;
  const pool = shuffle(eligible, mulberry32(seed));
  const selected: Cell[] = [];
  const taken = new Set<string>();

  const minDist = (cell: Cell) => {
    let min = Infinity;
    for (const other of selected) {
      min = Math.min(min, chebyshev(cell, other));
    }
    return min;
  };

  const adjacent = (cell: Cell) =>
    selected.filter((other) => chebyshev(cell, other) === 1);

  const take = (cell: Cell) => {
    selected.push(cell);
    taken.add(cellKey(cell));
  };

  const clusterBudget = Math.max(2, Math.round(target * 0.36));
  const isolatedTarget = Math.max(1, target - clusterBudget);

  for (const cell of pool) {
    if (selected.length >= isolatedTarget) break;
    if (selected.length === 0 || minDist(cell) >= 2) take(cell);
  }

  for (const cell of pool) {
    if (selected.length >= target) break;
    if (taken.has(cellKey(cell))) continue;
    const neighbors = adjacent(cell);
    if (neighbors.length !== 1) continue;
    const hub = neighbors[0]!;
    const hubPaired = adjacent(hub).length >= 1;
    if (hubPaired || wouldFillSquare(cell, taken)) continue;
    take(cell);
  }

  for (const cell of pool) {
    if (selected.length >= target) break;
    if (taken.has(cellKey(cell))) continue;
    if (minDist(cell) >= 2) take(cell);
  }

  for (const cell of pool) {
    if (selected.length >= target) break;
    if (taken.has(cellKey(cell))) continue;
    if (!wouldFillSquare(cell, taken)) take(cell);
  }

  return selected.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
}

export function layoutTiles(w: number, h: number, dpr = 1): Tile[] {
  const cellScale = FIELD_OPTIONS.cellScale;
  if (w <= 0 || h <= 0) return [];

  const width = Math.max(1, Math.round(w * dpr));
  const height = Math.max(1, Math.round(h * dpr));
  const minAxis = Math.min(width, height);
  const cellCss = minAxis / cellScale / dpr;
  const colCount = Math.ceil((width * cellScale) / minAxis);
  const rowCount = Math.ceil((height * cellScale) / minAxis);

  const ctaCol = Math.floor(((w / 2) * dpr / minAxis) * cellScale);
  const ctaRow = Math.floor(((height - (h / 2) * dpr) / minAxis) * cellScale);

  const cells: Cell[] = [];
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      cells.push({
        col,
        row,
        x: (col * minAxis) / cellScale / dpr,
        y: (height - (row + 1) * minAxis / cellScale) / dpr,
        size: cellCss,
      });
    }
  }

  const numbered = pickNumbered(cells, ctaCol, ctaRow, colCount, rowCount);
  const numberIds = new Map<string, string>();
  numbered.forEach((cell, index) => {
    numberIds.set(
      `${cell.col},${cell.row}`,
      String(index + 1).padStart(2, "0"),
    );
  });

  return cells.map((cell) => {
    if (cell.col === ctaCol && cell.row === ctaRow) {
      return { ...cell, id: "cta", role: "cta" as const };
    }
    const numberId = numberIds.get(`${cell.col},${cell.row}`);
    if (numberId) {
      return { ...cell, id: numberId, role: "number" as const };
    }
    return {
      ...cell,
      id: `o:${cell.col},${cell.row}`,
      role: "occupancy" as const,
    };
  });
}
