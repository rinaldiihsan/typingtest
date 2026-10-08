// src/lib/engine/label.test.ts
import { describe, expect, it } from "vitest";
import { modeLabel } from "./label";

describe("modeLabel", () => {
	it("describes every mode", () => {
		expect(modeLabel({ type: "time", seconds: 30 })).toBe("30 seconds");
		expect(modeLabel({ type: "words", count: 25 })).toBe("25 words");
		expect(modeLabel({ type: "quote", length: "medium" })).toBe("medium quote");
	});
});
