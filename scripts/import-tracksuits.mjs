import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(projectRoot, '..');
const sourceRoot = path.join(workspaceRoot, 'Tracksuits');
const publicProductsRoot = path.join(projectRoot, 'public', 'products', 'tracksuits');
const outputFile = path.join(projectRoot, 'src', 'importedTracksuits.js');
const jsonOutputFile = path.join(projectRoot, 'supabase', 'import-tracksuits.json');

const teamSlugByName = {
  argentina: 'argentina',
  brazil: 'brazil',
  england: 'england',
  france: 'france',
  netherlands: 'netherlands',
  nigeria: 'nigeria',
  norway: 'norway',
  usa: 'usa',
};

const teamDisplayBySlug = {
  argentina: 'Argentina',
  brazil: 'Brazil',
  england: 'England',
  france: 'France',
  netherlands: 'Netherlands',
  nigeria: 'Nigeria',
  norway: 'Norway',
  usa: 'USA',
};

const colorByTeam = {
  argentina: '#75b9e7',
  brazil: '#f5d22e',
  england: '#f4f4f2',
  france: '#133a8a',
  netherlands: '#f36d21',
  nigeria: '#12864b',
  norway: '#ba0c2f',
  usa: '#203e83',
};

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function detectTeam(metadata) {
  const text = `${metadata.team_name_english || ''} ${metadata.folder_name || ''}`.toLowerCase();
  return Object.keys(teamSlugByName).find((team) => text.includes(team)) || 'france';
}

function detectColorLabel(text) {
  const lower = text.toLowerCase();
  if (lower.includes('yellow') || text.includes('黄色')) return 'Yellow ';
  if (lower.includes('light blue') || text.includes('浅蓝')) return 'Light Blue ';
  if (lower.includes('dark blue') || text.includes('深蓝')) return 'Dark Blue ';
  if (lower.includes('royal blue') || text.includes('宝蓝')) return 'Royal Blue ';
  if (lower.includes('green') || text.includes('绿色') || text.includes('青色')) return 'Green ';
  if (lower.includes('orange') || text.includes('橙色')) return 'Orange ';
  if (lower.includes('red') || text.includes('红色')) return 'Red ';
  return '';
}

function detectProductLabel(metadata, teamName) {
  const album = metadata.album_name || metadata.folder_name || '';
  const text = `${album} ${metadata.team_name_english || ''} ${metadata.folder_name || ''}`;
  const color = detectColorLabel(text);
  if (text.toLowerCase().includes('trousers') || album.includes('长裤')) {
    return `${teamName} ${color}Tracksuit 2026`.replace(/\s+/g, ' ').trim();
  }
  return `${teamName} ${color}Match Hoodie 2026`.replace(/\s+/g, ' ').trim();
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
    const productSlug = `tracksuit-${slugify(folder)}`;
    const files = sortFiles((await readdir(folderPath)).filter((file) => /\.(jpe?g|png|webp|gif)$/i.test(file)));
    const gallery = [];

    for (const file of files) {
      const extension = path.extname(file).toLowerCase();
      const source = path.join(folderPath, file);
      const label = file === 'primary.jpg' ? 'primary' : path.basename(file, extension);
      const targetName = `${productSlug}-${label}${extension}`;
      await copyFile(source, path.join(publicProductsRoot, targetName));
      gallery.push(`/products/tracksuits/${targetName}`);
    }

    products.push({
      id: productSlug,
      teamId: teamSlug,
      category: 'Survette',
      name: productName,
      price: 119,
      oldPrice: null,
      image: gallery[0],
      gallery,
      badge: index < 6 ? 'New' : null,
      color: colorByTeam[teamSlug] || '#171816',
      description: metadata.album_name,
      sourceUrl: metadata.source_url,
    });
  }

  const moduleContent = `export const importedTracksuits = ${JSON.stringify(products, null, 2)};\n`;
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
    sort_order: 700 + index,
    is_active: true,
  }));

  await writeFile(jsonOutputFile, JSON.stringify(supabaseRows, null, 2));
  console.log(`Imported ${products.length} tracksuit products.`);
  console.log(`Copied images to ${publicProductsRoot}`);
  console.log(`Wrote ${path.relative(projectRoot, outputFile)} and ${path.relative(projectRoot, jsonOutputFile)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
