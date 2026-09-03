import { describe, it, expect, beforeEach } from 'vitest';
import { MockConnector, createContext } from '../src/connector/index.js';
import type { InboundMessage } from '../src/connector/index.js';

describe('MockConnector', () => {
  let mock: MockConnector;

  beforeEach(() => {
    mock = new MockConnector('test-1', 'test-harness');
  });

  it('starts and reports health', async () => {
    const ctx = createContext({ harnessId: 'test-harness' });
    await mock.start(ctx);
    const health = await mock.health();
    expect(health.status).toBe('ok');
    expect(health.uptimeMs).toBeGreaterThanOrEqual(0);
  });

  it('sends messages and returns receipt', async () => {
    const ctx = createContext({ harnessId: 'test-harness' });
    await mock.start(ctx);
    const receipt = await mock.send({
      channel: '#tinity-cursor',
      workUnitRef: 'wu-1',
      payload: { test: true },
      correlationId: 'corr-1',
      requiresAck: true,
    });
    expect(receipt.messageId).toContain('test-1');
    expect(receipt.routedTo).toBe('mock-bus');
    expect(mock.metrics().sent).toBe(1);
    expect(mock.metrics().acked).toBe(1);
  });

  it('rejects sends when configured to always fail', async () => {
    const failing = new MockConnector('test-2', 'failing', { alwaysFail: true });
    const ctx = createContext({ harnessId: 'failing' });
    await failing.start(ctx);
    await expect(
      failing.send({
        channel: '#tinity-cursor',
        workUnitRef: 'wu-2',
        payload: {},
        correlationId: 'corr-2',
        requiresAck: false,
      }),
    ).rejects.toThrow(/always fail/);
    expect(failing.metrics().failed).toBe(1);
  });

  it('invokes registered handlers on inbound inject', async () => {
    const ctx = createContext({ harnessId: 'test-harness' });
    await mock.start(ctx);
    const seen: InboundMessage<unknown>[] = [];
    mock.on((msg) => {
      seen.push(msg);
    });
    await mock.injectInbound({
      channel: '#tinity-cursor',
      from: 'openclaw',
      workUnitRef: 'wu-3',
      payload: { reply: 'hello' },
      correlationId: 'corr-3',
      receivedAt: Date.now(),
    });
    expect(seen.length).toBe(1);
    expect(seen[0].correlationId).toBe('corr-3');
  });

  it('unsubscribes correctly', async () => {
    const ctx = createContext({ harnessId: 'test-harness' });
    await mock.start(ctx);
    let count = 0;
    const unsub = mock.on(() => {
      count++;
    });
    await mock.injectInbound({
      channel: '#tinity-cursor',
      from: 'openclaw',
      workUnitRef: 'wu-4',
      payload: {},
      correlationId: 'corr-4',
      receivedAt: Date.now(),
    });
    expect(count).toBe(1);
    unsub();
    await mock.injectInbound({
      channel: '#tinity-cursor',
      from: 'openclaw',
      workUnitRef: 'wu-5',
      payload: {},
      correlationId: 'corr-5',
      receivedAt: Date.now(),
    });
    expect(count).toBe(1); // unchanged
  });
});
