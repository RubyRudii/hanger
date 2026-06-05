-- Subscription / entitlement columns on profiles.
-- Eventually a RevenueCat webhook will toggle is_premium / premium_until.
-- For now: is_admin lets you bypass the paywall during testing.

alter table public.profiles
  add column if not exists is_premium boolean not null default false,
  add column if not exists premium_until timestamptz,
  add column if not exists is_admin boolean not null default false;

create or replace view public.entitled_users as
  select id, is_admin or (is_premium and (premium_until is null or premium_until > now())) as has_access
  from public.profiles;

-- helper used by the judge edge function
create or replace function public.user_has_access(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(is_admin, false)
      or (coalesce(is_premium, false)
          and (premium_until is null or premium_until > now()))
    from public.profiles
   where id = uid;
$$;

grant execute on function public.user_has_access(uuid) to anon, authenticated, service_role;

-- Bootstrap: promote the earliest-created profile (you) to admin so you can
-- bypass the paywall while testing. Change/remove this in production.
update public.profiles
   set is_admin = true
 where id = (select id from public.profiles order by created_at asc limit 1);
