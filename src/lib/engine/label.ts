// src/lib/engine/label.ts
import type { Mode } from "./types";

/** Short human label for a mode, e.g. "30 seconds", "25 words" or "short quote". */
export function modeLabel(mode: Mode): string {
	if (mode.type === "time") return `${mode.seconds} seconds`;
	if (mode.type === "words") return `${mode.count} words`;
	return `${mode.length} quote`;
}
