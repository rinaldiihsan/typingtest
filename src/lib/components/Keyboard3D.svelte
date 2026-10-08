<!-- src/lib/components/Keyboard3D.svelte -->
<script lang="ts">
	import KeyboardOff from "@lucide/svelte/icons/keyboard-off";
	import { onDestroy, onMount } from "svelte";
	import { type LayoutName, LAYOUTS, placeKeys } from "#lib/keyboard3d/layout.ts";
	import type { KeyboardScene } from "#lib/keyboard3d/scene.ts";
	import type { KeycapId } from "#lib/keyboard3d/themes.ts";

	let { layout, keycaps }: { layout: LayoutName; keycaps: KeycapId } = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	let ready = $state(false);
	let failed = $state(false);

	let scene: KeyboardScene | undefined;
	let destroyed = false;

	// Match the frame to the board so wide layouts do not shrink into a thin strip.
	const aspect = $derived.by(() => {
		const { width, depth } = placeKeys(LAYOUTS[layout].rows);
		return Math.min(4, Math.max(2, (width / depth) * 0.95));
	});

	export function press(code: string) {
		scene?.press(code);
	}

	export function release(code: string) {
		scene?.release(code);
	}

	export function releaseAll() {
		scene?.releaseAll();
	}

	// Read the props before the optional call, or the effect would not track them while scene is unset.
	$effect(() => {
		const next = layout;
		scene?.setLayout(next);
	});

	$effect(() => {
		const next = keycaps;
		scene?.setKeycaps(next);
	});

	onMount(async () => {
		// Phones have no physical keyboard, so skip loading three.js entirely.
		if (!canvas || window.matchMedia("(max-width: 720px)").matches) return;

		try {
			const { createKeyboardScene } = await import("#lib/keyboard3d/scene.ts");
			const created = await createKeyboardScene(canvas, { layout, keycaps });
			if (destroyed) {
				created.dispose();
				return;
			}
			scene = created;
			ready = true;
		} catch {
			failed = true;
		}
	});

	onDestroy(() => {
		destroyed = true;
		scene?.dispose();
	});
</script>

{#if failed}
	<p class="notice" role="status">
		<KeyboardOff size={18} strokeWidth={1.75} aria-hidden="true" />
		The 3D keyboard is hidden because WebGL is not available. Typing works as usual.
	</p>
{:else}
	<div class="keyboard" class:ready aria-hidden="true" style:aspect-ratio={aspect}>
		<canvas bind:this={canvas}></canvas>
	</div>
{/if}

<style>
	.keyboard {
		width: 100%;
		max-width: 56rem;
		margin-inline: auto;
		opacity: 0;
	}

	.keyboard.ready {
		opacity: 1;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	.notice {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		margin: 0;
		padding: 1.5rem 0;
		color: var(--muted);
		font-size: 0.95rem;
	}

	@media (prefers-reduced-motion: no-preference) {
		.keyboard {
			transition: opacity 300ms ease-out;
		}
	}

	@media (max-width: 720px) {
		.keyboard,
		.notice {
			display: none;
		}
	}
</style>