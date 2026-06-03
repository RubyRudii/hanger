-- Kits collection log. Independent of public.builds (which is the AI-judged builds table).
-- Each user sees only their own kits.

create table if not exists public.kits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kit_name text not null,
  grade text not null,
  series text,
  notes text,
  photo_url text,
  created_at timestamptz default now()
);

create index if not exists kits_user_id_idx on public.kits (user_id);
create index if not exists kits_created_at_idx on public.kits (created_at desc);

alter table public.kits enable row level security;

drop policy if exists "kits_read_own" on public.kits;
create policy "kits_read_own" on public.kits for select using (auth.uid() = user_id);

drop policy if exists "kits_insert_self" on public.kits;
create policy "kits_insert_self" on public.kits for insert with check (auth.uid() = user_id);

drop policy if exists "kits_update_self" on public.kits;
create policy "kits_update_self" on public.kits for update using (auth.uid() = user_id);

drop policy if exists "kits_delete_self" on public.kits;
create policy "kits_delete_self" on public.kits for delete using (auth.uid() = user_id);

-- Storage policies in schema.sql already permit `<userId>/kits/...` paths in the build-photos bucket.
-- No storage migration required.
