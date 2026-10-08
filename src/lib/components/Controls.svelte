<!-- src/lib/components/Controls.svelte -->
<script lang="ts">
	import AtSign from "@lucide/svelte/icons/at-sign";
	import CaseUpper from "@lucide/svelte/icons/case-upper";
	import Check from "@lucide/svelte/icons/check";
	import ChevronDown from "@lucide/svelte/icons/chevron-down";
	import Flame from "@lucide/svelte/icons/flame";
	import Hash from "@lucide/svelte/icons/hash";
	import Languages from "@lucide/svelte/icons/languages";
	import SlidersHorizontal from "@lucide/svelte/icons/sliders-horizontal";
	import type { Mode, QuoteLength, TestOptions } from "#lib/engine/index.ts";
	import type { Language, TypingTest } from "#lib/stores/test.svelte.ts";
	import Popover from "./Popover.svelte";

	let { test }: { test: TypingTest } = $props();

	type ModeType = Mode["type"];

	const LANGUAGES: { value: Language; label: string }[] = [
		{ value: "en", label: "English" },
		{ value: "id", label: "Indonesian" },
	];
	const MODE_TYPES: { type: ModeType; label: string }[] = [
		{ type: "time", label: "time" },
		{ type: "words", label: "words" },
		{ type: "quote", label: "quote" },
	];
	const TIMES = [15, 30, 60];
	const WORD_COUNTS = [10, 25, 50, 100];
	const QUOTES: QuoteLength[] = ["short", "medium", "long"];
	const OPTIONS: { name: keyof TestOptions; label: string; Icon: typeof Hash }[] = [
		{ name: "punctuation", label: "Punctuation", Icon: AtSign },
		{ name: "numbers", label: "Numbers", Icon: Hash },
		{ name: "capitals", label: "Capitals", Icon: CaseUpper },
		{ name: "hard", label: "Hard words", Icon: Flame },
	];

	// Last value used per mode type, so switching tabs returns to it.
	const remembered: Record<ModeType, Mode> = {
		time: { type: "time", seconds: 30 },
		words: { type: "words", count: 25 },
		quote: { type: "quote", length: "medium" },
	};

	const modeType = $derived(test.mode.type);
	const isQuote = $derived(modeType === "quote");
	const anyOption = $derived(!isQuote && Object.values(test.options).some(Boolean));
	const languageLabel = $derived(LANGUAGES.find((l) => l.value === test.language)?.label);

	function chooseMode(mode: Mode) {
		remembered[mode.type] = mode;
		test.setMode(mode);
	}

	function chooseType(type: ModeType) {
		if (type !== modeType) test.setMode(remembered[type]);
	}

	// Release focus so Space keeps feeding the test instead of re-clicking the button.
	function run(event: MouseEvent, action: () => void) {
		action();
		(event.currentTarget as HTMLElement).blur();
	}
</script>

<div class="controls">
	<Popover label="Language">
		{#snippet trigger()}
			<Languages size={16} strokeWidth={1.75} aria-hidden="true" />
			{languageLabel}
			<ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" />
		{/snippet}
		{#snippet children(close)}
			{#each LANGUAGES as lang (lang.value)}
				<button
					type="button"
					class="row"
					aria-pressed={test.language === lang.value}
					onclick={(e) =>
						run(e, () => {
							test.setLanguage(lang.value);
							close();
						})}
				>
					{lang.label}
					{#if test.language === lang.value}
						<Check size={15} strokeWidth={2} aria-hidden="true" />
					{/if}
				</button>
			{/each}
		{/snippet}
	</Popover>

	<span class="rule" aria-hidden="true"></span>

	<div class="group" role="group" aria-label="Mode">
		{#each MODE_TYPES as item (item.type)}
			<button
				type="button"
				class="opt"
				aria-pressed={modeType === item.type}
				onclick={(e) => run(e, () => chooseType(item.type))}
			>
				{item.label}
			</button>
		{/each}
	</div>

	<span class="rule" aria-hidden="true"></span>

	<div class="group" role="group" aria-label="Length">
		{#if test.mode.type === "time"}
			{#each TIMES as seconds (seconds)}
				<button
					type="button"
					class="opt"
					aria-label="{seconds} seconds"
					aria-pressed={test.mode.type === "time" && test.mode.seconds === seconds}
					onclick={(e) => run(e, () => chooseMode({ type: "time", seconds }))}
				>
					{seconds}
				</button>
			{/each}
		{:else if test.mode.type === "words"}
			{#each WORD_COUNTS as count (count)}
				<button
					type="button"
					class="opt"
					aria-label="{count} words"
					aria-pressed={test.mode.type === "words" && test.mode.count === count}
					onclick={(e) => run(e, () => chooseMode({ type: "words", count }))}
				>
					{count}
				</button>
			{/each}
		{:else}
			{#each QUOTES as length (length)}
				<button
					type="button"
					class="opt"
					aria-pressed={test.mode.type === "quote" && test.mode.length === length}
					onclick={(e) => run(e, () => chooseMode({ type: "quote", length }))}
				>
					{length}
				</button>
			{/each}
		{/if}
	</div>

	<span class="spacer" aria-hidden="true"></span>

	<Popover label="Text options" dot={anyOption} align="end">
		{#snippet trigger()}
			<SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
			Options
		{/snippet}
		{#snippet children()}
			{#each OPTIONS as { name, label, Icon } (name)}
				<button
					type="button"
					class="row"
					aria-pressed={test.options[name]}
					disabled={isQuote}
					onclick={(e) => run(e, () => test.toggleOption(name))}
				>
					<span class="label"><Icon size={15} strokeWidth={1.75} aria-hidden="true" />{label}</span>
					{#if test.options[name] && !isQuote}
						<Check size={15} strokeWidth={2} aria-hidden="true" />
					{/if}
				</button>
			{/each}
			{#if isQuote}
				<p class="note">Quotes are typed as written.</p>
			{/if}
		{/snippet}
	</Popover>
</div>

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 0.75rem;
		align-items: center;
		color: var(--muted);
	}

	.group {
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}

	.rule {
		width: 1px;
		height: 1.1rem;
		background: var(--rule);
	}

	.spacer {
		flex: 1;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.5rem 0.65rem;
		font: inherit;
		font-size: 0.95rem;
		color: var(--muted);
		text-align: left;
		background: transparent;
		border: 0;
		border-radius: 6px;
		cursor: pointer;
		transition:
			color 140ms ease-out,
			background-color 140ms ease-out;
	}

	.row:hover:not(:disabled) {
		color: var(--fg);
		background: color-mix(in srgb, var(--fg) 6%, transparent);
	}

	.row[aria-pressed="true"] {
		color: var(--accent);
	}

	.row:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.row:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}

	.label {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
	}

	.note {
		margin: 0.25rem 0.65rem 0.35rem;
		font-size: 0.85rem;
		color: var(--muted);
	}

	@media (max-width: 720px) {
		.rule {
			display: none;
		}

		.spacer {
			display: none;
		}
	}
</style>