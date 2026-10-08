// src/lib/engine/index.ts

export { modeLabel } from "./label";
export { MAX_EXTRA_CHARS, type SessionOptions, TypingSession } from "./session";
export { computeStats, type StatsInput } from "./stats";
export {
	buildWords,
	DEFAULT_OPTIONS,
	decorateWords,
	HARD_WORD_MIN_LENGTH,
	pickQuote,
	quoteLengthOf,
	type WordSource,
} from "./text";
export type {
	CharState,
	CharView,
	Mode,
	QuoteLength,
	Sample,
	Snapshot,
	Stats,
	Status,
	TestOptions,
} from "./types";
export { getCharViews } from "./view";
export { generateWords, TIME_MODE_WORD_BUFFER, wordCountFor } from "./words";
