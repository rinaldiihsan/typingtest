// src/lib/keyboard3d/layout.test.ts
import { describe, expect, it } from "vitest";
import { LAYOUT_60, placeKeys } from "./layout.ts";

describe("LAYOUT_60", () => {
	it("has 5 rows and 61 keys", () => {
		expect(LAYOUT_60).toHaveLength(5);
		expect(LAYOUT_60.flat()).toHaveLength(61);
	});

	it("is 15 units wide on every row", () => {
		for (const row of LAYOUT_60) {
			const width = row.reduce((sum, k) => sum + k.width, 0);
			expect(width).toBeCloseTo(15);
		}
	});

	it("uses unique KeyboardEvent codes", () => {
		const codes = LAYOUT_60.flat().map((k) => k.code);
		expect(new Set(codes).size).toBe(codes.length);
	});

	it("covers every typing key", () => {
		const codes = new Set(LAYOUT_60.flat().map((k) => k.code));
		for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ")
			expect(codes.has(`Key${ch}`)).toBe(true);
		for (const d of "0123456789") expect(codes.has(`Digit${d}`)).toBe(true);
		for (const code of [
			"Space",
			"Backspace",
			"Enter",
			"Comma",
			"Period",
			"Slash",
			"Quote",
		]) {
			expect(codes.has(code)).toBe(true);
		}
	});
});

describe("placeKeys", () => {
	const placed = placeKeys(LAYOUT_60);

	it("reports the board size", () => {
		expect(placed.width).toBeCloseTo(15);
		expect(placed.depth).toBe(5);
		expect(placed.keys).toHaveLength(61);
	});

	it("centers the board on the origin", () => {
		const left = Math.min(...placed.keys.map((k) => k.x - k.width / 2));
		const right = Math.max(...placed.keys.map((k) => k.x + k.width / 2));
		expect(left).toBeCloseTo(-7.5);
		expect(right).toBeCloseTo(7.5);
	});

	it("puts the first row at the back and the last row at the front", () => {
		const esc = placed.keys.find((k) => k.code === "Escape");
		const space = placed.keys.find((k) => k.code === "Space");
		expect(esc?.z).toBeCloseTo(-2);
		expect(space?.z).toBeCloseTo(2);
	});

	it("never overlaps keys within a row", () => {
		const byRow = new Map<number, typeof placed.keys>();
		for (const k of placed.keys) byRow.set(k.z, [...(byRow.get(k.z) ?? []), k]);

		for (const row of byRow.values()) {
			const sorted = [...row].sort((a, b) => a.x - b.x);
			for (let i = 1; i < sorted.length; i++) {
				const prevEdge = sorted[i - 1].x + sorted[i - 1].width / 2;
				const nextEdge = sorted[i].x - sorted[i].width / 2;
				expect(nextEdge).toBeGreaterThanOrEqual(prevEdge - 1e-9);
			}
		}
	});

	it("places the space bar after three 1.25u keys", () => {
		const space = placed.keys.find((k) => k.code === "Space");
		// center = 3 * 1.25 + 6.25 / 2, shifted by half the board width
		expect(space?.x).toBeCloseTo(3 * 1.25 + 6.25 / 2 - 7.5);
	});
});
