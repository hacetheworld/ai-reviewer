-- Add repo -> GitHub user mapping so worker can resolve correct PAT

alter table public.repos
  add column if not exists github_user_id text;

-- Backfill for existing repos: pick the most recent user_pat row
update public.repos r
set github_user_id = up.github_user_id
from (
  select github_user_id
  from public.user_pat
  order by created_at desc
  limit 1
) up
where r.github_user_id is null;

alter table public.repos
  alter column github_user_id set not null;

create index if not exists repos_github_user_id_idx
  on public.repos (github_user_id);
