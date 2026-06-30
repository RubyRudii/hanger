-- Likes: one row per (user, build). Composite primary key prevents duplicate likes.

create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  build_id uuid not null references public.builds(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, build_id)
);

create index if not exists likes_build_idx on public.likes (build_id);
create index if not exists likes_user_idx on public.likes (user_id);

alter table public.likes enable row level security;

drop policy if exists "likes_select_all" on public.likes;
create policy "likes_select_all" on public.likes for select using (true);

drop policy if exists "likes_insert_self" on public.likes;
create policy "likes_insert_self" on public.likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "likes_delete_self" on public.likes;
create policy "likes_delete_self" on public.likes
  for delete using (auth.uid() = user_id);

-- Denormalized counter on builds for cheap reads on the feed.
alter table public.builds
  add column if not exists like_count int not null default 0;

create or replace function public.touch_build_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.builds set like_count = like_count + 1 where id = new.build_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.builds set like_count = greatest(like_count - 1, 0) where id = old.build_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists likes_after_insert on public.likes;
create trigger likes_after_insert
  after insert on public.likes
  for each row execute function public.touch_build_like_count();

drop trigger if exists likes_after_delete on public.likes;
create trigger likes_after_delete
  after delete on public.likes
  for each row execute function public.touch_build_like_count();

-- Backfill counts for any builds that already exist.
update public.builds b
   set like_count = (select count(*) from public.likes l where l.build_id = b.id);
