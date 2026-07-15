-- Moderation: reports + blocks (App Store guideline 1.2 for social/UGC apps).

-- ── Reports ────────────────────────────────────────────────────────────────
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  subject_kind text not null check (subject_kind in ('build', 'comment', 'profile')),
  subject_id uuid not null,
  reason text not null check (reason in ('spam', 'harassment', 'hate', 'sexual', 'violence', 'ip_violation', 'other')),
  notes text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed', 'actioned')),
  created_at timestamptz not null default now()
);

create index if not exists reports_subject_idx on public.reports (subject_kind, subject_id);
create index if not exists reports_status_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;

drop policy if exists "reports_insert_self" on public.reports;
create policy "reports_insert_self" on public.reports
  for insert with check (auth.uid() = reporter_id);

-- No general select policy — only service_role can review reports.

-- ── Blocks ─────────────────────────────────────────────────────────────────
create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocker_idx on public.blocks (blocker_id);
create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;

drop policy if exists "blocks_select_own" on public.blocks;
create policy "blocks_select_own" on public.blocks
  for select using (auth.uid() = blocker_id);

drop policy if exists "blocks_insert_self" on public.blocks;
create policy "blocks_insert_self" on public.blocks
  for insert with check (auth.uid() = blocker_id);

drop policy if exists "blocks_delete_self" on public.blocks;
create policy "blocks_delete_self" on public.blocks
  for delete using (auth.uid() = blocker_id);
