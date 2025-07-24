<script>
	import '../app.css';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	
	// Determine search display mode based on current route
	$: isHomePage = $page.url.pathname === base + '/' || $page.url.pathname === base;
	$: isNotepadPage = $page.url.pathname.startsWith(base + '/notepads');
	$: isBrowserPage = $page.url.pathname.startsWith(base + '/browser');
</script>

<div class="min-h-screen bg-vsc-light-bg-dark dark:bg-vsc-bg-dark text-vsc-light-text-primary dark:text-vsc-text-primary">
	<!-- Global Header -->
	<header class="bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border-b border-vsc-light-border dark:border-vsc-border-light sticky top-0 z-30">
		<div class="container mx-auto px-4 py-3 lg:py-4">
			<div class="text-center mb-3 lg:mb-4">
				<a href="{base}/" class="inline-block">
					<h1 class="text-2xl lg:text-3xl font-bold text-vsc-accent-blue hover:text-blue-400 transition-colors">
						PythonMap
					</h1>
				</a>
				<p class="text-xs lg:text-sm text-vsc-text-secondary mt-1">
					A notepad viewer and codebase browser for Python scripts
				</p>
			</div>
			
			<!-- Contextual Search Bar -->
			{#if isHomePage}
				<!-- Full search for home page -->
				<SearchBar mode="full" />
			{:else if isNotepadPage}
				<!-- Collapsed/optional search for notepad pages -->
				<SearchBar mode="collapsed" />
			{/if}
			<!-- Browser pages will have search in left panel, not header -->
		</div>
	</header>

	<!-- Theme Toggle Button -->
	<ThemeToggle />
	
	<!-- Main Content -->
	<main class="flex {isBrowserPage ? 'h-[calc(100vh-7rem)] lg:h-[calc(100vh-8rem)]' : ''}">
		<slot />
	</main>
</div>