import { supabase } from '../db/client.js';

export async function upsertRepoConfig({ repoId, rules }) {
  const { data, error } = await supabase
    .from('config')
    .upsert(
      {
        repo_id: repoId,
        rules,
      },
      { onConflict: 'repo_id' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getRepoConfig(repoId) {
  const { data, error } = await supabase.from('config').select('*').eq('repo_id', repoId).maybeSingle();
  if (error) throw error;
  return data;
}
