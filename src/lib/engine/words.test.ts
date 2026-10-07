// src/lib/engine/words.test.ts
import { describe, expect, it } from "vitest";
import { generateWords, TIME_MODE_WORD_BUFFER, wordCountFor } from "./words";

const LIST = ["one", "two", "three", "four"];

describe("generateWords", () => {
	it("returns the requested number of words from the list", () => {
		const words = generateWords(LIST, 50);
		expect(words).toHaveLength(50);
		expect(words.every((w) => LIST.includes(w))).toBe(true);
	});

	it("never repeats the same word back to back", () => {
		const words = generateWords(LIST, 500);
		const repeated = words.some((w, i) => i > 0 && w === words[i - 1]);
		expect(repeated).toBe(false);
	});

	it("handles extreme rng values", () => {
		expect(generateWords(LIST, 3, () => 0)).toHaveLength(3);
		expect(generateWords(LIST, 3, () => 0.9999999)).toHaveLength(3);
	});

	it("returns an empty array for an empty list or zero count", () => {
		expect(generateWords([], 5)).toEqual([]);
		expect(generateWords(LIST, 0)).toEqual([]);
	});

	it("allows repeats when the list has a single word", () => {
		expect(generateWords(["me"], 3)).toEqual(["me", "me", "me"]);
	});
});

describe("wordCountFor", () => {
	it("uses the chosen count in words mode", () => {
		expect(wordCountFor({ type: "words", count: 25 })).toBe(25);
	});

	it("uses the buffer size in time mode", () => {
		expect(wordCountFor({ type: "time", seconds: 30 })).toBe(
			TIME_MODE_WORD_BUFFER,
		);
	});
});
