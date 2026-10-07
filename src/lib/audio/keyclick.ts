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
	createBuffer(
		channels: number,
		length: number,
		sampleRate: number,
	): { getChannelData(channel: number): Float32Array };
	createBufferSource(): AudioNodeLike & {
		buffer: unknown;
		playbackRate: { value: number };
		start(): void;
	};
	createGain(): AudioNodeLike & { gain: { value: number } };
}

export interface KeyClick {
	play(): void;
	dispose(): void;
}

const DURATION_S = 0.045;
const VOLUME = 0.22;

function defaultFactory(): ContextLike | null {
	const Ctor =
		globalThis.AudioContext ??
		(globalThis as { webkitAudioContext?: typeof AudioContext })
			.webkitAudioContext;
	return Ctor ? (new Ctor() as unknown as ContextLike) : null;
}

/** A short low "thock": a decaying sine mixed with a little noise. */
function fillClick(
	data: Float32Array,
	sampleRate: number,
	random: () => number,
): void {
	for (let i = 0; i < data.length; i++) {
		const t = i / sampleRate;
		const body = Math.sin(2 * Math.PI * 190 * t);
		const noise = random() * 2 - 1;
		data[i] = (body * 0.8 + noise * 0.5) * Math.exp(-t * 110);
	}
}

/**
 * Synthesized key sound, so no audio files are shipped.
 * The context is created on the first play, which is always inside a key press
 * and therefore allowed by browser autoplay rules.
 */
export function createKeyClick(
	factory: () => ContextLike | null = defaultFactory,
	random: () => number = Math.random,
): KeyClick {
	let context: ContextLike | null = null;
	let buffer: unknown = null;
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
			const created = context.createBuffer(1, length, context.sampleRate);
			fillClick(created.getChannelData(0), context.sampleRate, random);
			buffer = created;
			return true;
		} catch {
			context = null;
			unavailable = true;
			return false;
		}
	}

	return {
		play() {
			if (!init() || !context) return;
			try {
				if (context.state === "suspended") void context.resume();
				const source = context.createBufferSource();
				const gain = context.createGain();
				source.buffer = buffer;
				// Slight pitch variation keeps fast typing from sounding robotic.
				source.playbackRate.value = 0.92 + random() * 0.16;
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
			buffer = null;
		},
	};
}
