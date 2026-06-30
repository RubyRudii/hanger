-- Adds editable profile fields: bio and avatar URL.

alter table public.profiles
  add column if not exists bio text,
  add column if not exists avatar_url text;

-- Length sanity (Postgres check, not a hard requirement, gracefully ignored on conflict)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_bio_length') then
    alter table public.profiles add constraint profiles_bio_length check (char_length(coalesce(bio, '')) <= 280);
  end if;
end$$;
