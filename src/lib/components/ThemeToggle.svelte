<script>
	import { onMount } from 'svelte';
	import { isDarkMode, toggleTheme, initializeTheme } from '$lib/stores/theme.js';
	
	onMount(() => {
		initializeTheme();
	});
	
	function handleToggle() {
		toggleTheme();
	}
</script>

<button
	on:click={handleToggle}
	class="fixed top-4 right-4 z-50 p-3 rounded-full bg-vsc-light-bg-medium dark:bg-vsc-bg-medium hover:bg-vsc-light-bg-light dark:hover:bg-vsc-bg-light border border-vsc-light-border dark:border-vsc-border-light transition-all duration-300 shadow-lg hover:shadow-xl group"
	title={$isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
	aria-label="Toggle theme"
>
	<div class="relative w-6 h-6 transition-transform duration-300 group-hover:scale-110">
		{#if $isDarkMode}
			<!-- Sun icon for dark mode (to switch to light) -->
			<svg viewBox="0 0 24 24" class="w-6 h-6 text-yellow-400 transition-all duration-300 rotate-0 group-hover:rotate-180">
				<circle cx="12" cy="12" r="4" fill="currentColor"/>
				<path d="M12 1v6m0 8v6m11-7h-6m-8 0H1m17.2-3.6l-4.2 4.2M8.8 8.8l-4.2-4.2m12.8 12.8l-4.2-4.2M8.8 15.2l-4.2 4.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			</svg>
		{:else}
			<!-- Moon icon for light mode (to switch to dark) -->
			<svg viewBox="0 0 24 24" class="w-6 h-6 text-blue-600 transition-all duration-300 rotate-0 group-hover:-rotate-12">
				<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>
			</svg>
		{/if}
	</div>
	
	<!-- Tooltip -->
	<div class="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-vsc-light-bg-light dark:bg-vsc-bg-dark text-vsc-light-text-primary dark:text-vsc-text-primary text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
		{$isDarkMode ? 'Light Mode' : 'Dark Mode'}
	</div>
</button>

<style>
	/* Ensure the button stays above other content */
	button {
		backdrop-filter: blur(8px);
	}
</style>