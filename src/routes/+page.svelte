<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { onDestroy } from "svelte";
	import Controls from "#lib/components/Controls.svelte";
	import Results from "#lib/components/Results.svelte";
	import WordsView from "#lib/components/WordsView.svelte";
	import { TypingTest } from "#lib/stores/test.svelte.ts";

	const test = new TypingTest();
	const snap = $derived(test.snapshot);

	const progress = $derived.by(() => {
		const { mode, elapsedMs, wordIndex } = snap;
		if (mode.type === "time") {
			return String(Math.max(0, Math.ceil(mode.seconds - elapsedMs / 1000)));
		}
		return `${wordIndex}/${mode.count}`;
	});

	const liveWpm = $derived(snap.status === "running" ? Math.round(snap.stats.wpm) : 0);

	function onkeydown(event: KeyboardEvent) {
		if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;

		if (event.key === "Escape") {
			event.preventDefault();
			test.restart();
			return;
		}

		if (snap.status === "finished") return;

		const isTypingKey =
			event.key === " " || event.key === "Backspace" || event.key.length === 1;
		if (!isTypingKey) return;

		// Stops page scroll on Space and Firefox quick find on "/" and "'".
		event.preventDefault();
		test.press(event.key);
	}

	onDestroy(() => test.destroy());
</script>

<svelte:head>
	<title>Typing Test</title>
</svelte:head>

<svelte:window {onkeydown} />

<main>
	<header>
		<h1>typing test</h1>
		<Controls {test} />
	</header>

	<section class="stage" aria-label="Typing area">
		{#if snap.status === "finished"}
			<Results snapshot={snap} onrestart={() => test.restart()} />
		{:else}
			<div class="hud" aria-live="off">
				<span class="progress">{progress}</span>
				<span class="live">{liveWpm} wpm</span>
			</div>
			<WordsView snapshot={snap} />
		{/if}
	</section>

	<footer>
		<kbd>Esc</kbd> restart
	</footer>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 3rem;
		max-width: 62rem;
		min-height: 100%;
		margin-inline: auto;
		padding: 2rem 1.5rem 2.5rem;
	}

	header {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	h1 {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 1.1rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		color: var(--muted);
	}

	.stage {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-block: auto;
	}

	.hud {
		display: flex;
		gap: 1.5rem;
		align-items: baseline;
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		min-height: 2rem;
	}

	.progress {
		color: var(--accent);
		font-size: 1.5rem;
	}

	.live {
		color: var(--muted);
		font-size: 1rem;
	}

	footer {
		color: var(--muted);
		font-size: 0.85rem;
	}

	kbd {
		font-family: var(--font-mono);
		background: var(--surface);
		border-radius: 4px;
		padding: 0.1rem 0.4rem;
	}
</style>