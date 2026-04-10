# API Documentation (Current)

Base URL: `VITE_API_BASE` in the UI (default: `http://localhost:3001`)

Response format (all endpoints):

- Success: `{ "success": true, "data": <any> }`
- Error: `{ "success": false, "error": "<message>" }`

## Auth / Tenant Scoping (Interim)

All non-webhook endpoints require this header:

- `X-GitHub-User-Id: <githubUserId>`

The backend uses this to look up the encrypted PAT in `user_pat`, decrypt it, and call GitHub APIs.

## Endpoints

### GET /health

- Auth: none
- Request: none
- Response:
  - `data`: "ok"

Internal flow:

- Route → handler returns static JSON

---

### POST /auth/pat

Stores an encrypted GitHub PAT and returns the identity.

- Auth: none
- Body:
  - `pat` (string, required)

Response `data`:

- `githubUserId` (string)
- `username` (string)

Internal flow:

- Route → `authController.postPat()`
- Controller validates `pat`
- Service `authService.savePat()`
  - GitHub API `GET /user` to validate token and get `{ id, login }`
  - Encrypt PAT (AES-256-GCM)
  - Upsert into `user_pat` keyed by `github_user_id`

---

### GET /repos

Lists repos from GitHub for the authenticated user, with `isEnabled` coming from DB.

- Auth: `X-GitHub-User-Id` required
- Request: none

Response `data`: array of:

- `repoId` (string)
- `owner` (string)
- `name` (string)
- `fullName` (string)
- `private` (boolean)
- `isEnabled` (boolean)

Internal flow:

- Route → `repoController.getRepos()`
- Middleware loads PAT from DB by `github_user_id`
- Service `repoService.fetchGithubReposWithEnabled({ pat, githubUserId })`
  - GitHub API `GET /user/repos`
  - DB: `repos` rows filtered by `github_user_id`
  - Merge `is_enabled` into `isEnabled`

---

### GET /repos/enabled

Lists enabled repos stored in DB for this user.

- Auth: `X-GitHub-User-Id` required

Response `data`: array of `repos` table rows (subset), including:

- `repo_id` (string)
- `owner` (string)
- `name` (string)
- `is_enabled` (boolean)
- `github_user_id` (string)

Internal flow:

- Route → `repoController.getEnabledRepos()`
- Service `repoService.listEnabledRepos(githubUserId)`
- Model queries `repos` filtered by `github_user_id` and `is_enabled=true`

---

### POST /repos/:id/enable

Enables a repo for review and creates a GitHub webhook.

- Auth: `X-GitHub-User-Id` required
- Params:
  - `id` (string): GitHub repo id
- Body:
  - `owner` (string, required)
  - `name` (string, required)

Response `data`:

- `repoId` (string)
- `owner` (string)
- `name` (string)
- `isEnabled` (boolean, true)
- `githubUserId` (string)

Internal flow:

- Route → `repoController.postEnableRepo()`
- Loads PAT by `X-GitHub-User-Id`
- Service `repoService.enableRepo()`
  - GitHub API: create webhook `POST /repos/:owner/:repo/hooks`
  - DB: upsert `repos` with `is_enabled=true` and `github_user_id` set

---

### POST /repos/:id/disable

Disables a repo and deletes webhook(s) matching `WEBHOOK_URL`.

- Auth: `X-GitHub-User-Id` required
- Params:
  - `id` (string): GitHub repo id

Response `data`: updated `repos` row

Internal flow:

- Route → `repoController.postDisableRepo()`
- Controller verifies the repo belongs to the authenticated user
- Service `repoService.disableRepo({ repoId, githubUserId })`
  - Fetch `repos` row for that user
  - Load PAT for the repo’s stored `github_user_id`
  - GitHub API:
    - list hooks `GET /repos/:owner/:repo/hooks`
    - delete each matching hook `DELETE /repos/:owner/:repo/hooks/:hookId`
  - DB: set `is_enabled=false` for that user+repo

---

### GET /repos/:id/config

Get per-repo rules.

- Auth: `X-GitHub-User-Id` required
- Params:
  - `id` (string): GitHub repo id

Response `data`:

- `rules` (string)

Internal flow:

- Route → `repoController.getRepoConfigController()`
- Verify repo belongs to this user
- Model `config.getRepoConfig(repoId, githubUserId)`

---

### POST /repos/:id/config

Save per-repo rules.

- Auth: `X-GitHub-User-Id` required
- Params:
  - `id` (string): GitHub repo id
- Body:
  - `rules` (string, required; may be empty)

Response `data`:

- `rules` (string)

Internal flow:

- Route → `repoController.postRepoConfigController()`
- Verify repo belongs to this user
- Model `config.upsertRepoConfig({ repoId, githubUserId, rules })`

---

### GET /history?repoId=...

List review history for a repo.

- Auth: `X-GitHub-User-Id` required
- Query:
  - `repoId` (string, required)

Response `data`: array of `history` rows, including:

- `id` (uuid)
- `repo_id` (string)
- `pr_number` (number)
- `pr_title` (string)
- `summary` (string)
- `comments` (array/json)
- `created_at` (timestamp)

Internal flow:

- Route → `historyController.getHistory()`
- Requires `repoId`
- Verifies repo belongs to this user
- Model `history.listHistory({ repoId, githubUserId })`

---

### POST /webhooks/github

GitHub webhook endpoint.

- Auth: webhook signature (not user auth)
- Headers:
  - `X-Hub-Signature-256` (required)
  - `X-GitHub-Event` (required)
- Body: GitHub webhook payload (pull_request)

Response `data`:

- `{ queued: true }` or `{ ignored: true }`

Internal flow:

- Route → `webhookController`
- Service `webhookService.handleGithubWebhook()`
  - Verify HMAC signature using `WEBHOOK_SECRET`
  - Validate event/action fields
  - Look up repo in DB by `repo_id`
  - If repo is disabled: ignore
  - Enqueue BullMQ job `pr-review-queue` with `{ repoId, owner, repo, prNumber, githubUserId }`
