-- APEX Card Grading - Supabase Storage setup
-- Ejecutar una sola vez en Supabase SQL Editor.
-- Crea un bucket público para imágenes/videos de certificados y permite subida desde usuarios autenticados.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'apex-certificates',
  'apex-certificates',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública: necesaria para que verify.html pueda mostrar imágenes sin login.
drop policy if exists "APEX certificates public read" on storage.objects;
create policy "APEX certificates public read"
on storage.objects
for select
using (bucket_id = 'apex-certificates');

-- Subida desde el panel admin: requiere estar logueado con Supabase Auth.
drop policy if exists "APEX certificates authenticated upload" on storage.objects;
create policy "APEX certificates authenticated upload"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'apex-certificates');

-- Reemplazo/actualización de archivos desde el panel admin.
drop policy if exists "APEX certificates authenticated update" on storage.objects;
create policy "APEX certificates authenticated update"
on storage.objects
for update
to authenticated
using (bucket_id = 'apex-certificates')
with check (bucket_id = 'apex-certificates');

-- Columna para guardar el informe visual avanzado importado desde carpetas locales.
alter table public.certificates
add column if not exists analysis_images jsonb;


-- =========================================================
-- APEX Public Collector Profiles
-- Run this once in Supabase SQL Editor.
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text unique,
  public_collection boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.slugify_username(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(value, 'collector')), '[^a-z0-9]+', '-', 'g'));
$$;

drop policy if exists "Profiles owner select" on public.profiles;
create policy "Profiles owner select"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Profiles owner insert" on public.profiles;
create policy "Profiles owner insert"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Profiles owner update" on public.profiles;
create policy "Profiles owner update"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  display text;
begin
  display := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Collector');
  base_username := public.slugify_username(coalesce(new.raw_user_meta_data->>'username', display, split_part(new.email, '@', 1)));
  if base_username is null or base_username = '' then
    base_username := 'collector';
  end if;
  final_username := base_username;

  if exists (select 1 from public.profiles where username = final_username) then
    final_username := base_username || '-' || left(new.id::text, 6);
  end if;

  insert into public.profiles (id, display_name, username, public_collection)
  values (new.id, display, final_username, true)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

create or replace function public.get_public_certificate_owner(p_certificate_id text)
returns table (
  user_id uuid,
  username text,
  display_name text
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.username, coalesce(nullif(p.display_name, ''), p.username) as display_name
  from public.certificate_ownerships o
  join public.profiles p on p.id = o.user_id
  where o.certificate_id = p_certificate_id
    and o.is_current_owner = true
    and p.public_collection = true
  limit 1;
$$;

grant execute on function public.get_public_certificate_owner(text) to anon, authenticated;

create or replace function public.get_public_collector_cards(p_username text)
returns table (
  username text,
  display_name text,
  certificate_id text,
  status text,
  final_grade text,
  average_score numeric,
  card_name text,
  card_year integer,
  brand text,
  set_name text,
  card_number text,
  variant text,
  front_image_url text,
  back_image_url text,
  slab_image_url text,
  acquired_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.username,
    coalesce(nullif(p.display_name, ''), p.username) as display_name,
    c.certificate_id,
    c.status,
    c.final_grade,
    c.average_score,
    c.card_name,
    c.card_year,
    c.brand,
    c.set_name,
    c.card_number,
    c.variant,
    c.front_image_url,
    c.back_image_url,
    c.slab_image_url,
    o.acquired_at
  from public.profiles p
  join public.certificate_ownerships o on o.user_id = p.id and o.is_current_owner = true
  join public.certificates c on c.certificate_id = o.certificate_id
  where lower(p.username) = lower(p_username)
    and p.public_collection = true
  order by o.acquired_at desc;
$$;

grant execute on function public.get_public_collector_cards(text) to anon, authenticated;
