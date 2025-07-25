<script>
	export let size = 'medium'; // 'small', 'medium', 'large'
	export let message = 'Loading...';
	export let inline = false;
</script>

<div class="loading-container" class:inline>
	<div class="spinner" class:small={size === 'small'} class:large={size === 'large'}>
		<div class="spinner-ring"></div>
		<div class="spinner-ring"></div>
		<div class="spinner-ring"></div>
		<div class="spinner-ring"></div>
	</div>
	{#if message}
		<p class="loading-message">{message}</p>
	{/if}
</div>

<style>
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem;
	}
	
	.loading-container.inline {
		padding: 0.5rem;
		gap: 0.5rem;
	}
	
	.spinner {
		position: relative;
		width: 2.5rem;
		height: 2.5rem;
	}
	
	.spinner.small {
		width: 1.5rem;
		height: 1.5rem;
	}
	
	.spinner.large {
		width: 4rem;
		height: 4rem;
	}
	
	.spinner-ring {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: 0.125rem solid transparent;
		border-top-color: theme('colors.vsc-accent-blue');
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	.spinner-ring:nth-child(2) {
		animation-delay: 0.25s;
		border-top-color: theme('colors.vsc-text-secondary');
	}
	
	.spinner-ring:nth-child(3) {
		animation-delay: 0.5s;
		border-top-color: theme('colors.vsc-accent-blue');
		opacity: 0.7;
	}
	
	.spinner-ring:nth-child(4) {
		animation-delay: 0.75s;
		border-top-color: theme('colors.vsc-text-secondary');
		opacity: 0.5;
	}
	
	.loading-message {
		font-size: 0.875rem;
		color: theme('colors.vsc-text-secondary');
		margin: 0;
		text-align: center;
	}
	
	.loading-container.inline .loading-message {
		font-size: 0.75rem;
	}
	
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
	
	/* Dark mode adjustments */
	:global(.dark) .spinner-ring {
		border-top-color: theme('colors.vsc-accent-blue');
	}
	
	:global(.dark) .spinner-ring:nth-child(2) {
		border-top-color: theme('colors.vsc-text-secondary');
	}
	
	:global(.dark) .loading-message {
		color: theme('colors.vsc-text-secondary');
	}
</style>