import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { base } from '$app/paths';

// Create a writable store for search index data
export const searchIndex = writable([]);
export const availableTags = writable([]);
export const isSearchIndexLoaded = writable(false);
export const searchIndexError = writable(null);

// Cache the search index data to avoid multiple fetches
let searchIndexCache = null;
let searchIndexPromise = null;

export async function loadSearchIndex() {
	// If we already have cached data, return it
	if (searchIndexCache) {
		searchIndex.set(searchIndexCache);
		return searchIndexCache;
	}

	// If we're already loading, return the existing promise
	if (searchIndexPromise) {
		return searchIndexPromise;
	}

	// Only load in browser environment
	if (!browser) {
		return [];
	}

	// Create and cache the loading promise
	searchIndexPromise = (async () => {
		try {
			isSearchIndexLoaded.set(false);
			searchIndexError.set(null);

			const response = await fetch(`${base}/data/search_index.json`);
			if (!response.ok) {
				throw new Error(`Failed to fetch search index: ${response.status}`);
			}

			const data = await response.json();
			
			// Cache the data
			searchIndexCache = data;
			
			// Update stores
			searchIndex.set(data);
			
			// Extract unique tags
			const tagSet = new Set();
			data.forEach(item => {
				if (item.tags) {
					item.tags.forEach(tag => tagSet.add(tag));
				}
			});
			availableTags.set(Array.from(tagSet).sort());
			
			isSearchIndexLoaded.set(true);
			
			return data;
		} catch (error) {
			console.error('Error loading search index:', error);
			searchIndexError.set(error.message);
			searchIndex.set([]);
			availableTags.set([]);
			isSearchIndexLoaded.set(false);
			
			// Clear the promise so we can retry later
			searchIndexPromise = null;
			
			throw error;
		}
	})();

	return searchIndexPromise;
}

// Helper function to clear cache (useful for development or manual refresh)
export function clearSearchIndexCache() {
	searchIndexCache = null;
	searchIndexPromise = null;
	searchIndex.set([]);
	availableTags.set([]);
	isSearchIndexLoaded.set(false);
	searchIndexError.set(null);
}