<!-- src/lib/components/Results.svelte -->
<script lang="ts">
	import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
	import Trophy from "@lucide/svelte/icons/trophy";
	import type { Sample, Snapshot } from "#lib/engine/index.ts";
	import type { Language, RunSummary } from "#lib/stores/test.svelte.ts";
	import WpmChart from "./WpmChart.svelte";

	let {
		snapshot,
		run,
		samples,
		language,
		onrestart,
	}: {
		snapshot: Snapshot;
		run: RunSummary | null;
		samples: readonly Sample[];
		language: Language;
		onrestart: () => void;
	} = $props();

	const LANGUAGE_NAMES: Record<Language, string> = { en: "English", id: "Indonesian" };

	const stats = $derived(snapshot.stats);
	const seconds = $derived((Math.round(stats.elapsedMs / 100) / 10).toFixed(1));
	const testLabel = $derived(
		snapshot.mode.type === "time"
			? `${LANGUAGE_NAMES[language]}, ${snapshot.mode.seconds} seconds`
			: `${LANGUAGE_NAMES[language]}, ${snapshot.mode.count} words`,
	);
</script>

<section class="results" aria-label="Results">
	<div class="top">
		<dl class="hero">
			<div>
				<dt>wpm</dt>
				<dd>{Math.round(stats.wpm)}</dd>
			</div>
			<div>
				<dt>accuracy</dt>
				<dd>{stats.accuracy.toFixed(1)}%</dd>
			</div>
		</dl>
		<WpmChart {samples} />
	</div>

	<dl class="facts">
		<div>
			<dt>raw</dt>
			<dd>{Math.round(stats.rawWpm)}</dd>
		</div>
		<div>
			<dt>characters</dt>
			<dd>{stats.correctKeystrokes} correct, {stats.incorrectKeystrokes} wrong</dd>
		</div>
		<div>
			<dt>time</dt>
			<dd>{seconds}s</dd>
		</div>
		<div>
			<dt>test</dt>
			<dd>{testLabel}</dd>
		</div>
	</dl>

	<div class="foot">
		<button type="button" class="btn" onclick={onrestart}>
			<RotateCcw size={16} strokeWidth={2} aria-hidden="true" />
			Restart
		</button>

		{#if run}
			<p class="best" class:record={run.isNewBest}>
				{#if run.isNewBest}
					<Trophy size={16} strokeWidth={1.75} aria-hidden="true" />
					New personal best, up from {Math.round(run.previousBest ?? 0)} wpm
				{:else if run.previousBest !== null}
					Personal best is {Math.round(run.previousBest)} wpm
				{:else}
					First result saved
				{/if}
			</p>
		{/if}
	</div>
</section>

<style>
	.results {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
		animation: rise 320ms ease-out both;
	}

	.top {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 2rem 3.5rem;
		align-items: center;
	}

	dl {
		margin: 0;
	}

	dt {
		color: var(--muted);
		font-size: 0.9rem;
	}

	dd {
		margin: 0;
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
	}

	.hero {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.hero dd {
		font-size: 4rem;
		line-height: 1.05;
		letter-spacing: -0.03em;
	}

	.hero div:first-child dd {
		color: var(--accent);
	}

	.hero div:last-child dd {
		font-size: 2.4rem;
		color: var(--fg);
	}

	.facts {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: 1.25rem 2rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--rule);
	}

	.facts dd {
		margin-top: 0.1rem;
		font-size: 1.05rem;
	}

	.foot {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem 1.5rem;
		align-items: center;
	}

	.best {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		color: var(--muted);
		font-size: 0.95rem;
	}

	.best.record {
		color: var(--accent);
	}

	@media (max-width: 720px) {
		.top {
			grid-template-columns: 1fr;
		}

		.hero {
			flex-direction: row;
			gap: 2.5rem;
		}
	}
</style>