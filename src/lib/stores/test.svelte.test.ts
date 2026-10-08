// src/lib/stores/test.svelte.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_OPTIONS } from "#lib/engine/index.ts";
import { createStorage, type StorageBackend } from "#lib/storage/storage.ts";
import en from "#lib/words/en.json";
import id from "#lib/words/id.json";
import { TypingTest } from "./test.svelte.ts";

function memoryBackend(): StorageBackend {
	const data = new Map<string, string>();
	return {
		getItem: (key) => data.get(key) ?? null,
		setItem: (key, value) => void data.set(key, value),
		removeItem: (key) => void data.delete(key),
	};
}

/** Types every word correctly until the words-mode test finishes. */
function finishWordsTest(test: TypingTest) {
	for (const word of test.snapshot.words) {
		typeText(test, word);
		test.press(" ");
		// Fake timers also freeze performance.now(), so move time forward.
		vi.advanceTimersByTime(500);
	}
}

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

	describe("persistence", () => {
		it("restores language and mode from storage", () => {
			const backend = memoryBackend();
			const first = new TypingTest(createStorage(backend));
			first.setLanguage("id");
			first.setMode({ type: "words", count: 10 });
			first.destroy();

			const second = new TypingTest(createStorage(backend));
			expect(second.language).toBe("id");
			expect(second.mode).toEqual({ type: "words", count: 10 });
			expect(second.snapshot.words).toHaveLength(10);
			second.destroy();
		});

		it("records a finished test in history", () => {
			const backend = memoryBackend();
			const test = new TypingTest(createStorage(backend));
			test.setMode({ type: "words", count: 10 });
			finishWordsTest(test);

			expect(test.snapshot.status).toBe("finished");
			expect(test.history).toHaveLength(1);
			expect(test.lastRun?.isNewBest).toBe(false);
			expect(test.lastRun?.previousBest).toBeNull();
			expect(createStorage(backend).loadHistory()).toHaveLength(1);
			test.destroy();
		});

		it("flags a new best only when it beats the previous result", () => {
			const backend = memoryBackend();
			const storage = createStorage(backend);
			storage.saveSettings({
				language: "en",
				mode: { type: "words", count: 10 },
				options: DEFAULT_OPTIONS,
			});
			storage.saveHistory([
				{
					at: 1,
					language: "en",
					mode: { type: "words", count: 10 },
					options: DEFAULT_OPTIONS,
					wpm: 1,
					rawWpm: 1,
					accuracy: 100,
					elapsedMs: 1000,
				},
			]);

			const test = new TypingTest(createStorage(backend));
			finishWordsTest(test);

			expect(test.lastRun?.previousBest).toBe(1);
			expect(test.lastRun?.isNewBest).toBe(true);
			expect(test.best).toBe(test.lastRun?.entry.wpm);
			test.destroy();
		});

		it("does not record a run without correct keystrokes", () => {
			const test = new TypingTest(createStorage(memoryBackend()));
			test.setMode({ type: "time", seconds: 15 });
			test.press("#");
			vi.advanceTimersByTime(16000);

			expect(test.snapshot.status).toBe("finished");
			expect(test.history).toHaveLength(0);
			expect(test.lastRun).toBeNull();
			test.destroy();
		});

		it("clears history", () => {
			const backend = memoryBackend();
			const test = new TypingTest(createStorage(backend));
			test.setMode({ type: "words", count: 10 });
			finishWordsTest(test);
			test.clearHistory();

			expect(test.history).toHaveLength(0);
			expect(createStorage(backend).loadHistory()).toHaveLength(0);
			test.destroy();
		});
	});

	describe("samples", () => {
		it("collects about one sample per second and closes with the final one", () => {
			const test = new TypingTest(createStorage(memoryBackend()));
			test.setMode({ type: "words", count: 10 });
			finishWordsTest(test);

			const times = test.samples.map((s) => s.t);
			expect(times.length).toBeGreaterThanOrEqual(3);
			expect([...times].sort((a, b) => a - b)).toEqual(times);
			expect(times.at(-1)).toBeCloseTo(test.snapshot.stats.elapsedMs / 1000, 1);
			test.destroy();
		});

		it("starts empty and resets on restart", () => {
			const test = new TypingTest(createStorage(memoryBackend()));
			expect(test.samples).toEqual([]);
			test.setMode({ type: "words", count: 10 });
			finishWordsTest(test);
			test.restart();
			expect(test.samples).toEqual([]);
			test.destroy();
		});
	});

	describe("options and quote mode", () => {
		it("saves and restores options", () => {
			const backend = memoryBackend();
			const first = new TypingTest(createStorage(backend));
			first.toggleOption("numbers");
			first.toggleOption("hard");
			first.destroy();

			const second = new TypingTest(createStorage(backend));
			expect(second.options).toEqual({
				...DEFAULT_OPTIONS,
				numbers: true,
				hard: true,
			});
			second.destroy();
		});

		it("restarts when an option changes", () => {
			const test = new TypingTest(createStorage(memoryBackend()));
			test.press(test.snapshot.words[0][0]);
			test.toggleOption("capitals");
			expect(test.snapshot.status).toBe("idle");
			test.destroy();
		});

		it("uses only long words in hard mode", () => {
			const test = new TypingTest(createStorage(memoryBackend()));
			test.toggleOption("hard");
			expect(test.snapshot.words.every((w) => w.length >= 7)).toBe(true);
			test.destroy();
		});

		it("types a whole quote and finishes", () => {
			const test = new TypingTest(createStorage(memoryBackend()));
			test.setMode({ type: "quote", length: "short" });
			expect(test.snapshot.words.length).toBeLessThanOrEqual(14);

			for (const word of test.snapshot.words) {
				typeText(test, word);
				test.press(" ");
				vi.advanceTimersByTime(300);
			}

			expect(test.snapshot.status).toBe("finished");
			expect(test.history).toHaveLength(1);
			expect(test.history[0].mode).toEqual({ type: "quote", length: "short" });
			test.destroy();
		});

		it("uses Indonesian quotes in Indonesian", () => {
			const test = new TypingTest(createStorage(memoryBackend()));
			test.setLanguage("id");
			test.setMode({ type: "quote", length: "medium" });
			expect(test.snapshot.words.length).toBeGreaterThan(14);
			test.destroy();
		});
	});
});
