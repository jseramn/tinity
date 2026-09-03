import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DECRYPT_CHARSET,
  DECRYPT_DURATION_MS,
  useDecryptLabel,
} from "./useDecryptLabel";

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

function installRaf() {
  const pending: FrameRequestCallback[] = [];
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    pending.push(cb);
    return pending.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  return {
    step(time: number) {
      const batch = pending.splice(0, pending.length);
      for (const cb of batch) cb(time);
    },
  };
}

describe("useDecryptLabel", () => {
  afterEach(() => {
    stubMatchMedia(false);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the target immediately when inactive", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useDecryptLabel("ABC", false, () => 0));
    expect(result.current).toBe("ABC");
  });

  it("returns the target instantly under reduced motion", () => {
    stubMatchMedia(true);
    const raf = installRaf();
    const { result } = renderHook(() => useDecryptLabel("ABC", true, () => 0));
    expect(result.current).toBe("ABC");
    act(() => raf.step(DECRYPT_DURATION_MS));
    expect(result.current).toBe("ABC");
  });

  it("starts from random cipher glyphs and resolves left-to-right over rAF", () => {
    stubMatchMedia(false);
    const raf = installRaf();
    const random = () => 0;
    const { result } = renderHook(() =>
      useDecryptLabel("ABC", true, random),
    );
    expect(result.current).toHaveLength(3);
    expect(result.current).not.toBe("ABC");
    for (const ch of result.current) {
      expect(DECRYPT_CHARSET).toContain(ch);
    }

    act(() => raf.step(0));
    expect(result.current).not.toBe("ABC");

    act(() => raf.step(DECRYPT_DURATION_MS / 3));
    expect(result.current.startsWith("A")).toBe(true);
    expect(result.current).not.toBe("ABC");

    act(() => raf.step((2 * DECRYPT_DURATION_MS) / 3));
    expect(result.current.startsWith("AB")).toBe(true);

    act(() => raf.step(DECRYPT_DURATION_MS));
    expect(result.current).toBe("ABC");
  });

  it("keeps spaces as spaces while unresolved glyphs stay in the cipher alphabet", () => {
    stubMatchMedia(false);
    const raf = installRaf();
    const { result } = renderHook(() =>
      useDecryptLabel("A B", true, () => 0),
    );
    expect(result.current).toHaveLength(3);
    expect(result.current[1]).toBe(" ");
    expect(result.current[0]).not.toBe("A");
    expect(DECRYPT_CHARSET).toContain(result.current[0]);

    act(() => raf.step(0));
    expect(result.current[1]).toBe(" ");
    act(() => raf.step(DECRYPT_DURATION_MS));
    expect(result.current).toBe("A B");
  });

  it("snaps back to the target as soon as active becomes false", () => {
    stubMatchMedia(false);
    installRaf();
    const { result, rerender } = renderHook(
      ({ active }: { active: boolean }) =>
        useDecryptLabel("XYZ", active, () => 0),
      { initialProps: { active: true } },
    );
    expect(result.current).not.toBe("XYZ");
    rerender({ active: false });
    expect(result.current).toBe("XYZ");
  });
});
