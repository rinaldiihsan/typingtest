// src/lib/keyboard3d/animation.ts
const PRESS_TAU_MS = 28;
const RELEASE_TAU_MS = 70;
/** A tap shorter than a frame still travels this deep before the key rises. */
const MIN_DEPTH = 0.75;
const SNAP_EPSILON = 0.002;

interface KeyState {
	value: number;
	held: boolean;
	reachedMinDepth: boolean;
}

/** Per-key press depth in [0, 1], smoothed over time. No rendering concerns. */
export class KeyAnimator {
	#states = new Map<string, KeyState>();

	press(code: string): void {
		let state = this.#states.get(code);
		if (!state) {
			state = { value: 0, held: false, reachedMinDepth: true };
			this.#states.set(code, state);
		}
		state.held = true;
		state.reachedMinDepth = state.value >= MIN_DEPTH;
	}

	release(code: string): void {
		const state = this.#states.get(code);
		if (state) state.held = false;
	}

	releaseAll(): void {
		for (const state of this.#states.values()) state.held = false;
	}

	depth(code: string): number {
		return this.#states.get(code)?.value ?? 0;
	}

	/** Advances all keys by dtMs. Returns true while another frame is needed. */
	step(dtMs: number): boolean {
		let needsFrame = false;

		for (const state of this.#states.values()) {
			if (state.value >= MIN_DEPTH) state.reachedMinDepth = true;

			const goingDown = state.held || !state.reachedMinDepth;
			const target = goingDown ? 1 : 0;
			const tau = goingDown ? PRESS_TAU_MS : RELEASE_TAU_MS;

			state.value += (target - state.value) * (1 - Math.exp(-dtMs / tau));
			if (Math.abs(target - state.value) < SNAP_EPSILON) state.value = target;
			if (state.value >= MIN_DEPTH) state.reachedMinDepth = true;

			const nextTarget = state.held || !state.reachedMinDepth ? 1 : 0;
			if (state.value !== nextTarget) needsFrame = true;
		}

		return needsFrame;
	}
}
