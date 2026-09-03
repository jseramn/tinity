import { readFileSync } from "node:fs";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as ForceField from "../components/canvasui/ForceField";
import { AGENTS } from "./agents";
import { MANIFESTO } from "./copy";
import { ctaOrigin, flipAxis, flipTilt } from "./delays";
import { Stage } from "./Stage";
import { layoutTiles } from "./tiles";

const DEFAULT_VIEWPORT = {
  w: window.innerWidth,
  h: window.innerHeight,
};

function reservedRowsFor(height: number): number {
  return window.matchMedia("(pointer: coarse)").matches || height < 700 ? 1 : 0;
}

function currentLayout() {
  return layoutTiles(
    window.innerWidth,
    window.innerHeight,
    Math.min(window.devicePixelRatio || 1, 2),
    { reservedRows: reservedRowsFor(window.innerHeight) },
  );
}

function currentTiles() {
  return currentLayout().tiles;
}

function expectedNumberCount() {
  return currentTiles().filter((tile) => tile.role === "number").length;
}

function spyAnimate() {
  const proto = HTMLElement.prototype as HTMLElement & {
    animate?: typeof HTMLElement.prototype.animate;
  };
  if (typeof proto.animate !== "function") {
    proto.animate = vi.fn() as unknown as typeof HTMLElement.prototype.animate;
  }
  return vi.spyOn(proto, "animate");
}

function stubMatchMedia(reduce: boolean, pointer: "fine" | "coarse" = "fine") {
  window.matchMedia = (query: string) => {
    let matches = false;
    if (query.includes("prefers-reduced-motion")) matches = reduce;
    if (query.includes("pointer: fine")) matches = pointer === "fine";
    if (query.includes("pointer: coarse")) matches = pointer === "coarse";
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    } as MediaQueryList;
  };
}

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: height,
  });
}

function stubFieldImpact() {
  const impact = vi.fn();
  vi.spyOn(ForceField, "createForceField").mockReturnValue({
    impact,
    setOptions: vi.fn(),
    resize: vi.fn(),
    destroy: vi.fn(),
  });
  return impact;
}

function agentPositions() {
  return [...numberCubes()]
    .map((cube) => {
      const el = cube as HTMLElement;
      return [
        cube.querySelector("[data-agent]")?.getAttribute("data-agent") ?? "",
        el.style.left,
        el.style.top,
      ].join(":");
    })
    .sort();
}

function numberCubes() {
  return document.querySelectorAll(".cube--number");
}

function occupancyCubes() {
  return document.querySelectorAll(".cube--occupancy");
}

function flippedNumberCubes() {
  return document.querySelectorAll(".cube--number.is-flipped");
}

function fieldCanvases() {
  return document.querySelectorAll(".stage-slot canvas");
}

function cubeBack(id: string) {
  return document.querySelector(`[data-agent="${id}"]`);
}

function cssVar(el: Element, name: string) {
  return (el as HTMLElement).style.getPropertyValue(name);
}

function numberCubeEl(id: string) {
  return cubeBack(id)?.closest(".cube") as HTMLElement | undefined;
}

describe("Stage experience loop", () => {
  afterEach(() => {
    setViewport(DEFAULT_VIEWPORT.w, DEFAULT_VIEWPORT.h);
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 1,
    });
    stubMatchMedia(false);
    vi.restoreAllMocks();
  });

  it("renders occupancy cubes without numbers, numbered cubes, and one tinity me", async () => {
    stubMatchMedia(false);
    render(<Stage />);
    const cta = await screen.findByRole("button", { name: "tinity me" });
    const expected = expectedNumberCount();
    expect(numberCubes()).toHaveLength(expected);
    expect(screen.getAllByRole("button", { name: "tinity me" })).toHaveLength(1);
    expect(occupancyCubes().length).toBeGreaterThan(0);
    expect(occupancyCubes().length + expected + 1).toBe(
      document.querySelectorAll(".cube").length,
    );
    for (const cube of occupancyCubes()) {
      expect(cube.textContent?.trim()).toBe("");
      expect(cube).not.toHaveClass("is-flipped");
      expect(cube.querySelectorAll(".cube-face")).toHaveLength(1);
    }
    expect(flippedNumberCubes()).toHaveLength(0);
    expect(cta.style.background).not.toMatch(/accent|#1fdb12/i);
    expect(cta.style.getPropertyValue("--cell-css")).toMatch(/px$/);
    expect(fieldCanvases().length).toBeGreaterThan(0);
    expect(document.querySelector(".stage-slot .overlay")).toBeTruthy();
    expect(document.querySelector(".stage > .overlay")).toBeNull();
    expect(screen.queryByText(MANIFESTO)).not.toBeInTheDocument();
    expect(screen.queryByText("01")).not.toBeInTheDocument();
    const first = cubeBack(AGENTS[0].id);
    expect(first).toHaveAttribute("aria-hidden", "true");
    expect(first?.querySelector("img.cube-mark")).toHaveAttribute(
      "alt",
      AGENTS[0].label,
    );
    expect(document.querySelectorAll(".cube-mark")).toHaveLength(expected);
  });

  it("gives idle numbered cubes two faces, a spine, and unitless flip axes from the CTA", async () => {
    stubMatchMedia(false);
    render(<Stage />);
    await screen.findByRole("button", { name: "tinity me" });
    const tiles = currentTiles();
    const origin = ctaOrigin(tiles);
    expect(origin).not.toBeNull();
    const numbered = tiles.filter((tile) => tile.role === "number");
    expect(numbered.length).toBeGreaterThan(0);
    for (const tile of numbered) {
      const cube = numberCubeEl(tile.id);
      expect(cube).toBeTruthy();
      expect(cube!.querySelectorAll(".cube-face")).toHaveLength(2);
      expect(cube!.querySelector(".cube-face--front")).toBeTruthy();
      expect(cube!.querySelector(".cube-face--back")).toBeTruthy();
      expect(cube!.querySelector(".cube-spine")).toBeTruthy();
      const axis = flipAxis(tile, origin!);
      expect(cssVar(cube!, "--flip-x")).toBe(String(axis.x));
      expect(cssVar(cube!, "--flip-y")).toBe(String(axis.y));
    }
    const occupancy = occupancyCubes();
    expect(occupancy.length).toBeGreaterThan(0);
    for (const cube of occupancy) {
      expect(cube).not.toHaveClass("is-flipped");
      expect(cssVar(cube, "--flip-x")).toBe("");
      expect(cssVar(cube, "--flip-y")).toBe("");
    }
    const cta = screen.getByRole("button", { name: "tinity me" });
    expect(cta).not.toHaveClass("is-flipped");
    expect(cssVar(cta, "--flip-x")).toBe("");
    expect(cssVar(cta, "--flip-y")).toBe("");
  });

  it("wraps numbered cube-inner in cube-tumble and sets --flip-tilt only on numbers", async () => {
    stubMatchMedia(false);
    render(<Stage />);
    await screen.findByRole("button", { name: "tinity me" });
    const tiles = currentTiles();
    const origin = ctaOrigin(tiles);
    expect(origin).not.toBeNull();
    const numbered = tiles.filter((tile) => tile.role === "number");
    expect(numbered.length).toBeGreaterThan(0);
    for (const tile of numbered) {
      const cube = numberCubeEl(tile.id);
      expect(cube).toBeTruthy();
      const tumble = cube!.querySelector(":scope > .cube-tumble");
      expect(tumble).toBeTruthy();
      expect(tumble!.querySelector(":scope > .cube-lift > .cube-inner")).toBeTruthy();
      expect(cube!.querySelector(".cube-face--front")).toBeTruthy();
      expect(cube!.querySelector(".cube-spine")).toBeTruthy();
      expect(cube!.querySelector(".cube-face--back")).toBeTruthy();
      expect(cube!.querySelector(".cube-label")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      expect(cssVar(cube!, "--flip-tilt")).toBe(String(flipTilt(tile, origin!)));
    }
    const occupancy = occupancyCubes();
    expect(occupancy.length).toBeGreaterThan(0);
    for (const cube of occupancy) {
      expect(cube).not.toHaveClass("is-flipped");
      expect(cube.querySelector(".cube-tumble")).toBeNull();
      expect(cssVar(cube, "--flip-tilt")).toBe("");
    }
    const cta = screen.getByRole("button", { name: "tinity me" });
    expect(cta).not.toHaveClass("is-flipped");
    expect(cta.querySelector(".cube-tumble")).toBeNull();
    expect(cta.querySelector(".cube-lift")).toBeTruthy();
    expect(cssVar(cta, "--flip-tilt")).toBe("");
  });

  it("assigns opposite-signed flip axes to numbered cubes on opposite sides of the CTA", async () => {
    stubMatchMedia(false);
    render(<Stage />);
    await screen.findByRole("button", { name: "tinity me" });
    const tiles = currentTiles();
    const origin = ctaOrigin(tiles);
    expect(origin).not.toBeNull();
    const numbered = tiles.filter((tile) => tile.role === "number");
    const offset = (tile: (typeof numbered)[number]) => ({
      dx: tile.x + tile.size / 2 - origin!.x,
      dy: tile.y + tile.size / 2 - origin!.y,
    });
    const east = numbered.find((tile) => {
      const { dx, dy } = offset(tile);
      return dx > 0 && Math.abs(dx) >= Math.abs(dy);
    });
    const west = numbered.find((tile) => {
      const { dx, dy } = offset(tile);
      return dx < 0 && Math.abs(dx) >= Math.abs(dy);
    });
    expect(east).toBeTruthy();
    expect(west).toBeTruthy();
    const eastY = Number(cssVar(numberCubeEl(east!.id)!, "--flip-y"));
    const westY = Number(cssVar(numberCubeEl(west!.id)!, "--flip-y"));
    expect(eastY).not.toBe(0);
    expect(westY).not.toBe(0);
    expect(Math.sign(eastY)).toBe(-Math.sign(westY));

    const south = numbered.find((tile) => {
      const { dx, dy } = offset(tile);
      return dy > 0 && Math.abs(dy) >= Math.abs(dx);
    });
    const north = numbered.find((tile) => {
      const { dx, dy } = offset(tile);
      return dy < 0 && Math.abs(dy) >= Math.abs(dx);
    });
    expect(south).toBeTruthy();
    expect(north).toBeTruthy();
    const southX = Number(cssVar(numberCubeEl(south!.id)!, "--flip-x"));
    const northX = Number(cssVar(numberCubeEl(north!.id)!, "--flip-x"));
    expect(southX).not.toBe(0);
    expect(northX).not.toBe(0);
    expect(Math.sign(southX)).toBe(-Math.sign(northX));
  });

  it("flips the first and last agent marks on click without flipping occupancy or showing manifesto", async () => {
    stubMatchMedia(false);
    const animate = spyAnimate();
    const user = userEvent.setup();
    render(<Stage />);
    const cta = await screen.findByRole("button", { name: "tinity me" });
    const expected = expectedNumberCount();
    const lastId = AGENTS[expected - 1]?.id;
    expect(lastId).toBeDefined();
    expect(fieldCanvases().length).toBeGreaterThan(0);
    await user.click(cta);

    await waitFor(() => {
      expect(cubeBack(AGENTS[0].id)?.closest(".cube")).toHaveClass("is-flipped");
      expect(cubeBack(lastId!)?.closest(".cube")).toHaveClass("is-flipped");
    });
    expect(cubeBack(AGENTS[0].id)?.querySelector("a.cube-mark-link")).toHaveAttribute(
      "href",
      AGENTS[0].href,
    );
    expect(cubeBack(lastId!)?.querySelector("a.cube-mark-link")).toHaveAttribute(
      "href",
      AGENTS[expected - 1]?.href,
    );
    expect(animate).not.toHaveBeenCalled();
    expect(cta).not.toHaveClass("is-flipped");
    expect(cta.querySelector(".cube-tumble")).toBeNull();
    expect(cssVar(cta, "--flip-x")).toBe("");
    expect(cssVar(cta, "--flip-y")).toBe("");
    expect(cssVar(cta, "--flip-tilt")).toBe("");
    expect(occupancyCubes().length).toBeGreaterThan(0);
    for (const cube of occupancyCubes()) {
      expect(cube).not.toHaveClass("is-flipped");
      expect(cube.querySelector(".cube-tumble")).toBeNull();
      expect(cssVar(cube, "--flip-x")).toBe("");
      expect(cssVar(cube, "--flip-y")).toBe("");
      expect(cssVar(cube, "--flip-tilt")).toBe("");
    }
    expect(fieldCanvases().length).toBeGreaterThan(0);
    expect(screen.queryByText(MANIFESTO)).not.toBeInTheDocument();
  });

  it("shuffles agents on a second click and stays revealed", async () => {
    stubMatchMedia(false);
    const user = userEvent.setup();
    render(<Stage />);
    const cta = await screen.findByRole("button", { name: "tinity me" });
    await user.click(cta);
    const expected = expectedNumberCount();
    await waitFor(() => {
      expect(flippedNumberCubes()).toHaveLength(expected);
    });
    const before = agentPositions();
    await user.click(cta);
    expect(screen.getByRole("button", { name: "tinity me" })).toBeInTheDocument();
    expect(cta).toHaveAttribute("aria-describedby", "cta-hint");
    expect(cta).not.toHaveClass("is-armed");
    expect(screen.getByText("Shuffle the agents")).toHaveClass("sr-only");
    await waitFor(() => {
      expect(agentPositions()).not.toEqual(before);
    });
    await waitFor(() => {
      expect(flippedNumberCubes()).toHaveLength(expected);
    });
    expect(numberCubes()).toHaveLength(expected);
    expect(fieldCanvases().length).toBeGreaterThan(0);
  });

  it("returns to idle unflipped occupancy on Escape and keeps board positions", async () => {
    stubMatchMedia(false);
    const user = userEvent.setup();
    render(<Stage />);
    const cta = await screen.findByRole("button", { name: "tinity me" });
    await user.click(cta);
    const expected = expectedNumberCount();
    await waitFor(() => {
      expect(flippedNumberCubes()).toHaveLength(expected);
    });
    const before = agentPositions();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(flippedNumberCubes()).toHaveLength(0);
    expect(cta).toHaveClass("is-armed");
    expect(cta).not.toHaveAttribute("aria-describedby");
    expect(agentPositions()).toEqual(before);
    expect(fieldCanvases().length).toBeGreaterThan(0);
  });

  it("clips leftmost and rightmost cubes equally at 1728×807 and pads the slot", async () => {
    stubMatchMedia(false);
    setViewport(1728, 807);
    render(<Stage />);
    await screen.findByRole("button", { name: "tinity me" });
    const layout = currentLayout();
    expect(layout.padX).toBeGreaterThan(0);
    expect(layout.padY).toBe(0);
    const slot = document.querySelector(".stage-slot") as HTMLElement;
    expect(parseFloat(slot.style.left)).toBeCloseTo(-layout.padX);
    expect(parseFloat(slot.style.right)).toBeCloseTo(-layout.padX);
    expect(parseFloat(slot.style.top || "0")).toBeCloseTo(0);
    expect(parseFloat(slot.style.bottom || "0")).toBeCloseTo(0);
    const cubes = [...document.querySelectorAll(".cube")] as HTMLElement[];
    const minLeft = Math.min(...cubes.map((cube) => parseFloat(cube.style.left)));
    const maxRight = Math.max(
      ...cubes.map(
        (cube) => parseFloat(cube.style.left) + parseFloat(cube.style.width),
      ),
    );
    expect(minLeft).toBeCloseTo(0);
    expect(maxRight).toBeCloseTo(1728 + 2 * layout.padX);
    const leftTile = layout.tiles.find((tile) => tile.col === 0)!;
    const rightTile = layout.tiles.find((tile) => tile.col === layout.cols - 1)!;
    const leftClip = 0 - leftTile.x;
    const rightClip = rightTile.x + rightTile.size - 1728;
    expect(leftClip).toBeCloseTo(rightClip);
    expect(leftClip).toBeCloseTo(layout.padX);
    expect(leftTile.x).toBeCloseTo(layout.offsetX);
  });

  it("places each cube at col×cellCss inside a slot inset by −padX", async () => {
    stubMatchMedia(false);
    setViewport(1728, 807);
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 0.9,
    });
    render(<Stage />);
    await screen.findByRole("button", { name: "tinity me" });
    const layout = currentLayout();
    expect(9 * layout.cellCss).toBe(807);
    const slot = document.querySelector(".stage-slot") as HTMLElement;
    expect(parseFloat(slot.style.left)).toBeCloseTo(-layout.padX);
    expect(parseFloat(slot.style.right)).toBeCloseTo(-layout.padX);
    const cubes = [...document.querySelectorAll(".cube")] as HTMLElement[];
    expect(cubes.length).toBeGreaterThan(0);
    for (const cube of cubes) {
      const left = parseFloat(cube.style.left);
      const col = Math.round(left / layout.cellCss);
      expect(left).toBeCloseTo(col * layout.cellCss);
    }
    const first = cubes.reduce((min, cube) =>
      parseFloat(cube.style.left) < parseFloat(min.style.left) ? cube : min,
    );
    expect(parseFloat(first.style.left)).toBeCloseTo(0);
  });

  it("keeps bottom-row agent cubes within the stage height at 1728×807", async () => {
    stubMatchMedia(false);
    setViewport(1728, 807);
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 0.9,
    });
    render(<Stage />);
    await screen.findByRole("button", { name: "tinity me" });
    const stageH = window.innerHeight;
    const agents = [...document.querySelectorAll(".cube--number")] as HTMLElement[];
    expect(agents.length).toBe(AGENTS.length);
    for (const cube of agents) {
      const top = parseFloat(cube.style.top);
      const size = parseFloat(cube.style.height);
      expect(top + size).toBeLessThanOrEqual(stageH + 0.5);
    }
  });

  it("drags a flipped cube onto an empty cell and ripples at the drop", async () => {
    stubMatchMedia(false);
    const impact = stubFieldImpact();
    const user = userEvent.setup();
    render(<Stage />);
    const cta = await screen.findByRole("button", { name: "tinity me" });
    await user.click(cta);
    const cube = await waitFor(() => {
      const el = numberCubeEl(AGENTS[0].id);
      expect(el).toHaveClass("is-flipped");
      return el!;
    });
    impact.mockClear();
    const layout = currentLayout();
    const empty = layout.tiles.find(
      (tile) => tile.role === "occupancy" && tile.inside,
    )!;
    const destLeft = empty.x + layout.padX;
    const destTop = empty.y + layout.padY;
    const dx = destLeft - parseFloat(cube.style.left);
    const dy = destTop - parseFloat(cube.style.top);
    fireEvent.pointerDown(cube, {
      button: 0,
      clientX: 0,
      clientY: 0,
      pointerId: 1,
    });
    fireEvent.pointerMove(cube, {
      clientX: dx,
      clientY: dy,
      pointerId: 1,
    });
    fireEvent.pointerUp(cube, {
      button: 0,
      clientX: dx,
      clientY: dy,
      pointerId: 1,
    });
    await waitFor(() => {
      expect(parseFloat(cube.style.left)).toBeCloseTo(destLeft);
      expect(parseFloat(cube.style.top)).toBeCloseTo(destTop);
    });
    expect(impact).toHaveBeenCalled();
    expect(impact.mock.calls[0]?.[0]).toBeCloseTo(
      empty.x + empty.size / 2 + layout.padX,
    );
    expect(impact.mock.calls[0]?.[1]).toBeCloseTo(
      empty.y + empty.size / 2 + layout.padY,
    );
  });

  it("keeps the agent link navigable when the pointer did not move", async () => {
    stubMatchMedia(false);
    const user = userEvent.setup();
    render(<Stage />);
    const cta = await screen.findByRole("button", { name: "tinity me" });
    await user.click(cta);
    const cube = await waitFor(() => {
      const el = numberCubeEl(AGENTS[0].id);
      expect(el).toHaveClass("is-flipped");
      return el!;
    });
    const link = cube.querySelector("a.cube-mark-link");
    expect(link).toBeTruthy();
    fireEvent.pointerDown(cube, {
      button: 0,
      clientX: 40,
      clientY: 40,
      pointerId: 1,
    });
    fireEvent.pointerUp(cube, {
      button: 0,
      clientX: 40,
      clientY: 40,
      pointerId: 1,
    });
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    link!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it("flips numbered cubes instantly under reduced motion without manifesto", async () => {
    stubMatchMedia(true);
    const animate = spyAnimate();
    const user = userEvent.setup();
    render(<Stage />);
    const cta = await screen.findByRole("button", { name: "tinity me" });
    await user.click(cta);
    expect(flippedNumberCubes()).toHaveLength(expectedNumberCount());
    expect(animate).not.toHaveBeenCalled();
    expect(occupancyCubes().length).toBeGreaterThan(0);
    for (const cube of occupancyCubes()) {
      expect(cube).not.toHaveClass("is-flipped");
    }
    expect(fieldCanvases().length).toBeGreaterThan(0);
    expect(screen.queryByText(MANIFESTO)).not.toBeInTheDocument();
  });

  it("decrypts the agent label when hovering a flipped numbered cube", async () => {
    stubMatchMedia(false);
    const user = userEvent.setup();
    render(<Stage />);
    const cta = await screen.findByRole("button", { name: "tinity me" });
    await user.click(cta);
    await waitFor(() => {
      expect(cubeBack(AGENTS[0].id)?.closest(".cube")).toHaveClass("is-flipped");
    });
    for (const cube of occupancyCubes()) {
      expect(cube.textContent).toBe("");
    }
    const cube = cubeBack(AGENTS[0].id)!.closest(".cube") as HTMLElement;
    const label = cube.querySelector(".cube-label");
    expect(label).toBeTruthy();
    const pending: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      pending.push(cb);
      return pending.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    fireEvent.pointerEnter(cube);
    act(() => {
      let now = 0;
      for (let i = 0; i < 24 && pending.length > 0; i += 1) {
        const batch = pending.splice(0, pending.length);
        now += 70;
        for (const cb of batch) cb(now);
      }
    });
    expect(label).toHaveTextContent(AGENTS[0].label);
    vi.unstubAllGlobals();
  });
});

const tokensCss = readFileSync("src/styles/tokens.css", "utf8");

describe("numbered cube tokens", () => {
  it("idles numbered faces as occupancy glass with a hairline spine", () => {
    expect(tokensCss).toMatch(
      /\.cube-face\s*\{[^}]*inset:\s*calc\(0\.03 \* var\(--cell-css\)\)/,
    );
    expect(tokensCss).toMatch(/\.cube-face\s*\{[^}]*background:\s*transparent/);
    expect(tokensCss).not.toMatch(/\.cube--number \.cube-face\s*\{[^}]*inset:\s*0/);
    expect(tokensCss).not.toMatch(/rgba\(\s*17\s*,\s*17\s*,\s*17\s*,\s*0\.92\s*\)/);
    expect(tokensCss).not.toMatch(/rgba\(\s*8\s*,\s*8\s*,\s*8\s*,\s*0\.96\s*\)/);
    expect(tokensCss).not.toMatch(/backdrop-filter/);
    expect(tokensCss).not.toMatch(/width:\s*12px/);
    expect(tokensCss).not.toMatch(/#0c0c0c/);
    expect(tokensCss).toMatch(
      /\.cube-spine\s*\{[^}]*width:\s*[12]px/,
    );
    expect(tokensCss).toMatch(
      /\.cube-spine\s*\{[^}]*background:\s*var\(--hairline\)/,
    );
    expect(tokensCss).toMatch(
      /\.cube-spine\s*\{[^}]*visibility:\s*hidden/,
    );
    expect(tokensCss).not.toMatch(
      /\.cube--number \.cube-face--front\s*\{[^}]*border:\s*1px/,
    );
    expect(tokensCss).not.toMatch(
      /\.cube--number \.cube-face--back\s*\{[^}]*border:\s*1px/,
    );
  });

  it("rotates the inner cube with epicentric rotate3d and keeps the 720ms rotor", () => {
    expect(tokensCss).toMatch(
      /\.cube-inner\s*\{[^}]*rotate3d\(\s*var\(--flip-x,\s*0\)\s*,\s*var\(--flip-y,\s*-1\)\s*,\s*0\s*,\s*0deg\s*\)/,
    );
    expect(tokensCss).toMatch(
      /\.cube\.is-flipped \.cube-inner\s*\{[^}]*rotate3d\(\s*var\(--flip-x,\s*0\)\s*,\s*var\(--flip-y,\s*-1\)\s*,\s*0\s*,\s*180deg\s*\)/,
    );
    expect(tokensCss).toMatch(/backface-visibility:\s*hidden/);
    expect(tokensCss).toMatch(
      /\.cube\.is-flipped \.cube-inner\s*\{[^}]*transition:\s*transform 720ms linear/,
    );
    expect(tokensCss).toMatch(/prefers-reduced-motion:\s*no-preference/);
    expect(tokensCss).toMatch(
      /\.cube--number \.cube-face--back\s*\{[^}]*color:\s*var\(--text\)/,
    );
    expect(tokensCss).not.toMatch(/\.cube-inner\s*\{[^}]*rotateY\(/);
    expect(tokensCss).not.toMatch(
      /\.cube\.is-flipped \.cube-inner\s*\{[^}]*rotateY\(/,
    );
    expect(tokensCss).toMatch(
      /\.cube--number \.cube-face--back\s*\{[^}]*rotate3d\(\s*var\(--flip-x,\s*0\)\s*,\s*var\(--flip-y,\s*-1\)\s*,\s*0\s*,\s*180deg\s*\)/,
    );
    expect(tokensCss).not.toMatch(
      /\.cube--number \.cube-face--back\s*\{[^}]*rotateY\(/,
    );
    expect(tokensCss).toMatch(
      /\.cube-spine\s*\{[^}]*rotate3d\(\s*var\(--flip-x,\s*0\)\s*,\s*var\(--flip-y,\s*-1\)\s*,\s*0\s*,\s*90deg\s*\)/,
    );
    expect(tokensCss).toMatch(
      /\.cube--number\.is-flipped \.cube-face--back\s*\{[^}]*background:\s*rgba\(\s*31\s*,\s*219\s*,\s*18\s*,\s*0\.16\s*\)/,
    );
  });

  it("tumbles with identity at 0% and 100% and modest lift at 50%", () => {
    expect(tokensCss).toMatch(/@keyframes cube-tumble/);
    expect(tokensCss).toMatch(
      /0%\s*,\s*100%\s*\{[^}]*translateZ\(0\)[^}]*rotate3d\(\s*var\(--flip-y,\s*0\)\s*,\s*var\(--flip-x,\s*0\)\s*,\s*0\s*,\s*0deg\s*\)/,
    );
    expect(tokensCss).toMatch(
      /50%\s*\{[^}]*translateZ\(calc\(0\.08 \* var\(--cell-css\)\)\)/,
    );
    expect(tokensCss).toMatch(
      /50%\s*\{[^}]*calc\(var\(--flip-tilt,\s*0\)\s*\*\s*12deg\)/,
    );
  });

  it("uses cell-relative thickness, forbids is-settled, and may light the spine mid-flight", () => {
    expect(tokensCss).toMatch(
      /--cube-thickness:\s*calc\(0\.11 \* var\(--cell-css\)\)/,
    );
    expect(
      tokensCss.match(/translateZ\(var\(--cube-thickness\)\)/g)?.length,
    ).toBeGreaterThanOrEqual(2);
    expect(tokensCss).not.toMatch(/translateZ\(8px\)/);
    expect(tokensCss).not.toMatch(/is-settled/);
    expect(tokensCss).toMatch(/\.cube-spine\s*\{[^}]*width:\s*[12]px/);
    expect(tokensCss).toMatch(/\.cube-spine\s*\{[^}]*visibility:\s*hidden/);
    expect(tokensCss).not.toMatch(/width:\s*12px/);
    expect(tokensCss).not.toMatch(/#0c0c0c/);
    expect(tokensCss).toMatch(
      /@keyframes cube-spine-pipe\s*\{[\s\S]*?var\(--accent\)/,
    );
  });

  it("reads two-face graphite versus green-glass with an accent-ring rim", () => {
    expect(tokensCss).toMatch(
      /\.cube--number\.is-flipped \.cube-face--front\s*\{[^}]*background:\s*rgba\(\s*38\s*,\s*38\s*,\s*38\s*,\s*0\.4\s*\)/,
    );
    expect(tokensCss).toMatch(
      /\.cube--number\.is-flipped \.cube-face--back\s*\{[^}]*background:\s*rgba\(\s*31\s*,\s*219\s*,\s*18\s*,\s*0\.16\s*\)/,
    );
    expect(tokensCss).toMatch(
      /\.cube--number \.cube-face--back\s*\{[^}]*color:\s*var\(--text\)/,
    );
    expect(tokensCss).toMatch(
      /\.cube--number\.is-flipped \.cube-face--back\s*\{[^}]*0 0 0 1px var\(--accent-ring\)/,
    );
    expect(tokensCss).toMatch(
      /\.cube--number\.is-flipped \.cube-face--back\s*\{[^}]*0 0 [1-8]px var\(--accent-ring\)/,
    );
    expect(tokensCss).not.toMatch(
      /\.cube--number\.is-flipped \.cube-face--(?:front|back)\s*\{[^}]*background:\s*(?:var\(--accent\)|#1fdb12)/,
    );
    expect(tokensCss).not.toMatch(/rgba\(\s*17\s*,\s*17\s*,\s*17\s*,\s*0\.92\s*\)/);
    expect(tokensCss).not.toMatch(
      /\.cube--number\.is-flipped \.cube-face--back\s*\{[^}]*background:\s*#/,
    );
  });

  it("runs cube-tumble for 720ms per cube, not a 10s hero", () => {
    expect(tokensCss).toMatch(
      /\.cube--number\.is-flipped \.cube-tumble\s*\{[^}]*animation:\s*cube-tumble 720ms linear/,
    );
    expect(tokensCss).not.toMatch(/animation:\s*cube-tumble 10s/);
    expect(tokensCss).not.toMatch(/cube-tumble\s+10s/);
    expect(tokensCss.match(/720ms linear/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("sets animation none under reduced motion and never uses WAAPI", () => {
    expect(tokensCss).toMatch(
      /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*animation:\s*none/,
    );
    expect(tokensCss).not.toMatch(/\banimate\(/);
    const src = readFileSync("src/experience/Stage.tsx", "utf8");
    expect(src).toMatch(/flipTilt\?:\s*number/);
    expect(src).toMatch(/prev\.flipTilt === next\.flipTilt/);
    expect(src).not.toMatch(/from ["']three["']/);
    expect(src).not.toMatch(/\.animate\(/);
  });

  it("gives pointer-events only to flipped numbered cubes and keeps overlay inert", () => {
    expect(tokensCss).toMatch(
      /\.cube--number\.is-flipped\s*\{[^}]*pointer-events:\s*auto/,
    );
    expect(tokensCss).toMatch(/\.overlay\s*\{[^}]*pointer-events:\s*none/);
    expect(tokensCss).toMatch(
      /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*\.cube-lift[\s\S]*transform:\s*none/,
    );
    // Drag translate lives on .cube.is-dragging; overlay stays inert for empty cells.
    expect(tokensCss).toMatch(/\.cube\.is-dragging\s*\{[^}]*transform:\s*translate/);
    expect(tokensCss).toMatch(/\.stage\s*\{[^}]*height:\s*100%/);
    expect(tokensCss).not.toMatch(/width:\s*100vw/);
    expect(tokensCss).not.toMatch(
      /html\s*,\s*body\s*,\s*#root\s*\{[^}]*overflow:\s*hidden/,
    );
    expect(tokensCss).toMatch(/\.stage\s*\{[^}]*overflow:\s*hidden/);
    expect(tokensCss).toMatch(/\.stage\s*\{[^}]*box-sizing:\s*border-box/);
    expect(tokensCss).toMatch(/\.sr-only\s*\{/);
  });
});
