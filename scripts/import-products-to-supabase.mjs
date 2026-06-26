import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, teams } from '../src/data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function parseEnv(content) {
  return Object.fromEntries(
    content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const [key, ...value] = line.split('=');
        return [key.trim(), value.join('=').trim()];
      }),
  );
}

async function request(table, rows, env) {
  const response = await fetch(`${env.VITE_SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}?on_conflict=slug`, {
    method: 'POST',
    headers: {
      apikey: env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${table} import failed: ${text}`);
  }
}

async function readProductsJson(fileName) {
  const filePath = path.join(projectRoot, 'supabase', fileName);
  try {
    await access(filePath);
  } catch {
    return [];
  }
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function main() {
  const env = parseEnv(await readFile(path.join(projectRoot, '.env'), 'utf8'));
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  }

  const products = [
    ...(await readProductsJson('import-products.json')),
    ...(await readProductsJson('import-tracksuits.json')),
  ];
  const teamRows = teams.map((team, index) => ({
    slug: team.id,
    name: team.name,
    code: team.code,
    colors: team.colors,
    logo_url: team.logo,
    sort_order: index + 1,
    is_active: true,
  }));
  const categoryRows = categories.map((category, index) => ({
    slug: category.id,
    name: category.name,
    sort_order: category.sortOrder || index + 1,
    is_active: true,
  }));

  await request('teams', teamRows, env);
  await request('categories', categoryRows, env);
  await request('products', products, env);
  console.log(`Imported ${teamRows.length} teams, ${categoryRows.length} categories, and ${products.length} products into Supabase.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
