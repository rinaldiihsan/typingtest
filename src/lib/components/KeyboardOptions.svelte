<!-- src/lib/components/KeyboardOptions.svelte -->
<script lang="ts">
	import LayoutGrid from "@lucide/svelte/icons/layout-grid";
	import Palette from "@lucide/svelte/icons/palette";
	import { LAYOUT_NAMES, LAYOUTS } from "#lib/keyboard3d/layout.ts";
	import { KEYCAP_IDS, KEYCAP_SCHEMES } from "#lib/keyboard3d/themes.ts";
	import type { Preferences } from "#lib/stores/prefs.svelte.ts";

	let { prefs }: { prefs: Preferences } = $props();

	// Release focus so Space keeps feeding the test instead of re-clicking the button.
	function run(event: MouseEvent, action: () => void) {
		action();
		(event.currentTarget as HTMLElement).blur();
	}
</script>

<div class="options">
	<div class="group" role="group" aria-label="Keyboard layout">
		<LayoutGrid size={16} strokeWidth={1.75} aria-hidden="true" />
		{#each LAYOUT_NAMES as name (name)}
			<button
				type="button"
				class="opt"
				aria-pressed={prefs.layout === name}
				onclick={(e) => run(e, () => prefs.setLayout(name))}
			>
				{LAYOUTS[name].label}
			</button>
		{/each}
	</div>

	<span class="rule" aria-hidden="true"></span>

	<div class="group" role="group" aria-label="Keycap colors">
		<Palette size={16} strokeWidth={1.75} aria-hidden="true" />
		{#each KEYCAP_IDS as id (id)}
			{@const scheme = KEYCAP_SCHEMES[id]}
			<button
				type="button"
				class="swatch"
				aria-pressed={prefs.keycaps === id}
				aria-label={scheme.label}
				title={scheme.label}
				style:--a={scheme.swatch[0]}
				style:--b={scheme.swatch[1]}
				onclick={(e) => run(e, () => prefs.setKeycaps(id))}
			></button>
		{/each}
	</div>
</div>

<style>
	.options {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem 1rem;
		align-items: center;
		margin-top: 0.75rem;
		color: var(--muted);
	}

	.group {
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}

	.group :global(svg) {
		margin-right: 0.35rem;
		flex: none;
	}

	.rule {
		width: 1px;
		height: 1.1rem;
		background: var(--rule);
	}

	.swatch {
		width: 1.4rem;
		height: 1.4rem;
		margin-inline: 0.2rem;
		padding: 0;
		cursor: pointer;
		border: 1px solid var(--line);
		border-radius: 50%;
		background: linear-gradient(135deg, var(--a) 50%, var(--b) 50%);
		transition:
			transform 90ms ease-out,
			box-shadow 140ms ease-out;
	}

	.swatch:hover {
		transform: scale(1.1);
	}

	.swatch:active {
		transform: scale(0.94);
	}

	.swatch[aria-pressed="true"] {
		box-shadow:
			0 0 0 2px var(--bg),
			0 0 0 4px var(--accent);
	}

	.swatch:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}

	@media (max-width: 720px) {
		.options {
			display: none;
		}
	}
</style>