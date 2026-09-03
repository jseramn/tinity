import { describe, it, expect } from 'vitest';
import {
  RESERVED_CHANNELS,
  isReservedChannel,
  assertHarnessChannel,
  ConnectorError,
} from '../src/connector/index.js';

describe('Connector types', () => {
  describe('isReservedChannel', () => {
    it('identifies reserved channels', () => {
      expect(isReservedChannel('#tinity-ops')).toBe(true);
      expect(isReservedChannel('#tinity-audit')).toBe(true);
      expect(isReservedChannel('#tinity-jr')).toBe(true);
      expect(isReservedChannel('#tinity-escalation')).toBe(true);
    });

    it('identifies harness channels as non-reserved', () => {
      expect(isReservedChannel('#tinity-cursor')).toBe(false);
      expect(isReservedChannel('#tinity-aider')).toBe(false);
      expect(isReservedChannel('#tinity-grokbot')).toBe(false);
    });
  });

  describe('assertHarnessChannel', () => {
    it('throws CHANNEL_FORBIDDEN for reserved channels', () => {
      expect(() =>
        assertHarnessChannel(RESERVED_CHANNELS.ops, 'cursor'),
      ).toThrow(ConnectorError);
    });

    it('does not throw for harness channels', () => {
      expect(() =>
        assertHarnessChannel('#tinity-cursor', 'cursor'),
      ).not.toThrow();
    });
  });

  describe('ConnectorError', () => {
    it('carries code, message and cause', () => {
      const cause = new Error('underlying');
      const err = new ConnectorError('TIMEOUT', 'timed out', cause);
      expect(err.code).toBe('TIMEOUT');
      expect(err.message).toBe('timed out');
      expect(err.cause).toBe(cause);
      expect(err.name).toBe('ConnectorError');
    });
  });
});
