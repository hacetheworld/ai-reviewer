-- Store PR title for better history UI

alter table public.history
  add column if not exists pr_title text not null default '';
