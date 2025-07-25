import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { base } from '$app/paths';

// Create stores for file caching
export const fileCache = writable(new Map());
export const fileCacheStats = writable({
	hits: 0,
	misses: 0,
	size: 0,
	totalSize: 0
});

// Cache configuration
const CACHE_MAX_SIZE = 50; // Maximum number of files to cache
const CACHE_MAX_FILE_SIZE = 1024 * 1024; // 1MB max file size to cache
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

// File cache implementation
let currentCache = new Map();
let currentStats = {
	hits: 0,
	misses: 0,
	size: 0,
	totalSize: 0
};

// Subscribe to store changes to keep local variables in sync
fileCache.subscribe(cache => {
	currentCache = cache;
});

fileCacheStats.subscribe(stats => {
	currentStats = stats;
});

// Helper function to generate cache key
function getCacheKey(filePath, type) {
	return `${type}:${filePath}`;
}

// Helper function to check if cache entry is expired
function isCacheEntryExpired(entry) {
	return Date.now() - entry.timestamp > CACHE_EXPIRY_TIME;
}

// Helper function to estimate content size
function estimateContentSize(content) {
	return new Blob([content]).size;
}

// Helper function to evict oldest entries when cache is full
function evictOldestEntries() {
	if (currentCache.size <= CACHE_MAX_SIZE) return;

	// Convert to array and sort by timestamp (oldest first)
	const entries = Array.from(currentCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
	
	// Remove oldest entries until we're under the limit
	const toRemove = currentCache.size - CACHE_MAX_SIZE + 1;
	for (let i = 0; i < toRemove && i < entries.length; i++) {
		const [key, entry] = entries[i];
		currentStats.totalSize -= estimateContentSize(entry.content);
		currentCache.delete(key);
	}
	
	currentStats.size = currentCache.size;
	
	// Update stores
	fileCache.set(new Map(currentCache));
	fileCacheStats.set({ ...currentStats });
}

// Main function to get file content with caching
export async function getCachedFileContent(filePath, type = 'script') {
	if (!browser) return null;

	const cacheKey = getCacheKey(filePath, type);
	
	// Check cache first
	if (currentCache.has(cacheKey)) {
		const entry = currentCache.get(cacheKey);
		
		// Check if entry is expired
		if (isCacheEntryExpired(entry)) {
			currentCache.delete(cacheKey);
			currentStats.size--;
			currentStats.totalSize -= estimateContentSize(entry.content);
		} else {
			// Cache hit
			currentStats.hits++;
			fileCacheStats.set({ ...currentStats });
			return entry.content;
		}
	}

	// Cache miss - fetch from server
	currentStats.misses++;
	
	try {
		let response;
		let url;
		
		if (type === 'readme') {
			const fileName = filePath.replace(/[\/\\]/g, '_') + '.html';
			url = `${base}/data/readmes/${fileName}`;
		} else {
			const fileName = filePath.replace(/[\/\\]/g, '_') + '.txt';
			url = `${base}/data/scripts/${fileName}`;
		}
		
		response = await fetch(url);
		
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		
		const content = await response.text();
		const contentSize = estimateContentSize(content);
		
		// Only cache if file is not too large
		if (contentSize <= CACHE_MAX_FILE_SIZE) {
			// Evict old entries if needed
			evictOldestEntries();
			
			// Add to cache
			currentCache.set(cacheKey, {
				content,
				timestamp: Date.now(),
				size: contentSize
			});
			
			currentStats.size = currentCache.size;
			currentStats.totalSize += contentSize;
			
			// Update stores
			fileCache.set(new Map(currentCache));
		}
		
		fileCacheStats.set({ ...currentStats });
		return content;
		
	} catch (error) {
		console.error(`Error loading file content for ${filePath}:`, error);
		fileCacheStats.set({ ...currentStats });
		throw error;
	}
}

// Function to preload frequently accessed files
export async function preloadFiles(filePaths) {
	if (!browser) return;
	
	const promises = filePaths.map(async ({ filePath, type }) => {
		try {
			await getCachedFileContent(filePath, type);
		} catch (error) {
			console.warn(`Failed to preload ${filePath}:`, error);
		}
	});
	
	await Promise.allSettled(promises);
}

// Function to clear cache manually
export function clearFileCache() {
	currentCache.clear();
	currentStats = {
		hits: 0,
		misses: 0,
		size: 0,
		totalSize: 0
	};
	
	fileCache.set(new Map());
	fileCacheStats.set({ ...currentStats });
}

// Function to get cache statistics
export function getCacheStats() {
	return {
		...currentStats,
		hitRate: currentStats.hits + currentStats.misses > 0 
			? (currentStats.hits / (currentStats.hits + currentStats.misses) * 100).toFixed(1)
			: '0.0'
	};
}