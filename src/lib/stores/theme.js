import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Create a writable store for theme state
export const isDarkMode = writable(true); // Default to dark mode

// Function to toggle theme
export function toggleTheme() {
	isDarkMode.update(dark => {
		const newTheme = !dark;
		if (browser) {
			// Update localStorage
			localStorage.setItem('theme', newTheme ? 'dark' : 'light');
			// Update HTML class
			document.documentElement.classList.toggle('dark', newTheme);
		}
		return newTheme;
	});
}

// Function to initialize theme from localStorage
export function initializeTheme() {
	if (browser) {
		const savedTheme = localStorage.getItem('theme');
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark;
		
		isDarkMode.set(shouldBeDark);
		document.documentElement.classList.toggle('dark', shouldBeDark);
	}
}