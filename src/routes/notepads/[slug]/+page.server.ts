import { readFile } from 'fs/promises';
import { error } from '@sveltejs/kit';
import { marked } from 'marked';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		// Load notepads metadata
		const notepadsData = await readFile('data/notepads.json', 'utf-8');
		const notepads = JSON.parse(notepadsData);
		
		// Find the requested notepad
		const notepad = notepads.find((n: any) => n.id === params.slug);
		
		if (!notepad) {
			throw error(404, 'Notepad not found');
		}
		
		// Load the actual Python file content
		const content = await readFile(notepad.filePath, 'utf-8');
		
		// Load README file if it exists
		let readmeContent = null;
		if (notepad.readmeFile) {
			try {
				const readmeText = await readFile(notepad.readmeFile, 'utf-8');
				readmeContent = marked(readmeText);
			} catch (readmeError) {
				console.warn(`Warning: Could not load README file ${notepad.readmeFile}`);
			}
		}
		
		return {
			notepad,
			content,
			readmeContent
		};
	} catch (err) {
		console.error('Error loading notepad:', err);
		throw error(404, 'Notepad not found');
	}
};