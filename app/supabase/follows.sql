-- Follows: user A follows user B. Two rows to represent a mutual follow.

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index if not exists follows_follower_idx on public.follows (follower_id);
create index if not exists follows_followee_idx on public.follows (followee_id);

alter table public.follows enable row level security;

drop policy if exists "follows_select_all" on public.follows;
create policy "follows_select_all" on public.follows for select using (true);

drop policy if exists "follows_insert_self" on public.follows;
create policy "follows_insert_self" on public.follows
  for insert with check (auth.uid() = follower_id);

drop policy if exists "follows_delete_self" on public.follows;
create policy "follows_delete_self" on public.follows
  for delete using (auth.uid() = follower_id);

-- Denormalized counts.
alter table public.profiles
  add column if not exists follower_count int not null default 0,
  add column if not exists following_count int not null default 0;

create or replace function public.touch_follow_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles set follower_count  = follower_count  + 1 where id = new.followee_id;
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.profiles set follower_count  = greatest(follower_count  - 1, 0) where id = old.followee_id;
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists follows_after_insert on public.follows;
create trigger follows_after_insert
  after insert on public.follows
  for each row execute function public.touch_follow_counts();

drop trigger if exists follows_after_delete on public.follows;
create trigger follows_after_delete
  after delete on public.follows
  for each row execute function public.touch_follow_counts();

-- Backfill for any pre-existing rows.
update public.profiles p set
  follower_count  = (select count(*) from public.follows f where f.followee_id = p.id),
  following_count = (select count(*) from public.follows f where f.follower_id = p.id);
