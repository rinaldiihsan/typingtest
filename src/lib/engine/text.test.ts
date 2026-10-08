// src/lib/engine/text.test.ts
import { describe, expect, it } from "vitest";
import {
	buildWords,
	DEFAULT_OPTIONS,
	decorateWords,
	HARD_WORD_MIN_LENGTH,
	pickQuote,
	quoteLengthOf,
} from "./text";

/** Deterministic random numbers so tests do not flake. */
function seeded(seed = 1): () => number {
	let state = seed;
	return () => {
		state = (state * 1664525 + 1013904223) % 4294967296;
		return state / 4294967296;
	};
}

const WORDS = Array.from({ length: 120 }, (_, i) =>
	i % 3 === 0 ? `longword${i}` : `w${i}`,
);

describe("quoteLengthOf", () => {
	it("sorts quotes by word count", () => {
		expect(quoteLengthOf("one two three")).toBe("short");
		expect(quoteLengthOf(Array(14).fill("a").join(" "))).toBe("short");
		expect(quoteLengthOf(Array(15).fill("a").join(" "))).toBe("medium");
		expect(quoteLengthOf(Array(28).fill("a").join(" "))).toBe("medium");
		expect(quoteLengthOf(Array(29).fill("a").join(" "))).toBe("long");
	});
});

describe("pickQuote", () => {
	const short = "a quick one";
	const long = Array(40).fill("word").join(" ");

	it("returns a quote of the requested length", () => {
		expect(pickQuote([short, long], "short", seeded())).toBe(short);
		expect(pickQuote([short, long], "long", seeded())).toBe(long);
	});

	it("falls back to any quote when none matches", () => {
		expect(pickQuote([short], "long", seeded())).toBe(short);
	});

	it("throws without quotes", () => {
		expect(() => pickQuote([], "short")).toThrow();
	});
});

describe("decorateWords", () => {
	it("returns the words unchanged with no options", () => {
		expect(decorateWords(["a", "b"], DEFAULT_OPTIONS, seeded())).toEqual([
			"a",
			"b",
		]);
	});

	it("does not mutate its input", () => {
		const input = ["alpha", "beta", "gamma", "delta", "epsilon"];
		decorateWords(input, { ...DEFAULT_OPTIONS, punctuation: true }, seeded());
		expect(input).toEqual(["alpha", "beta", "gamma", "delta", "epsilon"]);
	});

	it("replaces some words with numbers", () => {
		const out = decorateWords(
			WORDS,
			{ ...DEFAULT_OPTIONS, numbers: true },
			seeded(),
		);
		const numbers = out.filter((w) => /^[1-9]\d{0,3}$/.test(w));
		expect(numbers.length).toBeGreaterThan(3);
		expect(numbers.length).toBeLessThan(out.length / 2);
	});

	it("capitalizes some words", () => {
		const out = decorateWords(
			WORDS,
			{ ...DEFAULT_OPTIONS, capitals: true },
			seeded(),
		);
		const capitalized = out.filter((w) => /^[A-Z]/.test(w));
		expect(capitalized.length).toBeGreaterThan(10);
		expect(capitalized.length).toBeLessThan(out.length);
	});

	it("starts sentences with a capital and ends them with a mark", () => {
		const out = decorateWords(
			WORDS,
			{ ...DEFAULT_OPTIONS, punctuation: true },
			seeded(),
		);
		expect(out[0]).toMatch(/^[A-Z]/);
		const ends = out.filter((w) => /[.?!]$/.test(w));
		expect(ends.length).toBeGreaterThan(5);
		for (let i = 0; i < out.length - 1; i++) {
			if (/[.?!]$/.test(out[i])) expect(out[i + 1]).toMatch(/^[A-Z]/);
		}
	});

	it("only adds characters that every layout can type", () => {
		const out = decorateWords(
			WORDS,
			{ punctuation: true, numbers: true, capitals: true, hard: false },
			seeded(7),
		);
		for (const word of out) expect(word).toMatch(/^[A-Za-z0-9]+[,.?!]?$/);
	});
});

describe("buildWords", () => {
	const source = {
		words: WORDS,
		quotes: ["the first quote", "another short one"],
	};

	it("builds the requested number of words", () => {
		expect(
			buildWords(
				source,
				{ type: "words", count: 25 },
				DEFAULT_OPTIONS,
				seeded(),
			),
		).toHaveLength(25);
	});

	it("builds a buffer of words for time mode", () => {
		expect(
			buildWords(
				source,
				{ type: "time", seconds: 30 },
				DEFAULT_OPTIONS,
				seeded(),
			).length,
		).toBeGreaterThan(100);
	});

	it("uses only long words in hard mode", () => {
		const long = Array.from({ length: 80 }, (_, i) => `abcdefgh${i}`);
		const out = buildWords(
			{ words: [...long, "cat", "dog"], quotes: [] },
			{ type: "words", count: 60 },
			{ ...DEFAULT_OPTIONS, hard: true },
			seeded(),
		);
		expect(out.every((w) => w.length >= HARD_WORD_MIN_LENGTH)).toBe(true);
	});

	it("falls back to the full list when there are too few long words", () => {
		const out = buildWords(
			{ words: ["cat", "dog", "bird"], quotes: [] },
			{ type: "words", count: 10 },
			{ ...DEFAULT_OPTIONS, hard: true },
			seeded(),
		);
		expect(out).toHaveLength(10);
	});

	it("returns the quote split into words and ignores options in quote mode", () => {
		const out = buildWords(
			{ words: WORDS, quotes: ["Hello brave new world."] },
			{ type: "quote", length: "short" },
			{ punctuation: true, numbers: true, capitals: true, hard: true },
			seeded(),
		);
		expect(out).toEqual(["Hello", "brave", "new", "world."]);
	});
});
