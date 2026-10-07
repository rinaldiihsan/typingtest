<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import "#lib/styles/global.css";
	import type { LayoutProps } from "./$types";

	let { children }: LayoutProps = $props();
</script>

{@render children()}