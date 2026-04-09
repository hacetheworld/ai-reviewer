import { supabase } from '../db/client.js';

export async function upsertUserPat({ githubUserId, username, encryptedPat }) {
  const { data, error } = await supabase
    .from('user_pat')
    .upsert(
      {
        github_user_id: githubUserId,
        username,
        encrypted_pat: encryptedPat,
      },
      { onConflict: 'github_user_id' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getUserPatByGithubUserId(githubUserId) {
  const { data, error } = await supabase
    .from('user_pat')
    .select('*')
    .eq('github_user_id', githubUserId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
