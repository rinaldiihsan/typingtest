// src/lib/stores/prefs.svelte.test.ts
import { describe, expect, it } from "vitest";
import { createStorage, type StorageBackend } from "#lib/storage/storage.ts";
import {
	applyTheme,
	nextTheme,
	Preferences,
	type ThemeTarget,
} from "./prefs.svelte.ts";

function memoryBackend(): StorageBackend {
	const data = new Map<string, string>();
	return {
		getItem: (key) => data.get(key) ?? null,
		setItem: (key, value) => void data.set(key, value),
		removeItem: (key) => void data.delete(key),
	};
}

function fakeTarget(): ThemeTarget & { attrs: Map<string, string> } {
	const attrs = new Map<string, string>();
	return {
		attrs,
		setAttribute: (name, value) => void attrs.set(name, value),
		removeAttribute: (name) => void attrs.delete(name),
	};
}

describe("applyTheme", () => {
	it("sets data-theme for light and dark", () => {
		const target = fakeTarget();
		applyTheme("dark", target);
		expect(target.attrs.get("data-theme")).toBe("dark");
		applyTheme("light", target);
		expect(target.attrs.get("data-theme")).toBe("light");
	});

	it("removes data-theme for system", () => {
		const target = fakeTarget();
		applyTheme("dark", target);
		applyTheme("system", target);
		expect(target.attrs.has("data-theme")).toBe(false);
	});
});

describe("nextTheme", () => {
	it("cycles system, light, dark", () => {
		expect(nextTheme("system")).toBe("light");
		expect(nextTheme("light")).toBe("dark");
		expect(nextTheme("dark")).toBe("system");
	});
});

describe("Preferences store", () => {
	it("starts with system theme and sound off", () => {
		const prefs = new Preferences(createStorage(memoryBackend()), fakeTarget());
		expect(prefs.theme).toBe("system");
		expect(prefs.sound).toBe(false);
	});

	it("applies the saved theme on creation", () => {
		const backend = memoryBackend();
		createStorage(backend).savePreferences({
			theme: "dark",
			sound: false,
			layout: "60",
			keycaps: "default",
		});
		const target = fakeTarget();
		new Preferences(createStorage(backend), target);
		expect(target.attrs.get("data-theme")).toBe("dark");
	});

	it("cycles the theme, applies it and persists it", () => {
		const backend = memoryBackend();
		const target = fakeTarget();
		const prefs = new Preferences(createStorage(backend), target);

		prefs.cycleTheme();
		expect(prefs.theme).toBe("light");
		expect(target.attrs.get("data-theme")).toBe("light");
		expect(createStorage(backend).loadPreferences().theme).toBe("light");
	});

	it("toggles and persists sound", () => {
		const backend = memoryBackend();
		const prefs = new Preferences(createStorage(backend), fakeTarget());
		prefs.toggleSound();
		expect(prefs.sound).toBe(true);
		expect(createStorage(backend).loadPreferences().sound).toBe(true);
	});

	it("works without a DOM target", () => {
		const prefs = new Preferences(createStorage(null), null);
		expect(() => prefs.cycleTheme()).not.toThrow();
	});

	it("saves the keyboard layout and keycap scheme", () => {
		const backend = memoryBackend();
		const prefs = new Preferences(createStorage(backend), fakeTarget());
		prefs.setLayout("75");
		prefs.setKeycaps("sakura");

		expect(prefs.layout).toBe("75");
		expect(prefs.keycaps).toBe("sakura");
		const saved = createStorage(backend).loadPreferences();
		expect(saved.layout).toBe("75");
		expect(saved.keycaps).toBe("sakura");
	});
});
