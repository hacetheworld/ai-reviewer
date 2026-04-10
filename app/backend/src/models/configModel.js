import { supabase } from '../db/client.js';

export async function upsertRepoConfig({ repoId, githubUserId, rules }) {
  // After migration, we will scope config by (repo_id, github_user_id).
  // For backward compatibility (before migration), omit github_user_id.
  const row = {
    repo_id: repoId,
    rules,
  };
  if (typeof githubUserId === 'string' && githubUserId) {
    row.github_user_id = githubUserId;
  }

  // Prefer tenant-scoped conflict target if DB has it; fallback to repo_id.
  // If the conflict target doesn't exist yet, Supabase will error; callers should run migrations.
  const conflict = row.github_user_id ? 'repo_id,github_user_id' : 'repo_id';

  const { data, error } = await supabase
    .from('config')
    .upsert(row, { onConflict: conflict })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getRepoConfig(repoId, githubUserId) {
  let query = supabase.from('config').select('*').eq('repo_id', repoId);
  if (typeof githubUserId === 'string' && githubUserId) {
    query = query.eq('github_user_id', githubUserId);
  }

  const { data, error } = await query.maybeSingle();
  if (!error) return data;

  // Backward compatibility if github_user_id column doesn't exist yet.
  if (typeof githubUserId === 'string' && githubUserId && String(error?.message || '').includes('github_user_id')) {
    const fallback = await supabase.from('config').select('*').eq('repo_id', repoId).maybeSingle();
    if (fallback.error) throw fallback.error;
    return fallback.data;
  }

  throw error;
}
