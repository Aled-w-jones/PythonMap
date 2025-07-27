#!/usr/bin/env node

import { readFile, writeFile, readdir, stat, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { marked } from 'marked';

async function buildSearchIndex() {
    const searchIndex = [];
    
    try {
        // Load notepads metadata from Astro content collection
        const notepadsDir = 'src/content/notepads';
        const notepadFiles = await readdir(notepadsDir);
        const notepads = [];
        
        // Read all notepad JSON files
        for (const file of notepadFiles) {
            if (file.endsWith('.json')) {
                const notepadData = await readFile(join(notepadsDir, file), 'utf-8');
                const notepad = JSON.parse(notepadData);
                notepads.push(notepad);
            }
        }
        
        // Index notepad content
        for (const notepad of notepads) {
            try {
                const content = await readFile(notepad.filePath, 'utf-8');
                
                searchIndex.push({
                    type: 'notepad',
                    id: notepad.id,
                    title: notepad.title,
                    description: notepad.description,
                    tags: notepad.tags,
                    filePath: notepad.filePath,
                    url: `/notepads/${notepad.id}`
                });
            } catch (error) {
                console.warn(`Warning: Could not read ${notepad.filePath}`);
            }
        }
        
        // Index all files in scripts directory
        await indexDirectory('scripts', searchIndex);
        
        // Write search index to public directory (Astro static files)
        await mkdir('public/data', { recursive: true });
        await writeFile('public/data/search_index.json', JSON.stringify(searchIndex, null, 2));
        
        console.log(`Search index built with ${searchIndex.length} items`);
        console.log('Search index written to public/data/search_index.json');
        
    } catch (error) {
        console.error('Error building search index:', error);
        process.exit(1);
    }
}

async function indexDirectory(dirPath, searchIndex, basePath = '') {
    try {
        const items = await readdir(dirPath);
        
        for (const item of items) {
            // Skip hidden directories and annotation directories
            if (item.startsWith('.') || item === '.annotations') {
                continue;
            }
            
            const fullPath = join(dirPath, item);
            const relativePath = basePath ? `${basePath}/${item}` : item;
            
            try {
                const stats = await stat(fullPath);
                
                if (stats.isDirectory()) {
                    // Check for README in directory
                    const readmePath = join(fullPath, 'README.md');
                    try {
                        const readmeContent = await readFile(readmePath, 'utf-8');
                        const processedReadmeContent = marked(readmeContent);
                        searchIndex.push({
                            type: 'readme',
                            title: `README - ${item}`,
                            description: `README file for ${item} directory`,
                            filePath: readmePath,
                            url: `/browser/${relativePath}`
                        });
                    } catch {
                        // No README, that's fine
                    }
                    
                    // Recursively index subdirectory
                    await indexDirectory(fullPath, searchIndex, relativePath);
                    
                } else if (stats.isFile()) {
                    const extension = extname(item).toLowerCase();
                    
                    // Index certain file types
                    if (['.py', '.js', '.md', '.txt', '.json'].includes(extension)) {
                        try {
                            const content = await readFile(fullPath, 'utf-8');
                            const type = extension === '.py' ? 'python' : 
                                       extension === '.md' ? 'markdown' : 
                                       extension === '.js' ? 'javascript' : 
                                       extension === '.json' ? 'json' : 'file';
                            
                            searchIndex.push({
                                type: type,
                                title: item,
                                description: `${type} file in ${basePath || 'scripts'}`,
                                filePath: fullPath,
                                url: `/browser/${relativePath}`
                            });
                            
                            // If this is a README markdown file (but not the standard README.md), 
                            // also create a processed HTML version for split view
                            if (extension === '.md' && item.toLowerCase().includes('readme') && item.toLowerCase() !== 'readme.md') {
                                const processedContent = marked(content);
                                searchIndex.push({
                                    type: 'readme',
                                    title: `README - ${item.replace(/\.md$/i, '')}`,
                                    description: `Processed README file for ${item}`,
                                    filePath: fullPath,
                                    url: `/browser/${relativePath}`
                                });
                            }
                        } catch (error) {
                            console.warn(`Warning: Could not read ${fullPath}`);
                        }
                    }
                }
            } catch (error) {
                console.warn(`Warning: Could not access ${fullPath}`);
            }
        }
    } catch (error) {
        console.warn(`Warning: Could not read directory ${dirPath}`);
    }
}

buildSearchIndex();