<!-- src/lib/components/PrefsBar.svelte -->
<script lang="ts">
	import Monitor from "@lucide/svelte/icons/monitor";
	import Moon from "@lucide/svelte/icons/moon";
	import Sun from "@lucide/svelte/icons/sun";
	import Volume2 from "@lucide/svelte/icons/volume-2";
	import VolumeX from "@lucide/svelte/icons/volume-x";
	import type { Preferences, Theme } from "#lib/stores/prefs.svelte.ts";

	let { prefs }: { prefs: Preferences } = $props();

	const THEME_ICONS: Record<Theme, typeof Sun> = { system: Monitor, light: Sun, dark: Moon };
	const ThemeIcon = $derived(THEME_ICONS[prefs.theme]);
	const SoundIcon = $derived(prefs.sound ? Volume2 : VolumeX);

	// Release focus so Space keeps feeding the test instead of re-clicking the button.
	function run(event: MouseEvent, action: () => void) {
		action();
		(event.currentTarget as HTMLElement).blur();
	}
</script>

<div class="prefs" role="group" aria-label="Preferences">
	<button
		type="button"
		title="Switch theme"
		aria-label="Theme: {prefs.theme}. Click to change."
		onclick={(e) => run(e, () => prefs.cycleTheme())}
	>
		<ThemeIcon size={16} aria-hidden="true" />
		{prefs.theme}
	</button>
	<button
		type="button"
		aria-pressed={prefs.sound}
		title="Toggle key sound"
		aria-label="Key sound: {prefs.sound ? "on" : "off"}"
		onclick={(e) => run(e, () => prefs.toggleSound())}
	>
		<SoundIcon size={16} aria-hidden="true" />
		{prefs.sound ? "on" : "off"}
	</button>
</div>

<style>
	.prefs {
		display: flex;
		gap: 0.25rem;
	}

	button {
		font: inherit;
		font-size: 0.9rem;
		color: var(--muted);
		background: transparent;
		border: 0;
		border-radius: 6px;
		padding: 0.25rem 0.5rem;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		transition:
			color 120ms ease-out,
			transform 80ms ease-out;
	}

	button:active {
		transform: scale(0.95);
	}

	button:hover,
	button[aria-pressed="true"] {
		color: var(--accent);
	}

	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>