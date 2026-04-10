import { prReviewQueue } from '../queue/queue.js';
import { verifyWebhookSignature } from './githubService.js';
import { getRepoByRepoId } from '../models/repoModel.js';

export async function handleGithubWebhook({ rawBody, signature, event, payload }) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) throw new Error('WEBHOOK_SECRET is required');

  const isValid = verifyWebhookSignature({
    secret,
    rawBody,
    signatureHeader: signature,
  });

  if (!isValid) {
    const err = new Error('Invalid webhook signature');
    err.status = 401;
    throw err;
  }

  if (event !== 'pull_request') {
    return { ignored: true };
  }

  const action = payload?.action;
  if (!['opened', 'synchronize', 'reopened'].includes(action)) {
    return { ignored: true };
  }

  const repoId = String(payload?.repository?.id);
  const owner = payload?.repository?.owner?.login;
  const repo = payload?.repository?.name;
  const prNumber = payload?.pull_request?.number;

  if (!repoId || !owner || !repo || !prNumber) {
    const err = new Error('Missing webhook fields');
    err.status = 400;
    throw err;
  }

  const repoRow = await getRepoByRepoId(repoId);
  if (!repoRow || !repoRow.github_user_id) {
    const err = new Error('Repo not configured');
    err.status = 400;
    throw err;
  }

  if (repoRow.is_enabled === false) {
    return { ignored: true };
  }

  await prReviewQueue.add('pr-review', {
    repoId,
    owner,
    repo,
    prNumber,
    githubUserId: repoRow.github_user_id,
  });

  return { queued: true };
}
