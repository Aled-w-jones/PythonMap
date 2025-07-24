<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import BrowserSearchPanel from '$lib/components/BrowserSearchPanel.svelte';
	
	let isPanelOpen = true;
	
	onMount(() => {
		// Load panel state from localStorage
		if (browser) {
			const savedState = localStorage.getItem('browserSearchPanelOpen');
			if (savedState !== null) {
				isPanelOpen = JSON.parse(savedState);
			}
		}
	});
</script>

<svelte:head>
	<title>Codebase Browser - PythonMap</title>
</svelte:head>

<!-- Search Panel -->
<div class="{isPanelOpen ? 'w-80' : 'w-12'} flex-shrink-0 transition-all duration-300">
	<BrowserSearchPanel bind:isPanelOpen />
</div>

<!-- Main Content -->
<div class="flex-1 overflow-auto">
	<div class="container mx-auto px-4 py-8">
		<div class="mb-8">
			<a href="/" class="text-vsc-light-accent-blue dark:text-vsc-accent-blue hover:underline">&larr; Back to Home</a>
		</div>
		
		<header class="mb-8">
			<h1 class="text-3xl font-bold mb-4 text-vsc-light-text-primary dark:text-vsc-text-primary">Codebase Browser</h1>
			<p class="text-vsc-light-text-secondary dark:text-vsc-text-secondary">Navigate through your repository structure</p>
		</header>

		<div class="bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg p-6">
			<h2 class="text-xl font-semibold mb-4 text-vsc-light-text-primary dark:text-vsc-text-primary">Code File Explorer</h2>
			
			<div class="grid gap-4">
				<button 
					on:click={() => goto('/browser/scripts')}
					class="text-left bg-vsc-light-bg-light dark:bg-vsc-bg-light border border-vsc-light-border dark:border-vsc-border-light rounded p-4 hover:bg-vsc-light-bg-medium dark:hover:bg-vsc-bg-dark transition-colors transform hover:scale-[1.02] hover:shadow-lg"
				>
					<div class="flex items-center gap-2 mb-2">
						<span class="text-xl">📁</span>
						<span class="font-semibold text-vsc-light-text-primary dark:text-vsc-text-primary">scripts/</span>
					</div>
					<p class="text-vsc-light-text-secondary dark:text-vsc-text-secondary text-sm">Browse Python scripts and projects</p>
				</button>
			</div>
		</div>
	</div>
</div>