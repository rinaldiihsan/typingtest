// src/lib/keyboard3d/layout.test.ts
import { describe, expect, it } from "vitest";
import { LAYOUT_60, LAYOUT_NAMES, LAYOUTS, placeKeys } from "./layout.ts";

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

describe.each(LAYOUT_NAMES)("layout %s", (name) => {
	const { rows } = LAYOUTS[name];
	const placed = placeKeys(rows);

	it("uses unique KeyboardEvent codes", () => {
		const codes = placed.keys.map((k) => k.code);
		expect(new Set(codes).size).toBe(codes.length);
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

	it("is centered on the origin", () => {
		const left = Math.min(...placed.keys.map((k) => k.x - k.width / 2));
		const right = Math.max(...placed.keys.map((k) => k.x + k.width / 2));
		expect(left).toBeCloseTo(-placed.width / 2);
		expect(right).toBeCloseTo(placed.width / 2);
	});

	it("covers every typing key", () => {
		const codes = new Set(placed.keys.map((k) => k.code));
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
			"ShiftLeft",
		]) {
			expect(codes.has(code)).toBe(true);
		}
	});
});

describe("layout sizes", () => {
	it("has the expected key counts", () => {
		expect(placeKeys(LAYOUTS["60"].rows).keys).toHaveLength(61);
		expect(placeKeys(LAYOUTS["75"].rows).keys).toHaveLength(83);
		expect(placeKeys(LAYOUTS.tkl.rows).keys).toHaveLength(87);
	});

	it("does not share rows between layouts", () => {
		expect(LAYOUTS["60"].rows.flat()).toHaveLength(61);
		expect(LAYOUTS["60"].rows[4]).toHaveLength(8);
	});

	it("puts the arrow keys in an inverted T under the up key", () => {
		for (const name of ["75", "tkl"] as const) {
			const keys = placeKeys(LAYOUTS[name].rows).keys;
			const at = (code: string) => keys.find((k) => k.code === code);
			expect(at("ArrowDown")?.x).toBeCloseTo(at("ArrowUp")?.x ?? Number.NaN);
			expect(at("ArrowLeft")?.x).toBeCloseTo((at("ArrowDown")?.x ?? 0) - 1);
			expect(at("ArrowRight")?.x).toBeCloseTo((at("ArrowDown")?.x ?? 0) + 1);
			expect(at("ArrowDown")?.z).toBeGreaterThan(
				at("ArrowUp")?.z ?? Number.POSITIVE_INFINITY,
			);
		}
	});

	it("keeps the TKL navigation block separated from the main block", () => {
		const keys = placeKeys(LAYOUTS.tkl.rows).keys;
		const main = keys.find((k) => k.code === "Backspace");
		const nav = keys.find((k) => k.code === "Insert");
		expect((nav?.x ?? 0) - (nav?.width ?? 0) / 2).toBeGreaterThan(
			(main?.x ?? 0) + (main?.width ?? 0) / 2,
		);
	});
});
