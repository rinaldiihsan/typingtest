<!-- src/lib/components/Results.svelte -->
<script lang="ts">
	import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
	import Trophy from "@lucide/svelte/icons/trophy";
	import type { Snapshot } from "#lib/engine/index.ts";
	import type { RunSummary } from "#lib/stores/test.svelte.ts";

	let {
		snapshot,
		run,
		onrestart,
	}: { snapshot: Snapshot; run: RunSummary | null; onrestart: () => void } = $props();

	const stats = $derived(snapshot.stats);
	const seconds = $derived((Math.round(stats.elapsedMs / 100) / 10).toFixed(1));
</script>

<section class="results" aria-label="Results">
	<dl class="main">
		<div>
			<dt>wpm</dt>
			<dd>{Math.round(stats.wpm)}</dd>
		</div>
		<div>
			<dt>accuracy</dt>
			<dd>{stats.accuracy.toFixed(1)}%</dd>
		</div>
	</dl>

	<dl class="detail">
		<div>
			<dt>raw</dt>
			<dd>{Math.round(stats.rawWpm)}</dd>
		</div>
		<div>
			<dt>characters</dt>
			<dd>{stats.correctKeystrokes}/{stats.incorrectKeystrokes}</dd>
		</div>
		<div>
			<dt>time</dt>
			<dd>{seconds}s</dd>
		</div>
	</dl>

	{#if run}
		<p class="best" class:record={run.isNewBest}>
			{#if run.isNewBest}
				<Trophy size={16} aria-hidden="true" />
				new best · previous {Math.round(run.previousBest ?? 0)} wpm
			{:else if run.previousBest !== null}
				best {Math.round(run.previousBest)} wpm
			{:else}
				first result saved
			{/if}
		</p>
	{/if}

	<button type="button" onclick={onrestart}
		><RotateCcw size={16} aria-hidden="true" />Restart (Esc)</button
	>
</section>

<style>
	.results {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
		align-items: flex-start;
		min-height: calc(var(--line) * 3);
	}

	.main > div,
	.detail > div,
	.best,
	button {
		animation: rise 360ms ease-out both;
	}

	.main > div:nth-child(2) {
		animation-delay: 70ms;
	}

	.detail > div:nth-child(1) {
		animation-delay: 130ms;
	}

	.detail > div:nth-child(2) {
		animation-delay: 170ms;
	}

	.detail > div:nth-child(3) {
		animation-delay: 210ms;
	}

	.best {
		animation-delay: 250ms;
	}

	button {
		animation-delay: 300ms;
	}

	dl {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem 3rem;
		margin: 0;
	}

	dt {
		color: var(--muted);
		font-size: 0.85rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	dd {
		margin: 0;
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
	}

	.main dd {
		color: var(--accent);
		font-size: 3.25rem;
		line-height: 1.1;
	}

	.detail dd {
		font-size: 1.4rem;
	}

	.best {
		margin: 0;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.95rem;
	}

	.best {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
	}

	.best.record {
		color: var(--accent);
		animation-name: rise, pop;
		animation-duration: 360ms, 450ms;
		animation-delay: 250ms, 600ms;
	}

	button {
		font: inherit;
		font-weight: 600;
		color: var(--bg);
		background: var(--accent);
		border: 0;
		border-radius: 8px;
		padding: 0.55rem 1.1rem;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	button:active {
		transform: scale(0.96);
	}

	button:hover {
		filter: brightness(1.08);
	}

	button:focus-visible {
		outline: 2px solid var(--fg);
		outline-offset: 2px;
	}
</style>