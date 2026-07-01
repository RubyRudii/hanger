-- Comments on builds. Public-readable like the feed itself.

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references public.builds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists comments_build_idx on public.comments (build_id, created_at desc);
create index if not exists comments_user_idx on public.comments (user_id);

alter table public.comments enable row level security;

drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all" on public.comments for select using (true);

drop policy if exists "comments_insert_self" on public.comments;
create policy "comments_insert_self" on public.comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "comments_delete_self" on public.comments;
create policy "comments_delete_self" on public.comments
  for delete using (auth.uid() = user_id);

-- Denormalized counter on builds.
alter table public.builds
  add column if not exists comment_count int not null default 0;

create or replace function public.touch_build_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.builds set comment_count = comment_count + 1 where id = new.build_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.builds set comment_count = greatest(comment_count - 1, 0) where id = old.build_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists comments_after_insert on public.comments;
create trigger comments_after_insert
  after insert on public.comments
  for each row execute function public.touch_build_comment_count();

drop trigger if exists comments_after_delete on public.comments;
create trigger comments_after_delete
  after delete on public.comments
  for each row execute function public.touch_build_comment_count();

-- Backfill counts for existing builds.
update public.builds b
   set comment_count = (select count(*) from public.comments c where c.build_id = b.id);
