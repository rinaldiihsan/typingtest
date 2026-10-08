<!-- src/lib/components/History.svelte -->
<script lang="ts">
	import ArrowLeft from "@lucide/svelte/icons/arrow-left";
	import Trash from "@lucide/svelte/icons/trash";
	import { modeLabel } from "#lib/engine/index.ts";
	import type { HistoryEntry } from "#lib/storage/storage.ts";
	import { summarizeHistory } from "#lib/storage/summary.ts";

	let {
		entries,
		onclear,
		onclose,
	}: { entries: readonly HistoryEntry[]; onclear: () => void; onclose: () => void } = $props();

	const SHOWN = 10;
	const recent = $derived([...entries].reverse().slice(0, SHOWN));
	const summary = $derived(summarizeHistory(entries));
	const dateFormat = new Intl.DateTimeFormat(undefined, {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});

	function languageLabel(entry: HistoryEntry) {
		return entry.language === "en" ? "English" : "Indonesian";
	}

	function whole(value: number | null) {
		return value === null ? "0" : String(Math.round(value));
	}
</script>

<section class="history" aria-label="History">
	<dl class="summary">
		<div>
			<dt>best wpm</dt>
			<dd class="accent">{whole(summary.best)}</dd>
		</div>
		<div>
			<dt>recent average</dt>
			<dd>{whole(summary.average)}</dd>
		</div>
		<div>
			<dt>accuracy</dt>
			<dd>{summary.accuracy === null ? "0" : summary.accuracy.toFixed(1)}%</dd>
		</div>
		<div>
			<dt>tests taken</dt>
			<dd>{summary.count}</dd>
		</div>
	</dl>

	{#if recent.length === 0}
		<p class="empty">Finish a test and your results will show up here.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th scope="col">Date</th>
					<th scope="col">Language</th>
					<th scope="col">Test</th>
					<th scope="col" class="num">WPM</th>
					<th scope="col" class="num">Accuracy</th>
				</tr>
			</thead>
			<tbody>
				{#each recent as entry (entry.at)}
					<tr>
						<td>{dateFormat.format(entry.at)}</td>
						<td>{languageLabel(entry)}</td>
						<td>{modeLabel(entry.mode)}</td>
						<td class="num wpm">{Math.round(entry.wpm)}</td>
						<td class="num">{entry.accuracy.toFixed(1)}%</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}

	<div class="actions">
		<button type="button" class="btn" onclick={onclose}>
			<ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
			Back to test
		</button>
		{#if recent.length > 0}
			<button type="button" class="btn quiet" onclick={onclear}>
				<Trash size={16} strokeWidth={1.75} aria-hidden="true" />
				Clear history
			</button>
		{/if}
	</div>
</section>

<style>
	.history {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		animation: rise 320ms ease-out both;
	}

	.summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		gap: 1.25rem 2rem;
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
		font-size: 2rem;
		line-height: 1.2;
		letter-spacing: -0.02em;
	}

	dd.accent {
		color: var(--accent);
	}

	.empty {
		margin: 0;
		padding-top: 1.5rem;
		border-top: 1px solid var(--rule);
		color: var(--muted);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}

	th {
		color: var(--muted);
		font-size: 0.9rem;
		font-weight: 400;
		text-align: left;
	}

	th,
	td {
		padding: 0.6rem 1rem 0.6rem 0;
		border-bottom: 1px solid var(--rule);
	}

	td {
		font-size: 0.95rem;
	}

	.num {
		text-align: right;
		font-family: var(--font-mono);
		padding-right: 0;
	}

	.wpm {
		color: var(--accent);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	@media (max-width: 720px) {
		th:nth-child(2),
		td:nth-child(2) {
			display: none;
		}
	}
</style>