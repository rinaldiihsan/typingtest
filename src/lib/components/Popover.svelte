<!-- src/lib/components/Popover.svelte -->
<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		label,
		trigger,
		children,
		dot = false,
		align = "start",
	}: {
		label: string;
		trigger: Snippet;
		children: Snippet<[close: () => void]>;
		dot?: boolean;
		align?: "start" | "end" | "center";
	} = $props();

	let open = $state(false);
	let root: HTMLElement | undefined = $state();

	function close() {
		open = false;
	}

	// Esc closes the popover first and must not restart the test behind it.
	function onkeydown(event: KeyboardEvent) {
		if (!open || event.key !== "Escape") return;
		event.preventDefault();
		event.stopImmediatePropagation();
		close();
	}

	function onpointerdown(event: PointerEvent) {
		if (open && root && !root.contains(event.target as Node)) close();
	}
</script>

<svelte:window onkeydowncapture={onkeydown} {onpointerdown} />

<div class="popover" bind:this={root}>
	<button
		type="button"
		class="trigger"
		aria-haspopup="true"
		aria-expanded={open}
		aria-label={label}
		title={label}
		onclick={(e) => {
			open = !open;
			e.currentTarget.blur();
		}}
	>
		{@render trigger()}
		{#if dot}<span class="dot" aria-hidden="true"></span>{/if}
	</button>

	{#if open}
		<div class="panel {align}" role="group" aria-label={label}>
			{@render children(close)}
		</div>
	{/if}
</div>

<style>
	.popover {
		position: relative;
	}

	.trigger {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.55rem;
		font: inherit;
		font-size: 0.95rem;
		color: var(--muted);
		background: transparent;
		border: 0;
		border-radius: 6px;
		cursor: pointer;
		transition:
			color 140ms ease-out,
			transform 90ms ease-out;
	}

	.trigger:hover,
	.trigger[aria-expanded="true"] {
		color: var(--fg);
	}

	.trigger:active {
		transform: scale(0.96);
	}

	.trigger:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.dot {
		position: absolute;
		top: 0.2rem;
		right: 0.25rem;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent);
	}

	.panel {
		position: absolute;
		top: calc(100% + 0.4rem);
		z-index: 10;
		display: flex;
		flex-direction: column;
		min-width: 12rem;
		padding: 0.35rem;
		background: var(--surface);
		border: 1px solid var(--rule);
		border-radius: 10px;
		box-shadow: 0 10px 30px color-mix(in srgb, var(--bg) 60%, black);
		animation: rise 160ms ease-out;
	}

	.panel.start {
		left: 0;
	}

	.panel.end {
		right: 0;
	}

	.panel.center {
		left: 50%;
		translate: -50% 0;
	}

	@media (forced-colors: active) {
		.panel {
			border-color: CanvasText;
		}
	}
</style>