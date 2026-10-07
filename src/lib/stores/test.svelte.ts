// src/lib/stores/test.svelte.ts
import {
	generateWords,
	type Mode,
	type Snapshot,
	TypingSession,
	wordCountFor,
} from "#lib/engine/index.ts";
import en from "#lib/words/en.json";
import id from "#lib/words/id.json";

export type Language = "en" | "id";

const WORD_LISTS: Record<Language, readonly string[]> = { en, id };
const DEFAULT_LANGUAGE: Language = "en";
const DEFAULT_MODE: Mode = { type: "time", seconds: 30 };
const TICK_MS = 100;

function createSession(language: Language, mode: Mode): TypingSession {
	const words = generateWords(WORD_LISTS[language], wordCountFor(mode));
	return new TypingSession({ words, mode });
}

export class TypingTest {
	language = $state<Language>(DEFAULT_LANGUAGE);
	mode = $state.raw<Mode>(DEFAULT_MODE);

	#session = createSession(DEFAULT_LANGUAGE, DEFAULT_MODE);
	#timer: ReturnType<typeof setInterval> | undefined;

	snapshot = $state.raw<Snapshot>(this.#session.snapshot());

	press(key: string) {
		this.#session.input(key);
		this.#sync();
	}

	restart() {
		this.#stopTimer();
		this.#session = createSession(this.language, this.mode);
		this.#sync();
	}

	setLanguage(language: Language) {
		if (language === this.language) return;
		this.language = language;
		this.restart();
	}

	setMode(mode: Mode) {
		this.mode = mode;
		this.restart();
	}

	destroy() {
		this.#stopTimer();
	}

	#sync() {
		this.snapshot = this.#session.snapshot();
		if (this.snapshot.status === "running") {
			this.#startTimer();
		} else {
			this.#stopTimer();
		}
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
