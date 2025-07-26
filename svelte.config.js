import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const dev = process.argv.includes('dev');
const base = dev ? '' : (process.env.BASE_PATH || '').replace(/\/$/, '');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: null,
			precompress: false,
			strict: true
		}),
		paths: {
			base: base
		},
		serviceWorker: {
			register: false
		},
		prerender: {
			handleHttpError: 'warn',
			handleMissingId: 'warn',
			entries: [
				'/',
				'/notepads',
				'/browser',
				'/browser/scripts',
				'/browser/scripts/arcgis_utils.py',
				'/browser/scripts/project_x',
				'/browser/scripts/project_x/util.py',
				'/browser/scripts/project_x/README.md',
				'/browser/scripts/project_y',
				'/browser/scripts/project_y/data_analyzer.py',
				'/browser/scripts/project_y/README.md',
				'/notepads/arcgis_utils',
				'/notepads/data_analysis_utils',
				'/notepads/web_scraper_processor',
				'/notepads/advanced_data_analytics'
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