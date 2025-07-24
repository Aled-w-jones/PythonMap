import { readFile } from 'fs/promises';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		const notepadsData = await readFile('data/notepads.json', 'utf-8');
		const notepads = JSON.parse(notepadsData);
		
		return {
			notepads
		};
	} catch (error) {
		console.error('Error loading notepads:', error);
		return {
			notepads: []
		};
	}
};