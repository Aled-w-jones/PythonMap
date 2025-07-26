<script>
	export let annotations = [];
	export let activeLineRange = null;
	export let walkthroughMode = false;
	export let currentWalkthroughStep = 0;
	export let walkthrough = null;
	
	// Filter annotations for current context
	$: activeAnnotations = annotations.filter(annotation => {
		if (!activeLineRange) return false;
		return isLineInRange(activeLineRange, annotation.lines || annotation.line);
	});
	
	// Get current walkthrough annotation if in walkthrough mode
	$: walkthroughAnnotation = walkthroughMode && walkthrough?.steps?.[currentWalkthroughStep] 
		? annotations.find(a => a.id === walkthrough.steps[currentWalkthroughStep].focus)
		: null;
	
	// Final annotations to show
	$: displayAnnotations = walkthroughMode && walkthroughAnnotation 
		? [walkthroughAnnotation] 
		: activeAnnotations;
	
	function isLineInRange(hoveredLine, annotationRange) {
		if (!hoveredLine || !annotationRange) return false;
		
		if (typeof annotationRange === 'number') {
			return hoveredLine === annotationRange;
		}
		
		if (typeof annotationRange === 'string') {
			if (annotationRange.includes('-')) {
				const [start, end] = annotationRange.split('-').map(n => parseInt(n));
				return hoveredLine >= start && hoveredLine <= end;
			} else {
				return hoveredLine === parseInt(annotationRange);
			}
		}
		
		return false;
	}
	
	function getAnnotationIcon(type) {
		const icons = {
			'best_practice': '✨',
			'security': '🔒',
			'architecture': '🏗️',
			'pattern': '🎯',
			'insight': '💡',
			'enterprise': '🏢',
			'resilience': '🛡️',
			'demonstration': '🎓',
			'explanation': '📝',
			'walkthrough': '👣'
		};
		return icons[type] || '📌';
	}
	
	function getPriorityClass(priority) {
		const classes = {
			'critical': 'border-red-500 bg-red-500/10',
			'high': 'border-yellow-500 bg-yellow-500/10',
			'medium': 'border-blue-500 bg-blue-500/10',
			'low': 'border-gray-500 bg-gray-500/10'
		};
		return classes[priority] || classes['medium'];
	}
</script>

<div class="annotation-panel h-full flex flex-col">
	{#if walkthroughMode && walkthrough}
		<!-- Walkthrough Header -->
		<div class="walkthrough-header p-4 border-b border-vsc-light-border dark:border-vsc-border-light bg-vsc-light-bg-light dark:bg-vsc-bg-light">
			<h3 class="text-sm font-semibold text-vsc-light-text-primary dark:text-vsc-text-primary mb-1">
				🎓 {walkthrough.title}
			</h3>
			<p class="text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary mb-2">
				{walkthrough.description}
			</p>
			<div class="text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary">
				Step {currentWalkthroughStep + 1} of {walkthrough.steps.length}
			</div>
		</div>
	{/if}
	
	<div class="flex-1 overflow-y-auto">
		{#if displayAnnotations.length > 0}
			<div class="p-4 space-y-4">
				{#each displayAnnotations as annotation}
					<div class="annotation-card border rounded-lg p-4 {getPriorityClass(annotation.priority)}">
						<!-- Annotation Header -->
						<div class="flex items-start gap-2 mb-2">
							<span class="text-lg flex-shrink-0" title="Type: {annotation.type}">
								{getAnnotationIcon(annotation.type)}
							</span>
							<div class="flex-1 min-w-0">
								<h4 class="font-semibold text-sm text-vsc-light-text-primary dark:text-vsc-text-primary break-words">
									{annotation.title}
								</h4>
								{#if annotation.lines}
									<div class="text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary mt-1">
										Lines {annotation.lines}
									</div>
								{:else if annotation.line}
									<div class="text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary mt-1">
										Line {annotation.line}
									</div>
								{/if}
							</div>
							<span class="text-xs px-2 py-1 rounded bg-vsc-light-bg-medium dark:bg-vsc-bg-medium text-vsc-light-text-secondary dark:text-vsc-text-secondary flex-shrink-0">
								{annotation.type}
							</span>
						</div>
						
						<!-- Annotation Content -->
						<div class="content text-sm text-vsc-light-text-secondary dark:text-vsc-text-secondary leading-relaxed">
							{@html annotation.content.replace(/\n/g, '<br>')}
						</div>
						
						<!-- Tags -->
						{#if annotation.tags && annotation.tags.length > 0}
							<div class="flex flex-wrap gap-1 mt-3">
								{#each annotation.tags as tag}
									<span class="text-xs px-2 py-1 rounded bg-vsc-light-bg-light dark:bg-vsc-bg-light text-vsc-light-text-secondary dark:text-vsc-text-secondary">
										{tag}
									</span>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else if walkthroughMode}
			<!-- Walkthrough mode but no current annotation -->
			<div class="p-4 text-center">
				<div class="text-2xl mb-2">🎓</div>
				<p class="text-sm text-vsc-light-text-secondary dark:text-vsc-text-secondary">
					Follow the walkthrough steps to explore this code
				</p>
			</div>
		{:else}
			<!-- No active annotations -->
			<div class="p-4 text-center">
				<div class="text-2xl mb-2">👆</div>
				<p class="text-sm text-vsc-light-text-secondary dark:text-vsc-text-secondary">
					Hover over highlighted lines to see annotations
				</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.annotation-panel {
		background: theme('colors.vsc-light-bg-medium');
		border: 1px solid theme('colors.vsc-light-border');
	}
	
	:global(.dark) .annotation-panel {
		background: theme('colors.vsc-bg-medium');
		border-color: theme('colors.vsc-border-light');
	}
	
	.content :global(br) {
		margin-bottom: 0.5rem;
	}
	
	.annotation-card {
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
	}
	
	.annotation-card:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	
	:global(.dark) .annotation-card:hover {
		box-shadow: 0 4px 12px rgba(255, 255, 255, 0.05);
	}
</style>