import { error } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Load notepad data
async function loadNotepads() {
	try {
		const notepadsPath = join(process.cwd(), 'data', 'notepads.json');
		const notepadsData = await readFile(notepadsPath, 'utf-8');
		return JSON.parse(notepadsData);
	} catch (err) {
		console.error('Error loading notepads:', err);
		return [];
	}
}

// Load file content
async function loadFileContent(filePath: string) {
	try {
		const fullPath = join(process.cwd(), filePath);
		return await readFile(fullPath, 'utf-8');
	} catch (err) {
		console.error('Error loading file:', filePath, err);
		return null;
	}
}

export async function load({ params }) {
	const notepads = await loadNotepads();
	const notepad = notepads.find((n: any) => n.id === params.slug);
	
	if (!notepad) {
		error(404, 'Notepad not found');
	}
	
	// Load the script content
	const content = await loadFileContent(notepad.filePath);
	if (!content) {
		error(500, 'Could not load script content');
	}
	
	// Load README content if it exists (from processed HTML files)
	let readmeContent = null;
	if (notepad.readmeFile) {
		// Convert path to the processed HTML filename
		const processedReadmeFile = `static/data/readmes/${notepad.readmeFile.replace(/[\/\\]/g, '_')}.html`;
		readmeContent = await loadFileContent(processedReadmeFile);
	}
	
	// Load annotations if they exist
	let annotationsData = null;
	if (notepad.annotationsFile) {
		const annotationsContent = await loadFileContent(notepad.annotationsFile);
		if (annotationsContent) {
			try {
				annotationsData = JSON.parse(annotationsContent);
			} catch (err) {
				console.error('Error parsing annotations:', notepad.annotationsFile, err);
			}
		}
	}
	
	return {
		notepad,
		content,
		readmeContent,
		annotations: annotationsData
	};
}