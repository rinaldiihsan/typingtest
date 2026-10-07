<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { onDestroy } from "svelte";
	import { createKeyClick } from "#lib/audio/keyclick.ts";
	import Controls from "#lib/components/Controls.svelte";
	import History from "#lib/components/History.svelte";
	import Keyboard3D from "#lib/components/Keyboard3D.svelte";
	import PrefsBar from "#lib/components/PrefsBar.svelte";
	import Results from "#lib/components/Results.svelte";
	import WordsView from "#lib/components/WordsView.svelte";
	import { Preferences } from "#lib/stores/prefs.svelte.ts";
	import { TypingTest } from "#lib/stores/test.svelte.ts";

	const test = new TypingTest();
	const prefs = new Preferences();
	const click = createKeyClick();
	let keyboard: ReturnType<typeof Keyboard3D> | undefined = $state();
	let showHistory = $state(false);
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
		if (!event.repeat) {
			keyboard?.press(event.code);
			if (prefs.sound) click.play();
		}

		if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;

		if (event.key === "Escape") {
			event.preventDefault();
			if (showHistory) showHistory = false;
			else test.restart();
			return;
		}

		if (showHistory) return;

		if (snap.status === "finished") return;

		const isTypingKey = event.key === " " || event.key === "Backspace" || event.key.length === 1;
		if (!isTypingKey) return;

		// Stops page scroll on Space and Firefox quick find on "/" and "'".
		event.preventDefault();
		test.press(event.key);
	}

	function onkeyup(event: KeyboardEvent) {
		keyboard?.release(event.code);
	}

	onDestroy(() => {
		test.destroy();
		click.dispose();
	});
</script>

<svelte:head>
	<title>Typing Test</title>
</svelte:head>

<svelte:window {onkeydown} {onkeyup} onblur={() => keyboard?.releaseAll()} />

<main>
	<header>
		<div class="top">
			<h1>typing test</h1>
			<div class="tools">
				<PrefsBar {prefs} />
				<button
					type="button"
					class="link"
					aria-pressed={showHistory}
					onclick={(e) => {
						showHistory = !showHistory;
						e.currentTarget.blur();
					}}
				>
					history
				</button>
			</div>
		</div>
		<Controls {test} />
	</header>

	<section class="stage" aria-label="Typing area">
		{#if showHistory}
			<History
				entries={test.history}
				onclear={() => test.clearHistory()}
				onclose={() => (showHistory = false)}
			/>
		{:else if snap.status === "finished"}
			<Results snapshot={snap} run={test.lastRun} onrestart={() => test.restart()} />
		{:else}
			<div class="hud" aria-live="off">
				<span class="progress">{progress}</span>
				<span class="live">{liveWpm} wpm</span>
			</div>
			<WordsView snapshot={snap} />
		{/if}
	</section>

	<Keyboard3D bind:this={keyboard} />

	<footer>
		<kbd>Esc</kbd> restart / back
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

	.top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}

	.tools {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.25rem;
	}

	.link {
		font: inherit;
		font-size: 0.9rem;
		color: var(--muted);
		background: transparent;
		border: 0;
		border-radius: 6px;
		padding: 0.25rem 0.5rem;
		cursor: pointer;
	}

	.link:hover,
	.link[aria-pressed="true"] {
		color: var(--accent);
	}

	.link:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
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