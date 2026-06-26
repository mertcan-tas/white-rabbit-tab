import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, 'dist', 'index.html');

if (!fs.existsSync(filePath)) {
  console.error('dist/index.html not found. Please run build first.');
  process.exit(1);
}

let html = fs.readFileSync(filePath, 'utf-8');

// Remove entire `<link rel="preload" ...>` tags (and their leading
// indentation / trailing newline) so no dead <link> elements are left behind.
html = html.replace(/[ \t]*<link\b[^>]*\brel\s*=\s*["']preload["'][^>]*>[ \t]*\n?/gi, '');

// Collapse any blank line left where the preload block used to be.
html = html.replace(/(<head>\s*\n)\s*\n+/i, '$1');

fs.writeFileSync(filePath, html, 'utf-8');

console.log('✅ All `rel="preload"` <link> tags have been removed.');