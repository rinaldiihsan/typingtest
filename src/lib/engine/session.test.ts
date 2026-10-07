// src/lib/engine/session.test.ts
import { describe, expect, it } from "vitest";
import { MAX_EXTRA_CHARS, TypingSession } from "./session";
import type { Mode } from "./types";

function makeClock(start = 1000) {
	let t = start;
	return {
		now: () => t,
		advance: (ms: number) => {
			t += ms;
		},
	};
}

function make(words: string[], mode: Mode) {
	const clock = makeClock();
	const session = new TypingSession({ words, mode, now: clock.now });
	return { clock, session };
}

function typeText(session: TypingSession, text: string) {
	for (const ch of text) session.input(ch);
}

describe("TypingSession: start", () => {
	it("starts the timer on the first character, not on space or backspace", () => {
		const { session, clock } = make(["abc"], { type: "words", count: 1 });
		session.input(" ");
		session.input("Backspace");
		expect(session.status).toBe("idle");

		clock.advance(500);
		session.input("a");
		expect(session.status).toBe("running");

		clock.advance(1000);
		expect(session.elapsedMs()).toBe(1000);
	});

	it("ignores keys other than characters, space and Backspace", () => {
		const { session } = make(["abc"], { type: "words", count: 1 });
		for (const key of ["Shift", "Enter", "ArrowLeft", "Tab", "Control"]) {
			session.input(key);
		}
		expect(session.status).toBe("idle");
		expect(session.typed).toEqual([""]);
	});

	it("throws when there are no words", () => {
		expect(
			() => new TypingSession({ words: [], mode: { type: "words", count: 0 } }),
		).toThrow();
	});
});

describe("TypingSession: typing words", () => {
	it("moves to the next word on space", () => {
		const { session } = make(["go", "to"], { type: "words", count: 2 });
		typeText(session, "go ");
		expect(session.wordIndex).toBe(1);
		expect(session.typed).toEqual(["go", ""]);
	});

	it("ignores space on an empty word", () => {
		const { session } = make(["go", "to"], { type: "words", count: 2 });
		session.input("g");
		session.input("o");
		session.input(" ");
		session.input(" ");
		expect(session.wordIndex).toBe(1);
		expect(session.typed[1]).toBe("");
	});

	it("counts wrong and extra characters as errors", () => {
		const { session } = make(["ab", "cd"], { type: "words", count: 2 });
		typeText(session, "axyz");
		expect(session.typed[0]).toBe("axyz");
		const stats = session.stats();
		expect(stats.correctKeystrokes).toBe(1);
		expect(stats.incorrectKeystrokes).toBe(3);
	});

	it("caps extra characters at MAX_EXTRA_CHARS", () => {
		const { session } = make(["ab", "cd"], { type: "words", count: 2 });
		typeText(session, `a${"x".repeat(30)}`);
		expect(session.typed[0]).toHaveLength(2 + MAX_EXTRA_CHARS);
		expect(session.stats().incorrectKeystrokes).toBe(1 + MAX_EXTRA_CHARS);
	});

	it("marks the word incorrect when space is pressed mid-word", () => {
		const { session } = make(["hello", "world"], { type: "words", count: 2 });
		typeText(session, "hel ");
		expect(session.wordIndex).toBe(1);
		expect(session.typed[0]).toBe("hel");
		expect(session.stats().incorrectKeystrokes).toBe(1);
	});
});

describe("TypingSession: backspace", () => {
	it("removes the last character without counting as a keystroke", () => {
		const { session } = make(["abc", "d"], { type: "words", count: 2 });
		typeText(session, "ab");
		session.input("Backspace");
		expect(session.typed[0]).toBe("a");
		const stats = session.stats();
		expect(stats.correctKeystrokes + stats.incorrectKeystrokes).toBe(2);
	});

	it("locks correct words so they cannot be revisited", () => {
		const { session } = make(["go", "to"], { type: "words", count: 2 });
		typeText(session, "go ");
		session.input("Backspace");
		expect(session.wordIndex).toBe(1);
		expect(session.typed[0]).toBe("go");
	});

	it("lets incorrect words be revisited and fixed", () => {
		const { session } = make(["hello", "world"], { type: "words", count: 2 });
		typeText(session, "hel ");
		session.input("Backspace");
		expect(session.wordIndex).toBe(0);
		session.input("Backspace");
		expect(session.typed[0]).toBe("he");
		typeText(session, "llo ");
		expect(session.typed[0]).toBe("hello");
		expect(session.wordIndex).toBe(1);

		const stats = session.stats();
		expect(stats.correctKeystrokes).toBe(7);
		expect(stats.incorrectKeystrokes).toBe(1);
		expect(stats.accuracy).toBeCloseTo(87.5);
	});

	it("does nothing at the start of a session", () => {
		const { session } = make(["abc"], { type: "words", count: 1 });
		session.input("Backspace");
		expect(session.wordIndex).toBe(0);
		expect(session.status).toBe("idle");
	});
});

describe("TypingSession: words mode", () => {
	it("finishes when the last word is typed correctly, without a trailing space", () => {
		const { session, clock } = make(["aaaa", "bbbb"], {
			type: "words",
			count: 2,
		});
		session.input("a");
		clock.advance(6000);
		typeText(session, "aaa bbbb");

		expect(session.status).toBe("finished");
		const stats = session.stats();
		expect(stats.elapsedMs).toBe(6000);
		// "aaaa " = 5, "bbbb" = 4: 9 correct characters in 0.1 minutes
		expect(stats.wpm).toBeCloseTo(18);
		expect(stats.rawWpm).toBeCloseTo(18);
		expect(stats.accuracy).toBe(100);
	});

	it("finishes on space after an incorrect last word", () => {
		const { session } = make(["ab"], { type: "words", count: 1 });
		typeText(session, "a ");
		expect(session.status).toBe("finished");
		expect(session.stats().accuracy).toBeCloseTo(50);
	});

	it("ignores input after finishing", () => {
		const { session } = make(["ab"], { type: "words", count: 1 });
		typeText(session, "ab");
		session.input("x");
		expect(session.typed[0]).toBe("ab");
	});

	it("does not count skipped incorrect words toward WPM", () => {
		const { session, clock } = make(["aa", "bb"], { type: "words", count: 2 });
		session.input("x");
		clock.advance(60000);
		typeText(session, "x ");
		typeText(session, "bb");
		expect(session.status).toBe("finished");
		// only "bb" (2 characters) is correct
		expect(session.stats().wpm).toBeCloseTo(0.4);
	});
});

describe("TypingSession: time mode", () => {
	it("ends on tick after the time limit and clamps elapsed time", () => {
		const { session, clock } = make(["aa", "bb", "cc"], {
			type: "time",
			seconds: 15,
		});
		session.input("a");
		clock.advance(10000);
		typeText(session, "a bb");
		expect(session.status).toBe("running");

		clock.advance(6000);
		expect(session.tick()).toBe("finished");
		expect(session.elapsedMs()).toBe(15000);

		session.input("c");
		expect(session.typed[2]).toBe("");

		// "aa " = 3, "bb" = 2: 5 correct characters in 0.25 minutes
		expect(session.stats().wpm).toBeCloseTo(4);
	});

	it("closes the session on input after the limit without waiting for tick", () => {
		const { session, clock } = make(["aa", "bb"], {
			type: "time",
			seconds: 15,
		});
		session.input("a");
		clock.advance(20000);
		session.input("a");
		expect(session.status).toBe("finished");
		expect(session.typed[0]).toBe("a");
		expect(session.elapsedMs()).toBe(15000);
	});

	it("never reports elapsed time past the limit while running", () => {
		const { session, clock } = make(["aa", "bb"], {
			type: "time",
			seconds: 15,
		});
		session.input("a");
		clock.advance(99999);
		expect(session.elapsedMs()).toBe(15000);
	});
});

describe("TypingSession: snapshot", () => {
	it("returns a copy of the state and stats", () => {
		const { session, clock } = make(["ab", "cd"], { type: "words", count: 2 });
		session.input("a");
		clock.advance(1000);
		const snap = session.snapshot();
		expect(snap.status).toBe("running");
		expect(snap.typed).toEqual(["a", ""]);
		expect(snap.elapsedMs).toBe(1000);
		expect(snap.stats.correctKeystrokes).toBe(1);
	});
});
