// src/lib/words/lists.test.ts
import { describe, expect, it } from "vitest";
import en from "./en.json";
import id from "./id.json";

const LISTS: [string, string[]][] = [
	["en", en],
	["id", id],
];

describe.each(LISTS)("%s word list", (_name, list) => {
	it("has enough words", () => {
		expect(list.length).toBeGreaterThanOrEqual(200);
	});

	it("contains only lowercase a-z words", () => {
		expect(list.every((word) => /^[a-z]+$/.test(word))).toBe(true);
	});

	it("has no duplicates", () => {
		expect(new Set(list).size).toBe(list.length);
	});
});
