<!-- src/lib/components/Results.svelte -->
<script lang="ts">
	import type { Snapshot } from "#lib/engine/index.ts";

	let { snapshot, onrestart }: { snapshot: Snapshot; onrestart: () => void } = $props();

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

	<button type="button" onclick={onrestart}>Restart (Esc)</button>
</section>

<style>
	.results {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
		align-items: flex-start;
		min-height: calc(var(--line) * 3);
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

	button {
		font: inherit;
		font-weight: 600;
		color: var(--bg);
		background: var(--accent);
		border: 0;
		border-radius: 8px;
		padding: 0.55rem 1.1rem;
		cursor: pointer;
	}

	button:hover {
		filter: brightness(1.08);
	}

	button:focus-visible {
		outline: 2px solid var(--fg);
		outline-offset: 2px;
	}
</style>