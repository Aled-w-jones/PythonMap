#!/usr/bin/env node

import { readFile, writeFile, readdir, stat, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { marked } from 'marked';

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
        
        // Note: notepads.json is now embedded at build time, no longer copied to static
        // const notepadsFileData = await readFile('data/notepads.json', 'utf-8');
        // await writeFile('static/data/notepads.json', notepadsFileData);
        
        // Create static files for script content and README files
        await createStaticContentFiles(notepads);
        
        // Create static files for all indexed files (including JSON, etc.)
        await createStaticFilesForAllIndexedFiles(searchIndex);
        
        console.log(`Search index built with ${searchIndex.length} items`);
        console.log('Notepads data embedded at build time (no static copy needed)');
        console.log('Static content files created');
        
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

async function createStaticContentFiles(notepads) {
    try {
        // Ensure directories exist
        await mkdir('static/data/scripts', { recursive: true });
        await mkdir('static/data/readmes', { recursive: true });
        await mkdir('static/data/annotations', { recursive: true });
        
        for (const notepad of notepads) {
            try {
                // Create static file for script content
                const content = await readFile(notepad.filePath, 'utf-8');
                const scriptFileName = notepad.filePath.replace(/[\/\\]/g, '_') + '.txt';
                await writeFile(`static/data/scripts/${scriptFileName}`, content);
                
                // Create static file for README if exists
                if (notepad.readmeFile) {
                    try {
                        const readmeText = await readFile(notepad.readmeFile, 'utf-8');
                        const readmeHtml = marked(readmeText);
                        const readmeFileName = notepad.readmeFile.replace(/[\/\\]/g, '_') + '.html';
                        await writeFile(`static/data/readmes/${readmeFileName}`, readmeHtml);
                    } catch (readmeError) {
                        console.warn(`Warning: Could not process README file ${notepad.readmeFile}`);
                    }
                }
                
                // Create static file for annotations if exists
                if (notepad.annotationsFile) {
                    try {
                        const annotationsText = await readFile(notepad.annotationsFile, 'utf-8');
                        const annotationsFileName = notepad.annotationsFile.replace(/[\/\\]/g, '_');
                        await writeFile(`static/data/annotations/${annotationsFileName}`, annotationsText);
                    } catch (annotationsError) {
                        console.warn(`Warning: Could not process annotations file ${notepad.annotationsFile}`);
                    }
                }
            } catch (error) {
                console.warn(`Warning: Could not create static files for ${notepad.filePath}`);
            }
        }
    } catch (error) {
        console.error('Error creating static content files:', error);
    }
}

async function createStaticFilesForAllIndexedFiles(searchIndex) {
    try {
        // Ensure directories exist
        await mkdir('static/data/scripts', { recursive: true });
        
        // Process all indexed files that aren't already handled by createStaticContentFiles
        for (const item of searchIndex) {
            // Skip notepad entries (handled by createStaticContentFiles)
            // Skip readme entries (also handled by createStaticContentFiles)
            if (item.type === 'notepad' || item.type === 'readme') {
                continue;
            }
            
            // Handle other file types (json, python, javascript, markdown that aren't READMEs, etc.)
            if (item.filePath && ['python', 'javascript', 'json', 'markdown', 'file'].includes(item.type)) {
                try {
                    const content = await readFile(item.filePath, 'utf-8');
                    const staticFileName = item.filePath.replace(/[\/\\]/g, '_') + '.txt';
                    await writeFile(`static/data/scripts/${staticFileName}`, content);
                } catch (error) {
                    console.warn(`Warning: Could not create static file for ${item.filePath}`);
                }
            }
        }
    } catch (error) {
        console.error('Error creating static files for indexed files:', error);
    }
}

buildSearchIndex();