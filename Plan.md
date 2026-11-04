# CIMS Phase 02 — VS Code Implementation Plan

> **This is the execution runbook. Complete tasks in order. Do not start the next milestone until the current milestone passes verification.**  
> Project context and frozen requirements: `Context.md`  
> This document explains how to implement and verify those requirements.

**Development environment:** Windows 11 + VS Code + PowerShell  
**Implementation tools:** DeepSeek Chat (connected API) for planning/review; GitHub Copilot for in-editor implementation; ChatGPT for architecture and milestone review  
**Deadline:** Sunday, 8 November 2026, 11:59 PM Bangladesh time (UTC+6)

---

# 0. How to Use This Plan

## 0.1 Before You Start

Install/verify:

- Node.js 24 LTS (recommended)
- npm (bundled with Node.js)
- MySQL Server 8.0.16 or newer
- MySQL Workbench or MySQL CLI
- Git
- VS Code

VS Code extensions/tools:

- GitHub Copilot (implementation assistance)
- DeepSeek Chat extension connected to your DeepSeek API
- Optional: SQLTools or MySQL extension for inspecting tables
- Optional: REST Client extension for `.http` requests

Do not install additional tools unless a task genuinely needs them.

## 0.2 Open the Workspace

Open PowerShell in the directory where you want the project:

```powershell
mkdir cims-backend
cd cims-backend
code .
```

Create `Context.md` and `Plan.md` in the project root and save the final contents in them.

Recommended VS Code layout:

- Explorer: project files
- Editor: current task file
- Integrated Terminal: PowerShell
- Source Control: review changes and commits
- DeepSeek Chat: task planning/review
- Copilot: implement the current small task

## 0.3 Core Development Workflow

For **every task**, use the seven-step loop in §0.3.2: read the requirement, ask DeepSeek, clarify, implement with Copilot or your own code, inspect and verify, commit only if it passes, and record task completion. Never skip verification.

### 0.3.1 Tool Responsibilities — Keep the Workflow Simple

Use the three tools for different jobs; do not ask all of them to independently generate the same feature and then merge conflicting implementations.

| Tool | Role | Use it for |
|---|---|---|
| DeepSeek Chat in VS Code | Mentor / task planner | Explain one task, identify files, reason through errors, and review a focused diff |
| GitHub Copilot in VS Code | In-editor implementer | Write or edit the current file/function after you provide the exact requirement |
| ChatGPT in this conversation | Milestone reviewer | Review actual source files, `git diff`, terminal output, SQL, tests, security, and milestone readiness |

### 0.3.2 Seven-Step Task Loop

For each task (for example, M1.5 MySQL connection pool):

1. Read the task and its referenced `Context.md` section.
2. Ask DeepSeek to break down only this task and explain the decisions.
3. Ask follow-up questions until you understand the expected behavior.
4. Use Copilot or your own code to implement only the required file/function.
5. Inspect the diff, run the exact verification commands, and understand the result.
6. If it passes, commit the change; if it fails, give DeepSeek the command and complete error output, fix, and repeat.
7. Record the task as complete in your task tracker (or add `[x]` next to its heading in `Plan.md`) and move to the next task only after verification passes.

A typical task may take 15–40 minutes, but use the task's actual complexity rather than treating that as a deadline. Never commit code you cannot explain.

### 0.3.3 Focused Copilot Prompt

```text
Implement only the current task from Context.md and Plan.md.
Inspect the existing file and nearby code before editing.

Current task: [TASK ID + title]
Target file: [EXACT FILE PATH]
Requirements:
- Follow the current architecture and CommonJS convention.
- Respect Route -> Controller -> Service -> Repository boundaries.
- Use parameterized SQL (`?`) for values.
- Use the existing `ApiError(statusCode, code, message)` pattern for expected errors.
- Use `withTransaction` for transactional workflows.
- Do not add dependencies, tables, columns, endpoints, roles, or unrelated refactors.

After editing, explain the changes and provide exact verification commands.
Do not edit files outside this task.
```

### 0.3.4 Stuck-After-15-Minutes Template

If you are stuck, stop guessing. Send DeepSeek the narrow issue with all relevant evidence:

```text
Task: [TASK ID + title]
File: [exact path]
Command run: [exact command]
Expected: [expected result]
Actual output: [full terminal output]
Context: Context.md §[section]
Diagnose only this issue. Do not redesign the architecture.
Give me the smallest safe fix and a verification command.
```

### Prompt template for DeepSeek Chat

```text
Read Context.md and Plan.md first.
We are implementing [TASK ID and title] only.
Explain the required behavior, affected files, business rules, validation,
security concerns, and verification steps. Do not add features or change
frozen architecture. Do not generate unrelated files. If you find a real
contradiction, explain it before proposing a change.
```

### Prompt template for Copilot

```text
Implement only the current task described below, following Context.md and
Plan.md. Inspect the existing code before editing. Respect CommonJS and the
Route -> Controller -> Service -> Repository boundaries. Use parameterized
SQL, existing helpers, and existing naming conventions. Do not add dependencies,
tables, columns, endpoints, roles, or unrelated refactors. Explain the changes
and list exact verification commands.

Current task: [TASK ID + requirement]
```

### Prompt template for ChatGPT milestone review

```text
CIMS [MILESTONE] checkpoint review.
Context.md and Plan.md are the source of truth.
Completed tasks: [IDs]
Verification commands and outputs: [paste]
Git status / relevant git diff: [paste]
Files changed: [list or attach]
Please review requirement coverage, correctness, security, data integrity,
error handling, and whether the milestone is safe to pass. List blockers first.
Do not redesign the project unless there is a demonstrated defect.
```

## 0.4 Git Rules

Commit after each verified task or small coherent group.

Commit message convention:

```text
chore: initialize project configuration
feat(auth): add login and current-user endpoints
feat(records): add citizen record retrieval
feat(correction): add transactional request creation
fix(correction): prevent duplicate pending requests
docs: document API and setup
```

Use `git status` and `git diff` before every commit. Never commit `.env`, `node_modules`, secrets, real citizen data, or local database dumps.

## 0.5 PowerShell Notes

Use PowerShell commands in this plan. To copy environment file:

```powershell
Copy-Item .env.example .env
```

To create folders:

```powershell
New-Item -ItemType Directory -Force -Path src/config, src/modules/auth, src/modules/records
```

For MySQL SQL file import, use MySQL Workbench or run the CLI through `cmd.exe` redirection, for example:

```powershell
cmd /c "mysql -u root -p cims_db < database\migrations\001_initial_schema.sql"
```

If the `mysql` command is not recognized, use MySQL Workbench or add the MySQL `bin` directory to PATH. Do not change the project because of a local PATH issue.

---

# 1. Milestone Overview

| Milestone | Target date | Focus | Expected deliverable |
|---|---|---|---|
| M1 — Foundation | Nov 4 | Project, DB schema, seed, authentication | API server, MySQL, login, `/auth/me` |
| M2 — Citizen Workflow | Nov 5 | Records, request creation, tracking | Citizen can submit and track request |
| M3 — Officer Workflow | Nov 6 | Department review, approve/reject, transactions | Complete correction lifecycle |
| M4 — Quality & Documentation | Nov 7 | Swagger, tests, README, optional deploy | Reviewer can test documented APIs |
| M5 — Submission | Nov 8 | Fresh setup, video, submit | Accessible submission package |

The schedule is tight. Prioritize P0 functionality and the walkthrough. Frontend and deployment are not allowed to delay backend completion.

---

# M0 — Pre-flight Environment Verification

**Before starting M1**, verify the required tools are installed and available on PATH. This short check helps catch environment problems before project setup.

```powershell
node --version        # Expected: v22.x or v24.x; Node 24 LTS recommended for this project
npm --version         # Expected: 10.x or higher
mysql --version       # Expected: MySQL 8.0.16 or higher
git --version         # Any recent Git version
```

**If `mysql` is not recognized:**

1. Add the MySQL `bin` directory to PATH (for example, `C:\Program Files\MySQL\MySQL Server 8.0\bin`).
2. Restart PowerShell/VS Code.
3. Run `mysql --version` again.

**If MySQL is not installed:** install MySQL Server 8.0.16 or newer using the official MySQL installer. The minimum version is required because this project relies on enforced `CHECK` constraints.

Do not proceed to M1 until all four commands return usable output. Node.js 20 is not an accepted baseline because it reached end of life in April 2026.

---

# M1 — Foundation (November 4)

## Goal

Create the repository and backend foundation, apply the five-table database schema, seed fictional demo data, and verify login plus `/api/auth/me`.

## M1.1 — Initialize Git Repository and Workspace

**Actions**

```powershell
git init
New-Item -ItemType Directory -Force -Path src/config, src/modules/auth, src/modules/records, src/modules/correction-requests, src/modules/audit, src/middlewares, src/utils, src/constants, src/docs, database/migrations, database/seeds, tests
if (-not (Test-Path README.md)) { New-Item -ItemType File -Path README.md }
```

Save the complete final documentation into `Context.md` and `Plan.md` before committing.

> **Important:** `New-Item -ItemType File` creates an empty file. The command above creates only `README.md` when it does not already exist; it deliberately does not recreate or overwrite `Context.md` or `Plan.md`. Keep the full documentation content in those two files. `README.md` can remain a one-line placeholder for now; it will be completed in M4.3.

**Verify**

```powershell
Get-ChildItem -Force
git status
```

**Commit**

```powershell
git add Context.md Plan.md README.md
git commit -m "docs: add project context and implementation plan"
```

## M1.2 — Initialize Node Project and Dependencies

**Create `package.json`** with:

- name: `cims-backend`
- main: `src/server.js`
- CommonJS
- scripts: `dev`, `start`, `db:schema`, `db:seed`, `test`
- engines: Node 22 or higher; use Node 24 LTS as the preferred runtime

Install runtime packages:

```powershell
npm install express@^5 cors dotenv helmet jsonwebtoken mysql2 bcryptjs zod swagger-jsdoc swagger-ui-express
```

Install development packages:

```powershell
npm install -D nodemon jest supertest
```

Recommended `package.json` content (merge with generated defaults):

```json
{
  "name": "cims-backend",
  "version": "1.0.0",
  "main": "src/server.js",
  "engines": {
    "node": ">=22"
  },
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "db:schema": "mysql -u root -p cims_db < database/migrations/001_initial_schema.sql",
    "db:seed": "node database/seeds/seed.js",
    "test": "jest --runInBand"
  }
}
```

On Windows, npm runs package scripts through `cmd.exe` by default, so the `<` redirection in `db:schema` is handled by the script shell. From an interactive PowerShell terminal, use the explicit `cmd /c` import command shown in M1.8 if needed.

**Note:** Keep the generated `package-lock.json`. Do not manually invent package versions. Node 22 or Node 24 is supported by this plan; Node 24 is recommended. Node 20 is excluded because it is end-of-life.

**Express 5 + `swagger-ui-express` compatibility:** Do not assume a peer-dependency warning is expected or automatically harmless. Inspect the exact warning and the package's currently declared peer dependencies:

```powershell
npm view swagger-ui-express peerDependencies
```

A warning alone is not a reason to downgrade. If (and only if) `npm install` fails with a reproducible `ERESOLVE` conflict, capture the full output and verify which package range causes it. First try a compatible release of the same package without changing the architecture. Fall back to Express 4 only if a real blocker remains; the project uses an `asyncHandler`, so rejected async route handlers must continue to be forwarded to the error middleware. Do not use `--force` or `--legacy-peer-deps` as a silent workaround.

**Verify**

```powershell
node --version
npm --version
npm ls --depth=0
node -e "require('express'); require('mysql2/promise'); require('zod'); console.log('Dependencies load successfully')"
```

**Commit**

```powershell
git add package.json package-lock.json
git commit -m "chore: initialize backend dependencies"
```

## M1.3 — Environment and Git Ignore

Create `.env.example`:

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=cims_db

JWT_SECRET=replace_with_a_random_secret_at_least_32_chars
JWT_EXPIRES_IN=2h
```

Create local `.env` using `Copy-Item .env.example .env`, then enter your local MySQL password and a random JWT secret. Generate a secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Create `.gitignore`:

```gitignore
node_modules/
.env
.env.*.local
*.log
npm-debug.log*
coverage/
.nyc_output/
.vscode/
.idea/
.DS_Store
Thumbs.db
tmp/
dist/
```

**Verify**

```powershell
git status --short
```

`.env` must not appear as an untracked file. `.env.example` must be tracked.

**Commit**

```powershell
git add .env.example .gitignore
git commit -m "chore: add environment template and gitignore"
```

## M1.4 — Environment Configuration

Create `src/config/env.js`.

Responsibilities:

- Load `.env` from project root using an explicit path.
- Validate required environment variables.
- Validate integer port and database port.
- Require a sufficiently long JWT secret in development.
- Export a normalized configuration object.
- Fail fast with a clear message if required configuration is missing.

Do not print secret values. Avoid sprinkling `process.env` throughout the codebase; import the validated config.

**Verify**

```powershell
node -e "const env=require('./src/config/env'); console.log({port:env.port,database:env.db.database,nodeEnv:env.nodeEnv})"
```

The output must not contain the DB password or JWT secret.

## M1.5 — MySQL Connection Pool

Create `src/config/database.js` using `mysql2/promise`.

Requirements:

- Create a pool with `waitForConnections: true` and a small connection limit (e.g. 10).
- Export `pool` and `testConnection()`.
- `testConnection()` must acquire a connection, execute `SELECT 1`, and release in `finally`.
- Use the same pool for repository operations.
- Do not create a new pool per request.

**Verify**

```powershell
node -e "require('./src/config/database').testConnection().then(()=>console.log('MySQL connected')).catch(e=>{console.error(e.message);process.exitCode=1})"
```

If this fails, check MySQL service, credentials, port, database existence, and PATH. Do not continue until the connection works.

## M1.6 — Shared Utilities

Create:

### `src/utils/ApiError.js`

Custom operational error with `statusCode`, `code`, optional `details`, and a readable message.

### `src/utils/asyncHandler.js`

A small wrapper forwarding rejected promises to `next`. Express 5 already forwards rejected async handlers, but retaining one consistent wrapper is acceptable. Do not mix patterns inconsistently.

### `src/utils/jwt.js`

- `signToken({ sub })`
- `verifyToken(token)`
- Use config values; JWT payload must contain only `sub`.

### `src/utils/password.js`

- `hashPassword(plainText)` using bcryptjs.
- `comparePassword(plainText, hash)`.

### `src/utils/withTransaction.js`

Implement the transaction helper according to `Context.md` §11.5:

- Acquire connection.
- Begin transaction.
- Execute callback with the connection.
- Commit before returning.
- Rollback on error.
- Preserve original error if rollback also fails.
- Retry MySQL deadlock at most once.
- Release in `finally`.
- Callback must contain DB operations only.

**Important:** Do not use `pool.query()` inside a transaction callback. Every query in that transaction must use the supplied `conn`.

**Verify**

- Create an `ApiError` and inspect its fields.
- Hash a demo password and compare it successfully.
- Ensure a wrong password compares false.
- Review `withTransaction` for connection release on both success and failure.

## M1.7 — Middleware

Create:

### `not-found.js`

Forward `404 ROUTE_NOT_FOUND` to the error handler for unknown routes.

### `error-handler.js`

- Convert `ApiError` to the standard error envelope.
- Unexpected errors become `500 INTERNAL_ERROR`.
- Log internal error details server-side.
- Never expose stack traces in production.
- Development stack output, if enabled, must be development-only.

### `authenticate.js`

- Read Bearer token.
- Verify JWT.
- Validate `sub` is a positive integer string before querying MySQL.
- Load current user from MySQL by `sub`.
- LEFT JOIN department to inspect `departments.is_active`.
- Block missing/inactive user with 401.
- Block OFFICER assigned to inactive/missing department with 403 `DEPARTMENT_INACTIVE`.
- Set fresh `req.user` data.
- Forward errors to global handler.

### `authorize.js`

Return middleware accepting allowed roles and return 401 if no authenticated user or 403 if the role is not allowed.

### `validate.js`

Use Zod `safeParse` for a specified request source (`body`, `params`, or `query`). Return structured validation details through `ApiError`. Store successful parsed data in a predictable location such as `req.validated[source]`; do not overwrite `req.query` because Express 5 exposes it as a getter. Controllers must read validated data (for example, `req.validated.query`) rather than raw input. All object schemas, including nested objects, must use `.strict()`.

### `src/constants/allowed-fields.js`

Export `ALLOWED_CORRECTION_FIELDS = ['full_name']`.

**Verify**

- Missing token → 401.
- Invalid token → 401.
- Role mismatch → 403.
- Inactive user → 401.
- Inactive officer department → 403.

The last tests can be completed after schema and seed exist.

## M1.8 — Create Database Schema

Create `database/migrations/001_initial_schema.sql` from the exact five-table design in `Context.md` §8.

Must include:

- Five tables only.
- InnoDB.
- `utf8mb4` database charset.
- Foreign keys and delete restrictions.
- `users` role/department CHECK constraint.
- Composite unique key on `citizen_records(id, citizen_user_id, department_id)`.
- Composite FK from `correction_requests` to the matching record/citizen/department tuple.
- `expected_record_version`.
- Required indexes.
- Audit actor FK with `ON DELETE RESTRICT`.

**MySQL setup (if the database does not exist):**

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cims_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Apply schema (PowerShell):

```powershell
cmd /c "mysql -u root -p cims_db < database\migrations\001_initial_schema.sql"
```

Enter the MySQL password when prompted. Alternatively execute the file in MySQL Workbench.

**Verify**

```powershell
mysql -u root -p cims_db -e "SHOW TABLES;"
mysql -u root -p cims_db -e "SHOW CREATE TABLE correction_requests\G"

# Verify composite FK column order matches the referenced UNIQUE KEY order
mysql -u root -p cims_db -e "SHOW CREATE TABLE citizen_records\G" | Select-String "uq_record_owner_dept"
# Expected: UNIQUE KEY `uq_record_owner_dept` (`id`,`citizen_user_id`,`department_id`) — exact order

mysql -u root -p cims_db -e "SHOW CREATE TABLE correction_requests\G" | Select-String "fk_req_record_dept_citizen"
# Expected: FOREIGN KEY (`citizen_record_id`,`citizen_user_id`,`department_id`)
#           REFERENCES `citizen_records` (`id`,`citizen_user_id`,`department_id`)

mysql -u root -p cims_db -e "SELECT VERSION();"
```

Expected: exactly five tables; `uq_record_owner_dept` and `fk_req_record_dept_citizen` exist with the exact column order shown; MySQL 8.0.16+.

## M1.9 — Idempotent Demo Seed

Create `database/seeds/seed.js`.

Seed:

- Two departments: NID and BIRTH_REGISTRATION.
- One citizen account.
- Two officer accounts, each assigned to one department.
- Two fictional records: `BR-1001` with name `Demo Citzen`; `NID-1001` with name `Demo Citizen`.

Rules:

- Hash demo passwords at runtime using bcryptjs.
- Use stable unique emails and record references.
- Support two modes (see `Context.md` §13.5):
  - Default `npm run db:seed` → idempotent, preserves workflow state.
  - Reset `npm run db:seed -- --reset` → resets record `full_name` and `record_version` to initial values.
- Use `INSERT ... ON DUPLICATE KEY UPDATE` for demo rows.
- **Default mode must NOT overwrite `citizen_records.full_name` or `record_version`** on duplicate; update only `date_of_birth`, `address`, and `department_id`. This preserves approved corrections.
- **Reset mode (when `process.argv.includes('--reset')`) must overwrite `full_name` and set `record_version = 1`** for the two seeded records.
- In reset mode, first check whether any correction request for either demo record is still `PENDING`. Perform the check and record reset within a transaction (or otherwise guarantee no rows are changed before the check passes). If a pending request exists, abort before changing rows and print a clear message; do not delete or modify the pending request.
- Never `TRUNCATE` tables.
- Never delete or alter `correction_requests` or `audit_logs`; history persists across both modes.
- Ensure foreign-key rows are created in dependency order.
- Close the pool in success and failure paths (`pool.end()` must also run after a seed error).

**Reference SQL pattern — default mode:**

```sql
INSERT INTO citizen_records
  (id, citizen_user_id, department_id, record_type, record_reference,
   full_name, date_of_birth, address, record_version)
VALUES
  (1, 1, 2, 'BIRTH_REGISTRATION', 'BR-1001', 'Demo Citzen',  '1990-01-01', 'Dhaka, Bangladesh', 1),
  (2, 1, 1, 'NID',               'NID-1001', 'Demo Citizen', '1990-01-01', 'Dhaka, Bangladesh', 1)
ON DUPLICATE KEY UPDATE
  date_of_birth = VALUES(date_of_birth),
  address       = VALUES(address),
  department_id = VALUES(department_id);
-- full_name and record_version are deliberately NOT updated in default mode.
```

**Reference SQL pattern — reset mode (only with `--reset`):**

```sql
INSERT INTO citizen_records
  (id, citizen_user_id, department_id, record_type, record_reference,
   full_name, date_of_birth, address, record_version)
VALUES
  (1, 1, 2, 'BIRTH_REGISTRATION', 'BR-1001', 'Demo Citzen',  '1990-01-01', 'Dhaka, Bangladesh', 1),
  (2, 1, 1, 'NID',               'NID-1001', 'Demo Citizen', '1990-01-01', 'Dhaka, Bangladesh', 1)
ON DUPLICATE KEY UPDATE
  full_name      = VALUES(full_name),
  date_of_birth  = VALUES(date_of_birth),
  address        = VALUES(address),
  department_id  = VALUES(department_id),
  record_version = VALUES(record_version);
```

**Verify dual-mode behavior**

```powershell
# Default mode is repeatable and preserves workflow-mutated full_name
npm run db:seed
npm run db:seed
# After a successful approval, BR-1001 should remain 'Demo Citizen' on default seed:
npm run db:seed

# Reset mode restores the initial demo values without deleting request/audit history
npm run db:seed -- --reset

# Inspect the restored record values and versions
mysql -u root -p cims_db -e "SELECT record_reference, full_name, record_version FROM citizen_records WHERE record_reference IN ('BR-1001','NID-1001');"
```

Also compare request/audit row counts before and after reset. `BR-1001` must show `Demo Citzen`, `NID-1001` must show `Demo Citizen`, and both versions must be `1`; existing request/audit rows must remain unchanged. Previously finalized requests and audit events remain visible and may describe earlier record state; this is a demo-state reset, not a historical database reset. Expected base row counts: 3 users, 2 records, and 2 departments.

## M1.10 — Authentication Module

Create the five auth files under `src/modules/auth/`.

### Login API

`POST /api/auth/login`

Request:

```json
{
  "email": "citizen@example.com",
  "password": "Demo@12345"
}
```

Flow:

1. Zod validation.
2. Repository looks up user by email using `?` placeholder.
3. Reject missing/inactive user using generic `401 INVALID_CREDENTIALS`.
4. Verify bcrypt hash.
5. Sign JWT payload `{ sub: String(user.id) }`.
6. Return token plus safe user fields.

### Current User API

`GET /api/auth/me`

- Apply `authenticate`.
- Return fresh `req.user` fields.
- The DB lookup occurs in middleware, not by trusting stale JWT role/department claims.

**Verify**

- Citizen login → 200 and token.
- Birth officer login → 200 and token.
- NID officer login → 200 and token.
- Wrong password → 401.
- Invalid email format → 400.
- `/api/auth/me` without token → 401.
- `/api/auth/me` with valid token → 200.
- Inactive user → protected endpoint 401.
- Inactive officer department → protected endpoint 403.

Do not print or commit real secrets. Demo passwords are local demo-only.

## M1.11 — Express App and Server Bootstrap

### `src/app.js`

- Create Express app (do not call `listen` here).
- Apply `helmet`, CORS, JSON body limit, URL-encoded parser.
- Mount `/api/health`.
- Mount `/api/auth` routes.
- Mount not-found and global error middleware in the correct order.
- Export app for Supertest.

### `src/server.js`

- Test DB connection before listening.
- Start HTTP server.
- Implement graceful shutdown for SIGINT and SIGTERM: stop accepting new requests, close HTTP server, end MySQL pool, then exit.
- On startup failure, log a concise error and exit non-zero.

**Verify**

```powershell
npm run dev
```

Expected logs indicate DB connected and API listening on port 5000.

In another terminal:

```powershell
curl.exe http://localhost:5000/api/health
curl.exe http://localhost:5000/api/unknown
```

Expected: health 200; unknown route 404 with standard error envelope.

## M1.12 — M1 Verification Checklist

- [ ] Node 22 or 24 verified (Node 24 preferred) and MySQL 8.0.16+ verified.
- [ ] `npm install` succeeds.
- [ ] `.env` is ignored by Git.
- [ ] Database connection succeeds.
- [ ] Exactly five tables created.
- [ ] Composite foreign key is present and matches the referenced unique-key column order.
- [ ] Default seed runs twice without duplicates or workflow reset.
- [ ] Reset seed restores initial record values while preserving request/audit history and refusing to run with pending requests.
- [ ] Health endpoint returns 200.
- [ ] Citizen and both officer logins return JWT.
- [ ] `/api/auth/me` works with token.
- [ ] Missing/invalid token returns 401.
- [ ] Invalid login returns 401; malformed input returns 400.
- [ ] Unknown route returns 404 envelope.
- [ ] Inactive officer department blocks protected operation.
- [ ] No `.env`, secrets, or database dumps in Git.

**Checkpoint:** Share terminal outputs, `git status`, and relevant files/diff with ChatGPT. Do not start M2 until M1 passes.

---

# M2 — Citizen Workflow (November 5)

## Goal

A citizen can list their own records, retrieve a record by `recordRef`, submit a correction request, and track their own requests.

## M2.1 — Records Repository, Service, Controller, Routes

Create the records module files.

Repository functions:

- `findByCitizenId(userId)`
- `findByReference(recordRef)`

Service responsibilities:

- `getMyRecords(user)`
- `getRecordByReference(user, recordRef)` with ownership check.

Endpoints:

- `GET /api/citizen/records`
- `GET /api/citizen/records/:recordRef`

Return only safe display fields. Do not return password or unnecessary private metadata.

**Verify**

- Citizen gets exactly their own two records.
- `BR-1001` returns details.
- Unknown reference returns `404 RECORD_NOT_FOUND`.
- A second seeded/test citizen accessing the first citizen's record returns **`403 NOT_RECORD_OWNER`** (per `Context.md` §12 error catalog; do not use 404 for this case).
- Officer token on citizen endpoint returns `403 FORBIDDEN`.

## M2.2 — Audit Module

Create:

- `src/modules/audit/audit.repository.js`
- `src/modules/audit/audit.service.js`

Function contract:

```js
logAudit(conn, {
  actorUserId,
  action,
  entityType,
  entityId,
  metadata
})
```

**Critical:** receive the caller's transaction connection and use it. Do not acquire a separate pool connection. This ensures audit insert commits or rolls back with the primary operation.

Metadata must contain pointers/versions only; no PII duplication.

**Verify:** Use a small transaction test or inspect rows after successful/failed operations. A rolled-back primary operation must not leave an audit event.

## M2.3 — Correction Request Validation

Create `src/modules/correction-requests/correction.validation.js`.

Validation:

- `recordRef`: `/^(NID|BR)-\d+$/`.
- `changes`: array containing exactly one item.
- `fieldName`: `full_name` only.
- `proposedValue`: trimmed string, 1–100 chars.
- `reason`: trimmed string, 5–500 chars.

**`.strict()` is mandatory on every Zod object schema.** Zod's default object behavior strips unknown keys. This API must reject unexpected client fields rather than silently accepting a payload that contains spoofed or server-owned values such as `oldValue`, `citizenUserId`, `departmentId`, `status`, `expectedRecordVersion`, or `expectedVersion`.

Example:

```js
const createCorrectionSchema = z.object({
  changes: z.array(
    z.object({
      fieldName: z.literal('full_name'),
      proposedValue: z.string().trim().min(1).max(100),
    }).strict()
  ).length(1),
  reason: z.string().trim().min(5).max(500),
}).strict();
```

With `.strict()`, any unknown key returns `400 VALIDATION_ERROR`. Apply the same `.strict()` requirement to `loginSchema`, `decisionSchema`, and every other request object schema in the project.

## M2.4 — Create Correction Request (Core Feature)

Endpoint:

`POST /api/citizen/records/:recordRef/correction-requests`

Implement service method `createRequest(user, recordRef, payload)`.

Inside `withTransaction`:

1. Lock record by `record_reference` using `FOR UPDATE`.
2. Return 404 if absent.
3. Verify owner; return 403 if not owner.
4. Enforce exactly one supported field (`full_name`).
5. Compare normalized proposed value with current value; return `400 NO_CHANGE_REQUESTED` if no change.
6. Check pending request for same `citizen_record_id + field_name`; return 409 if found.
7. Insert `correction_requests` with `old_value` and `expected_record_version` taken from the locked record.
8. Insert `REQUEST_SUBMITTED` audit event on the same `conn`.
9. Commit and return request ID, status, submitted time, and requested change details.

Do not accept `old_value` from the client. Do not allow dynamic SQL column names.

**Verify**

- Valid request → 201 and PENDING.
- Submit same request again → 409 `DUPLICATE_PENDING_REQUEST`.
- Propose current value → 400 `NO_CHANGE_REQUESTED`.
- Unsupported field → 400 `UNSUPPORTED_FIELD` or Zod validation error.
- Invalid body → 400.
- Wrong owner → 403.
- Audit row exists after success.

## M2.5 — Citizen Request List and Details

Endpoints:

- `GET /api/citizen/correction-requests`
- `GET /api/citizen/correction-requests/:id`

Repository must filter by `req.user.id` at query level where practical. Detail lookup must enforce ownership. Do not fetch unrestricted request data and rely only on frontend filtering.

Return status, reason, field, old/proposed value, record reference/type, submitted/review timestamps, and rejection reason where applicable.

**Verify**

- Citizen sees their own request list.
- Citizen can see their own request detail.
- Another citizen cannot see the request.
- No sensitive user/auth fields are exposed.

## M2.6 — M2 Checkpoint

- [ ] Citizen records list works.
- [ ] Single record by `recordRef` works.
- [ ] Ownership enforced.
- [ ] Correction creation commits request and audit atomically.
- [ ] Duplicate request returns 409.
- [ ] No-op request returns 400.
- [ ] Unsupported field rejected.
- [ ] Citizen request list/detail work.
- [ ] Another citizen cannot access request details.
- [ ] API response envelope consistent.

Commit verified code and request ChatGPT checkpoint review before M3.

---

# M3 — Officer Workflow (November 6)

## Goal

An officer sees requests only for their department and can approve or reject a pending request safely.

## M3.1 — Officer Request Listing

Endpoint:

`GET /api/officer/correction-requests?status=PENDING`

Requirements:

- Require authenticated OFFICER.
- Use `req.user.departmentId`; do not accept an arbitrary department ID from client.
- Optional status query must be validated against PENDING/APPROVED/REJECTED.
- Join citizen and record information needed for review.
- Add pagination only if easy; do not overbuild.

**Verify:** Birth officer sees only Birth Registration department requests; NID officer sees only NID department requests.

## M3.2 — Officer Request Details

Endpoint:

`GET /api/officer/correction-requests/:id`

Fetch by request ID and enforce department ownership in the service/query. Another department's request must return **`403 WRONG_DEPARTMENT`** (per `Context.md` §12.2; do not substitute 404).

## M3.3 — Decision Validation

Zod schema (strict object):

- `decision`: `APPROVED` or `REJECTED`.
- For `APPROVED`, omit `reason`.
- For `REJECTED`, require a trimmed `reason` of 5–500 characters.
- Unknown keys are rejected with `400 VALIDATION_ERROR`.

Use `.strict()` and a conditional refinement (for example `superRefine`) so an empty rejection reason and an approval payload containing a rejection reason are both rejected. Do not silently accept unknown fields.

## M3.4 — Approve Request (Critical Transaction)

Endpoint:

`PATCH /api/officer/correction-requests/:id/decision`

Follow the transaction and locking rules in `Context.md` §11.3 exactly:

1. Non-locking read to discover `citizen_record_id` from request ID.
2. Lock `citizen_records` row (`FOR UPDATE`).
3. Lock `correction_requests` row (`FOR UPDATE`).
4. Verify request exists and is PENDING.
5. Verify officer department matches.
6. Verify `expected_record_version` equals current `record_version`.
7. Verify `field_name === 'full_name'`.
8. Verify current `record.full_name` equals `request.old_value`.
9. Update `full_name` with a hardcoded allowed SQL column and parameterized value.
10. Increment `record_version`.
11. Set request APPROVED, reviewed_by, reviewed_at.
12. Insert audit log using the same transaction connection.
13. Commit.

If any step fails, rollback. A conflict must not partially update the record or request.

## M3.5 — Reject Request

Use the same record → request lock order. Verify PENDING and department. Require rejection reason. Set status REJECTED and reviewer fields, insert audit event, commit. Do not update `citizen_records` or increment its version.

## M3.6 — Officer Workflow Verification

Successful approval:

- Record full_name updated.
- record_version incremented by one.
- Request APPROVED.
- reviewed_by and reviewed_at populated.
- Audit event exists.

Successful rejection:

- Request REJECTED.
- Rejection reason populated.
- Record full_name and version remain unchanged.
- Audit event exists.

Negative cases:

- Double approve/reject → 409.
- Wrong department → 403.
- Citizen token on officer endpoint → 403.
- Reject without reason → 400.
- Version/old-value conflict → 409 and no partial changes.

## M3.7 — M3 Checkpoint

- [ ] Officer list filters by current department.
- [ ] Officer details enforce department.
- [ ] Approval transaction works.
- [ ] Rejection transaction works.
- [ ] Record version behavior is correct.
- [ ] Duplicate final decision blocked.
- [ ] Audit rows are atomic with actions.
- [ ] Conflict scenario does not overwrite newer data.

Commit verified code and request ChatGPT checkpoint review before M4.

---

# M4 — Quality, Swagger, Tests, README (November 7)

## M4.1 — Swagger UI

Use `swagger-jsdoc` and `swagger-ui-express`.

- OpenAPI metadata: title, description, version, server URL.
- Configure HTTP Bearer JWT security scheme.
- Document all 11 endpoints.
- Document request schemas, response envelopes, and relevant HTTP status codes.
- Add examples for login, correction submission, approval, and rejection.
- Mount at `/api-docs`.

**Helmet/CSP check:** Open `/api-docs` in a browser. If Swagger UI resources are blocked, make a narrowly scoped CSP adjustment for the docs route only. Do not disable global security headers without a demonstrated reason.

**Verify:**

1. Open `http://localhost:5000/api-docs`.
2. Login using the citizen account.
3. Copy token and use Authorize.
4. Retrieve records and submit correction.
5. Login using officer account and authorize with officer token.
6. List, inspect, and approve/reject request.

## M4.2 — Jest + Supertest Core Tests

Use a separate test database (e.g. `cims_test_db`) where possible. Never let automated tests mutate the demo DB used for the walkthrough without an intentional reset.

Minimum test coverage:

`auth.test.js`
- Valid login.
- Invalid password.
- Malformed login input.
- Protected route without token.

`citizen-records.test.js`
- Own records returned.
- Wrong owner blocked.
- Wrong role blocked.

`correction-requests.test.js`
- Valid request creation.
- Duplicate request blocked.
- No-op change blocked.
- Approval updates record and version.
- Rejection leaves record unchanged.
- Finalized request cannot be processed again.

Do not chase 100% coverage. Test the business-critical paths and failure modes.

## M4.3 — README

README must contain:

1. Project name and short description.
2. Problem statement and proposed solution.
3. Phase 02 scope and excluded features.
4. Technology stack.
5. Architecture diagram/description.
6. Database table summary and relationships.
7. Prerequisites (Node and MySQL versions).
8. Installation and environment setup.
9. Schema and seed commands.
10. Demo accounts (clearly labelled fictional/local only).
11. How to start server.
12. Swagger UI URL.
13. Full demo workflow.
14. Test command.
15. Known limitations and future improvements.

## M4.4 — Optional Deployment

Deployment is optional. Only attempt it after local API documentation and tests are passing. Use a managed MySQL instance and environment secrets; do not commit credentials. If deployment consumes too much time, skip it and demonstrate locally in the video. A correct local working demo is more valuable than a rushed broken deployment.

## M4.5 — M4 Checkpoint

- [ ] `/api-docs` opens without console/CSP errors.
- [ ] All 11 routes documented.
- [ ] Bearer authentication works in Swagger.
- [ ] Main workflow can be executed from Swagger.
- [ ] Core Jest/Supertest tests pass.
- [ ] README supports setup from a fresh clone.
- [ ] No secret or real personal data committed.

Request ChatGPT checkpoint review before M5.

---

# M5 — Final Verification and Submission (November 8)

## M5.1 — Fresh Clone Test

Test the repository as if the evaluator has just cloned it:

```powershell
cd ..
git clone <YOUR_GITHUB_REPOSITORY_URL> cims-fresh
cd cims-fresh
npm install
Copy-Item .env.example .env
# Edit .env with local MySQL credentials and a new JWT secret
```

Create database, apply schema, seed, and run using README instructions. Verify health, login, and the full correction lifecycle.

## M5.2 — Walkthrough Video (3–5 Minutes)

Suggested timing:

| Time | Content |
|---|---|
| 0:00–0:40 | Problem and CIMS idea |
| 0:40–1:10 | Explain prototype scope and fictional data |
| 1:10–3:10 | Swagger demo: citizen login → records → correction request → officer login → approval → citizen verifies |
| 3:10–4:10 | Explain JWT, authorization, validation, transaction, version check |
| 4:10–4:50 | Real development challenge and future improvement |

Speak in your own words. Credosis allows Bangla for Bangladeshi candidates who are more comfortable in Bangla. Demonstrate actual working code/API behavior; do not claim unimplemented features.

## M5.3 — Submission Checklist

- [ ] GitHub repository accessible to reviewers.
- [ ] README complete.
- [ ] No `.env`, secrets, or actual citizen data committed.
- [ ] API docs/live demo link works, if supplied.
- [ ] 3–5 minute walkthrough video accessible (e.g. unlisted video or accessible Drive link).
- [ ] Submission form completed before Sunday, November 8, 2026, 11:59 PM (UTC+6).

Submit early enough to handle link or upload problems.

---

# 2. Global Engineering Rules

## 2.1 Before Every Commit

```powershell
git status --short
git diff
npm test
```

Run the task-specific verification too. Do not commit unverified code.

## 2.2 Forbidden Actions

- Do not commit `.env`, passwords, tokens, private keys, or database dumps.
- Do not add tables, columns, endpoints, roles, or features outside `Context.md` without reviewing and documenting a justified change.
- Do not put business logic or SQL in controllers.
- Do not concatenate user input into SQL.
- Do not accept `old_value`, `status`, user ID, or department ID from the citizen request body.
- Do not trust frontend role checks as backend security.
- Do not update a citizen record outside the approval workflow.
- Do not update a record without incrementing `record_version`.
- Do not write audit events outside the primary transaction.
- Do not put PII, password, or JWT in logs/audit metadata.
- Do not hard-delete users/departments/audit events.
- Do not add frontend before M3 is complete.
- Do not skip verification to save time.

## 2.3 If You Get Stuck

Collect:

1. Task ID (e.g. M2.4).
2. Exact command run.
3. Full error/output.
4. Relevant source file(s).
5. `git diff` for the affected files.
6. Expected vs actual behavior.

Ask DeepSeek to diagnose the narrow issue using `Context.md`. If the fix changes architecture, schema, or behavior contract, ask ChatGPT to review before applying it.

## 2.4 Commit Convention

```text
chore: initialize project configuration
feat(auth): add login and current-user endpoints
feat(records): add citizen record retrieval
feat(correction): add transactional request creation
fix(correction): block duplicate pending requests
test(correction): cover approval and rejection flows
docs: add API and setup documentation
```

---

# 3. Milestone Checkpoint Protocol With ChatGPT

ChatGPT cannot automatically inspect the VS Code workspace or run in the background. To review progress, provide the actual artifacts.

At each checkpoint, send:

- Checklist completed.
- Terminal verification output.
- `git status --short`.
- Relevant `git diff` or attach the changed files/repository archive.
- Test results and any known limitation.

ChatGPT will review:

1. Does implementation match `Context.md` and `Plan.md`?
2. Are SQL schema and constraints correct?
3. Are authorization and ownership rules enforced server-side?
4. Are transactions atomic and lock order consistent?
5. Are error responses and validation correct?
6. Are tests meaningful?
7. Is it safe to proceed to the next milestone?

Possible review outcomes:

- **PASS:** move to next milestone.
- **PASS WITH NOTES:** proceed, but record small non-blocking improvements.
- **BLOCKED:** fix the listed problems and resubmit checkpoint.

Do not mark a milestone complete until verification has passed.

---

# 4. Final Acceptance Checklist

- [ ] API starts on a fresh clone.
- [ ] MySQL connects.
- [ ] Five-table schema applies.
- [ ] Default seed is idempotent and preserves workflow records; explicit reset mode restores demo values without deleting history.
- [ ] Citizen and officer login work.
- [ ] JWT authentication and fresh DB user lookup work.
- [ ] Citizen can see only own records.
- [ ] Citizen can submit a correction request.
- [ ] Duplicate pending request is rejected with 409.
- [ ] No-op correction is rejected with 400.
- [ ] Citizen can track own request.
- [ ] Officer can see only their department's requests.
- [ ] Approval updates name and increments record version.
- [ ] Rejection leaves original record unchanged.
- [ ] Double decision is rejected with 409.
- [ ] Version conflict is rejected without partial update.
- [ ] Audit events are inserted atomically and contain pointers only.
- [ ] All 11 endpoints appear in Swagger UI.
- [ ] Core automated tests pass.
- [ ] README setup works from fresh clone.
- [ ] Walkthrough video is 3–5 minutes and accurately demonstrates the prototype.
- [ ] GitHub/API/video links are accessible.
- [ ] Form is submitted before the deadline.

---

**End of Plan.md — Implementation Runbook**
