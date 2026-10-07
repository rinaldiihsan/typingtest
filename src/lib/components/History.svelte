<!-- src/lib/components/History.svelte -->
<script lang="ts">
	import ArrowLeft from "@lucide/svelte/icons/arrow-left";
	import Trash from "@lucide/svelte/icons/trash";
	import type { HistoryEntry } from "#lib/storage/storage.ts";

	let {
		entries,
		onclear,
		onclose,
	}: {
		entries: readonly HistoryEntry[];
		onclear: () => void;
		onclose: () => void;
	} = $props();

	const SHOWN = 10;
	const recent = $derived([...entries].reverse().slice(0, SHOWN));
	const dateFormat = new Intl.DateTimeFormat(undefined, {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});

	function modeLabel(entry: HistoryEntry) {
		return entry.mode.type === "time" ? `${entry.mode.seconds}s` : `${entry.mode.count} words`;
	}
</script>

<section class="history" aria-label="History">
	{#if recent.length === 0}
		<p class="empty">no results yet</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>date</th>
					<th>lang</th>
					<th>mode</th>
					<th>wpm</th>
					<th>acc</th>
				</tr>
			</thead>
			<tbody>
				{#each recent as entry (entry.at)}
					<tr>
						<td>{dateFormat.format(entry.at)}</td>
						<td>{entry.language}</td>
						<td>{modeLabel(entry)}</td>
						<td class="wpm">{Math.round(entry.wpm)}</td>
						<td>{entry.accuracy.toFixed(1)}%</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}

	<div class="actions">
		<button type="button" onclick={onclose}><ArrowLeft size={16} aria-hidden="true" />Back (Esc)</button>
		{#if recent.length > 0}
			<button type="button" class="ghost" onclick={onclear}
				><Trash size={16} aria-hidden="true" />Clear history</button
			>
		{/if}
	</div>
</section>

<style>
	.history {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		align-items: flex-start;
		min-height: calc(var(--line) * 3);
		animation: rise 320ms ease-out both;
	}

	.empty {
		margin: 0;
		color: var(--muted);
	}

	table {
		border-collapse: collapse;
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		font-size: 0.95rem;
	}

	th {
		color: var(--muted);
		font-size: 0.8rem;
		font-weight: 400;
		letter-spacing: 0.06em;
		text-align: left;
		text-transform: uppercase;
	}

	th,
	td {
		padding: 0.3rem 1.5rem 0.3rem 0;
	}

	.wpm {
		color: var(--accent);
	}

	tbody tr {
		animation: rise 300ms ease-out both;
	}

	tbody tr:nth-child(2) {
		animation-delay: 30ms;
	}

	tbody tr:nth-child(3) {
		animation-delay: 60ms;
	}

	tbody tr:nth-child(n + 4) {
		animation-delay: 90ms;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	button {
		font: inherit;
		font-weight: 600;
		color: var(--bg);
		background: var(--accent);
		border: 0;
		border-radius: 8px;
		padding: 0.5rem 1rem;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		transition:
			filter 120ms ease-out,
			transform 80ms ease-out;
	}

	button:active {
		transform: scale(0.96);
	}

	button.ghost {
		color: var(--muted);
		background: var(--surface);
	}

	button:hover {
		filter: brightness(1.08);
	}

	button:focus-visible {
		outline: 2px solid var(--fg);
		outline-offset: 2px;
	}
</style>