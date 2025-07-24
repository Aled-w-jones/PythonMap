<script>
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	
	let notepads = [];
	let loading = true;
	
	onMount(async () => {
		try {
			// Load notepads data from the static JSON file generated during build
			const response = await fetch(`${base}/data/notepads.json`);
			if (response.ok) {
				const data = await response.json();
				notepads = data;
			}
		} catch (error) {
			console.error('Error loading notepads:', error);
		} finally {
			loading = false;
		}
	});
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<a href="{base}/" class="text-vsc-light-accent-blue dark:text-vsc-accent-blue hover:underline">&larr; Back to Home</a>
	</div>
	
	<header class="mb-8">
		<h1 class="text-3xl font-bold mb-4 text-vsc-light-text-primary dark:text-vsc-text-primary">Python Notepads</h1>
		<p class="text-vsc-light-text-secondary dark:text-vsc-text-secondary">Browse and view your Python scripts with syntax highlighting</p>
	</header>

	{#if loading}
		<div class="text-center py-12">
			<p class="text-vsc-light-text-secondary dark:text-vsc-text-secondary text-lg">Loading notepads...</p>
		</div>
	{:else}
		<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
			{#each notepads as notepad}
				<div class="notepad-card group cursor-pointer transform transition-all duration-300 ease-out hover:scale-105 hover:-rotate-1">
					<a href="{base}/notepads/{notepad.id}" class="block">
						<!-- Notepad Stack Shadow Layers -->
						<div class="absolute inset-0 bg-amber-100 dark:bg-slate-800 rounded-lg transform translate-x-1 translate-y-1 opacity-40"></div>
						<div class="absolute inset-0 bg-amber-50 dark:bg-slate-700 rounded-lg transform translate-x-0.5 translate-y-0.5 opacity-60"></div>
						
						<!-- Main Notepad -->
						<div class="relative bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-slate-700 dark:to-slate-600 border-2 border-amber-200 dark:border-slate-500 rounded-lg overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300">
							<!-- Python Logo -->
							<div class="absolute top-3 right-3 w-6 h-6 opacity-80">
								<svg viewBox="0 0 24 24" class="w-full h-full">
									<path fill="#3776ab" d="M14.31.18l.9.2c2.4.5 2.4 3.6 2.4 3.6v2.3h-4.8V8h7.8s3.7-.3 3.7 4.1c0 0-.1 3.8-.1 5.3c0 1.5-1.3 2.9-2.9 2.9H17.6v-2.5c0-1.6-1.3-2.9-2.9-2.9H9.9c-1.5 0-2.7-1.2-2.7-2.7V6.1s-.1-3.1 2.3-3.6c0 0 1.6-.3 4.8-.3zM12.1 2.5a.9.9 0 1 0 0 1.8a.9.9 0 0 0 0-1.8z"/>
									<path fill="#ffd43b" d="M3.7 20.4c0-1.5 1.3-2.9 2.9-2.9h4.8c1.5 0 2.7-1.2 2.7-2.7v-5.1s.1-3.1-2.3-3.6c0 0-1.6-.3-4.8-.3l-.9.2c-2.4.5-2.4 3.6-2.4 3.6v2.3h4.8V13H0.7s-3.7.3-3.7 4.1c0 0 .1 3.8.1 5.3c0 1.5 1.3 2.9 2.9 2.9h2.7v-2.5c0-1.6 1.3-2.9 2.9-2.9"/>
								</svg>
							</div>
							<!-- Spiral Binding -->
							<div class="absolute left-0 top-0 bottom-0 w-8 bg-amber-200 dark:bg-slate-600 border-r-2 border-amber-300 dark:border-slate-500">
								<div class="flex flex-col items-center justify-start pt-4 space-y-3">
									{#each Array(8) as _, i}
										<div class="w-3 h-3 rounded-full bg-amber-100 dark:bg-slate-500 border border-amber-300 dark:border-slate-400"></div>
									{/each}
								</div>
							</div>
							
							<!-- Notepad Content -->
							<div class="pl-12 pr-6 py-6">
								<!-- Header with animation -->
								<div class="mb-4 transform transition-transform duration-300 group-hover:translate-x-1">
									<h3 class="text-xl font-bold text-amber-800 dark:text-slate-100 mb-2 leading-tight">
										{notepad.title}
									</h3>
									<div class="w-full h-0.5 bg-gradient-to-r from-amber-600 dark:from-slate-400 to-transparent opacity-60"></div>
								</div>
								
								<!-- Description -->
								<p class="text-amber-700 dark:text-slate-300 mb-4 leading-relaxed text-sm line-clamp-3 transform transition-transform duration-300 group-hover:translate-x-0.5">
									{notepad.description}
								</p>
								
								<!-- Tags as sticky notes -->
								<div class="flex flex-wrap gap-2 mb-4">
									{#each notepad.tags.slice(0, 3) as tag, i}
										<span class="sticky-note bg-yellow-200 text-yellow-800 px-2 py-1 text-xs font-medium rounded-sm shadow-sm transform transition-all duration-300 hover:rotate-3"
											style="animation-delay: {i * 100}ms">
											{tag}
										</span>
									{/each}
									{#if notepad.tags.length > 3}
										<span class="text-vsc-light-text-secondary dark:text-vsc-text-secondary text-xs py-1">+{notepad.tags.length - 3} more</span>
									{/if}
								</div>
								
								<!-- Footer Info -->
								<div class="text-xs text-vsc-light-text-secondary dark:text-vsc-text-secondary space-y-1 border-t border-vsc-light-border dark:border-vsc-border-light pt-3">
									<div class="flex items-center gap-1">
										<span class="text-vsc-light-keyword dark:text-vsc-keyword">📦</span>
										<span class="truncate">{notepad.dependencies.slice(0, 2).join(', ')}{notepad.dependencies.length > 2 ? '...' : ''}</span>
									</div>
									<div class="flex items-center gap-1">
										<span class="text-vsc-light-string dark:text-vsc-string">📅</span>
										<span>{new Date(notepad.lastUpdated).toLocaleDateString()}</span>
									</div>
								</div>
							</div>
							
							<!-- Corner Fold -->
							<div class="absolute top-0 right-0 w-6 h-6 bg-gradient-to-bl from-vsc-light-bg-medium dark:from-vsc-bg-dark to-transparent opacity-30 transform transition-all duration-300 group-hover:scale-110"></div>
							
							<!-- Hover Glow Effect -->
							<div class="absolute inset-0 bg-gradient-to-r from-vsc-light-accent-blue/0 via-vsc-light-accent-blue/5 to-vsc-light-accent-blue/0 dark:from-vsc-accent-blue/0 dark:via-vsc-accent-blue/5 dark:to-vsc-accent-blue/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
						</div>
					</a>
				</div>
			{/each}
		</div>

		{#if notepads.length === 0}
			<div class="text-center py-12">
				<p class="text-vsc-light-text-secondary dark:text-vsc-text-secondary text-lg">No notepads found.</p>
				<p class="text-vsc-light-text-secondary dark:text-vsc-text-secondary">Add some Python scripts to the scripts/ directory and update data/notepads.json</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	.notepad-card {
		position: relative;
		/* Add floating animation */
		animation: float 6s ease-in-out infinite;
	}
	
	.notepad-card:nth-child(2n) {
		animation-delay: -2s;
	}
	
	.notepad-card:nth-child(3n) {
		animation-delay: -4s;
	}
	
	@keyframes float {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		50% { transform: translateY(-10px) rotate(0.5deg); }
	}
	
	.notepad-card:hover {
		animation-play-state: paused;
	}
	
	.sticky-note {
		position: relative;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		transform: rotate(-1deg);
		transition: all 0.3s ease;
	}
	
	.sticky-note:nth-child(2n) {
		transform: rotate(1deg);
	}
	
	.sticky-note:hover {
		transform: rotate(0deg) scale(1.1);
		box-shadow: 0 4px 8px rgba(0,0,0,0.2);
		z-index: 10;
	}
	
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	/* Page entrance animation */
	.notepad-card {
		opacity: 0;
		transform: translateY(50px) scale(0.8);
		animation: slideInUp 0.8s ease-out forwards, float 6s ease-in-out infinite;
	}
	
	.notepad-card:nth-child(1) { animation-delay: 0.1s, 0.1s; }
	.notepad-card:nth-child(2) { animation-delay: 0.2s, -1.9s; }
	.notepad-card:nth-child(3) { animation-delay: 0.3s, -3.9s; }
	.notepad-card:nth-child(4) { animation-delay: 0.4s, 0.4s; }
	.notepad-card:nth-child(5) { animation-delay: 0.5s, -1.5s; }
	.notepad-card:nth-child(6) { animation-delay: 0.6s, -3.5s; }
	
	@keyframes slideInUp {
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>