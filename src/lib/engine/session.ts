// src/lib/engine/session.ts
import { computeStats } from "./stats";
import type { Mode, Snapshot, Stats, Status } from "./types";

/** Max extra characters allowed past the end of a word. */
export const MAX_EXTRA_CHARS = 10;

export interface SessionOptions {
	words: readonly string[];
	mode: Mode;
	/** Time source in ms, injectable for tests. */
	now?: () => number;
}

export class TypingSession {
	readonly mode: Mode;
	readonly words: readonly string[];

	#now: () => number;
	#typed: string[];
	#wordIndex = 0;
	#status: Status = "idle";
	#startedAt = 0;
	#endedAt = 0;
	#correctKeystrokes = 0;
	#totalKeystrokes = 0;

	constructor({ words, mode, now = () => performance.now() }: SessionOptions) {
		if (words.length === 0) {
			throw new Error("TypingSession needs at least one word");
		}
		this.mode = mode;
		this.words = words;
		this.#now = now;
		this.#typed = words.map(() => "");
	}

	get status(): Status {
		return this.#status;
	}

	get wordIndex(): number {
		return this.#wordIndex;
	}

	get typed(): readonly string[] {
		return [...this.#typed];
	}

	/** Call periodically from the UI so time mode ends on schedule. */
	tick(): Status {
		if (this.#status === "running") {
			const limit = this.#limitMs();
			if (this.#now() - this.#startedAt >= limit) {
				this.#finish(this.#startedAt + limit);
			}
		}
		return this.#status;
	}

	/** Accepts a single character, " " or "Backspace". Other keys are ignored. */
	input(key: string): void {
		if (this.tick() === "finished") return;

		if (key === "Backspace") {
			this.#backspace();
		} else if (key === " ") {
			this.#space();
		} else if (key.length === 1) {
			this.#char(key);
		}
	}

	elapsedMs(): number {
		if (this.#status === "idle") return 0;
		if (this.#status === "finished") return this.#endedAt - this.#startedAt;
		return Math.min(this.#now() - this.#startedAt, this.#limitMs());
	}

	stats(): Stats {
		return computeStats({
			correctChars: this.#correctChars(),
			totalKeystrokes: this.#totalKeystrokes,
			correctKeystrokes: this.#correctKeystrokes,
			elapsedMs: this.elapsedMs(),
		});
	}

	snapshot(): Snapshot {
		this.tick();
		return {
			status: this.#status,
			mode: this.mode,
			words: this.words,
			typed: [...this.#typed],
			wordIndex: this.#wordIndex,
			elapsedMs: this.elapsedMs(),
			stats: this.stats(),
		};
	}

	#limitMs(): number {
		return this.mode.type === "time"
			? this.mode.seconds * 1000
			: Number.POSITIVE_INFINITY;
	}

	#start(): void {
		if (this.#status === "idle") {
			this.#status = "running";
			this.#startedAt = this.#now();
		}
	}

	#finish(at: number): void {
		this.#status = "finished";
		this.#endedAt = at;
	}

	#isLastWord(): boolean {
		return this.#wordIndex === this.words.length - 1;
	}

	#char(ch: string): void {
		const i = this.#wordIndex;
		const target = this.words[i];
		const typed = this.#typed[i];

		if (typed.length >= target.length + MAX_EXTRA_CHARS) return;

		this.#start();
		this.#totalKeystrokes++;
		if (ch === target[typed.length]) this.#correctKeystrokes++;

		this.#typed[i] = typed + ch;

		if (this.#typed[i] === target && this.#isLastWord()) {
			this.#finish(this.#now());
		}
	}

	#space(): void {
		const i = this.#wordIndex;
		if (this.#typed[i].length === 0) return;

		this.#totalKeystrokes++;
		if (this.#typed[i] === this.words[i]) this.#correctKeystrokes++;

		if (this.#isLastWord()) {
			this.#finish(this.#now());
		} else {
			this.#wordIndex++;
		}
	}

	#backspace(): void {
		const i = this.#wordIndex;

		if (this.#typed[i].length > 0) {
			this.#typed[i] = this.#typed[i].slice(0, -1);
		} else if (i > 0 && this.#typed[i - 1] !== this.words[i - 1]) {
			// Correct words are locked; only incorrect ones can be revisited.
			this.#wordIndex = i - 1;
		}
	}

	/** Completed correct words (with space) plus the active word if exactly right. */
	#correctChars(): number {
		let total = 0;

		for (let i = 0; i < this.#wordIndex; i++) {
			if (this.#typed[i] === this.words[i]) total += this.words[i].length + 1;
		}

		const current = this.#wordIndex;
		if (this.#typed[current] === this.words[current]) {
			total += this.words[current].length;
		}

		return total;
	}
}
