<script>
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	
	export let mode = 'full'; // 'full', 'collapsed', or 'panel'
	export let searchIndex = []; // Now passed as prop - no client-side fetching!
	
	let searchQuery = '';
	let searchResults = [];
	let isSearching = false;
	let showResults = false;
	let selectedTag = '';
	let isExpanded = false;
	
	// Extract unique tags from the embedded search index
	$: availableTags = (() => {
		const tagSet = new Set();
		searchIndex.forEach(item => {
			if (item.tags) {
				item.tags.forEach(tag => tagSet.add(tag));
			}
		});
		return Array.from(tagSet).sort();
	})();
	
	function performSearch() {
		if (!searchQuery.trim() && !selectedTag) {
			searchResults = [];
			showResults = false;
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
		}).slice(0, 20); // Limit results
		
		showResults = true;
		isSearching = false;
	}
	
	function handleSearchInput() {
		performSearch();
	}
	
	function handleTagChange() {
		performSearch();
	}
	
	function navigateToResult(result) {
		showResults = false;
		searchQuery = '';
		goto(base + result.url);
	}
	
	function clearSearch() {
		searchQuery = '';
		selectedTag = '';
		searchResults = [];
		showResults = false;
	}
	
	function toggleExpanded() {
		isExpanded = !isExpanded;
		if (!isExpanded) {
			showResults = false;
		}
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
	
	function truncateContent(content, maxLength = 150) {
		if (content.length <= maxLength) return content;
		return content.substring(0, maxLength) + '...';
	}
</script>

{#if mode === 'collapsed'}
	<!-- Collapsed Search for Notepad Pages -->
	<div class="w-full max-w-2xl mx-auto relative">
		{#if !isExpanded}
			<!-- Collapsed State -->
			<button 
				on:click={toggleExpanded}
				class="w-full bg-vsc-light-bg-light dark:bg-vsc-bg-light border border-vsc-light-border dark:border-vsc-border-light rounded-lg px-4 py-2 text-vsc-light-text-secondary dark:text-vsc-text-secondary hover:bg-vsc-light-bg-medium dark:hover:bg-vsc-bg-medium transition-colors flex items-center justify-center gap-2"
			>
				<span class="text-sm">🔍 Search</span>
				<span class="text-xs">Click to expand</span>
			</button>
		{:else}
			<!-- Expanded State -->
			<div class="bg-vsc-light-bg-light dark:bg-vsc-bg-light border border-vsc-light-border dark:border-vsc-border-light rounded-lg p-4">
				<div class="flex items-center gap-2 mb-3">
					<span class="text-sm font-medium text-vsc-light-text-primary dark:text-vsc-text-primary">🔍 Search</span>
					<button 
						on:click={toggleExpanded}
						class="ml-auto text-vsc-light-text-secondary dark:text-vsc-text-secondary hover:text-vsc-light-text-primary dark:hover:text-vsc-text-primary text-sm"
					>
						✕
					</button>
				</div>
				
				<div class="flex flex-col sm:flex-row gap-3">
					<div class="flex-1 relative">
						<input
							type="text"
							bind:value={searchQuery}
							on:input={handleSearchInput}
							placeholder="Search..."
							class="w-full bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded px-3 py-2 text-sm text-vsc-light-text-primary dark:text-vsc-text-primary placeholder-vsc-light-text-secondary dark:placeholder-vsc-text-secondary focus:outline-none focus:border-vsc-light-accent-blue dark:focus:border-vsc-accent-blue"
						/>
					</div>
					<div class="sm:w-32">
						<select
							bind:value={selectedTag}
							on:change={handleTagChange}
							class="w-full bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded px-3 py-2 text-sm text-vsc-light-text-primary dark:text-vsc-text-primary focus:outline-none focus:border-vsc-light-accent-blue dark:focus:border-vsc-accent-blue"
						>
							<option value="">All Tags</option>
							{#each availableTags as tag}
								<option value={tag}>{tag}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<!-- Full Search (Home Page) -->
	<div class="w-full max-w-4xl mx-auto relative">
		<!-- Search Controls -->
		<div class="flex flex-col md:flex-row gap-4 mb-4">
			<!-- Search Input -->
			<div class="flex-1 relative">
				<div class="relative">
					<input
						type="text"
						bind:value={searchQuery}
						on:input={handleSearchInput}
						placeholder="Search scripts, files, and content..."
						class="w-full bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg px-4 py-3 pl-10 text-vsc-light-text-primary dark:text-vsc-text-primary placeholder-vsc-light-text-secondary dark:placeholder-vsc-text-secondary focus:outline-none focus:border-vsc-light-accent-blue dark:focus:border-vsc-accent-blue focus:ring-1 focus:ring-vsc-light-accent-blue dark:focus:ring-vsc-accent-blue"
					/>
					<div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-vsc-light-text-secondary dark:text-vsc-text-secondary">
						🔍
					</div>
					{#if searchQuery}
						<button
							on:click={clearSearch}
							class="absolute right-3 top-1/2 transform -translate-y-1/2 text-vsc-light-text-secondary dark:text-vsc-text-secondary hover:text-vsc-light-text-primary dark:hover:text-vsc-text-primary"
						>
							✕
						</button>
					{/if}
				</div>
			</div>
			
			<!-- Tag Filter -->
			<div class="md:w-64">
				<select
					bind:value={selectedTag}
					on:change={handleTagChange}
					class="w-full bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg px-4 py-3 text-vsc-light-text-primary dark:text-vsc-text-primary focus:outline-none focus:border-vsc-light-accent-blue dark:focus:border-vsc-accent-blue focus:ring-1 focus:ring-vsc-light-accent-blue dark:focus:ring-vsc-accent-blue"
				>
					<option value="">All Tags</option>
					{#each availableTags as tag}
						<option value={tag}>{tag}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>
{/if}

<!-- Search Results -->
{#if showResults && (mode !== 'collapsed' || isExpanded)}
		<div class="absolute top-full left-0 right-0 z-50 bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg shadow-xl max-h-96 overflow-y-auto">
			{#if isSearching}
				<div class="p-4 text-center text-vsc-light-text-secondary dark:text-vsc-text-secondary">
					Searching...
				</div>
			{:else if searchResults.length === 0}
				<div class="p-4 text-center text-vsc-light-text-secondary dark:text-vsc-text-secondary">
					No results found for "{searchQuery}"
					{#if selectedTag}
						in tag "{selectedTag}"
					{/if}
				</div>
			{:else}
				<div class="p-2">
					<div class="text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary p-2 border-b border-vsc-light-border dark:border-vsc-border-light">
						{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
					</div>
					
					{#each searchResults as result}
						<button
							on:click={() => navigateToResult(result)}
							class="w-full text-left p-3 hover:bg-vsc-light-bg-light dark:hover:bg-vsc-bg-light transition-colors border-b border-vsc-light-border dark:border-vsc-border-light last:border-b-0"
						>
							<div class="flex items-start gap-3">
								<span class="text-lg mt-0.5">{getResultIcon(result.type)}</span>
								<div class="flex-1 min-w-0">
									<div class="font-medium text-vsc-light-text-primary dark:text-vsc-text-primary mb-1">
										{@html highlightMatch(result.title, searchQuery)}
									</div>
									<div class="text-sm text-vsc-light-text-secondary dark:text-vsc-text-secondary mb-2">
										{@html highlightMatch(result.description, searchQuery)}
									</div>
									{#if searchQuery && result.content.toLowerCase().includes(searchQuery.toLowerCase())}
										<div class="text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary bg-vsc-light-bg-light dark:bg-vsc-bg-dark p-2 rounded font-mono">
											{@html highlightMatch(truncateContent(result.content), searchQuery)}
										</div>
									{/if}
									{#if result.tags}
										<div class="flex flex-wrap gap-1 mt-2">
											{#each result.tags as tag}
												<span class="text-xs bg-vsc-light-bg-light dark:bg-vsc-bg-dark text-vsc-light-text-secondary dark:text-vsc-text-secondary px-2 py-1 rounded">
													{tag}
												</span>
											{/each}
										</div>
									{/if}
									<div class="text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary mt-1 opacity-75">
										{result.filePath}
									</div>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
{/if}

<!-- Click outside to close results -->
{#if showResults}
	<div 
		class="fixed inset-0 z-40" 
		role="button"
		tabindex="-1"
		on:click={() => showResults = false}
		on:keydown={(e) => e.key === 'Escape' && (showResults = false)}
	></div>
{/if}

<style>
	:global(mark) {
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
	}
	:global(.dark mark) {
		background-color: theme('colors.vsc-selection-bg') !important;
		color: theme('colors.vsc-text-primary') !important;
	}
	:global(html:not(.dark) mark) {
		background-color: theme('colors.vsc-light-selection-bg') !important;
		color: theme('colors.vsc-light-text-primary') !important;
	}
</style>