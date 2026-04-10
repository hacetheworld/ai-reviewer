import { Worker } from 'bullmq';
import { prReviewQueue } from './queue.js';
import { getRepoConfig } from '../models/configModel.js';
import { insertHistory } from '../models/historyModel.js';
import { getRepoByRepoId } from '../models/repoModel.js';
import { decryptText } from '../services/encryptionService.js';
import { getUserPatByGithubUserId } from '../models/userModel.js';
import {
  getPullRequest,
  getPullRequestFiles,
  postPullRequestReview,
} from '../services/githubService.js';
import { reviewPullRequestWithAI } from '../services/aiService.js';
import { info, error as logError } from '../utils/logger.js';

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
};

function shouldIgnoreFile(path) {
  const lower = (path || '').toLowerCase();
  if (lower.endsWith('package-lock.json')) return true;
  if (lower.endsWith('pnpm-lock.yaml')) return true;
  if (lower.endsWith('yarn.lock')) return true;
  if (lower.endsWith('.lock')) return true;
  return false;
}

function buildDiffText(files) {
  const maxLines = Number(process.env.DIFF_MAX_LINES || 3000);
  let lines = 0;
  const out = [];

  for (const f of files) {
    if (shouldIgnoreFile(f.filename)) continue;
    if (f.status === 'removed') continue;
    const patch = f.patch;
    if (!patch) continue;

    const patchLines = patch.split('\n');
    if (lines + patchLines.length > maxLines) {
      out.push('Diff truncated due to size');
      break;
    }

    out.push(`--- ${f.filename}`);
    out.push(patch);
    lines += patchLines.length;
  }

  return out.join('\n');
}

async function resolveTokenForUser(githubUserId) {
  const row = await getUserPatByGithubUserId(String(githubUserId));
  if (!row) {
    const err = new Error('No PAT configured for githubUserId');
    err.status = 400;
    throw err;
  }
  return decryptText(row.encrypted_pat);
}

export async function startWorker() {
  // Keep reference for visibility. Queue import ensures queue exists.
  void prReviewQueue;

  const worker = new Worker(
    'pr-review-queue',
    async (job) => {
      const { repoId, owner, repo, prNumber, githubUserId } = job.data;
      info('Processing PR review job', { repoId, owner, repo, prNumber, jobId: job.id });

      const repoRow = await getRepoByRepoId(String(repoId));
      if (repoRow && repoRow.is_enabled === false) {
        info('Repo disabled, skipping', { repoId });
        return;
      }

      const token = await resolveTokenForUser(githubUserId);

      const pr = await getPullRequest({ token, owner, repo, prNumber });
      const files = await getPullRequestFiles({ token, owner, repo, prNumber });
      const config = await getRepoConfig(String(repoId), String(githubUserId));

      const diffText = buildDiffText(files);
      const ai = await reviewPullRequestWithAI({
        title: pr.title,
        description: pr.body,
        diffText,
        rules: config?.rules,
      });

      const reviewBody = ai.summary || `Automated review by me :robot: which Ajay Created. Please check the comments for details. ALSO here are the rules for this repo: ${JSON.stringify(config?.rules || {})}`;
      const comments = ai.comments || [];

      await postPullRequestReview({
        token,
        owner,
        repo,
        prNumber,
        body: reviewBody,
        comments,
      });

      await insertHistory({
        repoId: String(repoId),
        githubUserId: String(githubUserId),
        prNumber: Number(prNumber),
        summary: reviewBody,
        comments,
        prTitle: pr.title,
      });

      info('PR review completed', { repoId, prNumber });
    },
    { connection }
  );

  worker.on('failed', (job, err) => {
    logError('Job failed', { jobId: job?.id, error: err?.message });
  });

  worker.on('error', (err) => {
    logError('Worker error', { error: err?.message });
  });

  info('Worker started');
  return worker;
}

// Allow running as a standalone process
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  startWorker().catch((e) => {
    logError('Failed to start worker', { error: e?.message });
    process.exit(1);
  });
}
