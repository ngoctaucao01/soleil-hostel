// Compatibility entry for Laravel's @vite('resources/js/app.js') in dev mode
// Import the real frontend entry using a relative path so Vite's plugin-react sees and transforms it
import '../../src/main.tsx';
