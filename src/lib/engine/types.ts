// src/lib/engine/types.ts
export type Mode =
	| { type: "time"; seconds: number }
	| { type: "words"; count: number };

export type Status = "idle" | "running" | "finished";

export type CharState = "correct" | "incorrect" | "extra" | "untyped";

export interface CharView {
	char: string;
	state: CharState;
	/** What the user actually typed, set only for incorrect characters. */
	typed?: string;
}

export interface Stats {
	wpm: number;
	rawWpm: number;
	accuracy: number;
	correctKeystrokes: number;
	incorrectKeystrokes: number;
	elapsedMs: number;
}

export interface Snapshot {
	status: Status;
	mode: Mode;
	words: readonly string[];
	typed: readonly string[];
	wordIndex: number;
	elapsedMs: number;
	stats: Stats;
}
