<!-- src/lib/components/Keyboard3D.svelte -->
<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import type { KeyboardScene } from "#lib/keyboard3d/scene.ts";

	let canvas: HTMLCanvasElement | undefined = $state();
	let ready = $state(false);
	let failed = $state(false);

	let scene: KeyboardScene | undefined;
	let destroyed = false;

	export function press(code: string) {
		scene?.press(code);
	}

	export function release(code: string) {
		scene?.release(code);
	}

	export function releaseAll() {
		scene?.releaseAll();
	}

	onMount(async () => {
		// Phones have no physical keyboard, so skip loading three.js entirely.
		if (!canvas || window.matchMedia("(max-width: 720px)").matches) return;

		try {
			const { createKeyboardScene } = await import("#lib/keyboard3d/scene.ts");
			const created = await createKeyboardScene(canvas);
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

{#if !failed}
	<div class="keyboard" class:ready aria-hidden="true">
		<canvas bind:this={canvas}></canvas>
	</div>
{/if}

<style>
	.keyboard {
		width: 100%;
		max-width: 52rem;
		margin-inline: auto;
		aspect-ratio: 16 / 6;
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

	@media (prefers-reduced-motion: no-preference) {
		.keyboard {
			transition: opacity 300ms ease-out;
		}
	}

	@media (max-width: 720px) {
		.keyboard {
			display: none;
		}
	}
</style>