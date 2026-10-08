// src/lib/words/lists.test.ts
import { describe, expect, it } from "vitest";
import { quoteLengthOf } from "#lib/engine/index.ts";
import en from "./en.json";
import id from "./id.json";
import quotesEn from "./quotes-en.json";
import quotesId from "./quotes-id.json";

const LISTS: [string, string[]][] = [
	["en", en],
	["id", id],
];

describe.each(LISTS)("%s word list", (_name, list) => {
	it("has enough words", () => {
		expect(list.length).toBeGreaterThanOrEqual(900);
	});

	it("contains only lowercase a-z words", () => {
		expect(list.every((word) => /^[a-z]+$/.test(word))).toBe(true);
	});

	it("has no duplicates", () => {
		expect(new Set(list).size).toBe(list.length);
	});

	it("has enough long words for hard mode", () => {
		expect(list.filter((w) => w.length >= 7).length).toBeGreaterThanOrEqual(
			100,
		);
	});
});

describe.each([
	["en", quotesEn],
	["id", quotesId],
])("%s quotes", (_name, quotes) => {
	it("has quotes of every length", () => {
		const lengths = new Set(quotes.map(quoteLengthOf));
		expect([...lengths].sort()).toEqual(["long", "medium", "short"]);
	});

	it("uses only characters every keyboard layout can type", () => {
		for (const quote of quotes)
			expect(quote).toMatch(/^[A-Za-z0-9 ,.'?!;:-]+$/);
	});

	it("has no double spaces and no duplicates", () => {
		expect(quotes.every((q) => !q.includes("  ") && q === q.trim())).toBe(true);
		expect(new Set(quotes).size).toBe(quotes.length);
	});
});
