-- Hanger schema: profiles + builds + storage bucket + RLS

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  display_name text,
  joined_year int,
  created_at timestamptz default now()
);

create table if not exists public.builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kit_name text not null,
  grade text not null,
  series text,
  modifications text,
  photo_url text,
  score int not null check (score between 0 and 100),
  scores jsonb not null,
  verdict text not null,
  strength text not null,
  work_on text not null,
  created_at timestamptz default now()
);

create index if not exists builds_created_at_idx on public.builds (created_at desc);
create index if not exists builds_user_id_idx on public.builds (user_id);
create index if not exists builds_score_idx on public.builds (score desc);

alter table public.profiles enable row level security;
alter table public.builds enable row level security;

drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all" on public.profiles for select using (true);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fallback_handle text := coalesce(
    new.raw_user_meta_data->>'handle',
    split_part(new.email, '@', 1)
  );
begin
  insert into public.profiles (id, handle, display_name, joined_year)
  values (new.id, fallback_handle, fallback_handle, extract(year from now())::int)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists "builds_read_all" on public.builds;
create policy "builds_read_all" on public.builds for select using (true);

drop policy if exists "builds_insert_self" on public.builds;
create policy "builds_insert_self" on public.builds for insert with check (auth.uid() = user_id);

drop policy if exists "builds_delete_self" on public.builds;
create policy "builds_delete_self" on public.builds for delete using (auth.uid() = user_id);

-- Storage bucket for build photos. Public-read, authenticated-write under your own folder.
insert into storage.buckets (id, name, public)
values ('build-photos', 'build-photos', true)
on conflict (id) do nothing;

drop policy if exists "build_photos_read" on storage.objects;
create policy "build_photos_read" on storage.objects for select using (bucket_id = 'build-photos');

drop policy if exists "build_photos_insert_own" on storage.objects;
create policy "build_photos_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'build-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "build_photos_delete_own" on storage.objects;
create policy "build_photos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'build-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
