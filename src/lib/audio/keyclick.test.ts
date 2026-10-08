// src/lib/audio/keyclick.test.ts
import { describe, expect, it, vi } from 'vitest';
import { createKeyClick, fillClick } from './keyclick.ts';

function fakeContext(state = 'running') {
  const started: number[] = [];
  const context = {
    destination: {},
    sampleRate: 8000,
    state,
    resume: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    createBuffer: vi.fn((_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    })),
    createBufferSource: vi.fn(() => ({
      buffer: null as unknown,
      playbackRate: { value: 1 },
      connect: vi.fn(),
      start: () => void started.push(1),
    })),
    createGain: vi.fn(() => ({ gain: { value: 0 }, connect: vi.fn() })),
  };
  return { context, started };
}

describe('createKeyClick', () => {
  it('does not create a context until the first play', () => {
    const factory = vi.fn(() => fakeContext().context);
    createKeyClick(factory);
    expect(factory).not.toHaveBeenCalled();
  });

  it('creates the context and buffer once and plays every call', () => {
    const { context, started } = fakeContext();
    const factory = vi.fn(() => context);
    const click = createKeyClick(factory);

    click.play();
    click.play();
    click.play();

    expect(factory).toHaveBeenCalledTimes(1);
    const buffersAfterFirstPlay = context.createBuffer.mock.calls.length;
    expect(buffersAfterFirstPlay).toBeGreaterThan(1);
    click.play(' ');
    expect(context.createBuffer).toHaveBeenCalledTimes(buffersAfterFirstPlay);
    expect(started).toHaveLength(4);
  });

  it('resumes a suspended context', () => {
    const { context } = fakeContext('suspended');
    createKeyClick(() => context).play();
    expect(context.resume).toHaveBeenCalled();
  });

  it('does nothing when audio is unsupported', () => {
    const factory = vi.fn(() => null);
    const click = createKeyClick(factory);
    expect(() => click.play()).not.toThrow();
    click.play();
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('does not throw when the context fails', () => {
    const click = createKeyClick(() => {
      throw new Error('blocked');
    });
    expect(() => click.play()).not.toThrow();
  });

  it('closes the context on dispose', () => {
    const { context } = fakeContext();
    const click = createKeyClick(() => context);
    click.play();
    click.dispose();
    expect(context.close).toHaveBeenCalled();
  });
});

describe('fillClick', () => {
  const rate = 44100;
  const length = Math.floor(rate * 0.11);

  function render(kind: 'key' | 'space', variant: number) {
    const data = new Float32Array(length);
    let seed = 1;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    fillClick(data, rate, kind, variant, random);
    return data;
  }

  it('peaks below clipping and is not silent', () => {
    for (const kind of ['key', 'space'] as const) {
      const peak = Math.max(...render(kind, 0).map(Math.abs));
      expect(peak).toBeGreaterThan(0.5);
      expect(peak).toBeLessThanOrEqual(0.9001);
    }
  });

  it('ends silent so there is no click at the tail', () => {
    const data = render('key', 1);
    expect(Math.abs(data[data.length - 1])).toBeLessThan(0.01);
  });

  it('differs between variants', () => {
    const a = render('key', 0);
    const b = render('key', 3);
    expect(a.some((value, i) => Math.abs(value - b[i]) > 0.05)).toBe(true);
  });
});
