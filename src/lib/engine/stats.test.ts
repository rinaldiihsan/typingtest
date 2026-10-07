// src/lib/engine/stats.test.ts
import { describe, expect, it } from "vitest";
import { computeStats } from "./stats";

describe("computeStats", () => {
	it("computes WPM as correct characters / 5 per minute", () => {
		const stats = computeStats({
			correctChars: 300,
			totalKeystrokes: 300,
			correctKeystrokes: 300,
			elapsedMs: 60000,
		});
		expect(stats.wpm).toBeCloseTo(60);
	});

	it("computes raw WPM from all keystrokes", () => {
		const stats = computeStats({
			correctChars: 150,
			totalKeystrokes: 200,
			correctKeystrokes: 150,
			elapsedMs: 60000,
		});
		expect(stats.rawWpm).toBeCloseTo(40);
		expect(stats.wpm).toBeCloseTo(30);
	});

	it("computes accuracy as correct keystrokes / total keystrokes", () => {
		const stats = computeStats({
			correctChars: 0,
			totalKeystrokes: 10,
			correctKeystrokes: 9,
			elapsedMs: 1000,
		});
		expect(stats.accuracy).toBeCloseTo(90);
		expect(stats.incorrectKeystrokes).toBe(1);
	});

	it("reports 100% accuracy before any keystroke", () => {
		const stats = computeStats({
			correctChars: 0,
			totalKeystrokes: 0,
			correctKeystrokes: 0,
			elapsedMs: 0,
		});
		expect(stats.accuracy).toBe(100);
	});

	it("reports 0 WPM when no time has elapsed", () => {
		const stats = computeStats({
			correctChars: 5,
			totalKeystrokes: 5,
			correctKeystrokes: 5,
			elapsedMs: 0,
		});
		expect(stats.wpm).toBe(0);
		expect(stats.rawWpm).toBe(0);
	});
});
