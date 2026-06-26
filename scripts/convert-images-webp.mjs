import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const defaultRoot = path.join(projectRoot, 'public');
const imageExtensions = new Set(['.jpg', '.jpeg', '.png']);
const quality = Number(process.env.WEBP_QUALITY || 82);

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    root: defaultRoot,
    force: false,
  };

  for (const arg of args) {
    if (arg === '--force') {
      options.force = true;
    } else {
      options.root = path.resolve(projectRoot, arg);
    }
  }

  return options;
}

async function collectImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const images = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      images.push(...await collectImages(fullPath));
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (entry.isFile() && imageExtensions.has(extension)) {
      images.push(fullPath);
    }
  }

  return images;
}

async function shouldConvert(source, target, force) {
  if (force) return true;

  try {
    const [sourceInfo, targetInfo] = await Promise.all([stat(source), stat(target)]);
    return sourceInfo.mtimeMs > targetInfo.mtimeMs;
  } catch {
    return true;
  }
}

function convertImage(source, target) {
  return new Promise((resolve, reject) => {
    const child = spawn('cwebp', ['-quiet', '-q', String(quality), source, '-o', target], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr || `cwebp exited with code ${code}`));
      }
    });
  });
}

async function main() {
  const { root, force } = parseArgs();
  const images = await collectImages(root);
  let converted = 0;
  let skipped = 0;

  for (const source of images) {
    const target = source.replace(/\.(jpe?g|png)$/i, '.webp');
    if (!await shouldConvert(source, target, force)) {
      skipped += 1;
      continue;
    }

    await convertImage(source, target);
    converted += 1;
  }

  console.log(`Scanned ${images.length} images in ${path.relative(projectRoot, root) || '.'}.`);
  console.log(`Converted ${converted} image${converted === 1 ? '' : 's'} to WebP.`);
  console.log(`Skipped ${skipped} up-to-date WebP file${skipped === 1 ? '' : 's'}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
