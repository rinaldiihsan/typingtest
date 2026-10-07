// src/lib/engine/words.ts
import type { Mode } from "./types";

export const TIME_MODE_WORD_BUFFER = 250;

export function wordCountFor(mode: Mode): number {
	return mode.type === "words" ? mode.count : TIME_MODE_WORD_BUFFER;
}

/** Picks random words; never repeats the same word twice in a row. */
export function generateWords(
	list: readonly string[],
	count: number,
	rng: () => number = Math.random,
): string[] {
	if (list.length === 0 || count <= 0) return [];

	const result: string[] = [];
	let previous = -1;

	for (let n = 0; n < count; n++) {
		let index = Math.min(list.length - 1, Math.floor(rng() * list.length));
		if (index === previous && list.length > 1) {
			const step = 1 + Math.floor(rng() * (list.length - 1));
			index = (index + step) % list.length;
		}
		result.push(list[index]);
		previous = index;
	}

	return result;
}
