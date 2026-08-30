import { describe, expect, it } from "vitest";
import {
  DECRYPT_OPTIONS,
  FIELD_EDGE_COLOR,
  FIELD_OPTIONS,
  GLITCH_OPTIONS,
} from "./options";

describe("adapter lattice and burst policy", () => {
  it("uses a square brand-green lattice that does not click-ripple", () => {
    expect(FIELD_OPTIONS.shape).toBe("square");
    expect(FIELD_OPTIONS.cellScale).toBe(9);
    expect(FIELD_OPTIONS.color).toEqual([0.122, 0.859, 0.071]);
    expect(FIELD_OPTIONS.edgeColor).toEqual(FIELD_EDGE_COLOR);
    expect(FIELD_OPTIONS.clickRipples).toBe(false);
  });

  it("uses playground energy knobs on the brand lattice", () => {
    expect(FIELD_OPTIONS.gridReveal).toBe("both");
    expect(FIELD_OPTIONS.lineWidth).toBe(0.035);
    expect(FIELD_OPTIONS.gridOpacity).toBe(0.15);
    expect(FIELD_OPTIONS.gridRevealStrength).toBe(0.4);
    expect(FIELD_OPTIONS.gridRevealRadius).toBe(800);
    expect(FIELD_OPTIONS.gridFade).toBe(1);
    expect(FIELD_OPTIONS.flowIntensity).toBe(0.95);
    expect(FIELD_OPTIONS.flowSpeed).toBe(1.45);
    expect(FIELD_OPTIONS.flashIntensity).toBe(0.24);
    expect(FIELD_OPTIONS.edgeGlow).toBe(0);
    expect(FIELD_OPTIONS.hoverGlow).toBe(0.25);
    expect(FIELD_OPTIONS.hoverRadius).toBe(230);
    expect(FIELD_OPTIONS.hoverCharge).toBe(0.3);
    expect(FIELD_OPTIONS.hideOnHover).toBe(false);
    expect(FIELD_OPTIONS.rippleIntensity).toBe(0.1);
    expect(FIELD_OPTIONS.rippleSpeed).toBe(0.75);
    expect(FIELD_OPTIONS.rippleBlend).toBe(1);
    expect(FIELD_OPTIONS.refraction).toBe(12);
    expect(FIELD_OPTIONS.aberration).toBe(2.1);
    expect(FIELD_OPTIONS.haze).toBe(0);
    expect(FIELD_OPTIONS.pageReact).toBe(1);
    expect(FIELD_OPTIONS.tint).toBe(0.28);
    expect(FIELD_OPTIONS.reveal).toBe(1);
    expect(FIELD_OPTIONS.dim).toBe(0.24);
    expect(FIELD_OPTIONS.bloom).toBe(0);
    expect(FIELD_OPTIONS.grain).toBe(0.14);
  });

  it("raises glitch interval so the adapter can burst once", () => {
    expect(GLITCH_OPTIONS.interval).toBe(1e6);
  });

  it("decrypts with brand green on the void background", () => {
    expect(DECRYPT_OPTIONS.color).toBe("#1fdb12");
    expect(DECRYPT_OPTIONS.background).toBe("#050505");
  });
});
