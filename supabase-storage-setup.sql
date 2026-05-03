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
