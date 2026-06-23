const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function normalizeError(error, table) {
  if (!error) return `Supabase request failed for ${table}`;
  return error.message || error.details || JSON.stringify(error);
}

async function supabaseRequest(table, { method = 'GET', query = '', body } = {}) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let error;
    try {
      error = await response.json();
    } catch {
      error = { message: response.statusText };
    }
    throw new Error(normalizeError(error, table));
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function fetchStoreContent() {
  const [teams, categories, products, heroSlides] = await Promise.all([
    supabaseRequest('teams', { query: '?select=*&is_active=eq.true&order=sort_order.asc' }),
    supabaseRequest('categories', { query: '?select=*&is_active=eq.true&order=sort_order.asc' }),
    supabaseRequest('products', { query: '?select=*&is_active=eq.true&order=sort_order.asc' }),
    supabaseRequest('hero_slides', { query: '?select=*&is_active=eq.true&order=sort_order.asc' }),
  ]);

  return {
    teams: teams.map(mapTeamFromDb),
    categories: categories.map(mapCategoryFromDb),
    products: products.map(mapProductFromDb),
    heroSlides: heroSlides.map(mapHeroSlideFromDb),
  };
}

export async function listTable(table) {
  const order = table === 'orders' ? 'created_at.desc' : 'sort_order.asc';
  return supabaseRequest(table, { query: `?select=*&order=${order}` });
}

export async function upsertRow(table, row) {
  const method = row.id ? 'PATCH' : 'POST';
  const query = row.id ? `?id=eq.${encodeURIComponent(row.id)}` : '';
  const payload = { ...row };
  if (!payload.id) delete payload.id;
  const result = await supabaseRequest(table, { method, query, body: payload });
  return Array.isArray(result) ? result[0] : result;
}

export async function deleteRow(table, id) {
  return supabaseRequest(table, {
    method: 'DELETE',
    query: `?id=eq.${encodeURIComponent(id)}`,
  });
}

export async function createOrder(order) {
  return supabaseRequest('orders', { method: 'POST', body: order });
}

export function mapTeamFromDb(row) {
  return {
    id: row.slug || row.id,
    dbId: row.id,
    name: row.name,
    code: row.code,
    colors: Array.isArray(row.colors) ? row.colors : ['#171816', '#ffffff'],
    logo: row.logo_url || '',
  };
}

export function mapCategoryFromDb(row) {
  return {
    id: row.slug || row.id,
    dbId: row.id,
    name: row.name,
    sortOrder: row.sort_order || 0,
  };
}

export function mapProductFromDb(row) {
  const gallery = Array.isArray(row.gallery) ? row.gallery.filter(Boolean) : [];

  return {
    id: row.slug || row.id,
    dbId: row.id,
    teamId: row.team_slug,
    category: row.category_name,
    name: row.name,
    price: Number(row.price || 0),
    oldPrice: row.old_price ? Number(row.old_price) : null,
    image: row.primary_image_url,
    gallery: gallery.length ? gallery : [row.primary_image_url].filter(Boolean),
    badge: row.badge,
    color: row.color || '#171816',
    description: row.description || '',
  };
}

export function mapHeroSlideFromDb(row) {
  return {
    id: row.slug || row.id,
    dbId: row.id,
    image: row.image_url,
    alt: row.alt_text || '',
    sortOrder: row.sort_order || 0,
  };
}
