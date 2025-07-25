// Service Worker Registration
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		// For GitHub Pages: detect if we're in a subdirectory
		const pathname = window.location.pathname;
		const basePath = pathname.includes('/PythonMap') ? '/PythonMap' : '';
		
		navigator.serviceWorker.register(basePath + '/service-worker.js')
			.then((registration) => {
				console.log('[App] Service Worker registered:', registration.scope);
				
				// Listen for updates
				registration.addEventListener('updatefound', () => {
					console.log('[App] Service Worker update found');
				});
			})
			.catch((error) => {
				console.log('[App] Service Worker registration failed:', error);
			});
		
		// Listen for service worker messages
		navigator.serviceWorker.addEventListener('message', (event) => {
			console.log('[App] Message from service worker:', event.data);
		});
	});
}