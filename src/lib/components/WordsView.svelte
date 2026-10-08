<!-- src/lib/components/WordsView.svelte -->
<script lang="ts">
	import type { Snapshot } from "#lib/engine/index.ts";
	import Word from "./Word.svelte";

	let { snapshot }: { snapshot: Snapshot } = $props();

	let track: HTMLDivElement | undefined = $state();
	let width = $state(0);
	let offset = $state(0);
	let caret = $state({ x: 0, y: 0, height: 0, placed: false });
	// Stays false for the first placement so the caret does not slide in from the corner.
	let animateCaret = $state(false);

	function measure() {
		const el = track?.querySelector<HTMLElement>('[data-caret]');
		const wordEl = track?.querySelector<HTMLElement>('[data-active="true"]');
		if (!el || !wordEl) return;

		// offset* values ignore the scrolling transform, so they stay stable mid-transition.
		const after = el.dataset.caret === "after";
		caret = {
			x: el.offsetLeft + (after ? el.offsetWidth : 0),
			y: wordEl.offsetTop + wordEl.offsetHeight * 0.18,
			height: wordEl.offsetHeight * 0.64,
			placed: true,
		};
		offset = Math.max(0, wordEl.offsetTop - wordEl.offsetHeight);
	}

	// Keep the active word on the second visible line and the caret on its character.
	$effect(() => {
		void snapshot;
		void width;
		measure();
	});

	$effect(() => {
		if (!caret.placed || animateCaret) return;
		const frame = requestAnimationFrame(() => {
			animateCaret = true;
		});
		return () => cancelAnimationFrame(frame);
	});

	// The web font swaps in after first paint and changes character widths.
	$effect(() => {
		void document.fonts?.ready.then(measure);
	});
</script>

<div class="viewport" bind:clientWidth={width}>
	<div class="track" bind:this={track} style:transform="translateY(-{offset}px)">
		{#if caret.placed}
			<div
				class="caret"
				class:idle={snapshot.status === "idle"}
				class:animate={animateCaret}
				style:transform="translate({caret.x}px, {caret.y}px)"
				style:height="{caret.height}px"
			></div>
		{/if}
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
		/* The third line fades out so the eye stays on the active one. */
		mask-image: linear-gradient(to bottom, #000 66%, rgb(0 0 0 / 0.3));
	}

	.track {
		position: relative;
		display: flex;
		flex-wrap: wrap;
		column-gap: 0.9ch;
		transition: transform 140ms ease-out;
	}

	.caret {
		position: absolute;
		top: 0;
		left: -1px;
		width: 2px;
		background: var(--accent);
		border-radius: 1px;
		pointer-events: none;
		z-index: 1;
	}

	.caret.animate {
		transition: transform 90ms ease-out;
	}

	.caret.idle {
		animation: blink 1.1s steps(1) infinite;
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
</style>