import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import type { ChildProcess, SpawnOptions } from "node:child_process";
import type { SpawnImpl } from "./spawn";

export type FakeSpawnCapture = {
  command: string;
  args: readonly string[];
  options?: SpawnOptions;
};

export function createFakeChild(opts: {
  lines?: string[];
  exitCode?: number;
  hold?: boolean;
}): { child: ChildProcess; release: () => void } {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  const child = new EventEmitter() as ChildProcess;
  Object.assign(child, {
    stdout,
    stderr,
    stdin: null,
    killed: false,
    kill(signal?: NodeJS.Signals | number) {
      void signal;
      (child as ChildProcess & { killed: boolean }).killed = true;
      stdout.end();
      child.emit("close", 1);
      return true;
    },
  });

  let release = () => {};
  const held = opts.hold
    ? new Promise<void>((resolve) => {
        release = resolve;
      })
    : Promise.resolve();

  void (async () => {
    await held;
    await new Promise((r) => setImmediate(r));
    for (const line of opts.lines ?? []) {
      stdout.write(line.endsWith("\n") ? line : `${line}\n`);
    }
    stdout.end();
    child.emit("close", opts.exitCode ?? 0);
  })();

  return { child, release };
}

export function mockSpawn(
  capture: FakeSpawnCapture[],
  factory: () => { child: ChildProcess },
): SpawnImpl {
  return (command, args, options) => {
    capture.push({ command, args, options });
    return factory().child;
  };
}
