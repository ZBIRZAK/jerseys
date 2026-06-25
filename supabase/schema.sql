create extension if not exists pgcrypto;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  code text not null,
  colors jsonb not null default '["#171816", "#ffffff"]'::jsonb,
  logo_url text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  team_slug text not null references public.teams(slug) on update cascade,
  category_name text not null references public.categories(name) on update cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null default 0,
  old_price numeric(10, 2),
  primary_image_url text not null,
  gallery jsonb not null default '[]'::jsonb,
  badge text,
  color text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  city text not null,
  address text,
  note text,
  items jsonb not null default '[]'::jsonb,
  total numeric(10, 2) not null default 0,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_teams_updated_at on public.teams;
create trigger set_teams_updated_at before update on public.teams for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at before update on public.products for each row execute function public.set_updated_at();

drop trigger if exists set_hero_slides_updated_at on public.hero_slides;
create trigger set_hero_slides_updated_at before update on public.hero_slides for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

drop trigger if exists set_store_settings_updated_at on public.store_settings;
create trigger set_store_settings_updated_at before update on public.store_settings for each row execute function public.set_updated_at();

alter table public.teams enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.hero_slides enable row level security;
alter table public.orders enable row level security;
alter table public.store_settings enable row level security;

drop policy if exists "Public can read active teams" on public.teams;
create policy "Public can read active teams" on public.teams for select using (is_active = true);

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories" on public.categories for select using (is_active = true);

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products for select using (is_active = true);

drop policy if exists "Public can read active hero slides" on public.hero_slides;
create policy "Public can read active hero slides" on public.hero_slides for select using (is_active = true);

drop policy if exists "Public can create orders" on public.orders;
create policy "Public can create orders" on public.orders for insert with check (true);

drop policy if exists "Dashboard anon insert teams" on public.teams;
create policy "Dashboard anon insert teams" on public.teams for insert with check (true);
drop policy if exists "Dashboard anon update teams" on public.teams;
create policy "Dashboard anon update teams" on public.teams for update using (true) with check (true);
drop policy if exists "Dashboard anon delete teams" on public.teams;
create policy "Dashboard anon delete teams" on public.teams for delete using (true);

drop policy if exists "Dashboard anon insert categories" on public.categories;
create policy "Dashboard anon insert categories" on public.categories for insert with check (true);
drop policy if exists "Dashboard anon update categories" on public.categories;
create policy "Dashboard anon update categories" on public.categories for update using (true) with check (true);
drop policy if exists "Dashboard anon delete categories" on public.categories;
create policy "Dashboard anon delete categories" on public.categories for delete using (true);

drop policy if exists "Dashboard anon insert products" on public.products;
create policy "Dashboard anon insert products" on public.products for insert with check (true);
drop policy if exists "Dashboard anon update products" on public.products;
create policy "Dashboard anon update products" on public.products for update using (true) with check (true);
drop policy if exists "Dashboard anon delete products" on public.products;
create policy "Dashboard anon delete products" on public.products for delete using (true);

drop policy if exists "Dashboard anon insert hero slides" on public.hero_slides;
create policy "Dashboard anon insert hero slides" on public.hero_slides for insert with check (true);
drop policy if exists "Dashboard anon update hero slides" on public.hero_slides;
create policy "Dashboard anon update hero slides" on public.hero_slides for update using (true) with check (true);
drop policy if exists "Dashboard anon delete hero slides" on public.hero_slides;
create policy "Dashboard anon delete hero slides" on public.hero_slides for delete using (true);

drop policy if exists "Dashboard anon read orders" on public.orders;
create policy "Dashboard anon read orders" on public.orders for select using (true);

drop policy if exists "Dashboard anon read settings" on public.store_settings;
create policy "Dashboard anon read settings" on public.store_settings for select using (true);
drop policy if exists "Dashboard anon insert settings" on public.store_settings;
create policy "Dashboard anon insert settings" on public.store_settings for insert with check (true);
drop policy if exists "Dashboard anon update settings" on public.store_settings;
create policy "Dashboard anon update settings" on public.store_settings for update using (true) with check (true);
drop policy if exists "Dashboard anon delete settings" on public.store_settings;
create policy "Dashboard anon delete settings" on public.store_settings for delete using (true);

insert into public.categories (slug, name, sort_order) values
  ('jerseys', 'Jerseys', 1),
  ('sandals', 'Sandals', 2),
  ('tattoos', 'Tattoos', 3),
  ('shoes', 'Shoes', 4),
  ('survette', 'Survette', 5)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;

insert into public.store_settings (key, value, sort_order) values
  ('general', '{"currency": "DHS", "whatsapp_number": ""}'::jsonb, 1)
on conflict (key) do update set value = excluded.value, sort_order = excluded.sort_order;
