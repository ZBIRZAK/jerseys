import React, { useEffect, useMemo, useState } from 'react';
import { deleteRow, isSupabaseConfigured, listTable, upsertRow } from './supabaseApi.js';

const ADMIN_PASSWORD = import.meta.env.VITE_DASHBOARD_PASSWORD || '';

const TABLES = {
  products: 'products',
  categories: 'categories',
  teams: 'teams',
  hero: 'hero_slides',
  orders: 'orders',
  settings: 'store_settings',
};

const PRODUCT_EMPTY = {
  id: '',
  slug: '',
  team_slug: '',
  category_name: 'Jerseys',
  name: '',
  description: '',
  price: 0,
  old_price: '',
  primary_image_url: '',
  gallery: '',
  badge: '',
  color: '#171816',
  sort_order: 100,
  is_active: true,
};

const CATEGORY_EMPTY = {
  id: '',
  slug: '',
  name: '',
  sort_order: 100,
  is_active: true,
};

const TEAM_EMPTY = {
  id: '',
  slug: '',
  name: '',
  code: '',
  colors: '#171816, #ffffff',
  logo_url: '',
  sort_order: 100,
  is_active: true,
};

const HERO_EMPTY = {
  id: '',
  slug: '',
  image_url: '',
  alt_text: '',
  sort_order: 100,
  is_active: true,
};

const SETTINGS_EMPTY = {
  id: '',
  key: 'general',
  value: '{\n  "currency": "DHS",\n  "whatsapp_number": ""\n}',
  sort_order: 1,
  is_active: true,
};

function parseList(value) {
  if (Array.isArray(value)) return value;
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseColors(value) {
  if (Array.isArray(value)) return value;
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);
}

function productToForm(row = PRODUCT_EMPTY) {
  return {
    ...PRODUCT_EMPTY,
    ...row,
    id: (row.dbId || row.slug) ? row.id : '',
    slug: row.slug || row.id || '',
    team_slug: row.team_slug || row.teamId || '',
    category_name: row.category_name || row.category || 'Jerseys',
    primary_image_url: row.primary_image_url || row.image || '',
    gallery: Array.isArray(row.gallery) ? row.gallery.join('\n') : row.gallery || '',
    old_price: row.old_price ?? row.oldPrice ?? '',
    sort_order: row.sort_order || row.sortOrder || 100,
  };
}

function teamToForm(row = TEAM_EMPTY) {
  return {
    ...TEAM_EMPTY,
    ...row,
    id: (row.dbId || row.slug) ? row.id : '',
    slug: row.slug || row.id || '',
    logo_url: row.logo_url || row.logo || '',
    colors: Array.isArray(row.colors) ? row.colors.join(', ') : row.colors || TEAM_EMPTY.colors,
    sort_order: row.sort_order || row.sortOrder || 100,
  };
}

function categoryToForm(row = CATEGORY_EMPTY) {
  return {
    ...CATEGORY_EMPTY,
    ...row,
    id: (row.dbId || row.slug) ? row.id : '',
    slug: row.slug || row.id || '',
    sort_order: row.sort_order || row.sortOrder || 100,
  };
}

function settingToForm(row = SETTINGS_EMPTY) {
  return {
    ...SETTINGS_EMPTY,
    ...row,
    value: typeof row.value === 'string' ? row.value : JSON.stringify(row.value || {}, null, 2),
  };
}

function boolValue(value) {
  return value === true || value === 'true';
}

function Field({ label, children }) {
  return (
    <label className="dashboard-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function DashboardShell({ title, description, children }) {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function DashboardPage({ seedProducts, seedTeams, seedCategories, onRefreshStore }) {
  const [unlocked, setUnlocked] = useState(() => !ADMIN_PASSWORD || localStorage.getItem('kitline-dashboard') === 'unlocked');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [rows, setRows] = useState({
    products: [],
    categories: [],
    teams: [],
    hero: [],
    orders: [],
    settings: [],
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [productForm, setProductForm] = useState(PRODUCT_EMPTY);
  const [categoryForm, setCategoryForm] = useState(CATEGORY_EMPTY);
  const [teamForm, setTeamForm] = useState(TEAM_EMPTY);
  const [heroForm, setHeroForm] = useState(HERO_EMPTY);
  const [settingForm, setSettingForm] = useState(SETTINGS_EMPTY);

  const teamOptions = useMemo(() => (
    rows.teams.length ? rows.teams : seedTeams.map((team, index) => ({
      id: team.dbId || team.id,
      slug: team.id,
      name: team.name,
      code: team.code,
      colors: team.colors,
      logo_url: team.logo,
      sort_order: index + 1,
      is_active: true,
    }))
  ), [rows.teams, seedTeams]);

  const categoryOptions = useMemo(() => (
    rows.categories.length ? rows.categories : seedCategories.map((category, index) => ({
      id: category.dbId || category.id,
      slug: category.id,
      name: category.name,
      sort_order: index + 1,
      is_active: true,
    }))
  ), [rows.categories, seedCategories]);

  async function loadDashboard() {
    if (!isSupabaseConfigured || !unlocked) return;
    setLoading(true);
    setStatus('');
    try {
      const [products, categories, teams, hero, orders, settings] = await Promise.all([
        listTable(TABLES.products),
        listTable(TABLES.categories),
        listTable(TABLES.teams),
        listTable(TABLES.hero),
        listTable(TABLES.orders),
        listTable(TABLES.settings),
      ]);
      setRows({ products, categories, teams, hero, orders, settings });
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [unlocked]);

  function unlockDashboard(event) {
    event.preventDefault();
    if (!ADMIN_PASSWORD || password === ADMIN_PASSWORD) {
      localStorage.setItem('kitline-dashboard', 'unlocked');
      setUnlocked(true);
      setPassword('');
    } else {
      setStatus('Wrong dashboard password.');
    }
  }

  async function saveRow(tableKey, payload, reset) {
    if (!isSupabaseConfigured) {
      setStatus('Connect Supabase env keys before saving dashboard changes.');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      await upsertRow(TABLES[tableKey], payload);
      reset();
      await loadDashboard();
      await onRefreshStore();
      setStatus('Saved.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function removeRow(tableKey, id) {
    if (!window.confirm('Delete this item?')) return;
    setLoading(true);
    setStatus('');
    try {
      await deleteRow(TABLES[tableKey], id);
      await loadDashboard();
      await onRefreshStore();
      setStatus('Deleted.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function uploadImages(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return [];

    setLoading(true);
    setStatus('');
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Image upload failed.');
      }

      setStatus(`Uploaded ${payload.paths.length} image${payload.paths.length === 1 ? '' : 's'}.`);
      return payload.paths;
    } catch (error) {
      setStatus(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }

  if (!unlocked) {
    return (
      <section className="dashboard-page">
        <form className="dashboard-login" onSubmit={unlockDashboard}>
          <h1>Dashboard</h1>
          <p>Enter the dashboard password from `VITE_DASHBOARD_PASSWORD`.</p>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" />
          <button type="submit">Open dashboard</button>
          {status && <p className="dashboard-status error">{status}</p>}
        </form>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <header className="dashboard-hero">
        <div>
          <p className="eyebrow">Supabase Admin</p>
          <h1>Dashboard</h1>
          <p>Manage the same content your storefront uses: teams, categories, products, hero images, orders, and settings.</p>
        </div>
        <div className={isSupabaseConfigured ? 'dashboard-chip ready' : 'dashboard-chip'}>
          {isSupabaseConfigured ? 'Supabase connected' : 'Supabase env missing'}
        </div>
      </header>

      <nav className="dashboard-tabs" aria-label="Dashboard sections">
        {[
          ['products', 'Products'],
          ['categories', 'Categories'],
          ['teams', 'Teams'],
          ['hero', 'Hero'],
          ['orders', 'Orders'],
          ['settings', 'Settings'],
        ].map(([id, label]) => (
          <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {!isSupabaseConfigured && (
        <p className="dashboard-status error">
          Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env` after running `supabase/schema.sql`.
        </p>
      )}
      {status && <p className={`dashboard-status ${status.includes('Wrong') || status.includes('failed') || status.includes('Connect') ? 'error' : ''}`}>{status}</p>}
      {loading && <p className="dashboard-status">Loading...</p>}

      {activeTab === 'products' && (
        <DashboardShell title="Products" description={`${rows.products.length || seedProducts.length} products available`}>
          <form
            className="dashboard-form"
            onSubmit={(event) => {
              event.preventDefault();
              saveRow('products', {
                ...productForm,
                price: Number(productForm.price || 0),
                old_price: productForm.old_price === '' ? null : Number(productForm.old_price),
                gallery: [
                  productForm.primary_image_url,
                  ...parseList(productForm.gallery).filter((path) => path !== productForm.primary_image_url),
                ].filter(Boolean),
                is_active: boolValue(productForm.is_active),
                sort_order: Number(productForm.sort_order || 100),
              }, () => setProductForm(PRODUCT_EMPTY));
            }}
          >
            <Field label="Slug"><input required value={productForm.slug} onChange={(event) => setProductForm({ ...productForm, slug: event.target.value })} placeholder="france-home" /></Field>
            <Field label="Team"><select required value={productForm.team_slug} onChange={(event) => setProductForm({ ...productForm, team_slug: event.target.value })}><option value="">Choose team</option>{teamOptions.map((team) => <option key={team.slug} value={team.slug}>{team.name}</option>)}</select></Field>
            <Field label="Category"><select value={productForm.category_name} onChange={(event) => setProductForm({ ...productForm, category_name: event.target.value })}>{categoryOptions.map((category) => <option key={category.slug} value={category.name}>{category.name}</option>)}</select></Field>
            <Field label="Name"><input required value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} /></Field>
            <Field label="Price"><input type="number" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} /></Field>
            <Field label="Old price"><input type="number" value={productForm.old_price} onChange={(event) => setProductForm({ ...productForm, old_price: event.target.value })} /></Field>
            <Field label="Badge"><input value={productForm.badge || ''} onChange={(event) => setProductForm({ ...productForm, badge: event.target.value })} /></Field>
            <Field label="Color"><input type="color" value={productForm.color || '#171816'} onChange={(event) => setProductForm({ ...productForm, color: event.target.value })} /></Field>
            <Field label="Primary image">
              <ImageUploadControl
                value={productForm.primary_image_url}
                onUpload={async (files) => {
                  const paths = await uploadImages(files);
                  if (paths[0]) setProductForm((current) => ({ ...current, primary_image_url: paths[0] }));
                }}
              />
            </Field>
            <Field label="Gallery images">
              <GalleryUploadControl
                value={productForm.gallery}
                onUpload={async (files) => {
                  const paths = await uploadImages(files);
                  if (paths.length) {
                    setProductForm((current) => ({
                      ...current,
                      gallery: [...parseList(current.gallery), ...paths].join('\n'),
                    }));
                  }
                }}
                onClear={() => setProductForm((current) => ({ ...current, gallery: '' }))}
              />
            </Field>
            <Field label="Description"><textarea rows="3" value={productForm.description || ''} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} /></Field>
            <Field label="Sort order"><input type="number" value={productForm.sort_order} onChange={(event) => setProductForm({ ...productForm, sort_order: event.target.value })} /></Field>
            <label className="dashboard-check"><input type="checkbox" checked={boolValue(productForm.is_active)} onChange={(event) => setProductForm({ ...productForm, is_active: event.target.checked })} /> Active</label>
            <div className="dashboard-actions"><button type="submit">Save product</button><button type="button" onClick={() => setProductForm(PRODUCT_EMPTY)}>New product</button></div>
          </form>
          <DashboardTable rows={rows.products} fallbackRows={seedProducts} onEdit={(row) => setProductForm(productToForm(row))} onDelete={(row) => removeRow('products', row.id)} columns={['slug', 'name', 'team_slug', 'category_name', 'price']} />
        </DashboardShell>
      )}

      {activeTab === 'categories' && (
        <DashboardShell title="Categories" description="Control filter buttons and product grouping.">
          <SimpleForm
            form={categoryForm}
            setForm={setCategoryForm}
            fields={['slug', 'name', 'sort_order']}
            onSubmit={() => saveRow('categories', { ...categoryForm, sort_order: Number(categoryForm.sort_order || 100), is_active: boolValue(categoryForm.is_active) }, () => setCategoryForm(CATEGORY_EMPTY))}
            submitLabel="Save category"
          />
          <DashboardTable rows={rows.categories} fallbackRows={seedCategories} onEdit={(row) => setCategoryForm(categoryToForm(row))} onDelete={(row) => removeRow('categories', row.id)} columns={['slug', 'name', 'sort_order']} />
        </DashboardShell>
      )}

      {activeTab === 'teams' && (
        <DashboardShell title="Teams" description="Manage the right-side team selector and product team metadata.">
          <form className="dashboard-form compact" onSubmit={(event) => { event.preventDefault(); saveRow('teams', { ...teamForm, colors: parseColors(teamForm.colors), sort_order: Number(teamForm.sort_order || 100), is_active: boolValue(teamForm.is_active) }, () => setTeamForm(TEAM_EMPTY)); }}>
            <Field label="Slug"><input required value={teamForm.slug} onChange={(event) => setTeamForm({ ...teamForm, slug: event.target.value })} /></Field>
            <Field label="Name"><input required value={teamForm.name} onChange={(event) => setTeamForm({ ...teamForm, name: event.target.value })} /></Field>
            <Field label="Code"><input required value={teamForm.code} onChange={(event) => setTeamForm({ ...teamForm, code: event.target.value.toUpperCase() })} maxLength="4" /></Field>
            <Field label="Colors"><input value={teamForm.colors} onChange={(event) => setTeamForm({ ...teamForm, colors: event.target.value })} placeholder="#133a8a, #e62b3a" /></Field>
            <Field label="Logo image">
              <ImageUploadControl
                value={teamForm.logo_url}
                onUpload={async (files) => {
                  const paths = await uploadImages(files);
                  if (paths[0]) setTeamForm((current) => ({ ...current, logo_url: paths[0] }));
                }}
              />
            </Field>
            <Field label="Sort order"><input type="number" value={teamForm.sort_order} onChange={(event) => setTeamForm({ ...teamForm, sort_order: event.target.value })} /></Field>
            <label className="dashboard-check"><input type="checkbox" checked={boolValue(teamForm.is_active)} onChange={(event) => setTeamForm({ ...teamForm, is_active: event.target.checked })} /> Active</label>
            <div className="dashboard-actions"><button type="submit">Save team</button><button type="button" onClick={() => setTeamForm(TEAM_EMPTY)}>New team</button></div>
          </form>
          <DashboardTable rows={rows.teams} fallbackRows={seedTeams} onEdit={(row) => setTeamForm(teamToForm(row))} onDelete={(row) => removeRow('teams', row.id)} columns={['slug', 'name', 'code', 'sort_order']} />
        </DashboardShell>
      )}

      {activeTab === 'hero' && (
        <DashboardShell title="Hero Slides" description="Control the carousel images on the home page.">
          <form className="dashboard-form compact" onSubmit={(event) => { event.preventDefault(); saveRow('hero', { ...heroForm, sort_order: Number(heroForm.sort_order || 100), is_active: boolValue(heroForm.is_active) }, () => setHeroForm(HERO_EMPTY)); }}>
            <Field label="Slug"><input required value={heroForm.slug} onChange={(event) => setHeroForm({ ...heroForm, slug: event.target.value })} /></Field>
            <Field label="Hero image">
              <ImageUploadControl
                value={heroForm.image_url}
                onUpload={async (files) => {
                  const paths = await uploadImages(files);
                  if (paths[0]) setHeroForm((current) => ({ ...current, image_url: paths[0] }));
                }}
              />
            </Field>
            <Field label="Alt text"><input value={heroForm.alt_text || ''} onChange={(event) => setHeroForm({ ...heroForm, alt_text: event.target.value })} /></Field>
            <Field label="Sort order"><input type="number" value={heroForm.sort_order} onChange={(event) => setHeroForm({ ...heroForm, sort_order: event.target.value })} /></Field>
            <label className="dashboard-check"><input type="checkbox" checked={boolValue(heroForm.is_active)} onChange={(event) => setHeroForm({ ...heroForm, is_active: event.target.checked })} /> Active</label>
            <div className="dashboard-actions"><button type="submit">Save hero slide</button><button type="button" onClick={() => setHeroForm(HERO_EMPTY)}>New hero slide</button></div>
          </form>
          <DashboardTable rows={rows.hero} fallbackRows={[]} onEdit={(row) => setHeroForm({ ...HERO_EMPTY, ...row })} onDelete={(row) => removeRow('hero', row.id)} columns={['slug', 'image_url', 'alt_text', 'sort_order']} />
        </DashboardShell>
      )}

      {activeTab === 'orders' && (
        <DashboardShell title="Orders" description="Orders submitted through checkout can be stored here before WhatsApp opens.">
          <DashboardTable rows={rows.orders} fallbackRows={[]} columns={['customer_name', 'phone', 'city', 'total', 'status']} />
        </DashboardShell>
      )}

      {activeTab === 'settings' && (
        <DashboardShell title="Settings" description="Store structured settings such as currency, WhatsApp number, and feature flags.">
          <form className="dashboard-form compact" onSubmit={(event) => { event.preventDefault(); let value; try { value = JSON.parse(settingForm.value); } catch { setStatus('Settings value must be valid JSON.'); return; } saveRow('settings', { ...settingForm, value, sort_order: Number(settingForm.sort_order || 100), is_active: boolValue(settingForm.is_active) }, () => setSettingForm(SETTINGS_EMPTY)); }}>
            <Field label="Key"><input required value={settingForm.key} onChange={(event) => setSettingForm({ ...settingForm, key: event.target.value })} /></Field>
            <Field label="Value JSON"><textarea rows="8" value={settingForm.value} onChange={(event) => setSettingForm({ ...settingForm, value: event.target.value })} /></Field>
            <Field label="Sort order"><input type="number" value={settingForm.sort_order} onChange={(event) => setSettingForm({ ...settingForm, sort_order: event.target.value })} /></Field>
            <label className="dashboard-check"><input type="checkbox" checked={boolValue(settingForm.is_active)} onChange={(event) => setSettingForm({ ...settingForm, is_active: event.target.checked })} /> Active</label>
            <div className="dashboard-actions"><button type="submit">Save settings</button><button type="button" onClick={() => setSettingForm(SETTINGS_EMPTY)}>New settings</button></div>
          </form>
          <DashboardTable rows={rows.settings} fallbackRows={[]} onEdit={(row) => setSettingForm(settingToForm(row))} onDelete={(row) => removeRow('settings', row.id)} columns={['key', 'value', 'sort_order']} />
        </DashboardShell>
      )}
    </section>
  );
}

function ImageUploadControl({ value, onUpload }) {
  return (
    <div className="dashboard-upload">
      <input readOnly required value={value || ''} placeholder="Upload an image to generate the path" />
      <input
        type="file"
        accept="image/*"
        onChange={async (event) => {
          await onUpload(event.target.files);
          event.target.value = '';
        }}
      />
      {value && <img className="dashboard-image-preview" src={value} alt="" />}
    </div>
  );
}

function GalleryUploadControl({ value, onUpload, onClear }) {
  const paths = parseList(value);

  return (
    <div className="dashboard-upload">
      <textarea readOnly rows="5" value={paths.join('\n')} placeholder="Upload gallery images to generate paths" />
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={async (event) => {
          await onUpload(event.target.files);
          event.target.value = '';
        }}
      />
      <div className="dashboard-gallery-preview">
        {paths.map((path) => <img key={path} src={path} alt="" />)}
      </div>
      {paths.length > 0 && <button className="dashboard-link-button" type="button" onClick={onClear}>Clear gallery</button>}
    </div>
  );
}

function SimpleForm({ form, setForm, fields, onSubmit, submitLabel }) {
  return (
    <form className="dashboard-form compact" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      {fields.map((field) => (
        <Field key={field} label={field.replaceAll('_', ' ')}>
          <input required={field !== 'sort_order'} type={field === 'sort_order' ? 'number' : 'text'} value={form[field] || ''} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />
        </Field>
      ))}
      <label className="dashboard-check"><input type="checkbox" checked={boolValue(form.is_active)} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> Active</label>
      <div className="dashboard-actions"><button type="submit">{submitLabel}</button><button type="button" onClick={() => setForm(fields.includes('image_url') ? HERO_EMPTY : CATEGORY_EMPTY)}>New</button></div>
    </form>
  );
}

function DashboardTable({ rows, fallbackRows, columns, onEdit, onDelete }) {
  const tableRows = rows.length ? rows : fallbackRows;
  const hasPersistedRows = rows.length > 0;

  if (!tableRows.length) {
    return <div className="dashboard-empty">No records yet.</div>;
  }

  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            {columns.map((column) => <th key={column}>{column.replaceAll('_', ' ')}</th>)}
            {(onEdit || onDelete) && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row) => (
            <tr key={row.id || row.slug || row.name}>
              {columns.map((column) => (
                <td key={column}>{formatCell(row[column] ?? row[column === 'slug' ? 'id' : column])}</td>
              ))}
              {(onEdit || onDelete) && (
                <td>
                  <div className="dashboard-row-actions">
                    {onEdit && <button type="button" onClick={() => onEdit(row)}>Edit</button>}
                    {onDelete && hasPersistedRows && row.id && <button type="button" onClick={() => onDelete(row)}>Delete</button>}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(value) {
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value ?? '');
}
