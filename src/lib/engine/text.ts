// src/lib/engine/text.ts
import type { Mode, QuoteLength, TestOptions } from "./types";
import { generateWords, wordCountFor } from "./words";

export interface WordSource {
	words: readonly string[];
	quotes: readonly string[];
}

export const DEFAULT_OPTIONS: TestOptions = {
	punctuation: false,
	numbers: false,
	capitals: false,
	hard: false,
};

export const HARD_WORD_MIN_LENGTH = 7;
/** Below this many long words the pool is too small, so the full list is used. */
const MIN_HARD_POOL = 50;

const SHORT_QUOTE_MAX_WORDS = 14;
const MEDIUM_QUOTE_MAX_WORDS = 28;

const NUMBER_CHANCE = 0.12;
const CAPITAL_CHANCE = 0.3;
const COMMA_CHANCE = 0.12;
const MIN_SENTENCE_WORDS = 4;
const MAX_SENTENCE_WORDS = 9;

function countWords(text: string): number {
	return text.trim().split(/\s+/).length;
}

export function quoteLengthOf(text: string): QuoteLength {
	const words = countWords(text);
	if (words <= SHORT_QUOTE_MAX_WORDS) return "short";
	if (words <= MEDIUM_QUOTE_MAX_WORDS) return "medium";
	return "long";
}

/** Picks a quote of the requested length, or any quote when none matches. */
export function pickQuote(
	quotes: readonly string[],
	length: QuoteLength,
	rng: () => number = Math.random,
): string {
	if (quotes.length === 0) throw new Error("No quotes available");
	const matching = quotes.filter((q) => quoteLengthOf(q) === length);
	const pool = matching.length > 0 ? matching : quotes;
	return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}

function hardPool(words: readonly string[]): readonly string[] {
	const long = words.filter((w) => w.length >= HARD_WORD_MIN_LENGTH);
	return long.length >= MIN_HARD_POOL ? long : words;
}

function randomNumber(rng: () => number): string {
	const digits = 1 + Math.floor(rng() * 4);
	const min = 10 ** (digits - 1);
	const max = 10 ** digits - 1;
	return String(min + Math.floor(rng() * (max - min + 1)));
}

function capitalize(word: string): string {
	return word.charAt(0).toUpperCase() + word.slice(1);
}

function randomSentenceLength(rng: () => number): number {
	return (
		MIN_SENTENCE_WORDS +
		Math.floor(rng() * (MAX_SENTENCE_WORDS - MIN_SENTENCE_WORDS + 1))
	);
}

function terminalMark(rng: () => number): string {
	const roll = rng();
	if (roll < 0.7) return ".";
	return roll < 0.85 ? "?" : "!";
}

/** Applies numbers, capitals and punctuation to plain words. Always returns a new array. */
export function decorateWords(
	words: readonly string[],
	options: TestOptions,
	rng: () => number = Math.random,
): string[] {
	const result = [...words];

	if (options.numbers) {
		for (let i = 0; i < result.length; i++) {
			if (rng() < NUMBER_CHANCE) result[i] = randomNumber(rng);
		}
	}

	if (options.capitals) {
		for (let i = 0; i < result.length; i++) {
			if (rng() < CAPITAL_CHANCE) result[i] = capitalize(result[i]);
		}
	}

	if (options.punctuation) {
		let sentenceLeft = randomSentenceLength(rng);
		let atStart = true;

		for (let i = 0; i < result.length; i++) {
			if (atStart) result[i] = capitalize(result[i]);
			atStart = false;
			sentenceLeft--;

			if (sentenceLeft === 0) {
				result[i] += terminalMark(rng);
				sentenceLeft = randomSentenceLength(rng);
				atStart = true;
			} else if (sentenceLeft > 1 && rng() < COMMA_CHANCE) {
				result[i] += ",";
			}
		}
	}

	return result;
}

/** Builds the words for one test from the word list or the quotes, depending on the mode. */
export function buildWords(
	source: WordSource,
	mode: Mode,
	options: TestOptions,
	rng: () => number = Math.random,
): string[] {
	if (mode.type === "quote") {
		return pickQuote(source.quotes, mode.length, rng).trim().split(/\s+/);
	}

	const pool = options.hard ? hardPool(source.words) : source.words;
	return decorateWords(
		generateWords(pool, wordCountFor(mode), rng),
		options,
		rng,
	);
}
