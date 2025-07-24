import { readFile, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { error } from '@sveltejs/kit';
import { marked } from 'marked';
import type { PageServerLoad } from './$types';

interface FileSystemItem {
	name: string;
	type: 'file' | 'directory';
	path: string;
	size?: number;
	extension?: string;
}

export const load: PageServerLoad = async ({ params }) => {
	const requestedPath = params.path || '';
	const fullPath = requestedPath ? join(requestedPath) : '.';
	
	try {
		const stats = await stat(fullPath);
		
		if (stats.isDirectory()) {
			// Directory listing
			const items = await readdir(fullPath);
			const fileSystemItems: FileSystemItem[] = [];
			
			// Check for README.md in this directory
			let readmeContent = null;
			const readmePath = join(fullPath, 'README.md');
			
			try {
				const readme = await readFile(readmePath, 'utf-8');
				readmeContent = marked(readme);
			} catch {
				// README doesn't exist, that's fine
			}
			
			// Process each item in the directory
			for (const item of items) {
				const itemPath = join(fullPath, item);
				try {
					const itemStats = await stat(itemPath);
					const extension = item.includes('.') ? item.split('.').pop() : undefined;
					
					fileSystemItems.push({
						name: item,
						type: itemStats.isDirectory() ? 'directory' : 'file',
						path: requestedPath ? `${requestedPath}/${item}` : item,
						size: itemStats.isFile() ? itemStats.size : undefined,
						extension
					});
				} catch {
					// Skip items we can't access
				}
			}
			
			// Sort items: directories first, then files, both alphabetically
			fileSystemItems.sort((a, b) => {
				if (a.type !== b.type) {
					return a.type === 'directory' ? -1 : 1;
				}
				return a.name.localeCompare(b.name);
			});
			
			return {
				type: 'directory',
				path: requestedPath || '.',
				items: fileSystemItems,
				readmeContent,
				breadcrumbs: requestedPath.split('/').filter(Boolean)
			};
		} else {
			// File content
			const content = await readFile(fullPath, 'utf-8');
			const extension = fullPath.includes('.') ? fullPath.split('.').pop() : undefined;
			const fileName = fullPath.split('/').pop() || fullPath.split('\\').pop() || fullPath;
			
			// For any file, check if there's a README.md in the same directory
			let readmeContent = null;
			
			try {
				const parentDir = dirname(fullPath);
				const baseFileName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
				
				// Try different README patterns
				const readmePatterns = [
					'README.md',                          // Standard README.md
					`${baseFileName}_README.md`,          // script_a_README.md
					`README_${baseFileName}.md`,          // README_script_a.md
					`${baseFileName}.README.md`           // script_a.README.md
				];
				
				// Try in current directory first
				for (const pattern of readmePatterns) {
					try {
						const readmePath = join(parentDir, pattern);
						console.log(`Trying README path: ${readmePath} for file: ${fullPath}`); // Debug log
						const readme = await readFile(readmePath, 'utf-8');
						readmeContent = marked(readme); // Render markdown to HTML for code files
						console.log(`Found README: ${readmePath}`); // Debug log
						break; // Found one, stop looking
					} catch (err) {
						console.log(`README not found at: ${join(parentDir, pattern)}`); // Debug log
						// This pattern doesn't exist, try next
					}
				}
				
				// If not found in current directory, try root directory (for files in subdirectories)
				if (!readmeContent && parentDir !== '.') {
					console.log(`Trying root directory for README patterns...`); // Debug log
					for (const pattern of readmePatterns) {
						try {
							const readmePath = join('.', pattern);
							console.log(`Trying root README path: ${readmePath}`); // Debug log
							const readme = await readFile(readmePath, 'utf-8');
							readmeContent = marked(readme); // Render markdown to HTML for code files
							console.log(`Found README in root: ${readmePath}`); // Debug log
							break; // Found one, stop looking
						} catch (err) {
							console.log(`README not found in root at: ${pattern}`); // Debug log
							// This pattern doesn't exist, try next
						}
					}
				}
			} catch (err) {
				console.log(`Error reading directory: ${err}`); // Debug log
				// Could not read directory, that's fine
			}
			
			return {
				type: 'file',
				path: requestedPath,
				content,
				extension,
				name: fileName,
				breadcrumbs: requestedPath.split('/').filter(Boolean),
				readmeContent // README content for split view
			};
		}
	} catch (err) {
		console.error('Error accessing path:', err);
		throw error(404, 'Path not found');
	}
};