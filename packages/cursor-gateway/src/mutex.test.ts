import { describe, expect, it } from "vitest";
import { JobMutex } from "./mutex";

describe("JobMutex", () => {
  it("allows one holder and rejects the second until release", () => {
    const mutex = new JobMutex();
    expect(mutex.busy).toBe(false);
    expect(mutex.tryAcquire()).toBe(true);
    expect(mutex.busy).toBe(true);
    expect(mutex.tryAcquire()).toBe(false);
    mutex.release();
    expect(mutex.busy).toBe(false);
    expect(mutex.tryAcquire()).toBe(true);
  });
});
