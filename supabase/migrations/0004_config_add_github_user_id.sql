alter table public.config
add column if not exists github_user_id text;

-- Backfill existing rows to a placeholder to allow NOT NULL later if desired.
-- For now keep nullable to avoid breaking existing installs.

create index if not exists config_github_user_id_idx on public.config (github_user_id);

-- Prefer config scoped per user. Unique when github_user_id present.
create unique index if not exists config_repo_user_unique on public.config (repo_id, github_user_id);
