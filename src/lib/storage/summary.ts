// src/lib/storage/summary.ts
import type { HistoryEntry } from "./storage.ts";

export interface HistorySummary {
	count: number;
	best: number | null;
	/** Average WPM of the latest runs. */
	average: number | null;
	/** Average accuracy of the latest runs. */
	accuracy: number | null;
}

export const SUMMARY_WINDOW = 10;

function mean(values: number[]): number | null {
	if (values.length === 0) return null;
	return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function summarizeHistory(
	history: readonly HistoryEntry[],
): HistorySummary {
	const recent = history.slice(-SUMMARY_WINDOW);
	return {
		count: history.length,
		best: history.length === 0 ? null : Math.max(...history.map((e) => e.wpm)),
		average: mean(recent.map((e) => e.wpm)),
		accuracy: mean(recent.map((e) => e.accuracy)),
	};
}
