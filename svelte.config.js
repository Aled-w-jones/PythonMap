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
			fallback: '404.html',
			precompress: false,
			strict: false
		}),
		paths: {
			base: base
		},
		serviceWorker: {
			register: false
		},
		prerender: {
			handleHttpError: 'warn',
			entries: [
				'/',
				'/notepads',
				'/browser',
				'/browser/scripts',
				'/browser/scripts/script_a.py',
				'/browser/scripts/project_x',
				'/browser/scripts/project_x/util.py',
				'/browser/scripts/project_x/README.md',
				'/notepads/file_automation',
				'/notepads/data_analysis_utils'
			],
			crawl: true
		},
		csp: {
			directives: {
				'script-src': ['self', 'https://static.cloudflareinsights.com']
			}
		}
	}
};

export default config;