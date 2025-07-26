import type { PageServerLoad } from './$types';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { marked } from 'marked';

export const load: PageServerLoad = async ({ params }) => {
	try {
		// Load search index from file system
		const searchIndexPath = join(process.cwd(), 'data', 'search_index.json');
		const searchIndexData = readFile(searchIndexPath, 'utf-8');
		
		// Load static file content based on path
		const requestedPath = params.path || '';
		
		// Parse search index
		const searchIndex = JSON.parse(await searchIndexData);
		
		// Find the requested item in search index
		let data = null;
		
		if (!requestedPath || requestedPath === '' || requestedPath === 'scripts') {
			// Show scripts directory listing
			data = await buildDirectoryListing(searchIndex, 'scripts');
		} else {
			// Try to find specific file or directory
			const item = findItemInSearchIndex(searchIndex, requestedPath);
			
			if (item && ['python', 'markdown', 'javascript', 'json', 'readme'].includes(item.type)) {
				// File view - load content from static files
				const fileName = item.filePath.split('/').pop() || item.filePath.split('\\').pop() || item.filePath;
				
				let displayContent = '';
				let isMarkdownRendered = false;
				
				try {
					if (item.type === 'readme') {
						// Load processed HTML for README files
						const readmeFileName = item.filePath.replace(/[\\/\\\\]/g, '_') + '.html';
						const readmeContentPath = join(process.cwd(), 'static', 'data', 'readmes', readmeFileName);
						displayContent = await readFile(readmeContentPath, 'utf-8');
						isMarkdownRendered = true;
					} else {
						// Load raw content for other files
						const staticFileName = item.filePath.replace(/[\\/\\\\]/g, '_') + '.txt';
						const staticContentPath = join(process.cwd(), 'static', 'data', 'scripts', staticFileName);
						displayContent = await readFile(staticContentPath, 'utf-8');
					}
				} catch (error) {
					console.error('Error loading file content:', error);
					displayContent = 'Error loading file content';
				}
				
				// Find README content for split view
				const readmeContent = await findReadmeForFile(searchIndex, item);
				
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
		}
		
		return {
			searchIndex,
			data
		};
	} catch (error) {
		console.error('Error in browser page server load:', error);
		throw new Error('Failed to load browser data');
	}
};

function findItemInSearchIndex(searchIndex: any[], path: string) {
	// Skip notepad entries for browser - only find actual files
	const items = searchIndex.filter(item => {
		if (item.type === 'notepad') return false;
		
		if (item.filePath) {
			// Normalize both paths for comparison
			const normalizedItemPath = item.filePath.replace(/\\/g, '/').replace(/^scripts\//, '');
			const normalizedSearchPath = path.replace(/\\/g, '/');
			
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

function getExtensionFromPath(filePath: string) {
	return filePath.includes('.') ? filePath.split('.').pop() : undefined;
}

async function findReadmeForFile(searchIndex: any[], fileItem: any) {
	// Get the file name without extension for matching
	const fileName = fileItem.filePath.split('/').pop().split('\\').pop();
	const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
	const fileDir = fileItem.filePath.replace(/\\/g, '/').split('/').slice(0, -1).join('/');
	
	// Look for the processed HTML version (type: 'readme') first
	let readmeItem = searchIndex.find(item => {
		if (item.type === 'readme') {
			const itemPath = item.filePath.replace(/\\/g, '/');
			const itemDir = itemPath.split('/').slice(0, -1).join('/');
			const itemFileName = itemPath.split('/').pop();
			
			// Check if it's in the same directory
			if (itemDir === fileDir) {
				// Check for different README patterns
				const matches = itemFileName.toLowerCase() === 'readme.md' || 
				       itemFileName.toLowerCase() === `${fileNameWithoutExt.toLowerCase()}_readme.md` ||
				       itemFileName.toLowerCase() === `readme_${fileNameWithoutExt.toLowerCase()}.md`;
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
	
	if (readmeItem) {
		try {
			if (readmeItem.type === 'readme') {
				// Load processed HTML for README files
				const readmeFileName = readmeItem.filePath.replace(/[\\/\\\\]/g, '_') + '.html';
				const readmeContentPath = join(process.cwd(), 'static', 'data', 'readmes', readmeFileName);
				return await readFile(readmeContentPath, 'utf-8');
			} else {
				// Load and process raw markdown
				const content = await readFile(readmeItem.filePath, 'utf-8');
				return marked(content);
			}
		} catch (error) {
			console.error('Error loading README content:', error);
		}
	}
	return null;
}

async function buildDirectoryListing(searchIndex: any[], dirPath: string) {
	const items = [];
	const seenItems = new Set();
	
	// Find all items in this directory - exclude notepad entries, only show actual files
	for (const item of searchIndex) {
		// Skip notepad entries - we only want actual files for the browser
		if (item.type === 'notepad') continue;
		
		if (item.filePath) {
			const normalizedPath = item.filePath.replace(/\\/g, '/');
			const relativePath = normalizedPath.replace('scripts/', '');
			const pathParts = relativePath.split('/');
			
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
				if (readmeItem.type === 'readme') {
					// Load processed HTML for README files
					const readmeFileName = readmeItem.filePath.replace(/[\\/\\\\]/g, '_') + '.html';
					const readmeContentPath = join(process.cwd(), 'static', 'data', 'readmes', readmeFileName);
					readmeContent = await readFile(readmeContentPath, 'utf-8');
				} else {
					// Load and process raw markdown
					const content = await readFile(readmeItem.filePath, 'utf-8');
					readmeContent = marked(content);
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