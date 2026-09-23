-- Pre-launch cleanup: strip the test data that was seeded during
-- development so nothing embarrassing ships to production.
--
-- Paste this into Supabase Studio → SQL Editor and run once, before the
-- first real Play Store release. Safe to re-run — every statement is
-- idempotent.
--
-- Order of operations matters:
--   1. Drop the seed builds first (they belong to your own profile).
--   2. Drop the fake pilots (cascades to their likes / comments / follows
--      via the FKs already in schema.sql).
--   3. Revalidate the profiles → auth.users FK. This is the last check
--      that no orphaned/fake profiles remain — if the ALTER fails, run
--      the SELECT below it to see which handles still don't have a
--      matching auth.users row and delete them.
--   4. Optionally flip your own admin override off so you experience
--      the paywall exactly like a real user.

------------------------------------------------------------------------
-- 1. Seed builds (from seed_test_builds.sql)
------------------------------------------------------------------------
delete from public.builds
 where kit_name in (
   'Nu Gundam Ver. Ka',
   'Sazabi Ver. Ka',
   'Strike Freedom',
   'Apex Mark VII',
   'Crimson Raptor',
   'Solaris Strike'
 );

------------------------------------------------------------------------
-- 2. Fake community pilots (from seed_fake_community.sql). Deletes
--    cascade to their likes, follows, and comments through the FKs
--    defined in schema.sql / follows.sql / likes.sql / comments.sql.
------------------------------------------------------------------------
delete from public.profiles
 where handle in (
   'zeropilot',
   'msbuilder_tokyo',
   'redcomet_88',
   'gundamkid',
   'plamo_uk'
 );

------------------------------------------------------------------------
-- 3. Revalidate the profiles → auth.users FK. It was dropped and
--    re-added as NOT VALID by seed_fake_community.sql so the fake
--    profiles could stay. Now that they're gone, every remaining
--    profile SHOULD have a matching auth.users row.
------------------------------------------------------------------------
do $$
begin
  -- Try to validate. If it fails, we surface the orphan handles so you
  -- can inspect / delete them manually.
  begin
    alter table public.profiles validate constraint profiles_id_fkey;
    raise notice 'FK revalidated — every profile now has a matching auth.users row.';
  exception when others then
    raise notice 'FK validation failed. Orphan profiles listed below:';
    raise notice '%', (
      select string_agg(handle, ', ')
        from public.profiles p
       where not exists (select 1 from auth.users u where u.id = p.id)
    );
  end;
end $$;

-- Optional: run this manually to see the list of orphaned profiles that
-- would block the FK revalidation. Should return zero rows.
--
-- select p.id, p.handle, p.display_name
--   from public.profiles p
--  where not exists (select 1 from auth.users u where u.id = p.id);

------------------------------------------------------------------------
-- 4. Optional: turn off your own admin override so you experience the
--    real paywall in production. Skip this if you want to keep bypassing
--    the paywall as the app owner (there's nothing shady about it — it's
--    your app).
------------------------------------------------------------------------
--
-- update public.profiles
--    set is_admin = false
--  where handle = 'YOUR_HANDLE_HERE';
