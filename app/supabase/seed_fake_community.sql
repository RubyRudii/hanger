-- Seed 5 fake community pilots that like, comment, and follow the earliest
-- profile in the DB (that's you). Idempotent — safe to run repeatedly.
--
-- Newer Supabase installs block direct inserts to auth.users from the SQL
-- editor, so we bypass auth entirely: drop the profiles → auth.users FK,
-- insert fake profiles with fresh UUIDs, then re-add the FK as NOT VALID
-- (still enforces for new signups, doesn't reject the existing fakes).
--
-- To remove all fake community data later, run:
--   delete from public.profiles where handle in
--     ('zeropilot','msbuilder_tokyo','redcomet_88','gundamkid','plamo_uk');

alter table public.profiles drop constraint if exists profiles_id_fkey;

do $$
declare
  target_user_id uuid;
  handles text[] := array['zeropilot','msbuilder_tokyo','redcomet_88','gundamkid','plamo_uk'];
  names   text[] := array['Zero Pilot','MS Builder','Red Comet','Gundam Kid','Plamo UK'];
  bios    text[] := array[
    'Building since 2019. UC purist. Weathering enthusiast.',
    'MG Master Grade collector. Tokyo based.',
    '3x the speed. Char loyalist.',
    'HG / RG kits, out-of-box builder.',
    'London builder. Custom paint jobs.'
  ];
  fake_ids uuid[] := array[]::uuid[];
  current_id uuid;
  target_build_ids uuid[];
begin
  select id into target_user_id from public.profiles order by created_at asc limit 1;

  for i in 1..array_length(handles, 1) loop
    select id into current_id from public.profiles where handle = handles[i];
    if current_id is null then
      current_id := gen_random_uuid();
      insert into public.profiles (id, handle, display_name, bio, joined_year, created_at)
      values (current_id, handles[i], names[i], bios[i], 2020, now() - interval '30 days');
    end if;
    fake_ids := array_append(fake_ids, current_id);
  end loop;

  select array_agg(id) into target_build_ids from public.builds where user_id = target_user_id;

  if target_build_ids is not null and array_length(target_build_ids, 1) > 0 then
    insert into public.likes (user_id, build_id, created_at)
    select f.fid, b, now() - (random() * interval '3 days')
      from unnest(fake_ids) f(fid)
      cross join unnest(target_build_ids) b
     where f.fid <> target_user_id
    on conflict do nothing;
  end if;

  insert into public.follows (follower_id, followee_id, created_at)
  select unnest(fake_ids), target_user_id, now() - (random() * interval '2 days')
  on conflict do nothing;

  -- Wipe prior fake comments so this stays idempotent
  delete from public.comments c
   using public.profiles p
   where c.user_id = p.id
     and p.handle in ('zeropilot','msbuilder_tokyo','redcomet_88','gundamkid','plamo_uk');
end $$;

insert into public.comments (user_id, build_id, body, created_at)
select
  (select id from public.profiles where handle = c.handle),
  b.id,
  c.body,
  now() - (c.hours_ago || ' hours')::interval
from (values
  ('zeropilot',       'Nu Gundam Ver. Ka', 'Wing detailing is nasty. What size pen for the panels?', 1),
  ('msbuilder_tokyo', 'Nu Gundam Ver. Ka', 'The pose sells it. Fin funnel positioning is fire.',    3),
  ('redcomet_88',     'Sazabi Ver. Ka',    'Weathering feels right — Char would approve.',           5),
  ('gundamkid',       'Strike Freedom',    'RG snap-fit really punches above its weight.',           8),
  ('plamo_uk',        'Sazabi Ver. Ka',    'Would love to see the funnels deployed from behind.',    12)
) as c(handle, kit, body, hours_ago)
join public.builds b
  on b.kit_name = c.kit
 and b.user_id = (select id from public.profiles order by created_at asc limit 1)
where (select id from public.profiles where handle = c.handle) is not null;

-- Re-add the FK as NOT VALID so real signups still enforce it, but the
-- fake profiles (which have no matching auth.users row) are allowed to stay.
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users(id) on delete cascade not valid;
