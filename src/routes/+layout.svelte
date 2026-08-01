<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { APP_VERSION } from '$lib/version';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
<footer class="py-6 text-center text-[11px] font-mono text-(--text-muted)/40 select-none pb-24 sm:pb-8">
	v{APP_VERSION}
</footer>

