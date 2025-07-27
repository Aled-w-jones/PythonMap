import { readFile } from 'fs/promises';
import { marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';

// Register languages
hljs.registerLanguage('python', python);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('markdown', markdown);

export interface ProcessedFile {
  content: string;
  html?: string;
  language?: string;
  type: 'python' | 'markdown' | 'json' | 'javascript' | 'text';
}

export async function processFile(filePath: string): Promise<ProcessedFile> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    let type: ProcessedFile['type'] = 'text';
    let language = '';
    let html = '';
    
    switch (extension) {
      case 'py':
        type = 'python';
        language = 'python';
        html = hljs.highlight(content, { language: 'python' }).value;
        break;
      case 'js':
        type = 'javascript';
        language = 'javascript';
        html = hljs.highlight(content, { language: 'javascript' }).value;
        break;
      case 'json':
        type = 'json';
        language = 'json';
        html = hljs.highlight(content, { language: 'json' }).value;
        break;
      case 'md':
        type = 'markdown';
        html = marked(content);
        break;
      default:
        html = `<pre><code>${escapeHtml(content)}</code></pre>`;
    }
    
    return {
      content,
      html,
      language,
      type
    };
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    throw error;
  }
}

export async function processMarkdown(content: string): Promise<string> {
  return marked(content);
}

export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export function getLanguageFromExtension(extension: string): string {
  switch (extension.toLowerCase()) {
    case 'py':
      return 'python';
    case 'js':
      return 'javascript';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    default:
      return 'text';
  }
}

export function getFileType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();
  return getLanguageFromExtension(extension || '');
}