<!-- src/lib/components/WpmChart.svelte -->
<script lang="ts">
	import { buildChart } from "#lib/chart/geometry.ts";
	import type { Sample } from "#lib/engine/index.ts";

	let { samples }: { samples: readonly Sample[] } = $props();

	const BOX = { width: 640, height: 180, left: 34, right: 8, top: 10, bottom: 24 };
	const chart = $derived(buildChart(samples, BOX));
</script>

{#if chart}
	<figure>
		<figcaption>
			<span class="key wpm-key">wpm</span>
			<span class="key raw-key">raw</span>
		</figcaption>
		<svg viewBox="0 0 {BOX.width} {BOX.height}" role="img" aria-label="Speed over time">
			<defs>
				<linearGradient id="wpm-fill" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stop-color="var(--accent)" stop-opacity="0.22" />
					<stop offset="1" stop-color="var(--accent)" stop-opacity="0" />
				</linearGradient>
			</defs>

			{#each chart.yTicks as tick (tick.label)}
				<line class="grid" x1={BOX.left} x2={BOX.width - BOX.right} y1={tick.y} y2={tick.y} />
				<text class="axis" x={BOX.left - 8} y={tick.y} text-anchor="end" dominant-baseline="middle">
					{tick.label}
				</text>
			{/each}
			{#each chart.xTicks as tick (tick.label)}
				<text class="axis" x={tick.x} y={BOX.height - 4} text-anchor="middle">{tick.label}</text>
			{/each}

			<path class="area" d={chart.areaPath} fill="url(#wpm-fill)" />
			<path class="raw" d={chart.rawPath} pathLength="1" />
			<path class="wpm" d={chart.wpmPath} pathLength="1" />
		</svg>
	</figure>
{/if}

<style>
	figure {
		margin: 0;
		min-width: 0;
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}

	.grid {
		stroke: var(--rule);
		stroke-width: 1;
	}

	.axis {
		fill: var(--muted);
		font-family: var(--font-mono);
		font-size: 11px;
	}

	.wpm,
	.raw {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		animation: draw 900ms 120ms ease-out forwards;
	}

	.wpm {
		stroke: var(--accent);
		stroke-width: 2.5;
	}

	.raw {
		stroke: var(--muted);
		stroke-width: 1.5;
		opacity: 0.7;
	}

	.area {
		opacity: 0;
		animation: fade 500ms 700ms ease-out forwards;
	}

	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes fade {
		to {
			opacity: 1;
		}
	}

	figcaption {
		display: flex;
		gap: 1.25rem;
		margin-bottom: 0.5rem;
		padding-left: 34px;
		color: var(--muted);
		font-size: 0.85rem;
	}

	.key {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
	}

	.key::before {
		content: "";
		width: 1rem;
		height: 0;
		border-top: 2.5px solid var(--accent);
		border-radius: 2px;
	}

	.raw-key::before {
		border-top: 1.5px solid var(--muted);
	}
</style>