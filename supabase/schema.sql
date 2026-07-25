create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.strains (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  current_count integer not null default 0 check (current_count >= 0),
  category text not null default 'Unknown',
  breeder text not null default 'Unknown',
  cross_name text not null default 'Research needed',
  lineage text not null default 'Research needed',
  flavors text[] not null default '{}',
  tags text[] not null default '{}',
  general_notes text not null default '',
  status text not null default 'Needs research',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.strain_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  strain_id uuid not null references public.strains(id) on delete cascade,
  note_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.strain_photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  strain_id uuid not null references public.strains(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.breeding_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  female_parent text not null default '',
  male_parent text not null default '',
  generation text not null default '',
  plant_count integer not null default 0 check (plant_count >= 0),
  stage text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seed_inventory (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  breeder text not null default '',
  packs integer not null default 0 check (packs >= 0),
  seeds_per_pack integer not null default 0 check (seeds_per_pack >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists strains_owner_name_idx on public.strains(owner_id, name);
create index if not exists strain_notes_strain_idx on public.strain_notes(strain_id, created_at desc);
create index if not exists strain_photos_strain_idx on public.strain_photos(strain_id, created_at desc);
create index if not exists projects_owner_idx on public.breeding_projects(owner_id);
create index if not exists seeds_owner_name_idx on public.seed_inventory(owner_id, name);

drop trigger if exists strains_updated_at on public.strains;
create trigger strains_updated_at before update on public.strains for each row execute function public.set_updated_at();
drop trigger if exists breeding_projects_updated_at on public.breeding_projects;
create trigger breeding_projects_updated_at before update on public.breeding_projects for each row execute function public.set_updated_at();
drop trigger if exists seed_inventory_updated_at on public.seed_inventory;
create trigger seed_inventory_updated_at before update on public.seed_inventory for each row execute function public.set_updated_at();

alter table public.strains enable row level security;
alter table public.strain_notes enable row level security;
alter table public.strain_photos enable row level security;
alter table public.breeding_projects enable row level security;
alter table public.seed_inventory enable row level security;

drop policy if exists "Owner controls strains" on public.strains;
create policy "Owner controls strains" on public.strains for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "Owner controls notes" on public.strain_notes;
create policy "Owner controls notes" on public.strain_notes for all to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid() and exists (select 1 from public.strains s where s.id = strain_id and s.owner_id = auth.uid()));

drop policy if exists "Owner controls photo records" on public.strain_photos;
create policy "Owner controls photo records" on public.strain_photos for all to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid() and exists (select 1 from public.strains s where s.id = strain_id and s.owner_id = auth.uid()));

drop policy if exists "Owner controls projects" on public.breeding_projects;
create policy "Owner controls projects" on public.breeding_projects for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "Owner controls seeds" on public.seed_inventory;
create policy "Owner controls seeds" on public.seed_inventory for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('strain-images', 'strain-images', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Owner reads strain images" on storage.objects;
create policy "Owner reads strain images" on storage.objects for select to authenticated
using (bucket_id = 'strain-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Owner uploads strain images" on storage.objects;
create policy "Owner uploads strain images" on storage.objects for insert to authenticated
with check (bucket_id = 'strain-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Owner updates strain images" on storage.objects;
create policy "Owner updates strain images" on storage.objects for update to authenticated
using (bucket_id = 'strain-images' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'strain-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Owner deletes strain images" on storage.objects;
create policy "Owner deletes strain images" on storage.objects for delete to authenticated
using (bucket_id = 'strain-images' and (storage.foldername(name))[1] = auth.uid()::text);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='strains') then
    alter publication supabase_realtime add table public.strains;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='breeding_projects') then
    alter publication supabase_realtime add table public.breeding_projects;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='seed_inventory') then
    alter publication supabase_realtime add table public.seed_inventory;
  end if;
end $$;
