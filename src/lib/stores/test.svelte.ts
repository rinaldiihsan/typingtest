// src/lib/stores/test.svelte.ts
import {
	generateWords,
	type Mode,
	type Snapshot,
	TypingSession,
	wordCountFor,
} from "#lib/engine/index.ts";
import {
	type AppStorage,
	appendResult,
	bestWpm,
	browserBackend,
	createStorage,
	type HistoryEntry,
	type Language,
} from "#lib/storage/storage.ts";
import en from "#lib/words/en.json";
import id from "#lib/words/id.json";

export type { Language };

/** Outcome of the latest finished test, used by the results screen. */
export interface RunSummary {
	entry: HistoryEntry;
	/** Best WPM before this run in the same language and mode. */
	previousBest: number | null;
	isNewBest: boolean;
}

const WORD_LISTS: Record<Language, readonly string[]> = { en, id };
const TICK_MS = 100;

function createSession(language: Language, mode: Mode): TypingSession {
	const words = generateWords(WORD_LISTS[language], wordCountFor(mode));
	return new TypingSession({ words, mode });
}

function round(value: number, digits = 2): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

export class TypingTest {
	language: Language;
	mode: Mode;
	snapshot: Snapshot;
	history: HistoryEntry[];
	lastRun: RunSummary | null;

	#storage: AppStorage;
	#session: TypingSession;
	#timer: ReturnType<typeof setInterval> | undefined;

	constructor(storage: AppStorage = createStorage(browserBackend())) {
		this.#storage = storage;
		const settings = storage.loadSettings();

		this.language = $state(settings.language);
		this.mode = $state.raw(settings.mode);
		this.history = $state.raw(storage.loadHistory());
		this.lastRun = $state.raw(null);

		this.#session = createSession(settings.language, settings.mode);
		this.snapshot = $state.raw(this.#session.snapshot());
	}

	/** Best WPM for the current language and mode. */
	get best(): number | null {
		return bestWpm(this.history, this.language, this.mode);
	}

	press(key: string) {
		this.#session.input(key);
		this.#sync();
	}

	restart() {
		this.#stopTimer();
		this.lastRun = null;
		this.#session = createSession(this.language, this.mode);
		this.snapshot = this.#session.snapshot();
	}

	setLanguage(language: Language) {
		if (language === this.language) return;
		this.language = language;
		this.#saveSettings();
		this.restart();
	}

	setMode(mode: Mode) {
		this.mode = mode;
		this.#saveSettings();
		this.restart();
	}

	clearHistory() {
		this.history = [];
		this.lastRun = null;
		this.#storage.clearHistory();
	}

	destroy() {
		this.#stopTimer();
	}

	#saveSettings() {
		this.#storage.saveSettings({ language: this.language, mode: this.mode });
	}

	#sync() {
		const wasFinished = this.snapshot.status === "finished";
		this.snapshot = this.#session.snapshot();

		if (this.snapshot.status === "running") {
			this.#startTimer();
			return;
		}

		this.#stopTimer();
		if (this.snapshot.status === "finished" && !wasFinished) this.#record();
	}

	#record() {
		const { stats, mode } = this.snapshot;
		// An untouched or all-wrong run says nothing about speed.
		if (stats.correctKeystrokes === 0) return;

		const entry: HistoryEntry = {
			at: Date.now(),
			language: this.language,
			mode,
			wpm: round(stats.wpm),
			rawWpm: round(stats.rawWpm),
			accuracy: round(stats.accuracy),
			elapsedMs: Math.round(stats.elapsedMs),
		};

		const previousBest = bestWpm(this.history, this.language, mode);
		this.lastRun = {
			entry,
			previousBest,
			isNewBest: previousBest !== null && entry.wpm > previousBest,
		};
		this.history = appendResult(this.history, entry);
		this.#storage.saveHistory(this.history);
	}

	#startTimer() {
		if (this.#timer === undefined) {
			this.#timer = setInterval(() => this.#sync(), TICK_MS);
		}
	}

	#stopTimer() {
		if (this.#timer !== undefined) {
			clearInterval(this.#timer);
			this.#timer = undefined;
		}
	}
}
