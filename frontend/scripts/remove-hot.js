const fs = require('fs');
const path = require('path');

try {
  const hotPath = path.resolve(__dirname, '../..', 'backend', 'public', 'hot');
  if (fs.existsSync(hotPath)) {
    fs.unlinkSync(hotPath);
    console.log(`Removed hot file at ${hotPath}`);
  } else {
    console.log('No hot file to remove.');
  }
} catch (err) {
  console.error('Failed to remove hot file:', err);
  process.exitCode = 1;
}
