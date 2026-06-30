-- Push notification token storage.
-- Stored on the profile so we can target a specific user by id.

alter table public.profiles
  add column if not exists push_token text,
  add column if not exists push_enabled boolean not null default true;

-- Index for the rare case we ever need to lookup by token (e.g. cleanup of
-- duplicate tokens across users that switched accounts).
create index if not exists profiles_push_token_idx on public.profiles (push_token);
