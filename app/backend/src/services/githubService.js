import crypto from 'crypto';

function getApiBase() {
  return process.env.GITHUB_API_BASE_URL || 'https://api.github.com';
}

export async function githubRequest({ token, method, path, body }) {
  const url = `${getApiBase()}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ai-reviewer',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const msg = json?.message || `GitHub API error (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.details = json;
    throw err;
  }

  return json;
}

export async function validatePat(token) {
  const me = await githubRequest({ token, method: 'GET', path: '/user' });
  return { id: String(me.id), login: me.login };
}

export async function listUserRepos(token) {
  // Minimal: list repos for authenticated user.
  // Pagination omitted for simplicity.
  const repos = await githubRequest({
    token,
    method: 'GET',
    path: '/user/repos?per_page=100&sort=updated',
  });
  return repos.map((r) => ({
    repoId: String(r.id),
    owner: r.owner?.login,
    name: r.name,
    fullName: r.full_name,
    private: r.private,
  }));
}

export async function createWebhook({ token, owner, repo, webhookUrl, secret }) {
  return githubRequest({
    token,
    method: 'POST',
    path: `/repos/${owner}/${repo}/hooks`,
    body: {
      name: 'web',
      active: true,
      events: ['pull_request'],
      config: {
        url: webhookUrl,
        content_type: 'json',
        secret,
      },
    },
  });
}

export async function listRepoWebhooks({ token, owner, repo }) {
  return githubRequest({
    token,
    method: 'GET',
    path: `/repos/${owner}/${repo}/hooks?per_page=100`,
  });
}

export async function deleteRepoWebhook({ token, owner, repo, hookId }) {
  return githubRequest({
    token,
    method: 'DELETE',
    path: `/repos/${owner}/${repo}/hooks/${hookId}`,
  });
}

export async function getPullRequest({ token, owner, repo, prNumber }) {
  return githubRequest({
    token,
    method: 'GET',
    path: `/repos/${owner}/${repo}/pulls/${prNumber}`,
  });
}

export async function getPullRequestFiles({ token, owner, repo, prNumber }) {
  // Pagination omitted for simplicity.
  return githubRequest({
    token,
    method: 'GET',
    path: `/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100`,
  });
}

export async function postPullRequestReview({ token, owner, repo, prNumber, body, comments }) {
  return githubRequest({
    token,
    method: 'POST',
    path: `/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
    body: {
      body,
      event: 'COMMENT',
      comments, // [{path, position, body}]
    },
  });
}

export function verifyWebhookSignature({ secret, rawBody, signatureHeader }) {
  if (!signatureHeader) return false;
  // GitHub sends: "sha256=..."
  const [algo, signature] = signatureHeader.split('=');
  if (algo !== 'sha256' || !signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(digest, 'hex'));
  } catch {
    return false;
  }
}
