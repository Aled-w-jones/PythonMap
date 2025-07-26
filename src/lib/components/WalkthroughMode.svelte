<script>
	import { createEventDispatcher } from 'svelte';
	
	export let walkthrough = null;
	export let currentStep = 0;
	export let isActive = false;
	
	const dispatch = createEventDispatcher();
	
	$: canGoNext = walkthrough && currentStep < walkthrough.steps.length - 1;
	$: canGoPrevious = currentStep > 0;
	$: currentStepData = walkthrough?.steps?.[currentStep];
	
	function nextStep() {
		if (canGoNext) {
			dispatch('stepChange', { step: currentStep + 1, direction: 'next' });
		}
	}
	
	function previousStep() {
		if (canGoPrevious) {
			dispatch('stepChange', { step: currentStep - 1, direction: 'previous' });
		}
	}
	
	function jumpToStep(stepIndex) {
		if (stepIndex >= 0 && stepIndex < walkthrough.steps.length) {
			dispatch('stepChange', { step: stepIndex, direction: 'jump' });
		}
	}
	
	function exitWalkthrough() {
		dispatch('exit');
	}
	
	function startWalkthrough() {
		dispatch('start');
	}
</script>

{#if walkthrough}
	<div class="walkthrough-container bg-vsc-light-bg-medium dark:bg-vsc-bg-medium border border-vsc-light-border dark:border-vsc-border-light rounded-lg overflow-hidden">
		{#if !isActive}
			<!-- Walkthrough Start Screen -->
			<div class="p-6 text-center">
				<div class="text-4xl mb-4">🎓</div>
				<h3 class="text-lg font-semibold text-vsc-light-text-primary dark:text-vsc-text-primary mb-2">
					{walkthrough.title}
				</h3>
				<p class="text-sm text-vsc-light-text-secondary dark:text-vsc-text-secondary mb-4 leading-relaxed">
					{walkthrough.description}
				</p>
				
				{#if walkthrough.metadata?.learning_objectives}
					<div class="mb-4">
						<h4 class="text-sm font-medium text-vsc-light-text-primary dark:text-vsc-text-primary mb-2">
							What you'll learn:
						</h4>
						<ul class="text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary text-left space-y-1">
							{#each walkthrough.metadata.learning_objectives as objective}
								<li class="flex items-start gap-2">
									<span class="text-green-500 flex-shrink-0 mt-0.5">✓</span>
									<span>{objective}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
				
				<div class="text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary mb-4">
					{walkthrough.steps.length} steps • Target audience: {walkthrough.metadata?.target_audience || 'All levels'}
				</div>
				
				<button 
					on:click={startWalkthrough}
					class="bg-vsc-light-accent-blue dark:bg-vsc-accent-blue text-white px-6 py-3 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors font-medium"
				>
					🚀 Start Walkthrough
				</button>
			</div>
		{:else}
			<!-- Active Walkthrough Controls -->
			<div class="walkthrough-controls">
				<!-- Header -->
				<div class="p-4 border-b border-vsc-light-border dark:border-vsc-border-light bg-vsc-light-bg-light dark:bg-vsc-bg-light">
					<div class="flex items-center justify-between mb-2">
						<h3 class="text-sm font-semibold text-vsc-light-text-primary dark:text-vsc-text-primary">
							🎓 Code Walkthrough
						</h3>
						<button 
							on:click={exitWalkthrough}
							class="text-vsc-light-text-secondary dark:text-vsc-text-secondary hover:text-vsc-light-text-primary dark:hover:text-vsc-text-primary transition-colors text-sm"
							title="Exit walkthrough"
						>
							✕
						</button>
					</div>
					
					<!-- Progress Bar -->
					<div class="mb-2">
						<div class="flex justify-between text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary mb-1">
							<span>Step {currentStep + 1} of {walkthrough.steps.length}</span>
							<span>{Math.round(((currentStep + 1) / walkthrough.steps.length) * 100)}%</span>
						</div>
						<div class="w-full bg-vsc-light-bg-medium dark:bg-vsc-bg-medium rounded-full h-2">
							<div 
								class="bg-vsc-light-accent-blue dark:bg-vsc-accent-blue h-2 rounded-full transition-all duration-500 ease-out"
								style="width: {((currentStep + 1) / walkthrough.steps.length) * 100}%"
							></div>
						</div>
					</div>
				</div>
				
				<!-- Current Step Content -->
				{#if currentStepData}
					<div class="p-4">
						<h4 class="font-semibold text-sm text-vsc-light-text-primary dark:text-vsc-text-primary mb-2">
							{currentStepData.title}
						</h4>
						<p class="text-sm text-vsc-light-text-secondary dark:text-vsc-text-secondary leading-relaxed mb-4">
							{currentStepData.instruction}
						</p>
					</div>
				{/if}
				
				<!-- Navigation Controls -->
				<div class="p-4 border-t border-vsc-light-border dark:border-vsc-border-light bg-vsc-light-bg-light dark:bg-vsc-bg-light">
					<div class="flex items-center justify-between gap-2">
						<button 
							on:click={previousStep}
							disabled={!canGoPrevious}
							class="px-3 py-2 rounded transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed
								   {canGoPrevious 
								   	? 'bg-vsc-light-bg-medium dark:bg-vsc-bg-medium text-vsc-light-text-primary dark:text-vsc-text-primary hover:bg-vsc-light-bg-light dark:hover:bg-vsc-bg-light border border-vsc-light-border dark:border-vsc-border-light' 
								   	: 'bg-vsc-light-bg-light dark:bg-vsc-bg-light text-vsc-light-text-secondary dark:text-vsc-text-secondary'}"
						>
							← Previous
						</button>
						
						<div class="flex gap-1">
							{#each walkthrough.steps as step, index}
								<button
									on:click={() => jumpToStep(index)}
									class="w-2 h-2 rounded-full transition-colors
										   {index === currentStep 
										   	? 'bg-vsc-light-accent-blue dark:bg-vsc-accent-blue' 
										   	: 'bg-vsc-light-bg-medium dark:bg-vsc-bg-medium hover:bg-vsc-light-border dark:hover:bg-vsc-border-light'}"
									title="Jump to step {index + 1}"
								></button>
							{/each}
						</div>
						
						<button 
							on:click={nextStep}
							disabled={!canGoNext}
							class="px-3 py-2 rounded transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed
								   {canGoNext 
								   	? 'bg-vsc-light-accent-blue dark:bg-vsc-accent-blue text-white hover:bg-blue-600 dark:hover:bg-blue-500' 
								   	: 'bg-vsc-light-bg-light dark:bg-vsc-bg-light text-vsc-light-text-secondary dark:text-vsc-text-secondary'}"
						>
							{canGoNext ? 'Next →' : 'Complete ✓'}
						</button>
					</div>
				</div>
				
				<!-- Quick Jump Menu -->
				<div class="border-t border-vsc-light-border dark:border-vsc-border-light">
					<details class="group">
						<summary class="p-3 cursor-pointer text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary hover:text-vsc-light-text-primary dark:hover:text-vsc-text-primary transition-colors list-none">
							<span class="flex items-center gap-2">
								<span class="group-open:rotate-90 transition-transform">▶</span>
								Quick Jump
							</span>
						</summary>
						<div class="px-3 pb-3 space-y-1 max-h-32 overflow-y-auto">
							{#each walkthrough.steps as step, index}
								<button
									on:click={() => jumpToStep(index)}
									class="block w-full text-left px-2 py-1 rounded text-xs transition-colors
										   {index === currentStep
										   	? 'bg-vsc-light-accent-blue dark:bg-vsc-accent-blue text-white'
										   	: 'text-vsc-light-text-secondary dark:text-vsc-text-secondary hover:bg-vsc-light-bg-light dark:hover:bg-vsc-bg-light hover:text-vsc-light-text-primary dark:hover:text-vsc-text-primary'}"
								>
									{index + 1}. {step.title}
								</button>
							{/each}
						</div>
					</details>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	details[open] summary {
		border-bottom: 1px solid theme('colors.vsc-light-border');
		margin-bottom: 0.75rem;
		padding-bottom: 0.75rem;
	}
	
	:global(.dark) details[open] summary {
		border-bottom-color: theme('colors.vsc-border-light');
	}
</style>