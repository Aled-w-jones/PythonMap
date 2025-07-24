import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const dev = process.argv.includes('dev');
const base = dev ? '' : process.env.BASE_PATH || '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: false
		}),
		base: base,
		paths: {
			base: base
		},
		prerender: {
			handleHttpError: 'warn',
			entries: [
				'/',
				'/notepads',
				'/browser',
				'/browser/scripts',
				'/notepads/file_automation',
				'/notepads/data_analysis_utils'
			]
		}
	}
};

export default config;