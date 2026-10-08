// src/lib/engine/words.ts
import type { Mode } from "./types";

export const TIME_MODE_WORD_BUFFER = 250;

/** How many random words a mode needs. Quote mode takes its length from the quote itself. */
export function wordCountFor(mode: Mode): number {
	if (mode.type === "words") return mode.count;
	if (mode.type === "quote") return 0;
	return TIME_MODE_WORD_BUFFER;
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
