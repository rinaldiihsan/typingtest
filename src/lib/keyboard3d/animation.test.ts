// src/lib/keyboard3d/animation.test.ts
import { describe, expect, it } from "vitest";
import { KeyAnimator } from "./animation.ts";

const FRAME = 16;

function run(animator: KeyAnimator, frames: number) {
	let needsFrame = false;
	for (let i = 0; i < frames; i++) needsFrame = animator.step(FRAME);
	return needsFrame;
}

describe("KeyAnimator", () => {
	it("reports depth 0 and needs no frames for an untouched board", () => {
		const animator = new KeyAnimator();
		expect(animator.depth("KeyA")).toBe(0);
		expect(animator.step(FRAME)).toBe(false);
	});

	it("moves a pressed key down and settles at full depth", () => {
		const animator = new KeyAnimator();
		animator.press("KeyA");
		animator.step(FRAME);
		expect(animator.depth("KeyA")).toBeGreaterThan(0);
		expect(run(animator, 30)).toBe(false);
		expect(animator.depth("KeyA")).toBe(1);
	});

	it("returns a released key to 0 and stops requesting frames", () => {
		const animator = new KeyAnimator();
		animator.press("KeyA");
		run(animator, 30);
		animator.release("KeyA");
		expect(animator.step(FRAME)).toBe(true);
		expect(run(animator, 60)).toBe(false);
		expect(animator.depth("KeyA")).toBe(0);
	});

	it("lets a very short tap travel deep enough to be visible", () => {
		const animator = new KeyAnimator();
		animator.press("KeyA");
		animator.release("KeyA");

		let max = 0;
		for (let i = 0; i < 60; i++) {
			animator.step(FRAME);
			max = Math.max(max, animator.depth("KeyA"));
		}

		expect(max).toBeGreaterThanOrEqual(0.75);
		expect(animator.depth("KeyA")).toBe(0);
	});

	it("restarts the press when a key is pressed again while rising", () => {
		const animator = new KeyAnimator();
		animator.press("KeyA");
		run(animator, 30);
		animator.release("KeyA");
		run(animator, 3);
		const rising = animator.depth("KeyA");
		expect(rising).toBeLessThan(1);

		animator.press("KeyA");
		run(animator, 30);
		expect(animator.depth("KeyA")).toBe(1);
	});

	it("animates several keys independently", () => {
		const animator = new KeyAnimator();
		animator.press("KeyA");
		animator.press("KeyB");
		run(animator, 30);
		animator.release("KeyA");
		run(animator, 60);
		expect(animator.depth("KeyA")).toBe(0);
		expect(animator.depth("KeyB")).toBe(1);
	});

	it("releaseAll lifts every held key", () => {
		const animator = new KeyAnimator();
		animator.press("KeyA");
		animator.press("ShiftLeft");
		run(animator, 30);
		animator.releaseAll();
		run(animator, 60);
		expect(animator.depth("KeyA")).toBe(0);
		expect(animator.depth("ShiftLeft")).toBe(0);
	});
});
