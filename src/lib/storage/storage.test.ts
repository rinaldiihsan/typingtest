// src/lib/storage/storage.test.ts
import { describe, expect, it } from "vitest";
import { DEFAULT_OPTIONS } from "#lib/engine/index.ts";
import {
	appendResult,
	bestWpm,
	createStorage,
	DEFAULT_PREFERENCES,
	DEFAULT_SETTINGS,
	HISTORY_LIMIT,
	type HistoryEntry,
	modeKey,
	type StorageBackend,
} from "./storage.ts";

function fakeBackend(initial: Record<string, string> = {}): StorageBackend & {
	data: Map<string, string>;
} {
	const data = new Map(Object.entries(initial));
	return {
		data,
		getItem: (key) => data.get(key) ?? null,
		setItem: (key, value) => void data.set(key, value),
		removeItem: (key) => void data.delete(key),
	};
}

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
	return {
		at: 1,
		language: "en",
		mode: { type: "time", seconds: 30 },
		options: DEFAULT_OPTIONS,
		wpm: 50,
		rawWpm: 55,
		accuracy: 96,
		elapsedMs: 30000,
		...overrides,
	};
}

describe("settings", () => {
	it("returns defaults when nothing is stored", () => {
		expect(createStorage(fakeBackend()).loadSettings()).toEqual(
			DEFAULT_SETTINGS,
		);
	});

	it("round-trips saved settings", () => {
		const storage = createStorage(fakeBackend());
		storage.saveSettings({
			language: "id",
			mode: { type: "words", count: 25 },
			options: { ...DEFAULT_OPTIONS, numbers: true },
		});
		expect(storage.loadSettings()).toEqual({
			language: "id",
			mode: { type: "words", count: 25 },
			options: { ...DEFAULT_OPTIONS, numbers: true },
		});
	});

	it("falls back per field when stored values are invalid", () => {
		const backend = fakeBackend({
			"typing-test:settings": JSON.stringify({
				language: "fr",
				mode: { type: "time", seconds: -5 },
			}),
		});
		expect(createStorage(backend).loadSettings()).toEqual(DEFAULT_SETTINGS);
	});

	it("keeps a valid field when the other is invalid", () => {
		const backend = fakeBackend({
			"typing-test:settings": JSON.stringify({ language: "id", mode: "nope" }),
		});
		expect(createStorage(backend).loadSettings()).toEqual({
			language: "id",
			mode: DEFAULT_SETTINGS.mode,
			options: DEFAULT_OPTIONS,
		});
	});

	it("survives corrupt JSON", () => {
		const backend = fakeBackend({ "typing-test:settings": "{oops" });
		expect(createStorage(backend).loadSettings()).toEqual(DEFAULT_SETTINGS);
	});

	it("works without any backend", () => {
		const storage = createStorage(null);
		storage.saveSettings({
			language: "id",
			mode: DEFAULT_SETTINGS.mode,
			options: DEFAULT_OPTIONS,
		});
		expect(storage.loadSettings()).toEqual(DEFAULT_SETTINGS);
		expect(storage.loadHistory()).toEqual([]);
	});

	it("does not throw when the backend throws", () => {
		const broken: StorageBackend = {
			getItem: () => {
				throw new Error("blocked");
			},
			setItem: () => {
				throw new Error("quota");
			},
			removeItem: () => {
				throw new Error("blocked");
			},
		};
		const storage = createStorage(broken);
		expect(storage.loadSettings()).toEqual(DEFAULT_SETTINGS);
		expect(() => storage.saveHistory([entry()])).not.toThrow();
		expect(() => storage.clearHistory()).not.toThrow();
	});
});

describe("preferences", () => {
	it("returns defaults when nothing is stored", () => {
		expect(createStorage(fakeBackend()).loadPreferences()).toEqual(
			DEFAULT_PREFERENCES,
		);
	});

	it("round-trips saved preferences", () => {
		const storage = createStorage(fakeBackend());
		storage.savePreferences({
			theme: "dark",
			sound: true,
			layout: "tkl",
			keycaps: "ocean",
		});
		expect(storage.loadPreferences()).toEqual({
			theme: "dark",
			sound: true,
			layout: "tkl",
			keycaps: "ocean",
		});
	});

	it("falls back per field when stored values are invalid", () => {
		const backend = fakeBackend({
			"typing-test:preferences": JSON.stringify({ theme: "neon", sound: true }),
		});
		expect(createStorage(backend).loadPreferences()).toEqual({
			...DEFAULT_PREFERENCES,
			sound: true,
		});
	});

	it("survives corrupt JSON and a missing backend", () => {
		const backend = fakeBackend({ "typing-test:preferences": "nope{" });
		expect(createStorage(backend).loadPreferences()).toEqual(
			DEFAULT_PREFERENCES,
		);
		expect(createStorage(null).loadPreferences()).toEqual(DEFAULT_PREFERENCES);
	});
});

describe("preferences keyboard fields", () => {
	it("rejects unknown layout and keycap ids per field", () => {
		const backend = fakeBackend({
			"typing-test:preferences": JSON.stringify({
				layout: "100",
				keycaps: "ocean",
			}),
		});
		const loaded = createStorage(backend).loadPreferences();
		expect(loaded.layout).toBe("60");
		expect(loaded.keycaps).toBe("ocean");
	});
});

describe("settings options and quote mode", () => {
	it("reads each option flag on its own", () => {
		const backend = fakeBackend({
			"typing-test:settings": JSON.stringify({
				language: "en",
				mode: { type: "quote", length: "long" },
				options: { punctuation: true, numbers: "yes", hard: true },
			}),
		});
		expect(createStorage(backend).loadSettings()).toEqual({
			language: "en",
			mode: { type: "quote", length: "long" },
			options: {
				punctuation: true,
				numbers: false,
				capitals: false,
				hard: true,
			},
		});
	});

	it("rejects an invalid quote length", () => {
		const backend = fakeBackend({
			"typing-test:settings": JSON.stringify({
				mode: { type: "quote", length: "huge" },
			}),
		});
		expect(createStorage(backend).loadSettings().mode).toEqual(
			DEFAULT_SETTINGS.mode,
		);
	});
});

describe("history", () => {
	it("loads results saved before options existed", () => {
		const legacy = { ...entry(), options: undefined };
		const backend = fakeBackend({
			"typing-test:history": JSON.stringify([legacy]),
		});
		expect(createStorage(backend).loadHistory()[0].options).toEqual(
			DEFAULT_OPTIONS,
		);
	});

	it("round-trips and drops invalid entries", () => {
		const backend = fakeBackend({
			"typing-test:history": JSON.stringify([
				entry(),
				{ wpm: "fast" },
				entry({ wpm: 70 }),
			]),
		});
		const loaded = createStorage(backend).loadHistory();
		expect(loaded.map((e) => e.wpm)).toEqual([50, 70]);
	});

	it("returns an empty list for non-array data", () => {
		const backend = fakeBackend({
			"typing-test:history": JSON.stringify({ a: 1 }),
		});
		expect(createStorage(backend).loadHistory()).toEqual([]);
	});

	it("clears saved history", () => {
		const backend = fakeBackend();
		const storage = createStorage(backend);
		storage.saveHistory([entry()]);
		storage.clearHistory();
		expect(storage.loadHistory()).toEqual([]);
	});

	it("keeps only the newest entries", () => {
		let history: HistoryEntry[] = [];
		for (let i = 0; i < HISTORY_LIMIT + 5; i++)
			history = appendResult(history, entry({ at: i }));
		expect(history).toHaveLength(HISTORY_LIMIT);
		expect(history[0].at).toBe(5);
		expect(history.at(-1)?.at).toBe(HISTORY_LIMIT + 4);
	});

	it("does not mutate the input list", () => {
		const history = [entry()];
		appendResult(history, entry({ at: 2 }));
		expect(history).toHaveLength(1);
	});
});

describe("bestWpm and options", () => {
	const hard = { ...DEFAULT_OPTIONS, hard: true };
	const quoteShort = { type: "quote", length: "short" } as const;
	const time30 = { type: "time", seconds: 30 } as const;
	const history = [
		entry({ wpm: 50 }),
		entry({ wpm: 80, options: hard }),
		entry({ wpm: 70, mode: quoteShort }),
		entry({ wpm: 90, mode: quoteShort, options: hard }),
	];

	it("keeps results with different options apart", () => {
		expect(bestWpm(history, "en", time30, DEFAULT_OPTIONS)).toBe(50);
		expect(bestWpm(history, "en", time30, hard)).toBe(80);
		expect(
			bestWpm(history, "en", time30, { ...DEFAULT_OPTIONS, numbers: true }),
		).toBeNull();
	});

	it("ignores options in quote mode", () => {
		expect(bestWpm(history, "en", quoteShort, DEFAULT_OPTIONS)).toBe(90);
	});
});

describe("bestWpm", () => {
	const history = [
		entry({ wpm: 40 }),
		entry({ wpm: 80, language: "id" }),
		entry({ wpm: 65 }),
		entry({ wpm: 90, mode: { type: "words", count: 25 } }),
	];

	it("is scoped to language and mode", () => {
		expect(bestWpm(history, "en", { type: "time", seconds: 30 })).toBe(65);
		expect(bestWpm(history, "id", { type: "time", seconds: 30 })).toBe(80);
		expect(bestWpm(history, "en", { type: "words", count: 25 })).toBe(90);
	});

	it("is null when there is no match", () => {
		expect(bestWpm(history, "en", { type: "time", seconds: 60 })).toBeNull();
		expect(bestWpm([], "en", { type: "time", seconds: 30 })).toBeNull();
	});
});

describe("modeKey", () => {
	it("tells modes apart", () => {
		expect(modeKey({ type: "time", seconds: 30 })).toBe("time:30");
		expect(modeKey({ type: "words", count: 30 })).toBe("words:30");
		expect(modeKey({ type: "quote", length: "long" })).toBe("quote:long");
	});
});
