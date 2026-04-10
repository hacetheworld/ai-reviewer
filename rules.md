AI PR Review System — LLM Instruction File (Strict Mode)
🎯 OBJECTIVE

Build a minimal, production-ready AI PR Review System that:

Integrates with GitHub
Reviews Pull Requests using AI
Shows results in a simple UI

⚠️ PRIORITIES:

Simplicity over cleverness
Predictable structure
No over-engineering
Clear separation of concerns
🧱 TECH STACK (DO NOT CHANGE)
Frontend
React (Vite)
Tailwind CSS (basic only)
Backend
Node.js + Express
Database
Supabase (PostgreSQL)
Queue
Redis + BullMQ
Worker
Node.js (separate process)
📁 STRICT FOLDER STRUCTURE
app/
  ui/
    src/
      pages/
        Login.jsx
        Dashboard.jsx
        Config.jsx
        History.jsx
      components/
      App.jsx
      main.jsx

  backend/
    src/
      routes/
        auth.js
        repos.js
        webhook.js

      controllers/
        authController.js
        repoController.js
        webhookController.js

      services/
        githubService.js
        aiService.js
        encryptionService.js

      queue/
        queue.js
        worker.js

      db/
        client.js

      models/
        userModel.js
        repoModel.js
        historyModel.js
        configModel.js

      utils/
        logger.js
        validator.js

      app.js
⚙️ ENGINEERING RULES (VERY IMPORTANT)
1. Layered Architecture (MANDATORY)

Every feature MUST follow:

Route → Controller → Service → DB/External API

❌ NEVER:

Call DB directly from routes
Put logic in routes
Mix GitHub logic in controllers
2. Responsibilities
Routes
Define endpoints only
Pass request → controller
Controllers
Handle request/response
Validate input
Call services
Return JSON
Services
Core business logic
External API calls (GitHub, AI)
Queue interaction
Models
DB queries only
No business logic
3. Keep It Simple

❌ DO NOT:

Add classes unless needed
Add complex patterns (no DDD, no CQRS)
Add unnecessary abstractions

✅ DO:

Use simple functions
Write readable code
Prefer clarity over DRY if needed
🔄 SYSTEM FLOW (MUST FOLLOW EXACTLY)
Webhook Flow
GitHub sends webhook
/webhooks/github receives it
Validate signature
Push job to Redis queue
Respond immediately

⚠️ NEVER process AI inside webhook route

Worker Flow

Worker MUST:

Get job
Fetch PR data from GitHub
Fetch diff
Load config from DB
Build prompt
Call AI
Parse response
Post review to GitHub
Save history
🗄️ DATABASE SCHEMA (STRICT)
user_pat
id (uuid)
github_user_id (text)
username (text)
encrypted_pat (text)
created_at (timestamp)
repos
id (uuid)
repo_id (text)
github_user_id (text)
owner (text)
name (text)
is_enabled (boolean)
config
id (uuid)
repo_id (text)
github_user_id (text)
rules (text)
history
id (uuid)
repo_id (text)
github_user_id (text)
pr_number (int)
pr_title (text)
summary (text)
comments (json)
created_at (timestamp)
🔐 SECURITY RULES (NON-NEGOTIABLE)
PAT Handling
MUST encrypt before storing
MUST use ENCRYPTION_KEY
NEVER log PAT
NEVER send PAT to frontend

Tenant Scoping (Interim)
All non-webhook endpoints MUST be scoped to a single GitHub user.
Client MUST send:
X-GitHub-User-Id: <githubUserId>
Server MUST load + decrypt the encrypted PAT from DB for that github_user_id.

NOTE: This header approach is NOT secure for public deployments (spoofable). For production, replace with real auth (PAT-per-request or server session).
Webhook Validation
Validate using WEBHOOK_SECRET
Reject invalid requests
📦 QUEUE RULES
Use BullMQ
One queue: pr-review-queue
Job payload:
{
  repoId,
  owner,
  repo,
  prNumber
  githubUserId
}
🧠 AI RULES
Prompt Constraints
Keep prompt simple
Include:
PR title
PR description
Diff (truncated if large)
Rules from DB
Diff Handling
Max ~3000 lines
Ignore:
lock files
binary files

If truncated:

"Diff truncated due to size"
🎨 FRONTEND RULES
UI Principles
Clean
Minimal
No animations
No complex state management
Pages
Login
Input: GitHub PAT
Submit → backend
Dashboard
List repos
Enable/disable
Config
Edit rules (textarea)
History
Show past reviews
🔌 API CONTRACT (STRICT)
POST /auth/pat
Validate via GitHub API
Encrypt + store
GET /repos
Fetch from GitHub
POST /repos/:id/enable
Store repo
Create webhook
POST /webhooks/github
Validate signature
Push to queue
❌ ANTI-HALLUCINATION RULES

The agent MUST NOT:

Invent APIs
Assume GitHub fields without checking docs
Create unnecessary tables
Add extra services not defined
Change folder structure
Introduce new tech

If unsure:
👉 Return: "NEED CLARIFICATION"

✅ CODE STYLE RULES
Use async/await
Use try/catch everywhere
Return consistent JSON:
{ success: true, data }
{ success: false, error }
🚀 FINAL GOAL

Deliver a system that:

Works end-to-end
Is easy to understand
Can scale later
Has zero unnecessary complexity