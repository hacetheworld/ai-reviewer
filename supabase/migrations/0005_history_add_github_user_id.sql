alter table public.history
add column if not exists github_user_id text;

create index if not exists history_github_user_id_idx on public.history (github_user_id);
create index if not exists history_repo_user_idx on public.history (repo_id, github_user_id);
