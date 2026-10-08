<!-- src/lib/components/Controls.svelte -->
<script lang="ts">
	import AtSign from "@lucide/svelte/icons/at-sign";
	import CaseUpper from "@lucide/svelte/icons/case-upper";
	import Flame from "@lucide/svelte/icons/flame";
	import Hash from "@lucide/svelte/icons/hash";
	import Languages from "@lucide/svelte/icons/languages";
	import Quote from "@lucide/svelte/icons/quote";
	import Timer from "@lucide/svelte/icons/timer";
	import WholeWord from "@lucide/svelte/icons/whole-word";
	import type { QuoteLength, TestOptions } from "#lib/engine/index.ts";
	import type { Language, TypingTest } from "#lib/stores/test.svelte.ts";

	let { test }: { test: TypingTest } = $props();

	const LANGUAGES: { value: Language; label: string }[] = [
		{ value: "en", label: "English" },
		{ value: "id", label: "Indonesian" },
	];
	const TIMES = [15, 30, 60];
	const WORD_COUNTS = [10, 25, 50, 100];

	const QUOTES: QuoteLength[] = ["short", "medium", "long"];
	const OPTIONS: { name: keyof TestOptions; label: string; Icon: typeof Hash }[] = [
		{ name: "punctuation", label: "punctuation", Icon: AtSign },
		{ name: "numbers", label: "numbers", Icon: Hash },
		{ name: "capitals", label: "capitals", Icon: CaseUpper },
		{ name: "hard", label: "hard words", Icon: Flame },
	];

	const isQuote = $derived(test.mode.type === "quote");

	function isQuoteLength(length: QuoteLength) {
		return test.mode.type === "quote" && test.mode.length === length;
	}

	function isTime(seconds: number) {
		return test.mode.type === "time" && test.mode.seconds === seconds;
	}

	function isWords(count: number) {
		return test.mode.type === "words" && test.mode.count === count;
	}

	// Release focus so Space keeps feeding the test instead of re-clicking the button.
	function run(event: MouseEvent, action: () => void) {
		action();
		(event.currentTarget as HTMLElement).blur();
	}
</script>

<div class="controls">
	<div class="group" role="group" aria-label="Language">
		<Languages size={16} strokeWidth={1.75} aria-hidden="true" />
		{#each LANGUAGES as lang (lang.value)}
			<button
				type="button"
				class="opt"
				aria-pressed={test.language === lang.value}
				onclick={(e) => run(e, () => test.setLanguage(lang.value))}
			>
				{lang.label}
			</button>
		{/each}
	</div>

	<span class="rule" aria-hidden="true"></span>

	<div class="group" role="group" aria-label="Time in seconds">
		<Timer size={16} strokeWidth={1.75} aria-hidden="true" />
		{#each TIMES as seconds (seconds)}
			<button
				type="button"
				class="opt"
				aria-pressed={isTime(seconds)}
				onclick={(e) => run(e, () => test.setMode({ type: "time", seconds }))}
			>
				{seconds}
			</button>
		{/each}
	</div>

	<span class="rule" aria-hidden="true"></span>

	<div class="group" role="group" aria-label="Number of words">
		<WholeWord size={16} strokeWidth={1.75} aria-hidden="true" />
		{#each WORD_COUNTS as count (count)}
			<button
				type="button"
				class="opt"
				aria-pressed={isWords(count)}
				onclick={(e) => run(e, () => test.setMode({ type: "words", count }))}
			>
				{count}
			</button>
		{/each}
	</div>

	<span class="rule" aria-hidden="true"></span>

	<div class="group" role="group" aria-label="Quote length">
		<Quote size={16} strokeWidth={1.75} aria-hidden="true" />
		{#each QUOTES as length (length)}
			<button
				type="button"
				class="opt"
				aria-pressed={isQuoteLength(length)}
				onclick={(e) => run(e, () => test.setMode({ type: "quote", length }))}
			>
				{length}
			</button>
		{/each}
	</div>
</div>

<div class="controls options" role="group" aria-label="Text options">
	{#each OPTIONS as { name, label, Icon } (name)}
		<button
			type="button"
			class="opt toggle"
			aria-pressed={test.options[name]}
			disabled={isQuote}
			onclick={(e) => run(e, () => test.toggleOption(name))}
		>
			<Icon size={15} strokeWidth={1.75} aria-hidden="true" />
			{label}
		</button>
	{/each}
</div>

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		align-items: center;
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

	.options {
		margin-top: -1rem;
		gap: 0.25rem 0.5rem;
	}

	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.toggle:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	@media (max-width: 720px) {
		.rule {
			display: none;
		}
	}
</style>