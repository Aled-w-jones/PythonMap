<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import hljs from 'highlight.js/lib/core';
	import python from 'highlight.js/lib/languages/python';
	import { base } from '$app/paths';
	import { marked } from 'marked';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import AnnotationPanel from '$lib/components/AnnotationPanel.svelte';
	import WalkthroughMode from '$lib/components/WalkthroughMode.svelte';
	
	export let data;
	
	let notepad = data.notepad;
	let content = data.content;
	let readmeContent = data.readmeContent;
	let annotations = data.annotations;
	let loading = false;
	let error = null;
	
	let codeElement;
	let codeContainer;
	let showReadme = false;
	let readmeCollapsed = false;
	let readmeMinimized = false;
	let splitContainer;
	let isResizing = false;
	let leftPanelWidth = 50; // Percentage
	let pageLoaded = false;
	
	// Mobile-specific state
	let isMobile = false;
	let showMobileModal = false;
	let mobileModalContent = 'code'; // 'code' or 'documentation'
	
	// Annotation-specific state
	let showAnnotations = false;
	let hoveredLine = null;
	let walkthroughActive = false;
	let currentWalkthroughStep = 0;
	let annotationPanelWidth = 30; // Percentage
	
	// Register Python language
	hljs.registerLanguage('python', python);
	
	onMount(async () => {
		// Set showReadme if we have readme content
		if (readmeContent) {
			showReadme = true;
		}
		
		// Check if mobile
		if (browser) {
			isMobile = window.innerWidth < 1024; // lg breakpoint
			window.addEventListener('resize', () => {
				isMobile = window.innerWidth < 1024;
				if (!isMobile && showMobileModal) {
					showMobileModal = false;
				}
			});
		}
		
		// Add entrance animation delay
		setTimeout(() => {
			pageLoaded = true;
			highlightCode();
		}, 100);
	});
	
	function highlightCode() {
		if (showAnnotations && annotations) {
			// Highlight code in annotation mode
			const codeElements = document.querySelectorAll('code.language-python');
			codeElements.forEach(el => {
				hljs.highlightElement(el);
			});
		} else if (codeElement) {
			// Standard highlighting
			hljs.highlightElement(codeElement);
		}
	}
	
	// Re-highlight when annotation mode changes
	$: if (showAnnotations !== undefined) {
		setTimeout(highlightCode, 50);
	}
	
	// Debug reactive statement to track walkthrough step changes
	$: if (walkthroughActive) {
		console.log('Walkthrough step changed:', currentWalkthroughStep, 'Focus lines:', currentWalkthroughFocusLines);
	}

	function copyToClipboard() {
		navigator.clipboard.writeText(content).then(() => {
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
	
	// Mobile modal functions
	function showMobileCode() {
		mobileModalContent = 'code';
		showMobileModal = true;
		// Highlight code after modal opens
		setTimeout(() => {
			if (codeElement) {
				hljs.highlightElement(codeElement);
			}
		}, 100);
	}
	
	function showMobileDocumentation() {
		mobileModalContent = 'documentation';
		showMobileModal = true;
	}
	
	function closeMobileModal() {
		showMobileModal = false;
	}
	
	// Annotation functions
	function toggleAnnotations() {
		showAnnotations = !showAnnotations;
		if (!showAnnotations) {
			walkthroughActive = false;
		}
	}
	
	function onLineHover(lineNumber) {
		if (!showAnnotations || walkthroughActive) return;
		hoveredLine = lineNumber;
	}
	
	function onLineLeave() {
		if (!walkthroughActive) {
			hoveredLine = null;
		}
	}
	
	function startWalkthrough() {
		walkthroughActive = true;
		currentWalkthroughStep = 0;
		showAnnotations = true;
		
		// Minimize documentation during walkthrough for better focus
		if (showReadme) {
			readmeMinimized = true;
		}
		
		// Focus on the first step's line range with a delay to ensure rendering
		setTimeout(() => {
			if (annotations?.walkthrough?.steps?.[0]?.focus) {
				const firstStepAnnotation = annotations.annotations.find(a => a.id === annotations.walkthrough.steps[0].focus);
				if (firstStepAnnotation) {
					highlightAnnotationLines(firstStepAnnotation);
				}
			}
		}, 200);
	}
	
	function exitWalkthrough() {
		walkthroughActive = false;
		currentWalkthroughStep = 0;
		hoveredLine = null;
	}
	
	function handleWalkthroughStep(event) {
		currentWalkthroughStep = event.detail.step;
		
		// Wait for UI to update, then highlight and scroll
		setTimeout(() => {
			if (annotations?.walkthrough?.steps?.[currentWalkthroughStep]?.focus) {
				const stepAnnotation = annotations.annotations.find(a => a.id === annotations.walkthrough.steps[currentWalkthroughStep].focus);
				if (stepAnnotation) {
					highlightAnnotationLines(stepAnnotation);
				}
			}
		}, 100);
	}
	
	function highlightAnnotationLines(annotation) {
		const lines = annotation.lines || annotation.line;
		if (typeof lines === 'string' && lines.includes('-')) {
			const [start] = lines.split('-').map(n => parseInt(n));
			hoveredLine = start;
		} else if (typeof lines === 'number') {
			hoveredLine = lines;
		} else if (typeof lines === 'string') {
			hoveredLine = parseInt(lines);
		}
		
		// Scroll to the highlighted line
		scrollToLine(hoveredLine);
	}
	
	function scrollToLine(lineNumber) {
		if (!lineNumber || !codeContainer) return;
		
		let targetLine;
		
		if (showAnnotations && annotations) {
			// In annotation mode, find the line in the enhanced view
			const lineElements = codeContainer.querySelectorAll('.code-line');
			targetLine = lineElements[lineNumber - 1];
		} else {
			// In standard mode, we need to calculate based on line height
			if (codeElement) {
				const lineHeight = 24; // Approximate line height in pixels
				const scrollTop = (lineNumber - 1) * lineHeight - codeContainer.clientHeight / 3;
				codeContainer.scrollTo({
					top: Math.max(0, scrollTop),
					behavior: 'smooth'
				});
			}
			return;
		}
		
		if (targetLine) {
			// Calculate the scroll position to center the line
			const containerRect = codeContainer.getBoundingClientRect();
			const lineRect = targetLine.getBoundingClientRect();
			const scrollTop = codeContainer.scrollTop + lineRect.top - containerRect.top - containerRect.height / 3;
			
			// Smooth scroll to the line
			codeContainer.scrollTo({
				top: Math.max(0, scrollTop),
				behavior: 'smooth'
			});
			
			// Add a subtle flash effect to the line (only in annotation mode)
			if (showAnnotations) {
				targetLine.style.transition = 'background-color 0.3s ease';
				const originalBg = targetLine.style.backgroundColor;
				targetLine.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
				
				setTimeout(() => {
					targetLine.style.backgroundColor = originalBg;
					setTimeout(() => {
						targetLine.style.transition = '';
					}, 300);
				}, 800);
			}
		}
	}
	
	function isLineAnnotated(lineNumber) {
		if (!annotations?.annotations) return false;
		
		return annotations.annotations.some(annotation => {
			const lines = annotation.lines || annotation.line;
			if (typeof lines === 'number') {
				return lineNumber === lines;
			}
			if (typeof lines === 'string') {
				if (lines.includes('-')) {
					const [start, end] = lines.split('-').map(n => parseInt(n));
					return lineNumber >= start && lineNumber <= end;
				} else {
					return lineNumber === parseInt(lines);
				}
			}
			return false;
		});
	}
	
	// Reactive variable to track which lines should be highlighted in walkthrough
	$: currentWalkthroughFocusLines = (() => {
		if (!walkthroughActive || !annotations?.walkthrough?.steps?.[currentWalkthroughStep]) {
			return [];
		}
		
		const focusId = annotations.walkthrough.steps[currentWalkthroughStep].focus;
		const focusAnnotation = annotations.annotations.find(a => a.id === focusId);
		
		if (!focusAnnotation) return [];
		
		const lines = focusAnnotation.lines || focusAnnotation.line;
		const focusLines = [];
		
		if (typeof lines === 'number') {
			focusLines.push(lines);
		} else if (typeof lines === 'string') {
			if (lines.includes('-')) {
				const [start, end] = lines.split('-').map(n => parseInt(n));
				for (let i = start; i <= end; i++) {
					focusLines.push(i);
				}
			} else {
				focusLines.push(parseInt(lines));
			}
		}
		
		return focusLines;
	})();
	
	function isLineInWalkthroughFocus(lineNumber) {
		return currentWalkthroughFocusLines.includes(lineNumber);
	}
</script>

<svelte:head>
	<title>{notepad?.title || 'Loading...'} - PythonMap</title>
</svelte:head>

{#if loading}
	<div class="container mx-auto px-4 py-8">
		<div class="flex justify-center py-12">
			<LoadingSpinner message="Loading notepad... this could take up to 20 seconds... free hosting in use" />
		</div>
	</div>
{:else if error}
	<div class="container mx-auto px-4 py-8">
		<div class="text-center py-12">
			<p class="text-red-500 text-lg">{error}</p>
			<a href="{base}/notepads" class="text-vsc-light-accent-blue dark:text-vsc-accent-blue hover:underline mt-4 inline-block">&larr; Back to Notepads</a>
		</div>
	</div>
{:else}
<div class="container mx-auto px-4 py-4 lg:py-8 max-w-none page-container" class:loaded={pageLoaded}>
	<div class="mb-6">
		<a href="{base}/notepads" class="text-vsc-light-accent-blue dark:text-vsc-accent-blue hover:underline">&larr; Back to Notepads</a>
	</div>
	
	<!-- Header Section -->
	<header class="mb-6 lg:mb-8">
		<h1 class="text-xl lg:text-3xl font-bold mb-3 lg:mb-4 text-vsc-light-text-primary dark:text-vsc-text-primary break-words">{notepad.title}</h1>
		<p class="text-vsc-light-text-secondary dark:text-vsc-text-secondary mb-3 lg:mb-4 text-sm lg:text-base">{notepad.description}</p>
		
		<div class="flex flex-wrap gap-1 lg:gap-2 mb-3 lg:mb-4">
			{#each notepad.tags as tag}
				<span class="bg-vsc-light-bg-light dark:bg-vsc-bg-light text-vsc-light-text-secondary dark:text-vsc-text-secondary px-2 py-1 rounded text-xs lg:text-sm">
					{tag}
				</span>
			{/each}
		</div>
		
		<div class="flex flex-col lg:flex-row lg:flex-wrap gap-2 lg:gap-4 text-xs lg:text-sm text-vsc-light-text-secondary dark:text-vsc-text-secondary mb-3 lg:mb-4">
			<span class="break-all">File: {notepad.filePath}</span>
			<span>Dependencies: {notepad.dependencies.join(', ')}</span>
			<span>Updated: {new Date(notepad.lastUpdated).toLocaleDateString()}</span>
		</div>
		
		<!-- Action Buttons -->
		<div class="flex flex-wrap gap-2 lg:gap-3">
			<button 
				on:click={copyToClipboard}
				class="bg-vsc-light-accent-blue dark:bg-vsc-accent-blue text-white px-3 lg:px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm lg:text-base"
			>
				📋 Copy Code
			</button>
			
			{#if readmeContent && !isMobile}
				<button 
					on:click={toggleReadme}
					class="bg-vsc-light-bg-light dark:bg-vsc-bg-light text-vsc-light-text-primary dark:text-vsc-text-primary px-3 lg:px-4 py-2 rounded hover:bg-vsc-light-bg-medium dark:hover:bg-vsc-bg-dark transition-colors border border-vsc-light-border dark:border-vsc-border-light text-sm lg:text-base"
				>
					{showReadme ? '👁️ Hide' : '📖 Show'} Documentation
				</button>
			{/if}
			
			{#if annotations && !isMobile}
				<button 
					on:click={toggleAnnotations}
					class="bg-vsc-light-bg-light dark:bg-vsc-bg-light text-vsc-light-text-primary dark:text-vsc-text-primary px-3 lg:px-4 py-2 rounded hover:bg-vsc-light-bg-medium dark:hover:bg-vsc-bg-dark transition-colors border border-vsc-light-border dark:border-vsc-border-light text-sm lg:text-base"
				>
					{showAnnotations ? '🔍 Hide' : '💡 Show'} Annotations
				</button>
				
				{#if annotations.walkthrough && !walkthroughActive}
					<button 
						on:click={startWalkthrough}
						class="bg-green-600 hover:bg-green-700 text-white px-3 lg:px-4 py-2 rounded transition-colors text-sm lg:text-base"
					>
						🎓 Start Walkthrough
					</button>
				{/if}
			{/if}
			
			{#if readmeContent && isMobile}
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

	{#if !isMobile}
		<!-- Desktop Split View Layout -->
		<div bind:this={splitContainer} class="split-view flex flex-col lg:flex-row h-[calc(100vh-16rem)] {isResizing ? 'select-none' : ''}">
			
			<!-- Walkthrough Panel (Left Side) -->
			{#if showAnnotations && annotations?.walkthrough}
				<div class="walkthrough-container bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg overflow-hidden mr-2" style="width: 300px; flex-shrink: 0;">
					<WalkthroughMode 
						walkthrough={annotations.walkthrough}
						currentStep={currentWalkthroughStep}
						isActive={walkthroughActive}
						on:start={startWalkthrough}
						on:exit={exitWalkthrough}
						on:stepChange={handleWalkthroughStep}
					/>
				</div>
			{/if}
			<!-- Code Panel -->
			<div 
				class="bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg overflow-hidden flex flex-col transition-all duration-300"
				style="width: {showReadme && readmeContent && !readmeMinimized ? `${leftPanelWidth}%` : '100%'}"
			>
				<div class="bg-vsc-light-bg-light dark:bg-vsc-bg-light px-4 py-2 border-b border-vsc-light-border dark:border-vsc-border-light flex-shrink-0">
					<span class="text-vsc-light-text-secondary dark:text-vsc-text-secondary text-sm">🐍 {notepad.filePath}</span>
				</div>
				<div class="flex-1 overflow-auto" bind:this={codeContainer}>
					{#if showAnnotations && annotations}
						<!-- Enhanced code view with line numbers and annotations -->
						<div class="code-with-annotations">
							{#each content.split('\n') as line, i (`${i}-${currentWalkthroughStep}`)}
								<div 
									class="code-line flex hover:bg-vsc-light-bg-light dark:hover:bg-vsc-bg-light transition-colors
										   {isLineAnnotated(i + 1) ? 'annotated' : ''}
										   {isLineInWalkthroughFocus(i + 1) ? 'walkthrough-focus' : ''}"
									on:mouseenter={() => onLineHover(i + 1)}
									on:mouseleave={onLineLeave}
									role="presentation"
								>
									<span class="line-number select-none text-vsc-light-text-secondary dark:text-vsc-text-secondary text-xs px-3 py-1 text-right border-r border-vsc-light-border dark:border-vsc-border-light bg-vsc-light-bg-light dark:bg-vsc-bg-light" style="min-width: 4rem;">
										{i + 1}
									</span>
									<div class="flex-1 flex items-center">
										<code class="language-python block px-4 py-1 text-sm leading-relaxed flex-1" style="background: transparent;">
											{line || ' '}
										</code>
										{#if isLineAnnotated(i + 1)}
											<span class="annotation-indicator text-lg mr-2 opacity-70" title="Line has annotations">
												💡
											</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<!-- Standard code view -->
						<pre class="!bg-vsc-light-bg-medium dark:!bg-vsc-bg-medium !border-0 !rounded-none m-0 h-full"><code 
							bind:this={codeElement}
							class="language-python block p-4 text-sm leading-relaxed"
						>{content}</code></pre>
					{/if}
				</div>
			</div>

		<!-- Resizer Bar -->
		{#if showReadme && readmeContent && !readmeMinimized}
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div 
				class="w-1 bg-vsc-light-border dark:bg-vsc-border-light hover:bg-vsc-light-accent-blue dark:hover:bg-vsc-accent-blue cursor-col-resize transition-colors flex-shrink-0"
				on:mousedown={startResize}
				role="separator"
				title="Drag to resize panels"
			></div>
		{/if}

		<!-- README Panel (conditionally shown) -->
		{#if showReadme && readmeContent}
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
								{@html readmeContent}
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
		
		<!-- Annotation Panel (Right Side) -->
		{#if showAnnotations && annotations && !walkthroughActive}
			<!-- Resizer Bar for Annotations -->
			<div 
				class="w-1 bg-vsc-light-border dark:bg-vsc-border-light hover:bg-vsc-light-accent-blue dark:hover:bg-vsc-accent-blue cursor-col-resize transition-colors flex-shrink-0"
				role="separator"
				title="Drag to resize annotation panel"
			></div>
			
			<div 
				class="annotation-panel-container bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg overflow-hidden flex flex-col"
				style="width: {annotationPanelWidth}%; min-width: 250px;"
			>
				<div class="bg-vsc-light-bg-light dark:bg-vsc-bg-light px-4 py-2 border-b border-vsc-light-border dark:border-vsc-border-light flex-shrink-0">
					<span class="text-vsc-light-text-secondary dark:text-vsc-text-secondary text-sm">💡 Code Annotations</span>
				</div>
				<AnnotationPanel 
					annotations={annotations.annotations}
					activeLineRange={hoveredLine}
					walkthroughMode={walkthroughActive}
					currentWalkthroughStep={currentWalkthroughStep}
					walkthrough={annotations.walkthrough}
				/>
			</div>
		{/if}
		</div>
	{:else}
		<!-- Mobile View -->
		<div class="bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg overflow-hidden">
			<div class="bg-vsc-light-bg-light dark:bg-vsc-bg-light px-4 py-2 border-b border-vsc-light-border dark:border-vsc-border-light">
				<span class="text-vsc-light-text-secondary dark:text-vsc-text-secondary text-sm">🐍 {notepad.filePath}</span>
			</div>
			{#if readmeContent}
				<div class="p-4 text-center">
					<p class="text-vsc-light-text-secondary dark:text-vsc-text-secondary mb-4">
						This notepad has documentation available. Use the buttons above to view code or documentation.
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
			{:else}
				<!-- Mobile Code Only View -->
				<div class="overflow-auto">
					<pre class="!bg-vsc-light-bg-medium dark:!bg-vsc-bg-medium !border-0 !rounded-none m-0"><code 
						bind:this={codeElement}
						class="language-python block p-3 text-xs leading-relaxed"
					>{content}</code></pre>
				</div>
			{/if}
		</div>
	{/if}
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
						{mobileModalContent === 'code' ? 'Code' : 'Documentation'}: {notepad.title}
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
						bind:this={codeElement}
						class="language-python block p-3 text-xs leading-relaxed"
					>{content}</code></pre>
				{:else if mobileModalContent === 'documentation'}
					<div class="p-4">
						<div class="prose prose-invert max-w-none">
							{@html readmeContent}
						</div>
					</div>
				{/if}
			</div>
			
			<!-- Modal Footer -->
			<div class="bg-vsc-light-bg-light dark:bg-vsc-bg-light px-4 py-3 border-t border-vsc-light-border dark:border-vsc-border-light flex gap-2 flex-shrink-0">
				<button 
					on:click={() => {
						mobileModalContent = 'code';
						// Highlight code after switching to code view
						setTimeout(() => {
							if (codeElement) {
								hljs.highlightElement(codeElement);
							}
						}, 50);
					}}
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
{/if}

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
	
	/* Annotation Styles */
	.code-with-annotations {
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		background: theme('colors.vsc-light-bg-medium');
		color: theme('colors.vsc-light-text-primary');
	}
	
	:global(.dark) .code-with-annotations {
		background: theme('colors.vsc-bg-medium');
		color: theme('colors.vsc-text-primary');
	}
	
	.code-line.annotated {
		background: rgba(253, 224, 71, 0.1) !important;
		border-left: 3px solid #fbbf24;
	}
	
	:global(.dark) .code-line.annotated {
		background: rgba(253, 224, 71, 0.05) !important;
		border-left-color: #fbbf24;
	}
	
	.code-line.walkthrough-focus {
		background: rgba(59, 130, 246, 0.2) !important;
		border-left: 4px solid #3b82f6;
		animation: focusPulse 2s ease-in-out infinite;
		box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
	}
	
	:global(.dark) .code-line.walkthrough-focus {
		background: rgba(59, 130, 246, 0.15) !important;
		box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
	}
	
	@keyframes focusPulse {
		0%, 100% {
			border-left-color: #3b82f6;
			box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
		}
		50% {
			border-left-color: #60a5fa;
			box-shadow: 0 0 15px rgba(96, 165, 250, 0.4);
		}
	}
	
	:global(.dark) .code-line.walkthrough-focus {
		@keyframes darkFocusPulse {
			0%, 100% {
				box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
			}
			50% {
				box-shadow: 0 0 15px rgba(96, 165, 250, 0.3);
			}
		}
		animation: darkFocusPulse 2s ease-in-out infinite;
	}
	
	.annotation-indicator {
		opacity: 0;
		transition: opacity 0.3s ease;
	}
	
	.code-line:hover .annotation-indicator,
	.code-line.annotated .annotation-indicator,
	.code-line.walkthrough-focus .annotation-indicator {
		opacity: 0.8;
	}
	
	.line-number {
		user-select: none;
		font-variant-numeric: tabular-nums;
	}
	
	.code-line:hover .line-number {
		background: theme('colors.vsc-light-bg-medium') !important;
		color: theme('colors.vsc-light-text-primary') !important;
	}
	
	:global(.dark) .code-line:hover .line-number {
		background: theme('colors.vsc-bg-medium') !important;
		color: theme('colors.vsc-text-primary') !important;
	}
	
	/* Walkthrough container styling */
	.walkthrough-container {
		max-height: 100%;
		min-width: 280px;
	}
	
	/* Annotation panel styling */
	.annotation-panel-container {
		max-height: 100%;
	}
</style>