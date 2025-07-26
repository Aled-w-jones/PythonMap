import fs from 'fs';
import path from 'path';
import type { LayoutServerLoad } from './$types';

export const prerender = true;

export const load: LayoutServerLoad = async () => {
	try {
		// Embed search index at build time - no runtime fetch needed!
		const searchIndexPath = path.join(process.cwd(), 'data', 'search_index.json');
		const searchIndexData = fs.readFileSync(searchIndexPath, 'utf-8');
		const searchIndex = JSON.parse(searchIndexData);

		return {
			searchIndex
		};
	} catch (error) {
		console.error('Error loading search index:', error);
		return {
			searchIndex: []
		};
	}
};