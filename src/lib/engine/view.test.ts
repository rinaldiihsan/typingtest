// src/lib/engine/view.test.ts
import { describe, expect, it } from "vitest";
import { getCharViews } from "./view";

describe("getCharViews", () => {
	it("marks untyped characters", () => {
		expect(getCharViews("ab", "").map((v) => v.state)).toEqual([
			"untyped",
			"untyped",
		]);
	});

	it("marks correct and incorrect characters", () => {
		expect(getCharViews("abc", "axc").map((v) => v.state)).toEqual([
			"correct",
			"incorrect",
			"correct",
		]);
	});

	it("marks characters past the end of the word as extra", () => {
		const views = getCharViews("ab", "abxy");
		expect(views.map((v) => v.state)).toEqual([
			"correct",
			"correct",
			"extra",
			"extra",
		]);
		expect(views.map((v) => v.char).join("")).toBe("abxy");
	});

	it("keeps the target letter for incorrect characters", () => {
		expect(getCharViews("ab", "x")[0].char).toBe("a");
	});
});
