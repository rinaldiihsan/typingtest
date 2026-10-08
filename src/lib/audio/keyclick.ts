// src/lib/audio/keyclick.ts

interface AudioNodeLike {
  connect(destination: unknown): unknown;
}

interface ContextLike {
  readonly destination: unknown;
  readonly sampleRate: number;
  readonly state: string;
  resume(): Promise<void>;
  close(): Promise<void>;
  createBuffer(channels: number, length: number, sampleRate: number): { getChannelData(channel: number): Float32Array };
  createBufferSource(): AudioNodeLike & {
    buffer: unknown;
    playbackRate: { value: number };
    start(): void;
  };
  createGain(): AudioNodeLike & { gain: { value: number } };
}

export interface KeyClick {
  play(key?: string): void;
  dispose(): void;
}

export type ClickKind = 'key' | 'space';

const DURATION_S = 0.11;
const VOLUME = 0.5;
const PEAK = 0.9;
const VARIANTS: Record<ClickKind, number> = { key: 4, space: 2 };

function defaultFactory(): ContextLike | null {
  const Ctor = globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctor ? (new Ctor() as unknown as ContextLike) : null;
}

/**
 * One key sound, built from three layers like a lubed mechanical switch:
 * a sharp tick on press, a low "thock" body that drops in pitch, and a soft bottom-out tap.
 * Each variant gets its own pitch so fast typing does not sound like one repeated sample.
 */
export function fillClick(data: Float32Array, sampleRate: number, kind: ClickKind, variant: number, random: () => number): void {
  const space = kind === 'space';
  const base = space ? 105 : 165 + variant * 14;
  const tickHz = 2300 + variant * 260;
  const bodyDecay = space ? 34 : 52;

  let previousNoise = 0;
  let low = 0;
  let peak = 0;

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const noise = random() * 2 - 1;

    // Tick: high-passed noise plus a short bright ring, gone in a few milliseconds.
    const high = noise - previousNoise;
    previousNoise = noise;
    const tick = (high * 0.55 + Math.sin(2 * Math.PI * tickHz * t) * 0.45) * Math.exp(-t * 700);

    // Thock: a sine that falls from a higher pitch to its base, so it sounds struck rather than beeped.
    const pitch = base * (1 + 0.7 * Math.exp(-t * 70));
    const body = Math.sin(2 * Math.PI * pitch * t) * Math.exp(-t * bodyDecay);

    // Tap: low-passed noise, the keycap landing on the plate.
    low += (noise - low) * 0.12;
    const tap = low * Math.exp(-t * 120) * 1.4;

    const value = tick * 0.7 + body * 1.0 + tap * 0.45;
    data[i] = value;
    peak = Math.max(peak, Math.abs(value));
  }

  // Fade the last milliseconds to avoid a click at the end, then normalize.
  const fade = Math.min(data.length, Math.floor(sampleRate * 0.01));
  const gain = peak > 0 ? PEAK / peak : 1;
  for (let i = 0; i < data.length; i++) {
    const tail = data.length - i;
    data[i] *= gain * (tail < fade ? tail / fade : 1);
  }
}

/**
 * Synthesized key sound, so no audio files are shipped.
 * The context is created on the first play, which is always inside a key press
 * and therefore allowed by browser autoplay rules.
 */
export function createKeyClick(factory: () => ContextLike | null = defaultFactory, random: () => number = Math.random): KeyClick {
  let context: ContextLike | null = null;
  const buffers: Record<ClickKind, unknown[]> = { key: [], space: [] };
  let unavailable = false;

  function init(): boolean {
    if (context) return true;
    if (unavailable) return false;
    try {
      context = factory();
      if (!context) {
        unavailable = true;
        return false;
      }
      const length = Math.floor(context.sampleRate * DURATION_S);
      for (const kind of ['key', 'space'] as const) {
        for (let variant = 0; variant < VARIANTS[kind]; variant++) {
          const created = context.createBuffer(1, length, context.sampleRate);
          fillClick(created.getChannelData(0), context.sampleRate, kind, variant, random);
          buffers[kind].push(created);
        }
      }
      return true;
    } catch {
      context = null;
      unavailable = true;
      return false;
    }
  }

  return {
    play(key) {
      if (!init() || !context) return;
      try {
        if (context.state === 'suspended') void context.resume();
        const source = context.createBufferSource();
        const gain = context.createGain();
        const pool = buffers[key === ' ' ? 'space' : 'key'];
        source.buffer = pool[Math.floor(random() * pool.length) % pool.length];
        // A little pitch drift on top of the variants.
        source.playbackRate.value = 0.97 + random() * 0.06;
        gain.gain.value = VOLUME;
        source.connect(gain);
        gain.connect(context.destination);
        source.start();
      } catch {
        // Audio is optional: never break typing over it.
      }
    },
    dispose() {
      void context?.close().catch(() => {});
      context = null;
      buffers.key = [];
      buffers.space = [];
    },
  };
}
