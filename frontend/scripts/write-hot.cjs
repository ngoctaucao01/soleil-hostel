const fs = require('fs');
const path = require('path');


// Sử dụng đường dẫn trong thư mục frontend
const hotFilePath = path.join(__dirname, '../hot');

// Write a hot file that Laravel uses to detect the Vite dev server for HMR
try {
	const projectRoot = path.resolve(__dirname, '..', '..');
	const candidates = [
		path.join(projectRoot, 'backend', 'public', 'hot'),
		path.join(projectRoot, '..', 'backend', 'public', 'hot'),
		// fallback: write to frontend public folder so container-local tooling can still find it
		path.join(projectRoot, 'frontend-hot')
	];
	const url = 'http://localhost:3000';

	let written = false;
	for (const hotPath of candidates) {
		try {
			const dir = path.dirname(hotPath);
			if (!fs.existsSync(dir)) {
				// don't attempt to create host backend dirs that aren't mounted in this container
				continue;
			}
			fs.writeFileSync(hotPath, url, { encoding: 'utf8' });
			console.log(`Wrote hot file to ${hotPath} -> ${url}`);
			written = true;
			break;
		} catch (e) {
			// try next candidate
		}
	}

	if (!written) {
		console.log('No valid backend/public path found from frontend container; skipping hot file write.');
	}
} catch (err) {
	console.error('Failed to write hot file:', err);
	process.exitCode = 1;
}

