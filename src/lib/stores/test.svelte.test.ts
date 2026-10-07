// src/lib/stores/test.svelte.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "#lib/words/en.json";
import id from "#lib/words/id.json";
import { TypingTest } from "./test.svelte.ts";

function typeText(test: TypingTest, text: string) {
	for (const ch of text) test.press(ch);
}

describe("TypingTest store", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("starts idle with English words in 30 second time mode", () => {
		const test = new TypingTest();
		expect(test.snapshot.status).toBe("idle");
		expect(test.language).toBe("en");
		expect(test.mode).toEqual({ type: "time", seconds: 30 });
		expect(test.snapshot.words.every((w) => en.includes(w))).toBe(true);
		test.destroy();
	});

	it("switches language and restarts with words from the new list", () => {
		const test = new TypingTest();
		test.press("a");
		test.setLanguage("id");
		expect(test.snapshot.status).toBe("idle");
		expect(test.snapshot.words.every((w) => id.includes(w))).toBe(true);
		test.destroy();
	});

	it("uses the chosen word count in words mode", () => {
		const test = new TypingTest();
		test.setMode({ type: "words", count: 10 });
		expect(test.snapshot.words).toHaveLength(10);
		test.destroy();
	});

	it("updates the snapshot as keys are pressed", () => {
		const test = new TypingTest();
		const first = test.snapshot.words[0];
		typeText(test, first);
		expect(test.snapshot.typed[0]).toBe(first);
		expect(test.snapshot.status).toBe("running");
		test.destroy();
	});

	it("finishes time mode by timer without further input", () => {
		const test = new TypingTest();
		test.setMode({ type: "time", seconds: 15 });
		test.press(test.snapshot.words[0][0]);
		expect(test.snapshot.status).toBe("running");

		vi.advanceTimersByTime(16000);
		expect(test.snapshot.status).toBe("finished");
		test.destroy();
	});

	it("restart resets progress", () => {
		const test = new TypingTest();
		typeText(test, test.snapshot.words[0]);
		test.restart();
		expect(test.snapshot.status).toBe("idle");
		expect(test.snapshot.typed[0]).toBe("");
		test.destroy();
	});
});
