import { supabase } from '../db/client.js';

export async function upsertRepo({ repoId, owner, name, isEnabled }) {
  const { data, error } = await supabase
    .from('repos')
    .upsert(
      {
        repo_id: repoId,
        owner,
        name,
        is_enabled: isEnabled,
      },
      { onConflict: 'repo_id' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function upsertRepoWithUser({ repoId, owner, name, isEnabled, githubUserId }) {
  const { data, error } = await supabase
    .from('repos')
    .upsert(
      {
        repo_id: repoId,
        owner,
        name,
        is_enabled: isEnabled,
        github_user_id: githubUserId,
      },
      { onConflict: 'repo_id' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function listRepos() {
  const { data, error } = await supabase.from('repos').select('*').order('owner');
  if (error) throw error;
  return data;
}

export async function setRepoEnabled(repoId, enabled) {
  const { data, error } = await supabase
    .from('repos')
    .update({ is_enabled: enabled })
    .eq('repo_id', repoId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getRepoByRepoId(repoId) {
  const { data, error } = await supabase.from('repos').select('*').eq('repo_id', repoId).maybeSingle();
  if (error) throw error;
  return data;
}
