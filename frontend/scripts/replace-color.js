const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src');
const exts = new Set(['.js', '.jsx', '.ts', '.tsx', '.css']);
let filesChanged = 0;
let filesScanned = 0;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else {
      const ext = path.extname(entry.name).toLowerCase();
      if (exts.has(ext)) processFile(full);
    }
  }
}

function processFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  filesScanned++;
  const before = src;

  // Replacements
  src = src.replace(/bg-\[#60A5FA\]\/10/g, 'bg-accent/10');
  src = src.replace(/hover:bg-\[#60A5FA\]\/10/g, 'hover:bg-accent/10');
  src = src.replace(/bg-\[#60A5FA\]/g, 'bg-accent');
  src = src.replace(/text-\[#60A5FA\]/g, 'text-accent');
  src = src.replace(/border-\[#60A5FA\]/g, 'border-accent');
  src = src.replace(/focus:border-\[#60A5FA\]/g, 'focus:border-accent');
  src = src.replace(/hover:border-\[#60A5FA\]/g, 'hover:border-accent');
  src = src.replace(/bg-\[#60A5FA\] text/g, 'bg-accent text');
  src = src.replace(/bg-\[#60A5FA\]\/10/g, 'bg-accent/10');

  // inline style backgroundColor: '#60A5FA' -> var
  src = src.replace(/backgroundColor:\s*'\s*#60A5FA\s*'/g, "backgroundColor: 'var(--color-accent)'");
  src = src.replace(/backgroundColor:\s*\"\s*#60A5FA\s*\"/g, 'backgroundColor: "var(--color-accent)"');

  // Replace any remaining raw hex occurrences cautiously: only replace when not inside className patterns (best-effort)
  // We'll replace exact '#60A5FA' with 'var(--color-accent)'
  src = src.replace(/#60A5FA/g, 'var(--color-accent)');

  if (src !== before) {
    fs.writeFileSync(filePath, src, 'utf8');
    filesChanged++;
    console.log('Updated:', path.relative(process.cwd(), filePath));
  }
}

walk(root);
console.log('\nScanned files:', filesScanned);
console.log('Files changed:', filesChanged);
