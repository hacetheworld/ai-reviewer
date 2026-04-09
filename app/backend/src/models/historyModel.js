import { supabase } from '../db/client.js';

export async function insertHistory({ repoId, prNumber, summary, comments, prTitle }) {
  const { data, error } = await supabase
    .from('history')
    .insert({
      repo_id: repoId,
      pr_number: prNumber,
      pr_title: prTitle || '',
      summary,
      comments,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function listHistory(repoId) {
  const query = supabase.from('history').select('*').order('created_at', { ascending: false });
  const { data, error } = repoId ? await query.eq('repo_id', repoId) : await query;
  if (error) throw error;
  return data;
}
