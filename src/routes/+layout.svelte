<script lang="ts">
	import './layout.css';
	import { APP_VERSION } from '$lib/version';

	let { children } = $props();
</script>

{@render children()}
<footer class="py-6 text-center text-[11px] font-mono text-(--text-muted)/40 select-none pb-24 sm:pb-8">
	v{APP_VERSION}
</footer>

