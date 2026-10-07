// src/lib/engine/stats.ts
import type { Stats } from "./types";

export interface StatsInput {
	correctChars: number;
	totalKeystrokes: number;
	correctKeystrokes: number;
	elapsedMs: number;
}

export function computeStats(input: StatsInput): Stats {
	const minutes = input.elapsedMs / 60000;
	const wpm = minutes > 0 ? input.correctChars / 5 / minutes : 0;
	const rawWpm = minutes > 0 ? input.totalKeystrokes / 5 / minutes : 0;
	const accuracy =
		input.totalKeystrokes > 0
			? (input.correctKeystrokes / input.totalKeystrokes) * 100
			: 100;

	return {
		wpm,
		rawWpm,
		accuracy,
		correctKeystrokes: input.correctKeystrokes,
		incorrectKeystrokes: input.totalKeystrokes - input.correctKeystrokes,
		elapsedMs: input.elapsedMs,
	};
}
