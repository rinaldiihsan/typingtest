// src/lib/engine/index.ts
export { MAX_EXTRA_CHARS, type SessionOptions, TypingSession } from "./session";
export { computeStats, type StatsInput } from "./stats";
export type {
	CharState,
	CharView,
	Mode,
	Snapshot,
	Stats,
	Status,
} from "./types";
export { getCharViews } from "./view";
export { generateWords, TIME_MODE_WORD_BUFFER, wordCountFor } from "./words";
