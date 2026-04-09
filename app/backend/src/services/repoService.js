import { listUserRepos, createWebhook, listRepoWebhooks, deleteRepoWebhook } from './githubService.js';
import { upsertRepoWithUser, setRepoEnabled, listRepos as listReposDb, getRepoByRepoId } from '../models/repoModel.js';
import { getUserPatByGithubUserId } from '../models/userModel.js';
import { decryptText } from './encryptionService.js';

export async function fetchGithubRepos(pat) {
  const repos = await listUserRepos(pat);
  return repos;
}

export async function fetchGithubReposWithEnabled(pat) {
  const [ghRepos, enabledRows] = await Promise.all([listUserRepos(pat), listReposDb()]);
  const enabledSet = new Set((enabledRows || []).filter((r) => r.is_enabled).map((r) => String(r.repo_id)));
  return (ghRepos || []).map((r) => ({
    ...r,
    isEnabled: enabledSet.has(String(r.repoId)),
  }));
}

export async function enableRepo({ repoId, owner, name, pat, webhookUrl, webhookSecret, githubUserId }) {
  await createWebhook({
    token: pat,
    owner,
    repo: name,
    webhookUrl,
    secret: webhookSecret,
  });

  await upsertRepoWithUser({ repoId, owner, name, isEnabled: true, githubUserId });

  return { repoId, owner, name, isEnabled: true, githubUserId };
}

export async function disableRepo({ repoId }) {
  const repoRow = await getRepoByRepoId(repoId);
  if (!repoRow) {
    const err = new Error('Repo not found');
    err.status = 404;
    throw err;
  }

  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    const err = new Error('WEBHOOK_URL is required');
    err.status = 500;
    throw err;
  }

  const patRow = await getUserPatByGithubUserId(repoRow.github_user_id);
  if (!patRow) {
    const err = new Error('PAT not found for repo owner');
    err.status = 400;
    throw err;
  }
  const token = decryptText(patRow.encrypted_pat);

  // Delete webhook(s) matching our configured URL (schema is strict; we don't store hook_id)
  const hooks = await listRepoWebhooks({ token, owner: repoRow.owner, repo: repoRow.name });
  const matches = (hooks || []).filter((h) => h?.config?.url === webhookUrl);
  for (const h of matches) {
    await deleteRepoWebhook({ token, owner: repoRow.owner, repo: repoRow.name, hookId: h.id });
  }

  const row = await setRepoEnabled(repoId, false);
  return row;
}

export async function listEnabledRepos() {
  return listReposDb();
}
