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

<button
	type="button"
	class="icon-btn"
	title="Theme: {prefs.theme}"
	aria-label="Theme: {prefs.theme}. Click to change."
	onclick={(e) => run(e, () => prefs.cycleTheme())}
>
	<ThemeIcon size={18} strokeWidth={1.75} aria-hidden="true" />
</button>
<button
	type="button"
	class="icon-btn"
	aria-pressed={prefs.sound}
	title="Key sound: {prefs.sound ? 'on' : 'off'}"
	aria-label="Key sound: {prefs.sound ? 'on' : 'off'}"
	onclick={(e) => run(e, () => prefs.toggleSound())}
>
	<SoundIcon size={18} strokeWidth={1.75} aria-hidden="true" />
</button>