#!/usr/bin/env node

import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, extname } from 'path';

async function buildSearchIndex() {
    const searchIndex = [];
    
    try {
        // Load notepads metadata
        const notepadsData = await readFile('data/notepads.json', 'utf-8');
        const notepads = JSON.parse(notepadsData);
        
        // Index notepad content
        for (const notepad of notepads) {
            try {
                const content = await readFile(notepad.filePath, 'utf-8');
                
                searchIndex.push({
                    type: 'notepad',
                    id: notepad.id,
                    title: notepad.title,
                    description: notepad.description,
                    content: content,
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
        
        // Write search index to both data directory and static directory
        await writeFile('data/search_index.json', JSON.stringify(searchIndex, null, 2));
        await writeFile('static/data/search_index.json', JSON.stringify(searchIndex, null, 2));
        
        // Also copy notepads.json to static directory for client-side access
        const notepadsFileData = await readFile('data/notepads.json', 'utf-8');
        await writeFile('static/data/notepads.json', notepadsFileData);
        
        console.log(`Search index built with ${searchIndex.length} items`);
        console.log('Notepads data copied to static directory');
        
    } catch (error) {
        console.error('Error building search index:', error);
        process.exit(1);
    }
}

async function indexDirectory(dirPath, searchIndex, basePath = '') {
    try {
        const items = await readdir(dirPath);
        
        for (const item of items) {
            const fullPath = join(dirPath, item);
            const relativePath = basePath ? `${basePath}/${item}` : item;
            
            try {
                const stats = await stat(fullPath);
                
                if (stats.isDirectory()) {
                    // Check for README in directory
                    const readmePath = join(fullPath, 'README.md');
                    try {
                        const readmeContent = await readFile(readmePath, 'utf-8');
                        searchIndex.push({
                            type: 'readme',
                            title: `README - ${item}`,
                            description: `README file for ${item} directory`,
                            content: readmeContent,
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
                                       extension === '.js' ? 'javascript' : 'file';
                            
                            searchIndex.push({
                                type: type,
                                title: item,
                                description: `${type} file in ${basePath || 'scripts'}`,
                                content: content,
                                filePath: fullPath,
                                url: `/browser/${relativePath}`
                            });
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