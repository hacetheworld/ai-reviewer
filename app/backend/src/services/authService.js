import { validatePat } from './githubService.js';
import { encryptText } from './encryptionService.js';
import { upsertUserPat } from '../models/userModel.js';

export async function savePat(pat) {
  const me = await validatePat(pat);
  const encryptedPat = encryptText(pat);
  const row = await upsertUserPat({
    githubUserId: me.id,
    username: me.login,
    encryptedPat,
  });

  return { githubUserId: row.github_user_id, username: row.username };
}
