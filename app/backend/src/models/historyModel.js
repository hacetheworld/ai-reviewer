import { supabase } from '../db/client.js';

export async function insertHistory({ repoId, githubUserId, prNumber, summary, comments, prTitle }) {
  const insertRow = {
    repo_id: repoId,
    pr_number: prNumber,
    pr_title: prTitle || '',
    summary,
    comments,
  };

  // Only include after the migration exists in the DB.
  if (typeof githubUserId === 'string' && githubUserId) {
    insertRow.github_user_id = githubUserId;
  }

  const { data, error } = await supabase
    .from('history')
    .insert(insertRow)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function listHistory({ repoId, githubUserId }) {
  const query = supabase
    .from('history')
    .select('*')
    .eq('repo_id', repoId)
    .eq('github_user_id', githubUserId)
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  if (!error) return data;

  // Backward compatibility if github_user_id column doesn't exist yet.
  if (String(error?.message || '').includes('github_user_id')) {
    const fallback = await supabase
      .from('history')
      .select('*')
      .eq('repo_id', repoId)
      .order('created_at', { ascending: false });
    if (fallback.error) throw fallback.error;
    return fallback.data;
  }

  throw error;
}
