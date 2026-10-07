<!-- src/lib/components/WordsView.svelte -->
<script lang="ts">
	import type { Snapshot } from "#lib/engine/index.ts";
	import Word from "./Word.svelte";

	let { snapshot }: { snapshot: Snapshot } = $props();

	let track: HTMLDivElement | undefined = $state();
	let width = $state(0);
	let offset = $state(0);

	// Keep the active word on the second visible line.
	$effect(() => {
		void snapshot.words;
		void snapshot.wordIndex;
		void width;

		const active = track?.querySelector<HTMLElement>('[data-active="true"]');
		if (!active) return;
		offset = Math.max(0, active.offsetTop - active.offsetHeight);
	});
</script>

<div class="viewport" bind:clientWidth={width}>
	<div class="track" bind:this={track} style:transform="translateY(-{offset}px)">
		{#each snapshot.words as word, i (i)}
			<Word target={word} typed={snapshot.typed[i]} active={i === snapshot.wordIndex} />
		{/each}
	</div>
</div>

<style>
	.viewport {
		height: calc(var(--line) * 3);
		overflow: hidden;
		font-family: var(--font-mono);
		font-size: 1.6rem;
	}

	.track {
		position: relative;
		display: flex;
		flex-wrap: wrap;
		column-gap: 0.9ch;
	}

	@media (prefers-reduced-motion: no-preference) {
		.track {
			transition: transform 120ms ease-out;
		}
	}
</style>