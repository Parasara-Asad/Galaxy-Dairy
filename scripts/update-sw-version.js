import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swPath = path.join(__dirname, '../dist/sw.js');

if (fs.existsSync(swPath)) {
  let content = fs.readFileSync(swPath, 'utf8');
  const timestamp = Date.now();
  // Prepend a build timestamp to force browser update detection
  content = `// Build timestamp: ${timestamp}\n` + content;
  fs.writeFileSync(swPath, content, 'utf8');
  console.log(`Successfully updated dist/sw.js with build timestamp: ${timestamp}`);
} else {
  console.error('Error: dist/sw.js not found!');
  process.exit(1);
}
