<!-- src/lib/components/Controls.svelte -->
<script lang="ts">
	import type { Language, TypingTest } from "#lib/stores/test.svelte.ts";

	let { test }: { test: TypingTest } = $props();

	const LANGUAGES: { value: Language; label: string }[] = [
		{ value: "en", label: "English" },
		{ value: "id", label: "Indonesia" },
	];
	const TIMES = [15, 30, 60];
	const WORD_COUNTS = [10, 25, 50, 100];

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
		{#each LANGUAGES as lang (lang.value)}
			<button
				type="button"
				aria-pressed={test.language === lang.value}
				onclick={(e) => run(e, () => test.setLanguage(lang.value))}
			>
				{lang.label}
			</button>
		{/each}
	</div>

	<div class="group" role="group" aria-label="Time">
		<span class="label">time</span>
		{#each TIMES as seconds (seconds)}
			<button
				type="button"
				aria-pressed={isTime(seconds)}
				onclick={(e) => run(e, () => test.setMode({ type: "time", seconds }))}
			>
				{seconds}
			</button>
		{/each}
	</div>

	<div class="group" role="group" aria-label="Words">
		<span class="label">words</span>
		{#each WORD_COUNTS as count (count)}
			<button
				type="button"
				aria-pressed={isWords(count)}
				onclick={(e) => run(e, () => test.setMode({ type: "words", count }))}
			>
				{count}
			</button>
		{/each}
	</div>
</div>

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1.5rem;
		align-items: center;
	}

	.group {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.label {
		margin-right: 0.35rem;
		color: var(--muted);
		font-size: 0.8rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	button {
		font: inherit;
		font-size: 0.95rem;
		color: var(--muted);
		background: transparent;
		border: 0;
		border-radius: 6px;
		padding: 0.3rem 0.6rem;
		cursor: pointer;
	}

	button:hover {
		color: var(--fg);
	}

	button[aria-pressed="true"] {
		color: var(--accent);
		background: var(--surface);
	}

	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>