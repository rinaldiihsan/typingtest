// src/lib/engine/view.ts
import type { CharView } from "./types";

/** Per-character state of one word, for rendering. */
export function getCharViews(target: string, typed: string): CharView[] {
	const views: CharView[] = [];

	for (let i = 0; i < target.length; i++) {
		if (i < typed.length) {
			views.push({
				char: target[i],
				state: typed[i] === target[i] ? "correct" : "incorrect",
			});
		} else {
			views.push({ char: target[i], state: "untyped" });
		}
	}

	for (let i = target.length; i < typed.length; i++) {
		views.push({ char: typed[i], state: "extra" });
	}

	return views;
}
