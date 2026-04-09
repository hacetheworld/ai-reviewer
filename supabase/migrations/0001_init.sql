-- AI Reviewer - Initial schema
-- Run this in Supabase Dashboard -> SQL Editor.
-- Matches rules.md schema and current backend models.

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- user_pat
create table if not exists public.user_pat (
  id uuid primary key default gen_random_uuid(),
  github_user_id text not null unique,
  username text not null,
  encrypted_pat text not null,
  created_at timestamp with time zone not null default now()
);

-- repos
create table if not exists public.repos (
  id uuid primary key default gen_random_uuid(),
  repo_id text not null unique,
  owner text not null,
  name text not null,
  is_enabled boolean not null default false
);

-- config
create table if not exists public.config (
  id uuid primary key default gen_random_uuid(),
  repo_id text not null unique,
  rules text not null default ''
);

-- history
create table if not exists public.history (
  id uuid primary key default gen_random_uuid(),
  repo_id text not null,
  pr_number int not null,
  summary text not null,
  comments jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default now()
);

create index if not exists history_repo_id_created_at_idx
  on public.history (repo_id, created_at desc);
