<!-- src/lib/components/PrefsBar.svelte -->
<script lang="ts">
	import type { Preferences } from "#lib/stores/prefs.svelte.ts";

	let { prefs }: { prefs: Preferences } = $props();

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
		onclick={(e) => run(e, () => prefs.cycleTheme())}
	>
		theme: {prefs.theme}
	</button>
	<button
		type="button"
		aria-pressed={prefs.sound}
		title="Toggle key sound"
		onclick={(e) => run(e, () => prefs.toggleSound())}
	>
		sound: {prefs.sound ? "on" : "off"}
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