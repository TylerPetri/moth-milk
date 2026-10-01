// Remove only files replaced by this migration, when their TS counterpart exists.
import { existsSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const apply = process.argv.includes('--apply');
const candidates: string[] = [];
function visit(directory: string): void {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) visit(path);
    else if (entry.name.endsWith('.js') && existsSync(path.slice(0, -3) + '.ts')) candidates.push(path);
  }
}
for (const directory of ['src', 'tests', 'e2e']) visit(join(root, directory));
for (const name of ['svelte.config', 'vite.config', 'playwright.config', 'playwright.live.config', 'jsconfig']) {
  const path = join(root, name + '.js');
  if (existsSync(path) && existsSync(join(root, name + '.ts'))) candidates.push(path);
}
const oldConfig = join(root, 'jsconfig.json');
if (existsSync(oldConfig) && existsSync(join(root, 'tsconfig.json'))) candidates.push(oldConfig);
for (const path of candidates) {
  if (apply) unlinkSync(path);
  console.log(`${apply ? 'Removed' : 'Would remove'} ${relative(root, path)}`);
}
if (!candidates.length) console.log('No replaced JavaScript files remain.');
