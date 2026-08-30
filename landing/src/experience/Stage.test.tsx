import { readFileSync } from "node:fs";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MANIFESTO } from "./copy";
import { ctaOrigin, flipAxis, flipTilt } from "./delays";
import { Stage } from "./Stage";
import { layoutTiles } from "./tiles";

function expectedNumberCount() {
  return layoutTiles(
    window.innerWidth,
    window.innerHeight,
    Math.min(window.devicePixelRatio || 1, 2),
  ).filter((tile) => tile.role === "number").length;
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

function stubMatchMedia(reduce: boolean) {
  window.matchMedia = (query: string) =>
    ({
      matches: reduce && query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
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
  return [...document.querySelectorAll(".cube-face--back")].find(
    (el) => el.textContent === id,
  );
}

function cssVar(el: Element, name: string) {
  return (el as HTMLElement).style.getPropertyValue(name);
}

function numberCubeEl(id: string) {
  return cubeBack(id)?.closest(".cube") as HTMLElement | undefined;
}

function currentLayout() {
  return layoutTiles(
    window.innerWidth,
    window.innerHeight,
    Math.min(window.devicePixelRatio || 1, 2),
  );
}

describe("Stage experience loop", () => {
  afterEach(() => {
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
    expect(screen.queryByText(MANIFESTO)).not.toBeInTheDocument();
    const back01 = cubeBack("01");
    expect(back01).toHaveAttribute("aria-hidden", "true");
    const visible01 = screen.queryByText("01");
    if (visible01) {
      expect(visible01).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("gives idle numbered cubes two faces, a spine, and unitless flip axes from the CTA", async () => {
    stubMatchMedia(false);
    render(<Stage />);
    await screen.findByRole("button", { name: "tinity me" });
    const tiles = currentLayout();
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
    const tiles = currentLayout();
    const origin = ctaOrigin(tiles);
    expect(origin).not.toBeNull();
    const numbered = tiles.filter((tile) => tile.role === "number");
    expect(numbered.length).toBeGreaterThan(0);
    for (const tile of numbered) {
      const cube = numberCubeEl(tile.id);
      expect(cube).toBeTruthy();
      const tumble = cube!.querySelector(":scope > .cube-tumble");
      expect(tumble).toBeTruthy();
      expect(tumble!.querySelector(":scope > .cube-inner")).toBeTruthy();
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
    expect(cssVar(cta, "--flip-tilt")).toBe("");
  });

  it("assigns opposite-signed flip axes to numbered cubes on opposite sides of the CTA", async () => {
    stubMatchMedia(false);
    render(<Stage />);
    await screen.findByRole("button", { name: "tinity me" });
    const tiles = currentLayout();
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

  it("flips 01 and the last numbered id on click without flipping occupancy or showing manifesto", async () => {
    stubMatchMedia(false);
    const animate = spyAnimate();
    const user = userEvent.setup();
    render(<Stage />);
    const cta = await screen.findByRole("button", { name: "tinity me" });
    const expected = expectedNumberCount();
    const lastId = String(expected).padStart(2, "0");
    expect(fieldCanvases().length).toBeGreaterThan(0);
    await user.click(cta);

    await waitFor(() => {
      expect(cubeBack("01")?.closest(".cube")).toHaveClass("is-flipped");
      expect(cubeBack(lastId)?.closest(".cube")).toHaveClass("is-flipped");
    });
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

  it("returns to idle unflipped occupancy after a second click with Force Field still mounted", async () => {
    stubMatchMedia(false);
    const user = userEvent.setup();
    render(<Stage />);
    const cta = await screen.findByRole("button", { name: "tinity me" });
    await user.click(cta);
    const expected = expectedNumberCount();
    await waitFor(() => {
      expect(flippedNumberCubes()).toHaveLength(expected);
    });
    await user.click(cta);
    expect(numberCubes()).toHaveLength(expected);
    expect(flippedNumberCubes()).toHaveLength(0);
    expect(numberCubes().length).toBeGreaterThan(0);
    for (const cube of numberCubes()) {
      expect(cube).not.toHaveClass("is-flipped");
      expect(cube.querySelector(":scope > .cube-tumble > .cube-inner")).toBeTruthy();
    }
    for (const cube of occupancyCubes()) {
      expect(cube).not.toHaveClass("is-flipped");
      expect(cube.querySelector(".cube-tumble")).toBeNull();
    }
    expect(fieldCanvases().length).toBeGreaterThan(0);
    expect(screen.queryByText(MANIFESTO)).not.toBeInTheDocument();
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
});
