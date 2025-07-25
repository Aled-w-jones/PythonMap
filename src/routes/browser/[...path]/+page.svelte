<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import hljs from 'highlight.js/lib/core';
	import python from 'highlight.js/lib/languages/python';
	import javascript from 'highlight.js/lib/languages/javascript';
	import json from 'highlight.js/lib/languages/json';
	import markdown from 'highlight.js/lib/languages/markdown';
	import BrowserSearchPanel from '$lib/components/BrowserSearchPanel.svelte';
	
	// Client-side data loading
	let data = null;
	let loading = true;
	let error = null;
	
	let codeElement;
	let directoryMinimized = false;
	let splitContainer;
	let isResizing = false;
	let leftPanelWidth = 50; // Percentage
	let isPanelOpen = false;
	
	// Mobile-specific state
	let isMobile = false;
	let showMobileModal = false;
	let mobileModalContent = 'code'; // 'code' or 'documentation'
	
	// Check if this file has README.md for split view OR if this IS a README file that should show split view
	$: isFileWithReadme = data?.type === 'file' && 
		(data?.readmeContent || (data?.name?.toLowerCase().includes('readme') && data?.extension === 'md'));
	
	// Debug logging
	$: if (data) {
		console.log('File data:', {
			type: data.type,
			name: data.name,
			hasReadmeContent: !!data.readmeContent,
			isFileWithReadme,
			readmeContentLength: data.readmeContent?.length
		});
	}
		
	// Check if this is a README.md file specifically (for different rendering)
	$: isReadmeFile = data?.type === 'file' && data?.name?.toLowerCase() === 'readme.md';
	
	// Register languages
	hljs.registerLanguage('python', python);
	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('json', json);
	hljs.registerLanguage('markdown', markdown);
	
	let searchIndex = null;
	
	// Load search index once
	onMount(async () => {
		try {
			const searchResponse = await fetch(`${base}/data/search_index.json`);
			if (!searchResponse.ok) throw new Error('Failed to load search index');
			searchIndex = await searchResponse.json();
		} catch (err) {
			console.error('Error loading search index:', err);
			error = 'Failed to load search index';
			loading = false;
		}
		
		// Set panel closed by default
		isPanelOpen = false;
		
		// Check if mobile
		isMobile = window.innerWidth < 1024; // lg breakpoint
		window.addEventListener('resize', () => {
			isMobile = window.innerWidth < 1024;
			if (!isMobile && showMobileModal) {
				showMobileModal = false;
			}
		});
	});
	
	// React to path changes
	$: if (searchIndex && $page.params.path !== undefined) {
		loadPageData($page.params.path || '');
	}
	
	async function loadPageData(requestedPath) {
		loading = true;
		error = null;
		data = null;
		
		try {
			console.log('Loading data for path:', requestedPath);
			
			if (!requestedPath || requestedPath === '' || requestedPath === 'scripts') {
				// Show scripts directory listing
				data = await buildDirectoryListing(searchIndex, 'scripts');
			} else {
				// Try to find specific file or directory
				const item = findItemInSearchIndex(searchIndex, requestedPath);
				console.log('Found item:', item);
				
				if (item) {
					if (item.type === 'python' || item.type === 'markdown' || item.type === 'javascript' || item.type === 'readme') {
						// File view - get actual filename from path
						const fileName = item.filePath.split('/').pop() || item.filePath.split('\\').pop() || item.filePath;
						
						// Load content from static files
						let displayContent = '';
						let isMarkdownRendered = false;
						
						try {
							if (item.type === 'readme') {
								// Load processed HTML from static files
								const readmeFileName = item.filePath.replace(/[\/\\]/g, '_') + '.html';
								const response = await fetch(`${base}/data/readmes/${readmeFileName}`);
								if (response.ok) {
									displayContent = await response.text();
									isMarkdownRendered = true;
								}
							} else {
								// Load raw content from static files
								const scriptFileName = item.filePath.replace(/[\/\\]/g, '_') + '.txt';
								const response = await fetch(`${base}/data/scripts/${scriptFileName}`);
								if (response.ok) {
									displayContent = await response.text();
								}
							}
						} catch (error) {
							console.error('Error loading file content:', error);
							displayContent = 'Error loading file content';
						}
						
						// Special handling for README files viewed directly
						let readmeContent = await findReadmeForFile(searchIndex, item);
						
						// If this IS a README file, find its processed HTML version for the right panel
						if (fileName.toLowerCase().includes('readme') && getExtensionFromPath(item.filePath) === 'md') {
							const processedVersion = searchIndex.find(htmlItem => 
								htmlItem.type === 'readme' && 
								htmlItem.filePath.replace(/\\/g, '/') === item.filePath.replace(/\\/g, '/')
							);
							if (processedVersion) {
								try {
									const readmeFileName = processedVersion.filePath.replace(/[\/\\]/g, '_') + '.html';
									const response = await fetch(`${base}/data/readmes/${readmeFileName}`);
									if (response.ok) {
										readmeContent = await response.text();
									}
								} catch (error) {
									console.error('Error loading processed README content:', error);
								}
							}
						}
						
						data = {
							type: 'file',
							path: requestedPath,
							content: displayContent,
							extension: getExtensionFromPath(item.filePath),
							name: fileName,
							breadcrumbs: requestedPath.split('/').filter(Boolean),
							readmeContent: readmeContent,
							isMarkdownRendered: isMarkdownRendered
						};
					} else {
						// Directory view
						data = await buildDirectoryListing(searchIndex, requestedPath);
					}
				} else {
					// Try as directory
					data = await buildDirectoryListing(searchIndex, requestedPath);
					if (!data.items || data.items.length === 0) {
						throw new Error('Path not found');
					}
				}
			}
		} catch (err) {
			console.error('Error loading browser data:', err);
			error = 'Failed to load browser data';
		} finally {
			loading = false;
		}
		
		// Highlight code if it's a file
		setTimeout(() => {
			if (codeElement && data?.type === 'file') {
				hljs.highlightElement(codeElement);
			}
		}, 100);
	}
	
	// Helper functions
	function findItemInSearchIndex(searchIndex, path) {
		// Skip notepad entries for browser - only find actual files
		// For direct file viewing, prefer raw markdown over processed readme
		const items = searchIndex.filter(item => {
			if (item.type === 'notepad') return false;
			
			if (item.filePath) {
				// Normalize both paths for comparison
				const normalizedItemPath = item.filePath.replace(/\\/g, '/').replace(/^scripts\//, '');
				const normalizedSearchPath = path.replace(/\\/g, '/');
				
				console.log('Comparing paths:', normalizedItemPath, 'vs', normalizedSearchPath);
				return normalizedItemPath === normalizedSearchPath;
			}
			return false;
		});
		
		// If we have multiple matches (raw markdown + processed readme), prefer raw markdown for direct viewing
		const markdownItem = items.find(item => item.type === 'markdown');
		if (markdownItem) return markdownItem;
		
		// Otherwise return the first match
		return items[0];
	}
	
	function getExtensionFromPath(filePath) {
		return filePath.includes('.') ? filePath.split('.').pop() : undefined;
	}
	
	async function findReadmeForFile(searchIndex, fileItem) {
		// Get the file name without extension for matching
		const fileName = fileItem.filePath.split('/').pop().split('\\').pop();
		const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
		const fileDir = fileItem.filePath.replace(/\\/g, '/').split('/').slice(0, -1).join('/');
		
		console.log('Looking for README for file:', fileName, 'in directory:', fileDir);
		console.log('File name without ext:', fileNameWithoutExt);
		console.log('Looking for patterns:', [
			'readme.md', 
			`${fileNameWithoutExt.toLowerCase()}_readme.md`,
			`readme_${fileNameWithoutExt.toLowerCase()}.md`
		]);
		
		// Look for the processed HTML version (type: 'readme') first
		let readmeItem = searchIndex.find(item => {
			if (item.type === 'readme') {
				const itemPath = item.filePath.replace(/\\/g, '/');
				const itemDir = itemPath.split('/').slice(0, -1).join('/');
				const itemFileName = itemPath.split('/').pop();
				
				// Check if it's in the same directory
				if (itemDir === fileDir) {
					console.log('Checking README item:', itemFileName, 'in dir:', itemDir);
					// Check for different README patterns:
					// 1. README.md (general directory README)
					// 2. script_a_README.md (file-specific README)
					// 3. README_script_a.md (alternative pattern)
					const matches = itemFileName.toLowerCase() === 'readme.md' || 
					       itemFileName.toLowerCase() === `${fileNameWithoutExt.toLowerCase()}_readme.md` ||
					       itemFileName.toLowerCase() === `readme_${fileNameWithoutExt.toLowerCase()}.md`;
					console.log('Pattern match result:', matches, 'for file:', itemFileName.toLowerCase());
					return matches;
				}
			}
			return false;
		});
		
		// If no processed version found, look for raw markdown
		if (!readmeItem) {
			readmeItem = searchIndex.find(item => {
				if (item.type === 'markdown') {
					const itemPath = item.filePath.replace(/\\/g, '/');
					const itemDir = itemPath.split('/').slice(0, -1).join('/');
					const itemFileName = itemPath.split('/').pop();
					
					if (itemDir === fileDir && itemFileName.toLowerCase().includes('readme')) {
						return itemFileName.toLowerCase() === 'readme.md' || 
						       itemFileName.toLowerCase() === `${fileNameWithoutExt.toLowerCase()}_readme.md` ||
						       itemFileName.toLowerCase() === `readme_${fileNameWithoutExt.toLowerCase()}.md`;
					}
				}
				return false;
			});
		}
		
		console.log('Found README item:', readmeItem ? readmeItem.filePath : 'none');
		
		if (readmeItem) {
			try {
				// Load processed HTML from static files
				const readmeFileName = readmeItem.filePath.replace(/[\/\\]/g, '_') + '.html';
				const response = await fetch(`${base}/data/readmes/${readmeFileName}`);
				if (response.ok) {
					return await response.text();
				}
			} catch (error) {
				console.error('Error loading README content:', error);
			}
		}
		return null;
	}
	
	async function buildDirectoryListing(searchIndex, dirPath) {
		const items = [];
		const seenItems = new Set();
		
		console.log('Building directory listing for:', dirPath);
		
		// Find all items in this directory - exclude notepad entries, only show actual files
		for (const item of searchIndex) {
			// Skip notepad entries - we only want actual files for the browser
			if (item.type === 'notepad') continue;
			
			if (item.filePath) {
				const normalizedPath = item.filePath.replace(/\\/g, '/');
				const relativePath = normalizedPath.replace('scripts/', '');
				const pathParts = relativePath.split('/');
				
				console.log('Processing item:', item.filePath, 'relativePath:', relativePath, 'pathParts:', pathParts);
				
				if (dirPath === 'scripts' || dirPath === '') {
					// Root scripts directory
					if (pathParts.length === 1) {
						// Direct file in scripts - use actual filename, not title
						const fileName = pathParts[0];
						if (!seenItems.has(fileName)) {
							items.push({
								name: fileName,
								type: 'file',
								path: fileName,
								extension: getExtensionFromPath(item.filePath)
							});
							seenItems.add(fileName);
						}
					} else if (pathParts.length > 1) {
						// File in subdirectory - add the subdirectory
						const subDir = pathParts[0];
						if (!seenItems.has(subDir)) {
							items.push({
								name: subDir,
								type: 'directory',
								path: subDir
							});
							seenItems.add(subDir);
						}
					}
				} else {
					// Specific subdirectory - check if the file is in this directory
					const targetDir = dirPath;
					
					// Check if this file belongs to the target directory
					if (relativePath.startsWith(targetDir + '/') || relativePath === targetDir) {
						const remainingPath = relativePath.replace(targetDir + '/', '');
						const remainingParts = remainingPath.split('/');
						
						if (remainingParts.length === 1 && remainingParts[0] !== '') {
							// Direct file in this directory - use actual filename
							const fileName = remainingParts[0];
							if (!seenItems.has(fileName)) {
								items.push({
									name: fileName,
									type: 'file',
									path: relativePath,
									extension: getExtensionFromPath(item.filePath)
								});
								seenItems.add(fileName);
							}
						} else if (remainingParts.length > 1) {
							// File in subdirectory
							const subDir = remainingParts[0];
							if (!seenItems.has(subDir)) {
								items.push({
									name: subDir,
									type: 'directory',
									path: targetDir + '/' + subDir
								});
								seenItems.add(subDir);
							}
						}
					}
				}
			}
		}
		
		console.log('Found items for', dirPath, ':', items);
		
		// Sort items: directories first, then files
		items.sort((a, b) => {
			if (a.type !== b.type) {
				return a.type === 'directory' ? -1 : 1;
			}
			return a.name.localeCompare(b.name);
		});
		
		// Find README for this directory - only if there's a README directly in this directory
		let readmeContent = null;
		
		// Only show README content for specific directories that actually have a README
		// The root scripts directory should not show any README content
		if (dirPath !== 'scripts' && dirPath !== '') {
			// Look for the processed HTML version (type: 'readme') first
			let readmeItem = searchIndex.find(item => {
				if (item.type === 'readme') {
					const normalizedPath = item.filePath.replace(/\\/g, '/');
					const readmeDir = normalizedPath.replace('scripts/', '').replace('/README.md', '');
					
					// Only show README if it's directly in the requested directory
					return readmeDir === dirPath;
				}
				return false;
			});
			
			// If no processed version found, look for raw markdown
			if (!readmeItem) {
				readmeItem = searchIndex.find(item => {
					if (item.type === 'markdown' && item.filePath.toLowerCase().includes('readme')) {
						const normalizedPath = item.filePath.replace(/\\/g, '/');
						const readmeDir = normalizedPath.replace('scripts/', '').replace('/README.md', '');
						
						return readmeDir === dirPath;
					}
					return false;
				});
			}
			
			if (readmeItem) {
				try {
					// Load processed HTML from static files
					const readmeFileName = readmeItem.filePath.replace(/[\/\\]/g, '_') + '.html';
					const response = await fetch(`${base}/data/readmes/${readmeFileName}`);
					if (response.ok) {
						readmeContent = await response.text();
					}
				} catch (error) {
					console.error('Error loading directory README content:', error);
				}
			}
		}
		
		return {
			type: 'directory',
			path: dirPath,
			items,
			readmeContent,
			breadcrumbs: dirPath === 'scripts' ? [] : dirPath.split('/').filter(Boolean)
		};
	}
	
	// Also highlight when data changes (for client-side navigation)
	$: if (codeElement && data?.type === 'file') {
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
	
	// Mobile modal functions
	function showMobileCode() {
		mobileModalContent = 'code';
		showMobileModal = true;
	}
	
	function showMobileDocumentation() {
		mobileModalContent = 'documentation';
		showMobileModal = true;
	}
	
	function closeMobileModal() {
		showMobileModal = false;
	}
</script>

<svelte:head>
	<title>Browser: {data?.path || 'Loading...'} - PythonMap</title>
</svelte:head>

<!-- Search Panel -->
<div class="{isMobile ? (isPanelOpen ? 'fixed inset-0 z-40' : 'hidden') : (isPanelOpen ? 'w-80' : 'w-12')} {isMobile ? '' : 'flex-shrink-0'} transition-all duration-300">
	<BrowserSearchPanel bind:isPanelOpen />
</div>

<!-- Main Content -->
<div class="flex-1 overflow-auto {isMobile && isPanelOpen ? 'hidden' : ''}">
	<div class="container mx-auto px-4 py-4 lg:py-8">
		{#if loading}
			<div class="text-center py-12">
				<p class="text-vsc-light-text-secondary dark:text-vsc-text-secondary text-lg">Loading...</p>
			</div>
		{:else if error}
			<div class="text-center py-12">
				<p class="text-red-500 text-lg">{error}</p>
				<a href="{base}/browser" class="text-vsc-light-accent-blue dark:text-vsc-accent-blue hover:underline mt-4 inline-block">&larr; Back to Browser</a>
			</div>
		{:else if data}
		<!-- Navigation -->
		<div class="mb-8">
			<a href="{base}/browser" class="text-vsc-light-accent-blue dark:text-vsc-accent-blue hover:underline">&larr; Back to Browser</a>
		</div>
		
		<!-- Breadcrumbs -->
		<nav class="mb-4 lg:mb-6">
			<div class="flex items-center space-x-1 lg:space-x-2 text-xs lg:text-sm text-vsc-light-text-secondary dark:text-vsc-text-secondary overflow-x-auto whitespace-nowrap">
				<a href="{base}/browser" class="hover:text-vsc-light-accent-blue dark:hover:text-vsc-accent-blue flex-shrink-0">Home</a>
				<span class="flex-shrink-0">/</span>
				<a href="{base}/browser/scripts" class="hover:text-vsc-light-accent-blue dark:hover:text-vsc-accent-blue flex-shrink-0">Scripts</a>
				{#if data.breadcrumbs.length > 0}
					{#each data.breadcrumbs as crumb, index}
						<span class="flex-shrink-0">/</span>
						<a 
							href="{base}/browser/{data.breadcrumbs.slice(0, index + 1).join('/')}"
							class="hover:text-vsc-light-accent-blue dark:hover:text-vsc-accent-blue flex-shrink-0"
						>
							{crumb}
						</a>
					{/each}
				{/if}
			</div>
		</nav>

		{#if data.type === 'directory'}
			<!-- Directory View -->
			<header class="mb-6 lg:mb-8">
				<h1 class="text-2xl lg:text-3xl font-bold mb-3 lg:mb-4 text-vsc-light-text-primary dark:text-vsc-text-primary">
					📁 {data.path === 'scripts' || data.path === '.' ? 'Scripts Directory' : data.path}
				</h1>
			</header>

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
												href="{base}/browser/{item.path}"
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

			<!-- README Content -->
			{#if data.readmeContent}
				<div class="bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg p-6 mt-8">
					<div class="prose prose-invert max-w-none">
						{@html data.readmeContent}
					</div>
				</div>
			{/if}

		{:else if data.type === 'file'}
			<!-- File View -->
			<header class="mb-6 lg:mb-8">
				<h1 class="text-xl lg:text-3xl font-bold mb-3 lg:mb-4 text-vsc-light-text-primary dark:text-vsc-text-primary break-all">
					{getFileIcon({ extension: data.extension })} {data.name}
				</h1>
				
				<div class="flex flex-wrap gap-2 lg:gap-3">
					<button 
						on:click={copyToClipboard}
						class="bg-vsc-light-accent-blue dark:bg-vsc-accent-blue text-white px-3 lg:px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm lg:text-base"
					>
						📋 Copy Content
					</button>
					
					{#if isFileWithReadme && !isMobile}
						<button 
							on:click={toggleDirectoryMinimize}
							class="bg-vsc-light-bg-light dark:bg-vsc-bg-light text-vsc-light-text-primary dark:text-vsc-text-primary px-3 lg:px-4 py-2 rounded hover:bg-vsc-light-bg-medium dark:hover:bg-vsc-bg-dark transition-colors border border-vsc-light-border dark:border-vsc-border-light text-sm lg:text-base"
						>
							{directoryMinimized ? '📂 Show' : '📁 Hide'} Documentation
						</button>
					{/if}
					
					{#if isFileWithReadme && isMobile}
						<button 
							on:click={showMobileCode}
							class="bg-vsc-light-bg-light dark:bg-vsc-bg-light text-vsc-light-text-primary dark:text-vsc-text-primary px-3 py-2 rounded hover:bg-vsc-light-bg-medium dark:hover:bg-vsc-bg-dark transition-colors border border-vsc-light-border dark:border-vsc-border-light text-sm"
						>
							💻 Show Code
						</button>
						<button 
							on:click={showMobileDocumentation}
							class="bg-vsc-light-bg-light dark:bg-vsc-bg-light text-vsc-light-text-primary dark:text-vsc-text-primary px-3 py-2 rounded hover:bg-vsc-light-bg-medium dark:hover:bg-vsc-bg-dark transition-colors border border-vsc-light-border dark:border-vsc-border-light text-sm"
						>
							📖 Show Documentation
						</button>
					{/if}
				</div>
			</header>

			{#if isFileWithReadme && !isMobile}
				<!-- Split View Layout for code files with README.md context (Desktop only) -->
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
			{:else if isFileWithReadme && isMobile}
				<!-- Mobile View for Files with README -->
				<div class="bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg overflow-hidden">
					<div class="bg-vsc-light-bg-light dark:bg-vsc-bg-light px-4 py-2 border-b border-vsc-light-border dark:border-vsc-border-light">
						<span class="text-vsc-light-text-secondary dark:text-vsc-text-secondary text-sm">{getFileIcon({ extension: data.extension })} {data.path}</span>
					</div>
					<div class="p-4 text-center">
						<p class="text-vsc-light-text-secondary dark:text-vsc-text-secondary mb-4">
							This file has documentation available. Use the buttons above to view code or documentation.
						</p>
						<div class="flex gap-3 justify-center">
							<button 
								on:click={showMobileCode}
								class="bg-vsc-light-accent-blue dark:bg-vsc-accent-blue text-white px-6 py-3 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
							>
								💻 View Code
							</button>
							<button 
								on:click={showMobileDocumentation}
								class="bg-vsc-light-bg-light dark:bg-vsc-bg-light text-vsc-light-text-primary dark:text-vsc-text-primary px-6 py-3 rounded hover:bg-vsc-light-bg-medium dark:hover:bg-vsc-bg-dark transition-colors border border-vsc-light-border dark:border-vsc-border-light"
							>
								📖 View Documentation
							</button>
						</div>
					</div>
				</div>
			{:else}
				<!-- Standard Single File View -->
				<div class="bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg overflow-hidden">
					<div class="bg-vsc-light-bg-light dark:bg-vsc-bg-light px-4 py-2 border-b border-vsc-light-border dark:border-vsc-border-light">
						<span class="text-vsc-light-text-secondary dark:text-vsc-text-secondary text-sm">{data.path}</span>
					</div>
					
					{#if data.isMarkdownRendered}
						<!-- Rendered Markdown Content -->
						<div class="p-4 lg:p-6">
							<div class="prose prose-invert max-w-none">
								{@html data.content}
							</div>
						</div>
					{:else}
						<!-- Raw Code Content -->
						<pre class="!bg-vsc-light-bg-medium dark:!bg-vsc-bg-medium !border-0 !rounded-none m-0"><code 
							bind:this={codeElement}
							class="{getLanguageClass(data.extension)} block p-3 lg:p-4 overflow-x-auto text-xs lg:text-sm"
						>{data.content}</code></pre>
					{/if}
				</div>
			{/if}
	{/if}
		{/if}
	</div>
</div>

<!-- Mobile Modal -->
{#if showMobileModal && isMobile}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
			<!-- Modal Header -->
			<div class="bg-vsc-light-bg-light dark:bg-vsc-bg-light px-4 py-3 border-b border-vsc-light-border dark:border-vsc-border-light flex items-center justify-between flex-shrink-0">
				<div class="flex items-center gap-2">
					<span class="text-lg">
						{mobileModalContent === 'code' ? '💻' : '📖'}
					</span>
					<span class="text-sm font-medium text-vsc-light-text-primary dark:text-vsc-text-primary">
						{mobileModalContent === 'code' ? 'Code' : 'Documentation'}: {data.name}
					</span>
				</div>
				<button 
					on:click={closeMobileModal}
					class="text-vsc-light-text-secondary dark:text-vsc-text-secondary hover:text-vsc-light-text-primary dark:hover:text-vsc-text-primary transition-colors text-xl"
					title="Close"
				>
					✕
				</button>
			</div>
			
			<!-- Modal Content -->
			<div class="flex-1 overflow-auto">
				{#if mobileModalContent === 'code'}
					<pre class="!bg-vsc-light-bg-medium dark:!bg-vsc-bg-medium !border-0 !rounded-none m-0 h-full"><code 
						class="{getLanguageClass(data.extension)} block p-3 text-xs leading-relaxed"
					>{data.content}</code></pre>
				{:else if mobileModalContent === 'documentation'}
					<div class="p-4">
						<div class="prose prose-invert max-w-none">
							{@html data.readmeContent}
						</div>
					</div>
				{/if}
			</div>
			
			<!-- Modal Footer -->
			<div class="bg-vsc-light-bg-light dark:bg-vsc-bg-light px-4 py-3 border-t border-vsc-light-border dark:border-vsc-border-light flex gap-2 flex-shrink-0">
				<button 
					on:click={() => mobileModalContent = 'code'}
					class="px-4 py-2 rounded transition-colors {mobileModalContent === 'code' ? 'bg-vsc-light-accent-blue dark:bg-vsc-accent-blue text-white' : 'bg-vsc-light-bg-medium dark:bg-vsc-bg-medium text-vsc-light-text-primary dark:text-vsc-text-primary border border-vsc-light-border dark:border-vsc-border-light'}"
				>
					💻 Code
				</button>
				<button 
					on:click={() => mobileModalContent = 'documentation'}
					class="px-4 py-2 rounded transition-colors {mobileModalContent === 'documentation' ? 'bg-vsc-light-accent-blue dark:bg-vsc-accent-blue text-white' : 'bg-vsc-light-bg-medium dark:bg-vsc-bg-medium text-vsc-light-text-primary dark:text-vsc-text-primary border border-vsc-light-border dark:border-vsc-border-light'}"
				>
					📖 Documentation
				</button>
				<div class="flex-1"></div>
				<button 
					on:click={closeMobileModal}
					class="bg-vsc-light-bg-medium dark:bg-vsc-bg-medium text-vsc-light-text-primary dark:text-vsc-text-primary px-4 py-2 rounded hover:bg-vsc-light-bg-light dark:hover:bg-vsc-bg-light transition-colors border border-vsc-light-border dark:border-vsc-border-light"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

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