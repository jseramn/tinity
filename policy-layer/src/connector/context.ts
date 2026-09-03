// Connector context helpers
import type { ConnectorContext } from './types.js';

export interface ContextOptions {
  harnessId: string;
  verbose?: boolean;
  cancel?: AbortSignal;
}

export function createContext(opts: ContextOptions): ConnectorContext {
  const verbose = opts.verbose ?? false;
  const metrics = {
    counters: new Map<string, number>(),
    observations: [] as Array<{ name: string; value: number; at: number }>,
    inc(name: string, value = 1) {
      this.counters.set(name, (this.counters.get(name) ?? 0) + value);
    },
    observe(name: string, value: number) {
      this.observations.push({ name, value, at: Date.now() });
    },
  };

  const logger = {
    info(msg: string, meta?: Record<string, unknown>) {
      if (verbose) {
        console.log(`[${opts.harnessId}] ${msg}`, meta ?? '');
      }
    },
    warn(msg: string, meta?: Record<string, unknown>) {
      console.warn(`[${opts.harnessId}] ${msg}`, meta ?? '');
    },
    error(msg: string, meta?: Record<string, unknown>) {
      console.error(`[${opts.harnessId}] ${msg}`, meta ?? '');
    },
  };

  return {
    logger,
    metrics,
    cancel: opts.cancel ?? new AbortController().signal,
  };
}

export type { ConnectorContext };
