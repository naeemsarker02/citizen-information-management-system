# CIMS Phase 02 — Practical VS Code Development Guide

> Use this guide for the day-to-day development workflow. `Context.md` is the source of truth for requirements and architecture. `Plan.md` is the detailed implementation runbook and verification checklist.

**Environment:** Windows 11, VS Code, PowerShell  
**Project:** `cims-backend`  
**Deadline:** Sunday, 8 November 2026, 11:59 PM Bangladesh time (UTC+6)

---

## 1. The Three Tools and Their Responsibilities

| Tool | Where | Responsibility |
|---|---|---|
| DeepSeek Chat | VS Code sidebar | Mentor: explain the current task, plan the implementation, and diagnose errors |
| GitHub Copilot | VS Code editor / inline chat | Implementer: write the current file or function from a clear requirement |
| ChatGPT | This conversation | Reviewer: inspect actual code, diffs, terminal output, tests, and milestone readiness |

Keep the responsibilities distinct. Do not ask all three tools to independently generate the same feature and then merge conflicting answers. DeepSeek guides, Copilot assists implementation, and ChatGPT reviews evidence at checkpoints.

**Important limitation:** ChatGPT cannot automatically see or monitor the VS Code workspace. Share the changed files, relevant code, `git diff`, terminal output, and test results when requesting a review.

## 2. Seven-Step Daily Task Loop

For every task in `Plan.md`:

1. Read the task and the relevant `Context.md` section.
2. Ask DeepSeek to explain only this task and identify the affected files.
3. Ask questions until you understand the behavior and design decisions.
4. Use Copilot or write the implementation yourself; edit only the current task's files.
5. Inspect the diff and run the exact verification commands from `Plan.md`.
6. If verification passes, commit. If it fails, provide the exact command and full output to DeepSeek, fix the issue, and repeat verification.
7. Record the task as complete in your task tracker (or add `[x]` next to its heading in `Plan.md`); continue only after the task passes.

A 15–40 minute estimate per task is only a planning guide. Do not rush a task or commit code you cannot explain.

## 3. DeepSeek Prompt — Current Task

Copy this and replace the task ID/title and Context section:

```text
Read Context.md (source of truth) and Plan.md (execution order).

Current task: M1.5 — MySQL Connection Pool
Context reference: Context.md §5 and Plan.md §M1.5

Rules:
- Explain/guide only this task. Do not jump ahead.
- Do not redesign the frozen architecture.
- Respect Route → Controller → Service → Repository boundaries.
- Use parameterized SQL only (`?` placeholders).
- Use ApiError(statusCode, code, message) for expected application errors.
- Use withTransaction for transactional workflows only.
- Do not add dependencies, tables, columns, endpoints, roles, or unrelated refactors.

Give me:
1. What this task must do.
2. Exact file path(s) to create or edit.
3. Important implementation decisions and why.
4. Exact verification command(s).
5. Common mistakes to avoid.

Then stop and wait for my verification output before moving to the next task.
```

## 4. Copilot Prompt — In-Editor Implementation

Use `Ctrl+I` (or the available Copilot inline chat shortcut) after opening the target file. Supply the precise current task and file path.

```text
Implement this file according to Context.md and Plan.md for the current task.

Task: M1.5 — MySQL Connection Pool
File: src/config/database.js

Requirements:
- Export `pool` (mysql2/promise) and `testConnection()`.
- Pool options must include waitForConnections: true and connectionLimit: 10.
- testConnection() must acquire a connection, run SELECT 1, and release it in finally.
- Read database settings from the validated config in src/config/env.js.
- Use CommonJS. Do not use ESM.
- Do not add dependencies or edit unrelated files.

After editing, explain the implementation and list the exact verification command.
```

Do not accept broad auto-refactors. Inspect every changed line in Source Control or `git diff`.

## 5. When Stuck — 15-Minute Rule

After around 15 minutes without progress, stop guessing. Send DeepSeek this evidence:

```text
Task: M1.7 — Authenticate Middleware
File: src/middlewares/authenticate.js
Command run: npm run dev
Expected: server starts and protected route authenticates a valid token
Actual output: [paste the complete terminal output]
Context reference: Context.md §10.2

Diagnose the narrow issue only. Do not redesign the architecture.
Give the smallest safe fix and one verification command.
```

If a proposed fix changes the database schema, API contract, transaction rules, role model, or project scope, pause and ask ChatGPT to review it before adopting the change.

## 6. Canonical Folder Structure

The project grows milestone by milestone. It is not necessary to create every file on day one.

```text
cims-backend/
├── Context.md
├── Plan.md
├── Development-Guide.md
├── README.md
├── package.json
├── package-lock.json
├── .env                         # local only — never commit
├── .env.example
├── .gitignore
├── src/
│   ├── config/
│   │   ├── env.js               # M1.4
│   │   └── database.js          # M1.5
│   ├── utils/
│   │   ├── ApiError.js          # M1.6
│   │   ├── asyncHandler.js      # M1.6
│   │   ├── jwt.js               # M1.6
│   │   ├── password.js          # M1.6
│   │   └── withTransaction.js   # M1.6
│   ├── constants/
│   │   └── allowed-fields.js    # M1.7
│   ├── middlewares/
│   │   ├── authenticate.js      # M1.7
│   │   ├── authorize.js         # M1.7
│   │   ├── validate.js          # M1.7
│   │   ├── not-found.js         # M1.7
│   │   └── error-handler.js     # M1.7
│   ├── modules/
│   │   ├── auth/                # M1.10
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.repository.js
│   │   │   └── auth.validation.js
│   │   ├── records/             # M2.1
│   │   │   ├── records.routes.js
│   │   │   ├── records.controller.js
│   │   │   ├── records.service.js
│   │   │   └── records.repository.js
│   │   ├── correction-requests/ # M2.3–M3
│   │   │   ├── correction.routes.js
│   │   │   ├── correction.citizen.controller.js
│   │   │   ├── correction.officer.controller.js
│   │   │   ├── correction.service.js
│   │   │   ├── correction.repository.js
│   │   │   └── correction.validation.js
│   │   └── audit/               # M2.2
│   │       ├── audit.service.js
│   │       └── audit.repository.js
│   ├── docs/
│   │   └── swagger.js           # M4.1
│   ├── app.js                   # M1.11
│   └── server.js                # M1.11
├── database/
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # M1.8
│   └── seeds/
│       └── seed.js                 # M1.9
└── tests/                         # M4.2
    ├── auth.test.js
    ├── citizen-records.test.js
    └── correction-requests.test.js
```

## 7. First 30 Minutes — Exact Startup Sequence

### Step 1 — Create and open the workspace

In PowerShell, choose a location you control. Example:

```powershell
cd D:\Projects
New-Item -ItemType Directory -Force -Path cims-backend
Set-Location cims-backend
code .
```

If `code` is not recognized, open VS Code manually and use **File → Open Folder** to open `cims-backend`.

### Step 2 — Save the three documentation files

Create these files in the project root and paste the complete contents from the supplied files:

- `Context.md`
- `Plan.md`
- `Development-Guide.md`

**Important:** creating a file with `New-Item -ItemType File` creates an empty file. It does not insert the documentation. Save each complete file with `Ctrl+S`. `README.md` may be created as a placeholder and completed in M4.3.

### Step 3 — Run M0 pre-flight checks

Open the integrated terminal (`Ctrl+``) and run:

```powershell
node --version
npm --version
mysql --version
git --version
```

Expected baseline:

- Node.js 24.x recommended; Node.js 22.x is an acceptable fallback.
- npm 10.x or later.
- MySQL 8.0.16 or later.
- A recent Git version.

If `mysql` is not recognized, add the MySQL Server `bin` directory to Windows PATH, restart PowerShell/VS Code, and retry. If MySQL is not installed, install MySQL Server 8.0.16+ before continuing. Do not proceed to M1 until all four checks work.

### Step 4 — Initialize Git and create the skeleton

```powershell
git init
New-Item -ItemType Directory -Force -Path src/config, src/utils, src/middlewares, src/constants, src/docs, src/modules/auth, src/modules/records, src/modules/correction-requests, src/modules/audit, database/migrations, database/seeds, tests
New-Item -ItemType File -Force -Path README.md
```

The folder command may report that directories already exist; that is fine. Do not overwrite `Context.md`, `Plan.md`, or `Development-Guide.md` with empty files.

Commit only the documentation and placeholder at this point:

```powershell
git add Context.md Plan.md Development-Guide.md README.md
git commit -m "docs: add CIMS project context and development plan"
```

If Git asks for identity, configure your own `user.name` and `user.email`; do not copy another person's identity.

### Step 5 — Start DeepSeek with the M1.2 instruction

Paste this into DeepSeek Chat:

```text
Read Context.md, Plan.md, and Development-Guide.md completely.
Architecture and scope are frozen.

M0 pre-flight has passed. M1.1 repository/workspace setup is complete.
Current task: M1.2 — Initialize Node Project and Dependencies.

Give me the exact package.json content, npm install commands, and verification
commands. Explain the package choices briefly. Do not generate the rest of
the application. Do not start M1.3 until I share the M1.2 verification output.
```

### Step 6 — Complete M1.2 only

Follow DeepSeek's task explanation, use Copilot for the package configuration if helpful, run every M1.2 verification command in `Plan.md`, inspect `git diff`, then commit only after the checks pass. Continue to M1.3 in the same task loop.

## 8. Milestone Checkpoint — What to Send ChatGPT

At the end of each milestone, provide:

1. Completed task IDs and checklist.
2. Full terminal output for the milestone verification commands.
3. `git status --short`.
4. Relevant `git diff` or attach changed files.
5. `npm test` output when tests exist.
6. Any errors, compromises, or incomplete items.

Use this template:

```text
CIMS M1 checkpoint review

Completed tasks: M1.1–M1.12
Verification output:
[paste the commands and full output]

git status --short:
[paste]

git diff / changed files:
[paste or attach]

Known issues:
[list or write None]

Please compare the actual implementation with Context.md and Plan.md.
Identify blockers first and give a PASS, PASS WITH NOTES, or BLOCKED verdict.
Do not approve based only on generated code; review the actual implementation and evidence.
```

## 9. Development Priorities

1. Complete the backend lifecycle first: citizen submits → department officer decides → citizen tracks status.
2. Keep Swagger UI as the demo interface; do not start a frontend before M3 passes.
3. Verify every task, commit small coherent changes, and preserve a working state.
4. Use fictional demo data only. Never commit `.env`, credentials, tokens, database dumps, or real personal data.
5. Record the walkthrough only after the full lifecycle works in Swagger.
6. Explain the project and your own contribution in your own words. Use AI to learn and debug, not to misrepresent work or personal experience.

---

**End of Development-Guide.md**
