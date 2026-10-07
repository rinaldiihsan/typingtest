<!-- src/lib/components/Word.svelte -->
<script lang="ts">
	import { getCharViews } from "#lib/engine/index.ts";

	let { target, typed, active }: { target: string; typed: string; active: boolean } = $props();

	const views = $derived(getCharViews(target, typed));
	const wrong = $derived(!active && typed.length > 0 && typed !== target);

	// Marks the character the caret sits on, so the parent can measure it.
	function caretSide(index: number): "before" | "after" | undefined {
		if (!active) return undefined;
		if (index === typed.length) return "before";
		if (index === views.length - 1 && typed.length >= views.length) return "after";
		return undefined;
	}
</script>

<span class="word" class:wrong data-active={active ? "true" : undefined}>
	{#each views as view, i (i)}
		<span class="char {view.state}" data-caret={caretSide(i)}
			>{view.char}{#if view.typed}<span class="typed" aria-hidden="true">{view.typed}</span
				>{/if}</span
		>
	{/each}
</span>

<style>
	.word {
		display: inline-block;
		height: var(--line);
		line-height: var(--line);
		white-space: nowrap;
	}

	.word.wrong {
		text-decoration: underline 2px var(--error);
		text-underline-offset: 0.2em;
	}

	.char {
		position: relative;
		color: var(--untyped);
		transition: color 90ms ease-out;
	}

	.char.correct {
		color: var(--typed);
	}

	.char.incorrect {
		color: var(--error);
	}

	.char.extra {
		color: var(--error);
		opacity: 0.7;
	}

	/* The wrong letter the user typed, shown above the expected one. */
	.typed {
		position: absolute;
		top: -0.3rem;
		left: 50%;
		translate: -50% 0;
		font-size: 0.5em;
		line-height: 1;
		font-weight: 600;
		color: var(--error);
		text-decoration: none;
		animation: typed-in 150ms ease-out;
	}

	@keyframes typed-in {
		from {
			opacity: 0;
			transform: translateY(40%) scale(0.6);
		}

		to {
			opacity: 1;
			transform: none;
		}
	}
</style>