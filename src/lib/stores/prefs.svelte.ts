// src/lib/stores/prefs.svelte.ts
import type { LayoutName } from "#lib/keyboard3d/layout.ts";
import type { KeycapId } from "#lib/keyboard3d/themes.ts";
import {
	type AppStorage,
	browserBackend,
	createStorage,
	type Theme,
} from "#lib/storage/storage.ts";

export type { Theme };

const THEME_ORDER: readonly Theme[] = ["system", "light", "dark"];

/** The part of an element needed to apply a theme, so tests can pass a fake. */
export interface ThemeTarget {
	setAttribute(name: string, value: string): void;
	removeAttribute(name: string): void;
}

/** "system" removes the attribute so the OS color scheme decides. */
export function applyTheme(theme: Theme, target: ThemeTarget): void {
	if (theme === "system") target.removeAttribute("data-theme");
	else target.setAttribute("data-theme", theme);
}

export function nextTheme(theme: Theme): Theme {
	return THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];
}

export class Preferences {
	theme: Theme;
	sound: boolean;
	layout: LayoutName;
	keycaps: KeycapId;

	#storage: AppStorage;
	#target: ThemeTarget | null;

	constructor(
		storage: AppStorage = createStorage(browserBackend()),
		target: ThemeTarget | null = typeof document === "undefined"
			? null
			: document.documentElement,
	) {
		this.#storage = storage;
		this.#target = target;

		const saved = storage.loadPreferences();
		this.theme = $state(saved.theme);
		this.sound = $state(saved.sound);
		this.layout = $state(saved.layout);
		this.keycaps = $state(saved.keycaps);
		this.#applyTheme();
	}

	cycleTheme() {
		this.theme = nextTheme(this.theme);
		this.#applyTheme();
		this.#save();
	}

	toggleSound() {
		this.sound = !this.sound;
		this.#save();
	}

	setLayout(layout: LayoutName) {
		this.layout = layout;
		this.#save();
	}

	setKeycaps(keycaps: KeycapId) {
		this.keycaps = keycaps;
		this.#save();
	}

	#applyTheme() {
		if (this.#target) applyTheme(this.theme, this.#target);
	}

	#save() {
		this.#storage.savePreferences({
			theme: this.theme,
			sound: this.sound,
			layout: this.layout,
			keycaps: this.keycaps,
		});
	}
}
