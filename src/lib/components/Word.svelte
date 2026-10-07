<!-- src/lib/components/Word.svelte -->
<script lang="ts">
	import { getCharViews } from "#lib/engine/index.ts";

	let {
		target,
		typed,
		active,
	}: { target: string; typed: string; active: boolean } = $props();

	const views = $derived(getCharViews(target, typed));
	const wrong = $derived(!active && typed.length > 0 && typed !== target);
</script>

<span class="word" class:wrong data-active={active ? "true" : undefined}>
	{#each views as view, i (i)}
		<span
			class="char {view.state}"
			class:caret-before={active && i === typed.length}
			class:caret-after={active && i === views.length - 1 && typed.length >= views.length}
			>{view.char}</span
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

	.caret-before::before,
	.caret-after::after {
		content: "";
		position: absolute;
		top: 18%;
		bottom: 18%;
		width: 2px;
		background: var(--accent);
		border-radius: 1px;
	}

	.caret-before::before {
		left: -1px;
	}

	.caret-after::after {
		right: -1px;
	}
</style>