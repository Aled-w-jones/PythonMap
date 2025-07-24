<script>
	import { onMount } from 'svelte';
	import hljs from 'highlight.js/lib/core';
	import python from 'highlight.js/lib/languages/python';
	
	export let data;
	
	let codeElement;
	let showReadme = !!data.readmeContent;
	let readmeCollapsed = false;
	let readmeMinimized = false;
	let splitContainer;
	let isResizing = false;
	let leftPanelWidth = 50; // Percentage
	let pageLoaded = false;
	
	// Register Python language
	hljs.registerLanguage('python', python);
	
	onMount(() => {
		// Add entrance animation delay
		setTimeout(() => {
			pageLoaded = true;
			if (codeElement) {
				hljs.highlightElement(codeElement);
			}
		}, 100);
	});

	function copyToClipboard() {
		navigator.clipboard.writeText(data.content).then(() => {
			alert('Code copied to clipboard!');
		});
	}
	
	function toggleReadme() {
		showReadme = !showReadme;
	}
	
	function toggleReadmeCollapse() {
		readmeCollapsed = !readmeCollapsed;
	}
	
	function toggleReadmeMinimize() {
		readmeMinimized = !readmeMinimized;
	}
	
	function startResize(e) {
		if (!showReadme || readmeMinimized) return;
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
	<title>{data.notepad.title} - PythonMap</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-none page-container" class:loaded={pageLoaded}>
	<div class="mb-6">
		<a href="/notepads" class="text-vsc-light-accent-blue dark:text-vsc-accent-blue hover:underline">&larr; Back to Notepads</a>
	</div>
	
	<!-- Header Section -->
	<header class="mb-6">
		<h1 class="text-3xl font-bold mb-4 text-vsc-light-text-primary dark:text-vsc-text-primary">{data.notepad.title}</h1>
		<p class="text-vsc-light-text-secondary dark:text-vsc-text-secondary mb-4">{data.notepad.description}</p>
		
		<div class="flex flex-wrap gap-2 mb-4">
			{#each data.notepad.tags as tag}
				<span class="bg-vsc-light-bg-light dark:bg-vsc-bg-light text-vsc-light-text-secondary dark:text-vsc-text-secondary px-2 py-1 rounded text-sm">
					{tag}
				</span>
			{/each}
		</div>
		
		<div class="flex flex-wrap gap-4 text-sm text-vsc-light-text-secondary dark:text-vsc-text-secondary mb-4">
			<span>File: {data.notepad.filePath}</span>
			<span>Dependencies: {data.notepad.dependencies.join(', ')}</span>
			<span>Updated: {new Date(data.notepad.lastUpdated).toLocaleDateString()}</span>
		</div>
		
		<!-- Action Buttons -->
		<div class="flex flex-wrap gap-3">
			<button 
				on:click={copyToClipboard}
				class="bg-vsc-light-accent-blue dark:bg-vsc-accent-blue text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
			>
				📋 Copy Code
			</button>
			
			{#if data.readmeContent}
				<button 
					on:click={toggleReadme}
					class="bg-vsc-light-bg-light dark:bg-vsc-bg-light text-vsc-light-text-primary dark:text-vsc-text-primary px-4 py-2 rounded hover:bg-vsc-light-bg-medium dark:hover:bg-vsc-bg-dark transition-colors border border-vsc-light-border dark:border-vsc-border-light"
				>
					{showReadme ? '👁️ Hide' : '📖 Show'} Documentation
				</button>
			{/if}
		</div>
	</header>

	<!-- Split View Layout -->
	<div bind:this={splitContainer} class="split-view flex flex-col lg:flex-row h-[calc(100vh-16rem)] {isResizing ? 'select-none' : ''}">
		<!-- Code Panel -->
		<div 
			class="bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg overflow-hidden flex flex-col transition-all duration-300"
			style="width: {showReadme && data.readmeContent && !readmeMinimized ? `${leftPanelWidth}%` : '100%'}"
		>
			<div class="bg-vsc-light-bg-light dark:bg-vsc-bg-light px-4 py-2 border-b border-vsc-light-border dark:border-vsc-border-light flex-shrink-0">
				<span class="text-vsc-light-text-secondary dark:text-vsc-text-secondary text-sm">🐍 {data.notepad.filePath}</span>
			</div>
			<div class="flex-1 overflow-auto">
				<pre class="!bg-vsc-light-bg-medium dark:!bg-vsc-bg-medium !border-0 !rounded-none m-0 h-full"><code 
					bind:this={codeElement}
					class="language-python block p-4 text-sm leading-relaxed"
				>{data.content}</code></pre>
			</div>
		</div>

		<!-- Resizer Bar -->
		{#if showReadme && data.readmeContent && !readmeMinimized}
			<div 
				class="w-1 bg-vsc-light-border dark:bg-vsc-border-light hover:bg-vsc-light-accent-blue dark:hover:bg-vsc-accent-blue cursor-col-resize transition-colors flex-shrink-0"
				on:mousedown={startResize}
				role="separator"
				tabindex="0"
				title="Drag to resize panels"
			></div>
		{/if}

		<!-- README Panel (conditionally shown) -->
		{#if showReadme && data.readmeContent}
			<div 
				class="bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg overflow-hidden flex flex-col transition-all duration-300"
				style="width: {readmeMinimized ? '48px' : `${100 - leftPanelWidth}%`}"
			>
				<div class="bg-vsc-light-bg-light dark:bg-vsc-bg-light px-4 py-2 border-b border-vsc-light-border dark:border-vsc-border-light flex-shrink-0 flex items-center justify-between">
					{#if !readmeMinimized}
						<span class="text-vsc-light-text-secondary dark:text-vsc-text-secondary text-sm">📖 Documentation</span>
						<div class="flex items-center gap-2">
							<button 
								on:click={toggleReadmeCollapse}
								class="text-vsc-light-text-secondary dark:text-vsc-text-secondary hover:text-vsc-light-text-primary dark:hover:text-vsc-text-primary transition-colors text-sm"
								title={readmeCollapsed ? 'Expand content' : 'Collapse content'}
							>
								{readmeCollapsed ? '📄' : '📋'}
							</button>
							<button 
								on:click={toggleReadmeMinimize}
								class="text-vsc-light-text-secondary dark:text-vsc-text-secondary hover:text-vsc-light-text-primary dark:hover:text-vsc-text-primary transition-colors text-sm"
								title="Minimize panel"
							>
								⏸️
							</button>
						</div>
					{:else}
						<button 
							on:click={toggleReadmeMinimize}
							class="text-vsc-light-text-secondary dark:text-vsc-text-secondary hover:text-vsc-light-text-primary dark:hover:text-vsc-text-primary transition-colors text-sm rotate-90 mx-auto"
							title="Expand panel"
						>
							📖
						</button>
					{/if}
				</div>
				{#if !readmeMinimized}
					<div class="flex-1 overflow-auto">
						{#if !readmeCollapsed}
							<div class="p-4 prose prose-invert max-w-none">
								{@html data.readmeContent}
							</div>
						{:else}
							<div class="p-4 text-center text-vsc-light-text-secondary dark:text-vsc-text-secondary">
								<p>Documentation collapsed. Click "📄" to expand.</p>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Enhanced prose styles for README content */
	:global(.prose h1) {
		color: theme('colors.vsc-light-text-primary');
		font-size: 1.875rem;
		font-weight: bold;
		margin-top: 2rem;
		margin-bottom: 1rem;
		border-bottom: 2px solid theme('colors.vsc-light-border');
		padding-bottom: 0.5rem;
	}
	
	:global(.dark .prose h1) {
		color: theme('colors.vsc-text-primary');
		border-bottom-color: theme('colors.vsc-border-light');
	}
	
	:global(.prose h2) {
		color: theme('colors.vsc-light-text-primary');
		font-size: 1.5rem;
		font-weight: bold;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		border-bottom: 1px solid theme('colors.vsc-light-border');
		padding-bottom: 0.25rem;
	}
	
	:global(.dark .prose h2) {
		color: theme('colors.vsc-text-primary');
		border-bottom-color: theme('colors.vsc-border-light');
	}
	
	:global(.prose h3, .prose h4, .prose h5, .prose h6) {
		color: theme('colors.vsc-light-text-primary');
		font-weight: bold;
		margin-top: 1.25rem;
		margin-bottom: 0.5rem;
	}
	
	:global(.dark .prose h3, .dark .prose h4, .dark .prose h5, .dark .prose h6) {
		color: theme('colors.vsc-text-primary');
	}
	
	:global(.prose p) {
		color: theme('colors.vsc-light-text-secondary');
		line-height: 1.7;
		margin-bottom: 1rem;
	}
	
	:global(.dark .prose p) {
		color: theme('colors.vsc-text-secondary');
	}
	
	:global(.prose code) {
		background-color: theme('colors.vsc-light-bg-light');
		color: theme('colors.vsc-light-keyword');
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
	}
	
	:global(.dark .prose code) {
		background-color: theme('colors.vsc-bg-light');
		color: theme('colors.vsc-keyword');
	}
	
	:global(.prose pre) {
		background-color: theme('colors.vsc-light-bg-light') !important;
		border: 1px solid theme('colors.vsc-light-border');
		border-radius: 0.5rem;
		padding: 1rem;
		overflow-x: auto;
		margin: 1rem 0;
	}
	
	:global(.dark .prose pre) {
		background-color: theme('colors.vsc-bg-light') !important;
		border-color: theme('colors.vsc-border-light');
	}
	
	:global(.prose pre code) {
		background-color: transparent !important;
		padding: 0;
		border-radius: 0;
		color: theme('colors.vsc-light-text-primary');
	}
	
	:global(.dark .prose pre code) {
		color: theme('colors.vsc-text-primary');
	}
	
	:global(.prose ul, .prose ol) {
		color: theme('colors.vsc-light-text-secondary');
		margin-left: 1.5rem;
		margin-bottom: 1rem;
	}
	
	:global(.dark .prose ul, .dark .prose ol) {
		color: theme('colors.vsc-text-secondary');
	}
	
	:global(.prose li) {
		margin-bottom: 0.5rem;
	}
	
	:global(.prose a) {
		color: theme('colors.vsc-light-accent-blue');
		text-decoration: underline;
	}
	
	:global(.dark .prose a) {
		color: theme('colors.vsc-accent-blue');
	}
	
	:global(.prose a:hover) {
		text-decoration: none;
	}
	
	:global(.prose blockquote) {
		border-left: 4px solid theme('colors.vsc-light-accent-blue');
		padding-left: 1rem;
		margin: 1rem 0;
		font-style: italic;
		color: theme('colors.vsc-light-text-secondary');
	}
	
	:global(.dark .prose blockquote) {
		border-left-color: theme('colors.vsc-accent-blue');
		color: theme('colors.vsc-text-secondary');
	}
	
	:global(.prose table) {
		border-collapse: collapse;
		width: 100%;
		margin: 1rem 0;
	}
	
	:global(.prose th, .prose td) {
		border: 1px solid theme('colors.vsc-light-border');
		padding: 0.5rem;
		text-align: left;
	}
	
	:global(.dark .prose th, .dark .prose td) {
		border-color: theme('colors.vsc-border-light');
	}
	
	:global(.prose th) {
		background-color: theme('colors.vsc-light-bg-light');
		color: theme('colors.vsc-light-text-primary');
		font-weight: bold;
	}
	
	:global(.dark .prose th) {
		background-color: theme('colors.vsc-bg-light');
		color: theme('colors.vsc-text-primary');
	}
	
	:global(.prose td) {
		color: theme('colors.vsc-light-text-secondary');
	}
	
	:global(.dark .prose td) {
		color: theme('colors.vsc-text-secondary');
	}
	
	/* Emoji styling */
	:global(.prose p:has(> code:first-child)) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	/* Page entrance animations */
	.page-container {
		opacity: 0;
		transform: translateY(30px) scale(0.95);
		transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
	}
	
	.page-container.loaded {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
	
	/* Stagger animation for child elements */
	.page-container.loaded .mb-6 {
		animation: slideInFromLeft 0.6s ease-out 0.2s both;
	}
	
	.page-container.loaded header {
		animation: slideInFromLeft 0.6s ease-out 0.4s both;
	}
	
	.page-container.loaded .split-view,
	.page-container.loaded > div:last-child {
		animation: slideInFromBottom 0.8s ease-out 0.6s both;
	}
	
	@keyframes slideInFromLeft {
		from {
			opacity: 0;
			transform: translateX(-50px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
	
	@keyframes slideInFromBottom {
		from {
			opacity: 0;
			transform: translateY(50px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	/* Code highlighting animation */
	pre code {
		opacity: 0;
		animation: fadeInCode 1s ease-out 1s both;
	}
	
	@keyframes fadeInCode {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>