// src/lib/storage/summary.test.ts
import { describe, expect, it } from "vitest";
import type { HistoryEntry } from "./storage.ts";
import { SUMMARY_WINDOW, summarizeHistory } from "./summary.ts";

function entry(wpm: number, accuracy = 95): HistoryEntry {
	return {
		at: wpm,
		language: "en",
		mode: { type: "time", seconds: 30 },
		wpm,
		rawWpm: wpm,
		accuracy,
		elapsedMs: 30000,
	};
}

describe("summarizeHistory", () => {
	it("is empty for no history", () => {
		expect(summarizeHistory([])).toEqual({
			count: 0,
			best: null,
			average: null,
			accuracy: null,
		});
	});

	it("reports count and best over all runs", () => {
		const summary = summarizeHistory([entry(40), entry(90), entry(60)]);
		expect(summary.count).toBe(3);
		expect(summary.best).toBe(90);
	});

	it("averages only the latest runs", () => {
		const old = Array.from({ length: 5 }, () => entry(10));
		const recent = Array.from({ length: SUMMARY_WINDOW }, () => entry(60, 98));
		const summary = summarizeHistory([...old, ...recent]);
		expect(summary.average).toBe(60);
		expect(summary.accuracy).toBe(98);
		expect(summary.best).toBe(60);
	});
});
