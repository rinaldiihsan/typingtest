// src/lib/chart/geometry.test.ts
import { describe, expect, it } from "vitest";
import { buildChart, niceStep } from "./geometry.ts";

const BOX = {
	width: 600,
	height: 200,
	left: 30,
	right: 10,
	top: 10,
	bottom: 20,
};

const samples = [
	{ t: 1, wpm: 40, raw: 44 },
	{ t: 2, wpm: 55, raw: 60 },
	{ t: 3, wpm: 62, raw: 66 },
];

describe("niceStep", () => {
	it("rounds up to 1, 2, 2.5, 5 or 10 times a power of ten", () => {
		expect(niceStep(0.8)).toBe(1);
		expect(niceStep(1.5)).toBe(2);
		expect(niceStep(2.2)).toBe(2.5);
		expect(niceStep(3)).toBe(5);
		expect(niceStep(7)).toBe(10);
		expect(niceStep(30)).toBe(50);
	});

	it("falls back to 1 for non-positive input", () => {
		expect(niceStep(0)).toBe(1);
	});
});

describe("buildChart", () => {
	it("needs at least two samples", () => {
		expect(buildChart([], BOX)).toBeNull();
		expect(buildChart([samples[0]], BOX)).toBeNull();
	});

	it("builds one point per sample on both lines", () => {
		const chart = buildChart(samples, BOX);
		expect(chart?.wpmPath.match(/[ML]/g)).toHaveLength(3);
		expect(chart?.rawPath.match(/[ML]/g)).toHaveLength(3);
		expect(chart?.wpmPath.startsWith("M")).toBe(true);
	});

	it("closes the area under the speed line", () => {
		expect(buildChart(samples, BOX)?.areaPath.endsWith("Z")).toBe(true);
	});

	it("starts the y axis at 0 and covers the highest value", () => {
		const chart = buildChart(samples, BOX);
		const labels = chart?.yTicks.map((t) => Number(t.label)) ?? [];
		expect(labels[0]).toBe(0);
		expect(Math.max(...labels)).toBeGreaterThanOrEqual(66);
	});

	it("keeps every tick inside the plot area", () => {
		const chart = buildChart(samples, BOX);
		for (const tick of chart?.yTicks ?? []) {
			expect(tick.y).toBeGreaterThanOrEqual(BOX.top - 1e-6);
			expect(tick.y).toBeLessThanOrEqual(BOX.height - BOX.bottom + 1e-6);
		}
		for (const tick of chart?.xTicks ?? []) {
			expect(tick.x).toBeGreaterThanOrEqual(BOX.left - 1e-6);
			expect(tick.x).toBeLessThanOrEqual(BOX.width - BOX.right + 1e-6);
		}
	});

	it("labels the x axis in seconds", () => {
		const labels = buildChart(samples, BOX)?.xTicks.map((t) => t.label);
		expect(labels?.[0]).toBe("0s");
		expect(labels?.every((l) => l.endsWith("s"))).toBe(true);
	});

	it("handles all-zero speed", () => {
		const flat = [
			{ t: 1, wpm: 0, raw: 0 },
			{ t: 2, wpm: 0, raw: 0 },
		];
		expect(buildChart(flat, BOX)?.yTicks.length).toBeGreaterThan(1);
	});
});
