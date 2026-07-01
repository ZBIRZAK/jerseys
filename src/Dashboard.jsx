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
  category_name: 'Maillots',
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
    category_name: row.category_name || row.category || 'Maillots',
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
      setStatus('Mot de passe du tableau de bord incorrect.');
    }
  }

  async function saveRow(tableKey, payload, reset) {
    if (!isSupabaseConfigured) {
      setStatus('Ajoutez les clés d’environnement Supabase avant d’enregistrer les modifications.');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      await upsertRow(TABLES[tableKey], payload);
      reset();
      await loadDashboard();
      await onRefreshStore();
      setStatus('Enregistré.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function removeRow(tableKey, id) {
    if (!window.confirm('Supprimer cet élément ?')) return;
    setLoading(true);
    setStatus('');
    try {
      await deleteRow(TABLES[tableKey], id);
      await loadDashboard();
      await onRefreshStore();
      setStatus('Supprimé.');
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
        throw new Error(payload.error || 'Échec de l’envoi de l’image.');
      }

      setStatus(`${payload.paths.length} image${payload.paths.length === 1 ? '' : 's'} téléversée${payload.paths.length === 1 ? '' : 's'}.`);
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
          <h1>Tableau de bord</h1>
          <p>Saisissez le mot de passe du tableau de bord défini dans `VITE_DASHBOARD_PASSWORD`.</p>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Mot de passe" />
          <button type="submit">Ouvrir le tableau de bord</button>
          {status && <p className="dashboard-status error">{status}</p>}
        </form>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <header className="dashboard-hero">
        <div>
          <p className="eyebrow">Admin Supabase</p>
          <h1>Tableau de bord</h1>
          <p>Gérez le même contenu que votre vitrine utilise : équipes, catégories, produits, images vedettes, commandes et réglages.</p>
        </div>
        <div className={isSupabaseConfigured ? 'dashboard-chip ready' : 'dashboard-chip'}>
          {isSupabaseConfigured ? 'Supabase connecté' : 'Variables Supabase manquantes'}
        </div>
      </header>

      <nav className="dashboard-tabs" aria-label="Sections du tableau de bord">
        {[
          ['products', 'Produits'],
          ['categories', 'Catégories'],
          ['teams', 'Équipes'],
          ['hero', 'Hero'],
          ['orders', 'Commandes'],
          ['settings', 'Réglages'],
        ].map(([id, label]) => (
          <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {!isSupabaseConfigured && (
        <p className="dashboard-status error">
          Ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env` après avoir exécuté `supabase/schema.sql`.
        </p>
      )}
      {status && <p className={`dashboard-status ${status.includes('incorrect') || status.includes('Échec') || status.includes('Ajoutez') ? 'error' : ''}`}>{status}</p>}
      {loading && <p className="dashboard-status">Chargement...</p>}

      {activeTab === 'products' && (
        <DashboardShell title="Produits" description={`${rows.products.length || seedProducts.length} produits disponibles`}>
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
            <Field label="Équipe"><select required value={productForm.team_slug} onChange={(event) => setProductForm({ ...productForm, team_slug: event.target.value })}><option value="">Choisir une équipe</option>{teamOptions.map((team) => <option key={team.slug} value={team.slug}>{team.name}</option>)}</select></Field>
            <Field label="Catégorie"><select value={productForm.category_name} onChange={(event) => setProductForm({ ...productForm, category_name: event.target.value })}>{categoryOptions.map((category) => <option key={category.slug} value={category.name}>{category.name}</option>)}</select></Field>
            <Field label="Nom"><input required value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} /></Field>
            <Field label="Prix"><input type="number" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} /></Field>
            <Field label="Ancien prix"><input type="number" value={productForm.old_price} onChange={(event) => setProductForm({ ...productForm, old_price: event.target.value })} /></Field>
            <Field label="Badge"><input value={productForm.badge || ''} onChange={(event) => setProductForm({ ...productForm, badge: event.target.value })} /></Field>
            <Field label="Couleur"><input type="color" value={productForm.color || '#171816'} onChange={(event) => setProductForm({ ...productForm, color: event.target.value })} /></Field>
            <Field label="Image principale">
              <ImageUploadControl
                value={productForm.primary_image_url}
                onUpload={async (files) => {
                  const paths = await uploadImages(files);
                  if (paths[0]) setProductForm((current) => ({ ...current, primary_image_url: paths[0] }));
                }}
              />
            </Field>
            <Field label="Images de galerie">
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
            <Field label="Ordre d’affichage"><input type="number" value={productForm.sort_order} onChange={(event) => setProductForm({ ...productForm, sort_order: event.target.value })} /></Field>
            <label className="dashboard-check"><input type="checkbox" checked={boolValue(productForm.is_active)} onChange={(event) => setProductForm({ ...productForm, is_active: event.target.checked })} /> Actif</label>
            <div className="dashboard-actions"><button type="submit">Enregistrer le produit</button><button type="button" onClick={() => setProductForm(PRODUCT_EMPTY)}>Nouveau produit</button></div>
          </form>
          <DashboardTable rows={rows.products} fallbackRows={seedProducts} onEdit={(row) => setProductForm(productToForm(row))} onDelete={(row) => removeRow('products', row.id)} columns={['slug', 'name', 'team_slug', 'category_name', 'price']} />
        </DashboardShell>
      )}

      {activeTab === 'categories' && (
        <DashboardShell title="Catégories" description="Contrôlez les boutons de filtre et le regroupement des produits.">
          <SimpleForm
            form={categoryForm}
            setForm={setCategoryForm}
            fields={['slug', 'name', 'sort_order']}
            onSubmit={() => saveRow('categories', { ...categoryForm, sort_order: Number(categoryForm.sort_order || 100), is_active: boolValue(categoryForm.is_active) }, () => setCategoryForm(CATEGORY_EMPTY))}
            submitLabel="Enregistrer la catégorie"
          />
          <DashboardTable rows={rows.categories} fallbackRows={seedCategories} onEdit={(row) => setCategoryForm(categoryToForm(row))} onDelete={(row) => removeRow('categories', row.id)} columns={['slug', 'name', 'sort_order']} />
        </DashboardShell>
      )}

      {activeTab === 'teams' && (
        <DashboardShell title="Équipes" description="Gérez le sélecteur d’équipes à droite et les métadonnées d’équipe des produits.">
          <form className="dashboard-form compact" onSubmit={(event) => { event.preventDefault(); saveRow('teams', { ...teamForm, colors: parseColors(teamForm.colors), sort_order: Number(teamForm.sort_order || 100), is_active: boolValue(teamForm.is_active) }, () => setTeamForm(TEAM_EMPTY)); }}>
            <Field label="Slug"><input required value={teamForm.slug} onChange={(event) => setTeamForm({ ...teamForm, slug: event.target.value })} /></Field>
            <Field label="Nom"><input required value={teamForm.name} onChange={(event) => setTeamForm({ ...teamForm, name: event.target.value })} /></Field>
            <Field label="Code"><input required value={teamForm.code} onChange={(event) => setTeamForm({ ...teamForm, code: event.target.value.toUpperCase() })} maxLength="4" /></Field>
            <Field label="Couleurs"><input value={teamForm.colors} onChange={(event) => setTeamForm({ ...teamForm, colors: event.target.value })} placeholder="#133a8a, #e62b3a" /></Field>
            <Field label="Image du logo">
              <ImageUploadControl
                value={teamForm.logo_url}
                onUpload={async (files) => {
                  const paths = await uploadImages(files);
                  if (paths[0]) setTeamForm((current) => ({ ...current, logo_url: paths[0] }));
                }}
              />
            </Field>
            <Field label="Ordre d’affichage"><input type="number" value={teamForm.sort_order} onChange={(event) => setTeamForm({ ...teamForm, sort_order: event.target.value })} /></Field>
            <label className="dashboard-check"><input type="checkbox" checked={boolValue(teamForm.is_active)} onChange={(event) => setTeamForm({ ...teamForm, is_active: event.target.checked })} /> Actif</label>
            <div className="dashboard-actions"><button type="submit">Enregistrer l’équipe</button><button type="button" onClick={() => setTeamForm(TEAM_EMPTY)}>Nouvelle équipe</button></div>
          </form>
          <DashboardTable rows={rows.teams} fallbackRows={seedTeams} onEdit={(row) => setTeamForm(teamToForm(row))} onDelete={(row) => removeRow('teams', row.id)} columns={['slug', 'name', 'code', 'sort_order']} />
        </DashboardShell>
      )}

      {activeTab === 'hero' && (
        <DashboardShell title="Slides hero" description="Contrôlez les images du carrousel de la page d’accueil.">
          <form className="dashboard-form compact" onSubmit={(event) => { event.preventDefault(); saveRow('hero', { ...heroForm, sort_order: Number(heroForm.sort_order || 100), is_active: boolValue(heroForm.is_active) }, () => setHeroForm(HERO_EMPTY)); }}>
            <Field label="Slug"><input required value={heroForm.slug} onChange={(event) => setHeroForm({ ...heroForm, slug: event.target.value })} /></Field>
            <Field label="Image hero">
              <ImageUploadControl
                value={heroForm.image_url}
                onUpload={async (files) => {
                  const paths = await uploadImages(files);
                  if (paths[0]) setHeroForm((current) => ({ ...current, image_url: paths[0] }));
                }}
              />
            </Field>
            <Field label="Texte alternatif"><input value={heroForm.alt_text || ''} onChange={(event) => setHeroForm({ ...heroForm, alt_text: event.target.value })} /></Field>
            <Field label="Ordre d’affichage"><input type="number" value={heroForm.sort_order} onChange={(event) => setHeroForm({ ...heroForm, sort_order: event.target.value })} /></Field>
            <label className="dashboard-check"><input type="checkbox" checked={boolValue(heroForm.is_active)} onChange={(event) => setHeroForm({ ...heroForm, is_active: event.target.checked })} /> Actif</label>
            <div className="dashboard-actions"><button type="submit">Enregistrer le slide hero</button><button type="button" onClick={() => setHeroForm(HERO_EMPTY)}>Nouveau slide hero</button></div>
          </form>
          <DashboardTable rows={rows.hero} fallbackRows={[]} onEdit={(row) => setHeroForm({ ...HERO_EMPTY, ...row })} onDelete={(row) => removeRow('hero', row.id)} columns={['slug', 'image_url', 'alt_text', 'sort_order']} />
        </DashboardShell>
      )}

      {activeTab === 'orders' && (
        <DashboardShell title="Commandes" description="Les commandes envoyées via la caisse peuvent être stockées ici avant l’ouverture de WhatsApp.">
          <DashboardTable rows={rows.orders} fallbackRows={[]} columns={['customer_name', 'phone', 'city', 'total', 'status']} />
        </DashboardShell>
      )}

      {activeTab === 'settings' && (
        <DashboardShell title="Réglages" description="Stockez les réglages structurés comme la devise, le numéro WhatsApp et les options d’activation.">
          <form className="dashboard-form compact" onSubmit={(event) => { event.preventDefault(); let value; try { value = JSON.parse(settingForm.value); } catch { setStatus('La valeur des réglages doit être un JSON valide.'); return; } saveRow('settings', { ...settingForm, value, sort_order: Number(settingForm.sort_order || 100), is_active: boolValue(settingForm.is_active) }, () => setSettingForm(SETTINGS_EMPTY)); }}>
            <Field label="Clé"><input required value={settingForm.key} onChange={(event) => setSettingForm({ ...settingForm, key: event.target.value })} /></Field>
            <Field label="Valeur JSON"><textarea rows="8" value={settingForm.value} onChange={(event) => setSettingForm({ ...settingForm, value: event.target.value })} /></Field>
            <Field label="Ordre d’affichage"><input type="number" value={settingForm.sort_order} onChange={(event) => setSettingForm({ ...settingForm, sort_order: event.target.value })} /></Field>
            <label className="dashboard-check"><input type="checkbox" checked={boolValue(settingForm.is_active)} onChange={(event) => setSettingForm({ ...settingForm, is_active: event.target.checked })} /> Actif</label>
            <div className="dashboard-actions"><button type="submit">Enregistrer les réglages</button><button type="button" onClick={() => setSettingForm(SETTINGS_EMPTY)}>Nouveaux réglages</button></div>
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
      <input readOnly required value={value || ''} placeholder="Téléversez une image pour générer le chemin" />
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
      <textarea readOnly rows="5" value={paths.join('\n')} placeholder="Téléversez des images de galerie pour générer les chemins" />
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
      {paths.length > 0 && <button className="dashboard-link-button" type="button" onClick={onClear}>Vider la galerie</button>}
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
      <label className="dashboard-check"><input type="checkbox" checked={boolValue(form.is_active)} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> Actif</label>
      <div className="dashboard-actions"><button type="submit">{submitLabel}</button><button type="button" onClick={() => setForm(fields.includes('image_url') ? HERO_EMPTY : CATEGORY_EMPTY)}>Nouveau</button></div>
    </form>
  );
}

function DashboardTable({ rows, fallbackRows, columns, onEdit, onDelete }) {
  const tableRows = rows.length ? rows : fallbackRows;
  const hasPersistedRows = rows.length > 0;

  if (!tableRows.length) {
    return <div className="dashboard-empty">Aucun enregistrement pour le moment.</div>;
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
                    {onEdit && <button type="button" onClick={() => onEdit(row)}>Modifier</button>}
                    {onDelete && hasPersistedRows && row.id && <button type="button" onClick={() => onDelete(row)}>Supprimer</button>}
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
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  return String(value ?? '');
}
