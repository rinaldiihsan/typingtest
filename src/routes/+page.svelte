<!-- src/routes/+page.svelte -->
<script lang="ts">
	import Keyboard from "@lucide/svelte/icons/keyboard";
	import RotateCcwClock from "@lucide/svelte/icons/rotate-ccw-clock";
	import { onDestroy } from "svelte";
	import { createKeyClick } from "#lib/audio/keyclick.ts";
	import Controls from "#lib/components/Controls.svelte";
	import History from "#lib/components/History.svelte";
	import Keyboard3D from "#lib/components/Keyboard3D.svelte";
	import KeyboardOptions from "#lib/components/KeyboardOptions.svelte";
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
		return `${wordIndex}/${snap.words.length}`;
	});

	const liveWpm = $derived(snap.status === "running" ? Math.round(snap.stats.wpm) : 0);

	function onkeydown(event: KeyboardEvent) {
		if (!event.repeat) {
			keyboard?.press(event.code);
			if (prefs.sound) click.play(event.key);
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
	<header class="bar">
		<h1 class="brand">
			<Keyboard size={20} strokeWidth={1.75} aria-hidden="true" />
			typing test
		</h1>
		<div class="tools">
			<PrefsBar {prefs} />
			<button
				type="button"
				class="icon-btn"
				aria-pressed={showHistory}
				title="History"
				aria-label="History"
				onclick={(e) => {
					showHistory = !showHistory;
					e.currentTarget.blur();
				}}
			>
				<RotateCcwClock size={18} strokeWidth={1.75} aria-hidden="true" />
			</button>
		</div>
	</header>

	<Controls {test} />

	<section class="stage" aria-label="Typing area">
		{#if showHistory}
			<History
				entries={test.history}
				onclear={() => test.clearHistory()}
				onclose={() => (showHistory = false)}
			/>
		{:else if snap.status === "finished"}
			<Results
				snapshot={snap}
				run={test.lastRun}
				samples={test.samples}
				language={test.language}
				onrestart={() => test.restart()}
			/>
		{:else}
			<div class="hud" aria-live="off">
				<span class="progress">{progress}</span>
				<span class="live">{liveWpm} wpm</span>
			</div>
			<WordsView snapshot={snap} />
			<p class="hint" class:visible={snap.status === "idle"}>Start typing to begin</p>
		{/if}
	</section>

	<div class="deck">
		<Keyboard3D bind:this={keyboard} layout={prefs.layout} keycaps={prefs.keycaps} />
		<KeyboardOptions {prefs} />
	</div>

	<footer>
		<span class="key">Esc</span>
		{showHistory ? "to go back" : "to restart"}
	</footer>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		max-width: 64rem;
		min-height: 100%;
		margin-inline: auto;
		padding: 1.5rem 1.5rem 2rem;
	}

	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		margin: 0;
		font-size: 1.15rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.brand :global(svg) {
		color: var(--accent);
	}

	.tools {
		display: flex;
		gap: 0.15rem;
	}

	.stage {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.75rem;
		min-height: 25rem;
	}

	.hud {
		display: flex;
		gap: 1.25rem;
		align-items: baseline;
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		min-height: 2.75rem;
	}

	.progress {
		color: var(--accent);
		font-size: 2.25rem;
		line-height: 1.2;
	}

	.live {
		color: var(--muted);
		font-size: 1rem;
	}

	.hint {
		margin: 0;
		color: var(--muted);
		font-size: 0.95rem;
		opacity: 0;
		transition: opacity 200ms ease-out;
	}

	.hint.visible {
		opacity: 1;
	}

	/* A soft glow in the accent color sits behind the keyboard. */
	.deck {
		margin-inline: -1.5rem;
		padding: 1rem 1.5rem;
		background: radial-gradient(
			ellipse 60% 55% at 50% 55%,
			color-mix(in srgb, var(--accent) 16%, transparent),
			transparent 70%
		);
	}

	footer {
		color: var(--muted);
		font-size: 0.9rem;
	}

	.key {
		margin-right: 0.25rem;
		color: var(--fg);
		font-family: var(--font-mono);
		font-weight: 600;
	}
</style>