<script lang="ts">
	import './layout.css';
	import { APP_VERSION } from '$lib/version';
	// Registers the bundled Phosphor icon subset so <Icon icon="ph:..."> never
	// hits api.iconify.design at runtime (previously 700ms-1.5s blocking
	// requests sitting on the critical rendering path, see PSI report).
	import '$lib/icons/register';

	let { children } = $props();
</script>

{@render children()}
<footer class="py-6 text-center text-[11px] font-mono text-(--text-muted)/60 select-none pb-24 sm:pb-8 flex items-center justify-center gap-3 flex-wrap px-4">
	<span>v{APP_VERSION}</span>
	<span>•</span>
	<a href="/polityka-prywatnosci" class="hover:underline hover:text-(--text-primary) transition-colors">
		Polityka prywatności
	</a>
</footer>


