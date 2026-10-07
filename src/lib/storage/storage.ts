// src/lib/storage/storage.ts
import type { Mode } from "#lib/engine/index.ts";

export type Language = "en" | "id";

export interface Settings {
	language: Language;
	mode: Mode;
}

export type Theme = "system" | "light" | "dark";

export interface Preferences {
	theme: Theme;
	sound: boolean;
}

export interface HistoryEntry {
	/** Unix time in ms when the test finished. */
	at: number;
	language: Language;
	mode: Mode;
	wpm: number;
	rawWpm: number;
	accuracy: number;
	elapsedMs: number;
}

/** The subset of the Web Storage API used here, so tests can pass a fake. */
export interface StorageBackend {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

export const DEFAULT_SETTINGS: Settings = {
	language: "en",
	mode: { type: "time", seconds: 30 },
};

export const DEFAULT_PREFERENCES: Preferences = {
	theme: "system",
	sound: false,
};

export const HISTORY_LIMIT = 200;

const SETTINGS_KEY = "typing-test:settings";
const HISTORY_KEY = "typing-test:history";
// Also read by the inline script in src/app.html: keep both in sync.
const PREFERENCES_KEY = "typing-test:preferences";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isLanguage(value: unknown): value is Language {
	return value === "en" || value === "id";
}

function isTheme(value: unknown): value is Theme {
	return value === "system" || value === "light" || value === "dark";
}

function isPositiveInt(value: unknown, max: number): value is number {
	return (
		typeof value === "number" &&
		Number.isInteger(value) &&
		value >= 1 &&
		value <= max
	);
}

function isMode(value: unknown): value is Mode {
	if (!isRecord(value)) return false;
	if (value.type === "time") return isPositiveInt(value.seconds, 600);
	if (value.type === "words") return isPositiveInt(value.count, 1000);
	return false;
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
	return (
		isRecord(value) &&
		isFiniteNumber(value.at) &&
		isLanguage(value.language) &&
		isMode(value.mode) &&
		isFiniteNumber(value.wpm) &&
		isFiniteNumber(value.rawWpm) &&
		isFiniteNumber(value.accuracy) &&
		isFiniteNumber(value.elapsedMs)
	);
}

/** Stable key for grouping results, e.g. "time:30" or "words:25". */
export function modeKey(mode: Mode): string {
	return mode.type === "time" ? `time:${mode.seconds}` : `words:${mode.count}`;
}

export function sameMode(a: Mode, b: Mode): boolean {
	return modeKey(a) === modeKey(b);
}

/** Best WPM for a language and mode, or null when nothing was recorded yet. */
export function bestWpm(
	history: readonly HistoryEntry[],
	language: Language,
	mode: Mode,
): number | null {
	let best: number | null = null;
	for (const entry of history) {
		if (entry.language !== language || !sameMode(entry.mode, mode)) continue;
		if (best === null || entry.wpm > best) best = entry.wpm;
	}
	return best;
}

/** Returns a new list with the entry appended, keeping only the newest HISTORY_LIMIT. */
export function appendResult(
	history: readonly HistoryEntry[],
	entry: HistoryEntry,
): HistoryEntry[] {
	return [...history, entry].slice(-HISTORY_LIMIT);
}

export function browserBackend(): StorageBackend | null {
	try {
		return typeof window === "undefined" ? null : window.localStorage;
	} catch {
		// Access can throw when site data is blocked.
		return null;
	}
}

function readJson(backend: StorageBackend | null, key: string): unknown {
	if (!backend) return undefined;
	try {
		const raw = backend.getItem(key);
		return raw === null ? undefined : JSON.parse(raw);
	} catch {
		return undefined;
	}
}

function writeJson(
	backend: StorageBackend | null,
	key: string,
	value: unknown,
): void {
	if (!backend) return;
	try {
		backend.setItem(key, JSON.stringify(value));
	} catch {
		// Quota exceeded or storage blocked: the app keeps working in memory.
	}
}

export interface AppStorage {
	loadSettings(): Settings;
	saveSettings(settings: Settings): void;
	loadPreferences(): Preferences;
	savePreferences(preferences: Preferences): void;
	loadHistory(): HistoryEntry[];
	saveHistory(history: readonly HistoryEntry[]): void;
	clearHistory(): void;
}

/** Never throws: bad, missing or blocked storage falls back to defaults. */
export function createStorage(backend: StorageBackend | null): AppStorage {
	return {
		loadSettings() {
			const raw = readJson(backend, SETTINGS_KEY);
			if (!isRecord(raw)) return { ...DEFAULT_SETTINGS };
			return {
				language: isLanguage(raw.language)
					? raw.language
					: DEFAULT_SETTINGS.language,
				mode: isMode(raw.mode) ? raw.mode : DEFAULT_SETTINGS.mode,
			};
		},
		saveSettings(settings) {
			writeJson(backend, SETTINGS_KEY, settings);
		},
		loadPreferences() {
			const raw = readJson(backend, PREFERENCES_KEY);
			if (!isRecord(raw)) return { ...DEFAULT_PREFERENCES };
			return {
				theme: isTheme(raw.theme) ? raw.theme : DEFAULT_PREFERENCES.theme,
				sound:
					typeof raw.sound === "boolean"
						? raw.sound
						: DEFAULT_PREFERENCES.sound,
			};
		},
		savePreferences(preferences) {
			writeJson(backend, PREFERENCES_KEY, preferences);
		},
		loadHistory() {
			const raw = readJson(backend, HISTORY_KEY);
			if (!Array.isArray(raw)) return [];
			return raw.filter(isHistoryEntry).slice(-HISTORY_LIMIT);
		},
		saveHistory(history) {
			writeJson(backend, HISTORY_KEY, history);
		},
		clearHistory() {
			try {
				backend?.removeItem(HISTORY_KEY);
			} catch {
				// Ignore blocked storage.
			}
		},
	};
}
