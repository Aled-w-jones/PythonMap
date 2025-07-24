<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import hljs from 'highlight.js/lib/core';
	import python from 'highlight.js/lib/languages/python';
	import javascript from 'highlight.js/lib/languages/javascript';
	import json from 'highlight.js/lib/languages/json';
	import markdown from 'highlight.js/lib/languages/markdown';
	import BrowserSearchPanel from '$lib/components/BrowserSearchPanel.svelte';
	
	export let data;
	
	let codeElement;
	let directoryMinimized = false;
	let splitContainer;
	let isResizing = false;
	let leftPanelWidth = 50; // Percentage
	let isPanelOpen = true;
	
	// Check if this file has README.md for split view
	$: isFileWithReadme = data.type === 'file' && 
		data.readmeContent;
	
	// Debug logging
	$: console.log('File data:', {
		type: data.type,
		name: data.name,
		hasReadmeContent: !!data.readmeContent,
		isFileWithReadme,
		readmeContentLength: data.readmeContent?.length
	});
		
	// Check if this is a README.md file specifically (for different rendering)
	$: isReadmeFile = data.type === 'file' && data.name.toLowerCase() === 'readme.md';
	
	// Register languages
	hljs.registerLanguage('python', python);
	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('json', json);
	hljs.registerLanguage('markdown', markdown);
	
	onMount(() => {
		// Load panel state from localStorage
		if (browser) {
			const savedState = localStorage.getItem('browserSearchPanelOpen');
			if (savedState !== null) {
				isPanelOpen = JSON.parse(savedState);
			}
		}
		
		// Use a short delay to ensure the element is fully rendered
		setTimeout(() => {
			if (codeElement && data.type === 'file') {
				hljs.highlightElement(codeElement);
			}
		}, 0);
	});
	
	// Also highlight when data changes (for client-side navigation)
	$: if (codeElement && data.type === 'file') {
		setTimeout(() => {
			hljs.highlightElement(codeElement);
		}, 0);
	}

	function getFileIcon(item) {
		if (item.type === 'directory') return '📁';
		
		switch (item.extension) {
			case 'py': return '🐍';
			case 'js': return '📜';
			case 'json': return '📋';
			case 'md': return '📝';
			case 'csv': return '📊';
			case 'txt': return '📄';
			default: return '📄';
		}
	}

	function getLanguageClass(extension) {
		switch (extension) {
			case 'py': return 'language-python';
			case 'js': return 'language-javascript';
			case 'json': return 'language-json';
			case 'md': return 'language-markdown';
			default: return 'language-text';
		}
	}

	function formatFileSize(bytes) {
		if (!bytes) return '';
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
	}

	function copyToClipboard() {
		if (data.type === 'file') {
			navigator.clipboard.writeText(data.content).then(() => {
				alert('Content copied to clipboard!');
			});
		}
	}
	
	function toggleDirectoryMinimize() {
		directoryMinimized = !directoryMinimized;
	}
	
	function startResize(e) {
		if (!isFileWithReadme || directoryMinimized) return;
		isResizing = true;
		document.addEventListener('mousemove', handleResize);
		document.addEventListener('mouseup', stopResize);
		e.preventDefault();
	}
	
	function handleResize(e) {
		if (!isResizing || !splitContainer) return;
		
		const containerRect = splitContainer.getBoundingClientRect();
		const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
		
		// Constrain between 20% and 80%
		leftPanelWidth = Math.max(20, Math.min(80, newLeftWidth));
	}
	
	function stopResize() {
		isResizing = false;
		document.removeEventListener('mousemove', handleResize);
		document.removeEventListener('mouseup', stopResize);
	}
</script>

<svelte:head>
	<title>Browser: {data.path} - PythonMap</title>
</svelte:head>

<!-- Search Panel -->
<div class="{isPanelOpen ? 'w-80' : 'w-12'} flex-shrink-0 transition-all duration-300">
	<BrowserSearchPanel bind:isPanelOpen />
</div>

<!-- Main Content -->
<div class="flex-1 overflow-auto">
	<div class="container mx-auto px-4 py-8">
		<!-- Navigation -->
		<div class="mb-8">
			<a href="/browser" class="text-vsc-light-accent-blue dark:text-vsc-accent-blue hover:underline">&larr; Back to Browser</a>
		</div>
		
		<!-- Breadcrumbs -->
		{#if data.breadcrumbs.length > 0}
			<nav class="mb-6">
				<div class="flex items-center space-x-2 text-vsc-light-text-secondary dark:text-vsc-text-secondary">
					<a href="/browser" class="hover:text-vsc-light-accent-blue dark:hover:text-vsc-accent-blue">/</a>
					{#each data.breadcrumbs as crumb, index}
						<span>/</span>
						<a 
							href="/browser/{data.breadcrumbs.slice(0, index + 1).join('/')}"
							class="hover:text-vsc-light-accent-blue dark:hover:text-vsc-accent-blue"
						>
							{crumb}
						</a>
					{/each}
				</div>
			</nav>
		{/if}

		{#if data.type === 'directory'}
			<!-- Directory View -->
			<header class="mb-8">
				<h1 class="text-3xl font-bold mb-4 text-vsc-light-text-primary dark:text-vsc-text-primary">
					📁 {data.path === '.' ? 'Root Directory' : data.path}
				</h1>
			</header>

			<!-- README Content -->
			{#if data.readmeContent}
				<div class="bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg p-6 mb-8">
					<div class="prose prose-invert max-w-none">
						{@html data.readmeContent}
					</div>
				</div>
			{/if}

			<!-- Directory Listing -->
			<div class="bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg">
				<div class="bg-vsc-light-bg-light dark:bg-vsc-bg-light px-4 py-2 border-b border-vsc-light-border dark:border-vsc-border-light">
					<span class="text-vsc-light-text-secondary dark:text-vsc-text-secondary text-sm">Files and Directories</span>
				</div>
				
				{#if data.items.length === 0}
					<div class="p-8 text-center text-vsc-light-text-secondary dark:text-vsc-text-secondary">
						This directory is empty.
					</div>
				{:else}
					<div class="divide-y divide-vsc-light-border dark:divide-vsc-border-light">
						{#each data.items as item, index}
							<div class="folder-item px-4 py-3 hover:bg-vsc-light-bg-light dark:hover:bg-vsc-bg-light transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:translate-x-2" 
								style="animation-delay: {index * 100}ms">
								<div class="flex items-center justify-between">
									<div class="flex items-center space-x-3">
										<span class="text-xl transition-transform duration-300 hover:scale-125 hover:rotate-12">
											{getFileIcon(item)}
										</span>
										<div class="transform transition-transform duration-300 hover:translate-x-1">
											<a 
												href="/browser/{item.path}"
												class="text-vsc-light-text-primary dark:text-vsc-text-primary hover:text-vsc-light-accent-blue dark:hover:text-vsc-accent-blue font-medium transition-colors duration-200"
											>
												{item.name}
											</a>
											{#if item.type === 'file' && item.extension}
												<span class="text-vsc-light-text-secondary dark:text-vsc-text-secondary text-sm ml-2 opacity-70 hover:opacity-100 transition-opacity">
													.{item.extension}
												</span>
											{/if}
										</div>
									</div>
									
									{#if item.size}
										<span class="text-vsc-light-text-secondary dark:text-vsc-text-secondary text-sm opacity-60 group-hover:opacity-100 transition-opacity">
											{formatFileSize(item.size)}
										</span>
									{/if}
								</div>
								
								<!-- Hover underline effect -->
								<div class="h-0.5 bg-gradient-to-r from-vsc-accent-blue to-transparent scale-x-0 hover:scale-x-100 transition-transform duration-300 origin-left mt-1"></div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

		{:else if data.type === 'file'}
			<!-- File View -->
			<header class="mb-8">
				<h1 class="text-3xl font-bold mb-4 text-vsc-light-text-primary dark:text-vsc-text-primary">
					{getFileIcon({ extension: data.extension })} {data.name}
				</h1>
				
				<div class="flex flex-wrap gap-3">
					<button 
						on:click={copyToClipboard}
						class="bg-vsc-light-accent-blue dark:bg-vsc-accent-blue text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
					>
						📋 Copy Content
					</button>
					
					{#if isFileWithReadme}
						<button 
							on:click={toggleDirectoryMinimize}
							class="bg-vsc-light-bg-light dark:bg-vsc-bg-light text-vsc-light-text-primary dark:text-vsc-text-primary px-4 py-2 rounded hover:bg-vsc-light-bg-medium dark:hover:bg-vsc-bg-dark transition-colors border border-vsc-light-border dark:border-vsc-border-light"
						>
							{directoryMinimized ? '📂 Show' : '📁 Hide'} Documentation
						</button>
					{/if}
				</div>
			</header>

			{#if isFileWithReadme}
				<!-- Split View Layout for code files with README.md context -->
				<div bind:this={splitContainer} class="flex flex-col lg:flex-row h-[calc(100vh-16rem)] {isResizing ? 'select-none' : ''}">
					<!-- Code File Panel -->
					<div 
						class="bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg overflow-hidden flex flex-col transition-all duration-300"
						style="width: {directoryMinimized ? '100%' : `${leftPanelWidth}%`}"
					>
						<div class="bg-vsc-light-bg-light dark:bg-vsc-bg-light px-4 py-2 border-b border-vsc-light-border dark:border-vsc-border-light flex-shrink-0">
							<span class="text-vsc-light-text-secondary dark:text-vsc-text-secondary text-sm">{getFileIcon({ extension: data.extension })} {data.path}</span>
						</div>
						<div class="flex-1 overflow-auto">
							<pre class="!bg-vsc-light-bg-medium dark:!bg-vsc-bg-medium !border-0 !rounded-none m-0 h-full"><code 
								bind:this={codeElement}
								class="{getLanguageClass(data.extension)} block p-4 text-sm leading-relaxed"
							>{data.content}</code></pre>
						</div>
					</div>

					<!-- Resizer Bar -->
					{#if !directoryMinimized}
						<div 
							class="w-1 bg-vsc-light-border dark:bg-vsc-border-light hover:bg-vsc-light-accent-blue dark:hover:bg-vsc-accent-blue cursor-col-resize transition-colors flex-shrink-0"
							on:mousedown={startResize}
							role="separator"
							tabindex="0"
							title="Drag to resize panels"
						></div>
					{/if}

					<!-- README Documentation Panel -->
					<div 
						class="bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg overflow-hidden flex flex-col transition-all duration-300"
						style="width: {directoryMinimized ? '48px' : `${100 - leftPanelWidth}%`}"
					>
						<div class="bg-vsc-light-bg-light dark:bg-vsc-bg-light px-4 py-2 border-b border-vsc-light-border dark:border-vsc-border-light flex-shrink-0 flex items-center justify-between">
							{#if !directoryMinimized}
								<span class="text-vsc-light-text-secondary dark:text-vsc-text-secondary text-sm">📖 README.md</span>
								<button 
									on:click={toggleDirectoryMinimize}
									class="text-vsc-light-text-secondary dark:text-vsc-text-secondary hover:text-vsc-light-text-primary dark:hover:text-vsc-text-primary transition-colors text-sm"
									title="Minimize panel"
								>
									⏸️
								</button>
							{:else}
								<button 
									on:click={toggleDirectoryMinimize}
									class="text-vsc-light-text-secondary dark:text-vsc-text-secondary hover:text-vsc-light-text-primary dark:hover:text-vsc-text-primary transition-colors text-sm rotate-90 mx-auto"
									title="Expand panel"
								>
									📖
								</button>
							{/if}
						</div>
						{#if !directoryMinimized}
							<div class="flex-1 overflow-auto">
								<div class="p-4">
									<div class="prose prose-invert max-w-none">
										{@html data.readmeContent}
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{:else}
				<!-- Standard Single File View -->
				<div class="bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg overflow-hidden">
					<div class="bg-vsc-light-bg-light dark:bg-vsc-bg-light px-4 py-2 border-b border-vsc-light-border dark:border-vsc-border-light">
						<span class="text-vsc-light-text-secondary dark:text-vsc-text-secondary text-sm">{data.path}</span>
					</div>
					<pre class="!bg-vsc-light-bg-medium dark:!bg-vsc-bg-medium !border-0 !rounded-none m-0"><code 
						bind:this={codeElement}
						class="{getLanguageClass(data.extension)} block p-4 overflow-x-auto text-sm"
					>{data.content}</code></pre>
				</div>
			{/if}
	{/if}
	</div>
</div>

<style>
	/* Custom styles for README content */
	:global(.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6) {
		font-weight: bold;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
	}
	
	:global(.dark .prose h1, .dark .prose h2, .dark .prose h3, .dark .prose h4, .dark .prose h5, .dark .prose h6) {
		color: theme('colors.vsc-text-primary');
	}
	
	:global(html:not(.dark) .prose h1, html:not(.dark) .prose h2, html:not(.dark) .prose h3, html:not(.dark) .prose h4, html:not(.dark) .prose h5, html:not(.dark) .prose h6) {
		color: theme('colors.vsc-light-text-primary');
	}
	
	:global(.prose p) {
		line-height: 1.6;
		margin-bottom: 1rem;
	}
	
	:global(.dark .prose p) {
		color: theme('colors.vsc-text-secondary');
	}
	
	:global(html:not(.dark) .prose p) {
		color: theme('colors.vsc-light-text-secondary');
	}
	
	:global(.prose code) {
		padding: 0.2rem 0.4rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
	}
	
	:global(.dark .prose code) {
		background-color: theme('colors.vsc-bg-light');
		color: theme('colors.vsc-text-primary');
	}
	
	:global(html:not(.dark) .prose code) {
		background-color: theme('colors.vsc-light-bg-light');
		color: theme('colors.vsc-light-text-primary');
	}
	
	:global(.prose pre) {
		border-radius: 0.5rem;
		padding: 1rem;
		overflow-x: auto;
		margin: 1rem 0;
	}
	
	:global(.dark .prose pre) {
		background-color: theme('colors.vsc-bg-light') !important;
		border: 1px solid theme('colors.vsc-border-light');
	}
	
	:global(html:not(.dark) .prose pre) {
		background-color: theme('colors.vsc-light-bg-light') !important;
		border: 1px solid theme('colors.vsc-light-border');
	}
	
	:global(.prose ul, .prose ol) {
		margin-left: 1.5rem;
		margin-bottom: 1rem;
	}
	
	:global(.dark .prose ul, .dark .prose ol) {
		color: theme('colors.vsc-text-secondary');
	}
	
	:global(html:not(.dark) .prose ul, html:not(.dark) .prose ol) {
		color: theme('colors.vsc-light-text-secondary');
	}
	
	:global(.prose a) {
		text-decoration: underline;
	}
	
	:global(.dark .prose a) {
		color: theme('colors.vsc-accent-blue');
	}
	
	:global(html:not(.dark) .prose a) {
		color: theme('colors.vsc-light-accent-blue');
	}
	
	:global(.prose a:hover) {
		text-decoration: none;
	}
	
	/* Folder navigation animations */
	.folder-item {
		opacity: 0;
		transform: translateX(-20px);
		animation: slideInLeft 0.6s ease-out forwards;
	}
	
	@keyframes slideInLeft {
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
	
	/* Breadcrumb animations */
	nav a {
		transition: all 0.3s ease;
		position: relative;
	}
	
	nav a:hover {
		transform: translateY(-2px);
		text-shadow: 0 2px 4px rgba(0, 123, 204, 0.3);
	}
	
	nav a::after {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 0;
		width: 0;
		height: 2px;
		background: linear-gradient(to right, theme('colors.vsc-accent-blue'), transparent);
		transition: width 0.3s ease;
	}
	
	nav a:hover::after {
		width: 100%;
	}
</style>