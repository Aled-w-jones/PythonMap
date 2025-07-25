<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	
	let searchQuery = '';
	let searchResults = [];
	let searchIndex = [];
	let isSearching = false;
	let selectedTag = '';
	let availableTags = [];
	export let isPanelOpen = false;
	
	onMount(async () => {
		// Set panel closed by default, ignore localStorage
		isPanelOpen = false;
		
		try {
			const response = await fetch(`${base}/data/search_index.json`);
			searchIndex = await response.json();
			
			// Extract unique tags
			const tagSet = new Set();
			searchIndex.forEach(item => {
				if (item.tags) {
					item.tags.forEach(tag => tagSet.add(tag));
				}
			});
			availableTags = Array.from(tagSet).sort();
		} catch (error) {
			console.error('Error loading search index:', error);
		}
	});
	
	function performSearch() {
		if (!searchQuery.trim() && !selectedTag) {
			searchResults = [];
			return;
		}
		
		isSearching = true;
		const query = searchQuery.toLowerCase().trim();
		
		searchResults = searchIndex.filter(item => {
			// Tag filter
			if (selectedTag && (!item.tags || !item.tags.includes(selectedTag))) {
				return false;
			}
			
			// Text search
			if (query) {
				return (
					item.title.toLowerCase().includes(query) ||
					item.description.toLowerCase().includes(query) ||
					(item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
				);
			}
			
			return true;
		}).slice(0, 50); // More results for panel view
		
		isSearching = false;
	}
	
	function handleSearchInput() {
		performSearch();
	}
	
	function handleTagChange() {
		performSearch();
	}
	
	function navigateToResult(result) {
		goto(base + result.url);
	}
	
	function clearSearch() {
		searchQuery = '';
		selectedTag = '';
		searchResults = [];
	}
	
	function togglePanel() {
		isPanelOpen = !isPanelOpen;
	}
	
	function getResultIcon(type) {
		switch (type) {
			case 'notepad': return '📔';
			case 'python': return '🐍';
			case 'markdown': return '📝';
			case 'readme': return '📖';
			case 'javascript': return '📜';
			default: return '📄';
		}
	}
	
	function highlightMatch(text, query) {
		if (!query.trim()) return text;
		
		const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
		return text.replace(regex, '<mark class="bg-vsc-light-selection-bg dark:bg-vsc-selection-bg text-vsc-light-text-primary dark:text-vsc-text-primary">$1</mark>');
	}
	
	function truncateContent(content, maxLength = 100) {
		if (content.length <= maxLength) return content;
		return content.substring(0, maxLength) + '...';
	}
</script>

<!-- VS Code-style Search Panel -->
<div class="h-full bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border-r border-vsc-light-border dark:border-vsc-border-light flex flex-col">
	<!-- Panel Header -->
	<div class="bg-vsc-light-bg-light dark:bg-vsc-bg-light px-3 py-2 border-b border-vsc-light-border dark:border-vsc-border-light flex items-center justify-between flex-shrink-0">
		{#if isPanelOpen}
			<div class="flex items-center gap-2">
				<span class="text-sm font-medium text-vsc-light-text-primary dark:text-vsc-text-primary">🔍</span>
				<span class="text-sm text-vsc-light-text-primary dark:text-vsc-text-primary">SEARCH</span>
			</div>
			<button 
				on:click={togglePanel}
				class="text-vsc-light-text-secondary dark:text-vsc-text-secondary hover:text-vsc-light-text-primary dark:hover:text-vsc-text-primary transition-colors"
				title="Toggle search panel"
			>
				◀
			</button>
		{:else}
			<button 
				on:click={togglePanel}
				class="text-vsc-light-text-secondary dark:text-vsc-text-secondary hover:text-vsc-light-text-primary dark:hover:text-vsc-text-primary transition-colors mx-auto"
				title="Expand search panel"
			>
				<span class="text-lg">🔍</span>
			</button>
		{/if}
	</div>

	{#if isPanelOpen}
		<!-- Search Controls -->
		<div class="p-3 border-b border-vsc-light-border dark:border-vsc-border-light flex-shrink-0">
			<!-- Search Input -->
			<div class="mb-3">
				<div class="relative">
					<input
						type="text"
						bind:value={searchQuery}
						on:input={handleSearchInput}
						placeholder="Search..."
						class="w-full bg-vsc-light-bg-light dark:bg-vsc-bg-dark border border-vsc-light-border dark:border-vsc-border-light rounded px-2 py-1 text-xs text-vsc-light-text-primary dark:text-vsc-text-primary placeholder-vsc-light-text-secondary dark:placeholder-vsc-text-secondary focus:outline-none focus:border-vsc-light-accent-blue dark:focus:border-vsc-accent-blue"
					/>
					{#if searchQuery}
						<button
							on:click={clearSearch}
							class="absolute right-2 top-1/2 transform -translate-y-1/2 text-vsc-light-text-secondary dark:text-vsc-text-secondary hover:text-vsc-light-text-primary dark:hover:text-vsc-text-primary text-xs"
						>
							✕
						</button>
					{/if}
				</div>
			</div>
			
			<!-- Tag Filter -->
			<div class="mb-3">
				<select
					bind:value={selectedTag}
					on:change={handleTagChange}
					class="w-full bg-vsc-light-bg-light dark:bg-vsc-bg-dark border border-vsc-light-border dark:border-vsc-border-light rounded px-2 py-1 text-xs text-vsc-light-text-primary dark:text-vsc-text-primary focus:outline-none focus:border-vsc-light-accent-blue dark:focus:border-vsc-accent-blue"
				>
					<option value="">All Tags</option>
					{#each availableTags as tag}
						<option value={tag}>{tag}</option>
					{/each}
				</select>
			</div>
			
			<!-- Results Counter -->
			{#if searchQuery || selectedTag}
				<div class="text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary">
					{isSearching ? 'Searching...' : `${searchResults.length} results`}
				</div>
			{/if}
		</div>

		<!-- Search Results -->
		<div class="flex-1 overflow-y-auto">
			{#if searchQuery || selectedTag}
				{#if searchResults.length === 0 && !isSearching}
					<div class="p-3 text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary text-center">
						No results found
					</div>
				{:else}
					{#each searchResults as result}
						<button
							on:click={() => navigateToResult(result)}
							class="w-full text-left p-2 hover:bg-vsc-light-bg-light dark:hover:bg-vsc-bg-light transition-colors border-b border-vsc-light-border/50 dark:border-vsc-border-light/50 last:border-b-0"
						>
							<div class="flex items-start gap-2">
								<span class="text-sm mt-0.5 flex-shrink-0">{getResultIcon(result.type)}</span>
								<div class="flex-1 min-w-0">
									<div class="text-xs font-medium text-vsc-light-text-primary dark:text-vsc-text-primary mb-1 truncate">
										{@html highlightMatch(result.title, searchQuery)}
									</div>
									<div class="text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary mb-1 line-clamp-2">
										{@html highlightMatch(truncateContent(result.description), searchQuery)}
									</div>
									{#if searchQuery && result.content.toLowerCase().includes(searchQuery.toLowerCase())}
										<div class="text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary bg-vsc-light-bg-light dark:bg-vsc-bg-dark p-1 rounded font-mono mb-1">
											{@html highlightMatch(truncateContent(result.content, 80), searchQuery)}
										</div>
									{/if}
									{#if result.tags}
										<div class="flex flex-wrap gap-1">
											{#each result.tags.slice(0, 2) as tag}
												<span class="text-xs bg-vsc-light-bg-light dark:bg-vsc-bg-dark text-vsc-light-text-secondary dark:text-vsc-text-secondary px-1 rounded">
													{tag}
												</span>
											{/each}
											{#if result.tags.length > 2}
												<span class="text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary">+{result.tags.length - 2}</span>
											{/if}
										</div>
									{/if}
									<div class="text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary mt-1 opacity-75 truncate">
										{result.filePath}
									</div>
								</div>
							</div>
						</button>
					{/each}
				{/if}
			{:else}
				<div class="p-3 text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary text-center">
					<p class="mb-2">🔍 Search your codebase</p>
					<p class="text-xs opacity-75">Enter a search term to find files, scripts, and content</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	:global(mark) {
		background-color: theme('colors.vsc-selection-bg') !important;
		color: theme('colors.vsc-text-primary') !important;
		padding: 0.125rem 0.25rem;
		border-radius: 0.125rem;
	}
	
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>