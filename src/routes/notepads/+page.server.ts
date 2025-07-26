import fs from 'fs';
import path from 'path';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		// Read notepads data at BUILD time, not runtime
		const notepadsPath = path.join(process.cwd(), 'data', 'notepads.json');
		const notepadsData = fs.readFileSync(notepadsPath, 'utf-8');
		const notepads = JSON.parse(notepadsData);

		return {
			notepads
		};
	} catch (error) {
		console.error('Error loading notepads data:', error);
		return {
			notepads: []
		};
	}
};