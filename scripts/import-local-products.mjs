import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(projectRoot, '..');
const sourceRoot = path.join(workspaceRoot, 'products');
const publicProductsRoot = path.join(projectRoot, 'public', 'products');
const outputFile = path.join(projectRoot, 'src', 'importedProducts.js');
const jsonOutputFile = path.join(projectRoot, 'supabase', 'import-products.json');

const teamSlugByName = {
  argentina: 'argentina',
  belgium: 'belgium',
  brazil: 'brazil',
  croatia: 'croatia',
  england: 'england',
  france: 'france',
  germany: 'germany',
  italy: 'italy',
  mexico: 'mexico',
  netherlands: 'netherlands',
  portugal: 'portugal',
  spain: 'spain',
};

const teamDisplayBySlug = {
  argentina: 'Argentina',
  belgium: 'Belgium',
  brazil: 'Brazil',
  croatia: 'Croatia',
  england: 'England',
  france: 'France',
  germany: 'Germany',
  italy: 'Italy',
  mexico: 'Mexico',
  netherlands: 'Netherlands',
  portugal: 'Portugal',
  spain: 'Spain',
};

const colorByTeam = {
  argentina: '#75b9e7',
  belgium: '#171717',
  brazil: '#f5d22e',
  croatia: '#d61f35',
  england: '#f4f4f2',
  france: '#133a8a',
  germany: '#171717',
  italy: '#1765ab',
  mexico: '#087b4b',
  netherlands: '#f36d21',
  portugal: '#ce1733',
  spain: '#df2638',
};

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function detectTeam(metadata) {
  const text = `${metadata.team_name_english || ''} ${metadata.folder_name || ''}`.toLowerCase();
  return Object.keys(teamSlugByName).find((team) => text.includes(team)) || 'germany';
}

function detectProductLabel(metadata, teamName) {
  const album = metadata.album_name || metadata.folder_name || '';
  const lower = `${album} ${metadata.folder_name || ''}`.toLowerCase();
  const year = album.includes('2526') ? '2025/26' : '2026';

  if (album.includes('半拉') || lower.includes('half pull')) return `${teamName} White Half-Zip Training Top`;
  if (album.includes('童装')) return `${teamName} Kids Jersey ${year}`;
  if (album.includes('二客') || lower.includes('second passenger')) return `${teamName} Third Jersey ${year}`;
  if (album.includes('客场')) return `${teamName} Away Jersey ${year}`;
  if (album.includes('主场')) return `${teamName} Home Jersey ${year}`;
  return `${teamName} Jersey ${year}`;
}

function sortFiles(files) {
  return files.sort((a, b) => {
    if (a === 'primary.jpg') return -1;
    if (b === 'primary.jpg') return 1;
    return a.localeCompare(b, undefined, { numeric: true });
  });
}

async function main() {
  await mkdir(publicProductsRoot, { recursive: true });
  await mkdir(path.dirname(jsonOutputFile), { recursive: true });

  const folders = (await readdir(sourceRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const products = [];

  for (const [index, folder] of folders.entries()) {
    const folderPath = path.join(sourceRoot, folder);
    const metadata = JSON.parse(await readFile(path.join(folderPath, 'metadata.json'), 'utf8'));
    const teamSlug = detectTeam(metadata);
    const teamName = teamDisplayBySlug[teamSlug];
    const productName = detectProductLabel(metadata, teamName);
    const productSlug = `imported-${slugify(folder)}`;
    const files = sortFiles((await readdir(folderPath)).filter((file) => /\.(jpe?g|png|webp|gif)$/i.test(file)));
    const gallery = [];

    for (const file of files) {
      const extension = path.extname(file).toLowerCase();
      const source = path.join(folderPath, file);
      const label = file === 'primary.jpg' ? 'primary' : path.basename(file, extension);
      const targetName = `${productSlug}-${label}${extension}`;
      await copyFile(source, path.join(publicProductsRoot, targetName));
      gallery.push(`/products/${targetName}`);
    }

    products.push({
      id: productSlug,
      teamId: teamSlug,
      category: 'Jerseys',
      name: productName,
      price: productName.includes('Kids') ? 74 : productName.includes('Training') ? 94 : 89,
      oldPrice: null,
      image: gallery[0],
      gallery,
      badge: index < 8 ? 'New' : null,
      color: colorByTeam[teamSlug] || '#171816',
      description: metadata.album_name,
      sourceUrl: metadata.source_url,
    });
  }

  const moduleContent = `export const importedProducts = ${JSON.stringify(products, null, 2)};\n`;
  await writeFile(outputFile, moduleContent);

  const supabaseRows = products.map((product, index) => ({
    slug: product.id,
    team_slug: product.teamId,
    category_name: product.category,
    name: product.name,
    description: product.description,
    price: product.price,
    old_price: product.oldPrice,
    primary_image_url: product.image,
    gallery: product.gallery,
    badge: product.badge,
    color: product.color,
    sort_order: 500 + index,
    is_active: true,
  }));

  await writeFile(jsonOutputFile, JSON.stringify(supabaseRows, null, 2));
  console.log(`Imported ${products.length} products.`);
  console.log(`Copied images to ${publicProductsRoot}`);
  console.log(`Wrote ${path.relative(projectRoot, outputFile)} and ${path.relative(projectRoot, jsonOutputFile)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
