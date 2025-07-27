import { readFile, writeFile, readdir, stat, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { marked } from 'marked';

export interface SearchIndexItem {
  type: 'notepad' | 'python' | 'markdown' | 'json' | 'readme' | 'javascript' | 'file';
  id?: string;
  title: string;
  description: string;
  tags?: string[];
  filePath: string;
  url: string;
  content?: string;
}

export async function buildSearchIndex(): Promise<SearchIndexItem[]> {
  const searchIndex: SearchIndexItem[] = [];
  
  try {
    // Load notepads from content collections
    const notepadsPath = 'src/content/notepads';
    const notepadFiles = await readdir(notepadsPath);
    
    for (const file of notepadFiles) {
      if (file.endsWith('.json')) {
        try {
          const notepadData = await readFile(join(notepadsPath, file), 'utf-8');
          const notepad = JSON.parse(notepadData);
          
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
          console.warn(`Warning: Could not read notepad file ${file}`);
        }
      }
    }
    
    // Index all files in scripts directory
    await indexDirectory('scripts', searchIndex);
    
    // Ensure public/data directory exists
    await mkdir('public/data', { recursive: true });
    
    // Write search index to public directory for static serving
    await writeFile('public/data/search_index.json', JSON.stringify(searchIndex, null, 2));
    
    console.log(`Search index built with ${searchIndex.length} items`);
    
    return searchIndex;
  } catch (error) {
    console.error('Error building search index:', error);
    throw error;
  }
}

async function indexDirectory(dirPath: string, searchIndex: SearchIndexItem[], basePath = '') {
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
                type: type as any,
                title: item,
                description: `${type} file in ${basePath || 'scripts'}`,
                filePath: fullPath,
                url: `/browser/${relativePath}`,
                content: content
              });
              
              // Don't create duplicate entries for README files
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