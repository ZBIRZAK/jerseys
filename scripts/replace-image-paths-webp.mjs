import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const publicRoot = path.join(projectRoot, 'public');

const filesToUpdate = [
  'src/data.js',
  'src/importedProducts.js',
  'src/importedTracksuits.js',
  'supabase/import-products.json',
  'supabase/import-tracksuits.json',
];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function toWebpIfAvailable(publicPath) {
  const webpPath = publicPath.replace(/\.(jpe?g|png)$/i, '.webp');
  if (webpPath === publicPath) return publicPath;

  const diskPath = path.join(publicRoot, webpPath.replace(/^\//, ''));
  return await exists(diskPath) ? webpPath : publicPath;
}

async function main() {
  let totalReplacements = 0;

  for (const relativeFile of filesToUpdate) {
    const filePath = path.join(projectRoot, relativeFile);
    let content = await readFile(filePath, 'utf8');
    const matches = [...content.matchAll(/(['"])(\/[^'"]+\.(?:jpe?g|png))\1/gi)];
    let replacements = 0;

    for (const match of matches) {
      const [fullMatch, quote, publicPath] = match;
      const webpPath = await toWebpIfAvailable(publicPath);
      if (webpPath === publicPath) continue;
      content = content.replaceAll(fullMatch, `${quote}${webpPath}${quote}`);
      replacements += 1;
    }

    if (replacements) {
      await writeFile(filePath, content);
    }

    totalReplacements += replacements;
    console.log(`${relativeFile}: ${replacements} replacement${replacements === 1 ? '' : 's'}`);
  }

  console.log(`Total replacements: ${totalReplacements}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
