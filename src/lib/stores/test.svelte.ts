// src/lib/stores/test.svelte.ts
import {
	buildWords,
	type Mode,
	type Sample,
	type Snapshot,
	type TestOptions,
	TypingSession,
	type WordSource,
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
import quotesEn from "#lib/words/quotes-en.json";
import quotesId from "#lib/words/quotes-id.json";

export type { Language };

/** Outcome of the latest finished test, used by the results screen. */
export interface RunSummary {
	entry: HistoryEntry;
	/** Best WPM before this run in the same language and mode. */
	previousBest: number | null;
	isNewBest: boolean;
}

const SOURCES: Record<Language, WordSource> = {
	en: { words: en, quotes: quotesEn },
	id: { words: id, quotes: quotesId },
};
const TICK_MS = 100;

function createSession(
	language: Language,
	mode: Mode,
	options: TestOptions,
): TypingSession {
	return new TypingSession({
		words: buildWords(SOURCES[language], mode, options),
		mode,
	});
}

function round(value: number, digits = 2): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

export class TypingTest {
	language: Language;
	mode: Mode;
	options: TestOptions;
	snapshot: Snapshot;
	history: HistoryEntry[];
	lastRun: RunSummary | null;
	/** Speed sampled about once per second during the current test. */
	samples: Sample[];

	#storage: AppStorage;
	#session: TypingSession;
	#timer: ReturnType<typeof setInterval> | undefined;
	#lastSampleAt = 0;

	constructor(storage: AppStorage = createStorage(browserBackend())) {
		this.#storage = storage;
		const settings = storage.loadSettings();

		this.language = $state(settings.language);
		this.mode = $state.raw(settings.mode);
		this.options = $state.raw(settings.options);
		this.history = $state.raw(storage.loadHistory());
		this.lastRun = $state.raw(null);
		this.samples = $state.raw([]);

		this.#session = createSession(
			settings.language,
			settings.mode,
			settings.options,
		);
		this.snapshot = $state.raw(this.#session.snapshot());
	}

	/** Best WPM for the current language and mode. */
	get best(): number | null {
		return bestWpm(this.history, this.language, this.mode, this.options);
	}

	press(key: string) {
		this.#session.input(key);
		this.#sync();
	}

	restart() {
		this.#stopTimer();
		this.lastRun = null;
		this.samples = [];
		this.#lastSampleAt = 0;
		this.#session = createSession(this.language, this.mode, this.options);
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

	/** Turns one option on or off and starts a new test. */
	toggleOption(name: keyof TestOptions) {
		this.options = { ...this.options, [name]: !this.options[name] };
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
		this.#storage.saveSettings({
			language: this.language,
			mode: this.mode,
			options: this.options,
		});
	}

	#sync() {
		const wasFinished = this.snapshot.status === "finished";
		this.snapshot = this.#session.snapshot();
		this.#sample();

		if (this.snapshot.status === "running") {
			this.#startTimer();
			return;
		}

		this.#stopTimer();
		if (this.snapshot.status === "finished" && !wasFinished) this.#record();
	}

	#sample() {
		const { status, stats } = this.snapshot;
		if (status === "idle") return;

		const t = stats.elapsedMs / 1000;
		const finished = status === "finished";
		// About one point per second, plus a closing point when the test ends.
		const gap = t - this.#lastSampleAt;
		if (t <= 0 || gap < (finished ? 0.25 : 1)) return;

		this.#lastSampleAt = t;
		this.samples = [
			...this.samples,
			{ t: round(t, 1), wpm: round(stats.wpm, 1), raw: round(stats.rawWpm, 1) },
		];
	}

	#record() {
		const { stats, mode } = this.snapshot;
		// An untouched or all-wrong run says nothing about speed.
		if (stats.correctKeystrokes === 0) return;

		const entry: HistoryEntry = {
			at: Date.now(),
			language: this.language,
			mode,
			options: this.options,
			wpm: round(stats.wpm),
			rawWpm: round(stats.rawWpm),
			accuracy: round(stats.accuracy),
			elapsedMs: Math.round(stats.elapsedMs),
		};

		const previousBest = bestWpm(
			this.history,
			this.language,
			mode,
			this.options,
		);
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
