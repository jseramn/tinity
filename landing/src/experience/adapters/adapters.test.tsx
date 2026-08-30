import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { DECRYPT_OPTIONS, FIELD_OPTIONS, GLITCH_OPTIONS } from "./options";

const forceField = vi.hoisted(() => ({
  create: vi.fn(() => ({
    impact: vi.fn(),
    setOptions: vi.fn(),
    resize: vi.fn(),
    destroy: vi.fn(),
  })),
}));

const glitch = vi.hoisted(() => ({
  create: vi.fn(() => ({
    burst: vi.fn(),
    setOptions: vi.fn(),
    resize: vi.fn(),
    destroy: vi.fn(),
  })),
}));

const decrypt = vi.hoisted(() => ({
  create: vi.fn(() => ({
    setOptions: vi.fn(),
    resize: vi.fn(),
    destroy: vi.fn(),
  })),
}));

vi.mock("../../components/canvasui/ForceField", () => ({
  createForceField: (...args: unknown[]) => forceField.create(...args),
}));

vi.mock("../../components/canvasui/Glitch", () => ({
  createGlitch: (...args: unknown[]) => glitch.create(...args),
}));

vi.mock("../../components/canvasui/DecryptReveal", () => ({
  createDecryptReveal: (...args: unknown[]) => decrypt.create(...args),
}));

import { DecryptRevealAdapter } from "./decryptReveal";
import { ForceFieldAdapter, type ForceFieldHandle } from "./forceField";
import { GlitchAdapter, type GlitchHandle } from "./glitch";

describe("engine adapters", () => {
  it("creates a force field with lattice options and forwards impact", () => {
    const onReady = vi.fn();
    const ref = createRef<ForceFieldHandle>();
    render(<ForceFieldAdapter ref={ref} onReady={onReady} />);
    expect(forceField.create).toHaveBeenCalledTimes(1);
    expect(forceField.create.mock.calls[0]?.[1]).toEqual(FIELD_OPTIONS);
    expect(onReady).toHaveBeenCalledTimes(1);
    ref.current?.impact(12, 34);
    expect(forceField.create.mock.results[0]?.value.impact).toHaveBeenCalledWith(
      12,
      34,
    );
  });

  it("creates glitch with a raised interval and forwards burst", () => {
    const ref = createRef<GlitchHandle>();
    render(<GlitchAdapter ref={ref} />);
    expect(glitch.create.mock.calls[0]?.[1]).toEqual(GLITCH_OPTIONS);
    ref.current?.burst();
    expect(glitch.create.mock.results[0]?.value.burst).toHaveBeenCalledTimes(1);
  });

  it("creates decrypt reveal with brand colors", () => {
    render(
      <DecryptRevealAdapter>
        <p>manifesto</p>
      </DecryptRevealAdapter>,
    );
    expect(decrypt.create.mock.calls[0]?.[1]).toEqual(DECRYPT_OPTIONS);
  });
});
