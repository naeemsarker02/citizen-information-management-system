# CIMS — Citizen Information Management System

A small backend prototype built for **Credosis Phase 02 — From Idea to Demo** (Backend Engineer Intern track). It demonstrates one workflow end-to-end: a citizen submits a correction request for one of their identity records, and a department officer reviews and decides on it.

Everything runs on fictional data. No government API, no real NID, no production user data — just a focused backend that shows how a correction workflow can be structured safely with transactions, validation, and audit logging.

**Stack:** Node.js · Express 5 · MySQL 8 · JWT · Zod · Swagger UI
**Deployed on:** Render (API) + Aiven (MySQL, managed)

---

## 🚀 Live Demo

**[Open the live Swagger UI →](https://citizen-information-management-system.onrender.com/api-docs)**

- - **API base URL:** `https://citizen-information-management-system.onrender.com` (try [`/api-docs`](https://citizen-information-management-system.onrender.com/api-docs))
- **Health check:** [`/api/health`](https://citizen-information-management-system.onrender.com/api/health)
- **Interactive docs:** [`/api-docs`](https://citizen-information-management-system.onrender.com/api-docs)

Log in with any of the [demo accounts](#demo-accounts) — click **Authorize** with the returned token, and every endpoint becomes clickable. The full correction workflow runs against the live Aiven database, not a mock.

> **Cold start notice:** Render's free tier puts the service to sleep after 15 minutes of inactivity. The first request after a sleep can take 30–60 seconds. If a request times out, wait a moment and reload.

### Want to run it locally instead?

Everything works from a clean clone — see [Running it locally](#running-it-locally). Same codebase, same behavior, your own MySQL instance.

---

## Why I built this

In Bangladesh — and in most places — a person's identity information lives in more than one place. Your name on the birth registration might not match your name on the NID. Your father's spelling might differ across documents. Fixing that is not one office trip; it's a chain of them, each with its own form, its own queue, its own status check.

The real pain isn't that the information is wrong. It's that:

- The citizen has no single place to see all their records side by side
- There's no transparent way to ask for a correction and track it
- Different departments process corrections independently, so nobody can prove who changed what, when, and on what basis

CIMS explores what a coordinated version of that could look like. It's a **coordination layer** — not a replacement for any government system. The prototype focuses on the piece that's most instructive to build: the correction request lifecycle, from submission to decision, with everything traceable.

Fictional example used throughout the demo:

| Document | Recorded name |
|---|---|
| Birth Registration | Demo Citzen *(typo)* |
| National ID | Demo Citizen |

The whole point is to let the citizen ask for `"Demo Citzen"` to become `"Demo Citizen"` through a reviewed, audited process — not by editing a database row directly.

---

## What this prototype actually does

Following Credosis's "a full MVP is not required" guidance, the scope is deliberately tight:

**Core feature**

- A citizen submits a correction request against one of their own records → status `PENDING`
- The responsible department's officer retrieves the request (scoped to their department only)
- The officer approves (record updated, version bumped) or rejects (reason stored, record untouched)
- Both the decision and the audit entry commit in a single transaction

**Supporting features**

1. **Authentication + role-based access** — JWT login, `CITIZEN` and `OFFICER` roles, with a fresh DB lookup on every protected request so a deactivated user or inactive department is caught immediately
2. **Record retrieval** — Citizens can list their own records; ownership is checked server-side, not just filtered in a query
3. **Request tracking** — Citizens see their own request history and current status; other users see nothing

**Quality bits that make it feel like real code, not a CRUD demo:**

- Zod schemas with `.strict()` on every object — unknown or spoofed keys return `400`, not silently stripped
- Consistent error envelope: `{ success: false, error: { code, message } }` across every endpoint
- Append-only audit log written in the same transaction as the action it describes — if the action fails, the audit fails with it
- Optimistic concurrency via `expected_record_version` — a stale approval can't overwrite fresh data
- Interactive OpenAPI docs at `/api-docs`
- Jest + Supertest tests for auth, records, and the full correction lifecycle

---

## What's deliberately out of scope

Real government integration. Registration flows. Document uploads. OCR or biometric verification. Email/SMS notifications. Multi-level approval. Admin dashboards. Mobile apps. Microservices, Redis, Kafka.

None of these are missing by accident. They're missing because a four-day prototype with one meaningful workflow is worth more than a shallow attempt at twelve.

The demo also doesn't include a frontend — Swagger UI is the interface. Reviewers can authenticate, execute every endpoint, and run the full workflow interactively without touching code.

---

## How it's organized

The codebase is a modular monolith with a clear layered split. Each layer has one job and knows nothing about the layer above it:

```
HTTP client (Swagger / Postman / curl)
        ↓
Routes          →  URL + middleware chain
        ↓
Middleware      →  auth, authorize, validate
        ↓
Controllers     →  HTTP request/response only
        ↓
Services        →  business rules, ownership, transactions
        ↓
Repositories    →  parameterized SQL
        ↓
MySQL 8
```

A few rules I kept strict throughout:

- Controllers never write SQL. Services never touch `req`/`res`. Repositories never decide HTTP status codes. If a decision felt like it belonged in two layers, the layer boundary made the call.
- Business logic that depends on a database read (ownership, duplicate checks, version comparison) always happens inside the service, using data the repository returned. This means the check and the action are in the same code path — not spread across middleware and controller.
- Every database write inside a transaction uses the transaction's connection. If a helper needs a connection, it takes it as a parameter. No silent fallbacks to the pool.

---

## Database

Five tables. Small on purpose, but every constraint matters:

| Table | What it holds |
|---|---|
| `departments` | NID and Birth Registration; `is_active` for soft deactivation |
| `users` | Citizens and officers; role ENUM; officers must have a `department_id`, citizens must not (enforced by a `CHECK` constraint) |
| `citizen_records` | Fictional identity records; each has a `record_reference` (e.g. `BR-1001`) and a `record_version` |
| `correction_requests` | The request itself — field name, old value, proposed value, reason, expected version, status, reviewer info |
| `audit_logs` | Append-only events — pointer metadata only, no names or emails |

A couple of design decisions worth calling out, because they're the ones that would matter in a real system:

**The composite foreign key.** A correction request stores `(citizen_record_id, citizen_user_id, department_id)`, and a composite FK ties that whole tuple back to the matching row in `citizen_records`. This means the database itself refuses to accept a request that names a record ID but pairs it with the wrong citizen or the wrong department. Application code has one less thing to get right.

**The version invariant.** Every successful approval increments `citizen_records.record_version` by exactly one. A request stores `expected_record_version` at submission time. During approval, if the current version doesn't match, the request is rejected with `409 RECORD_STATE_CONFLICT`. This blocks the classic bug where a stale approval quietly overwrites someone else's newer change.

**The audit log stores pointers, not data.** `{ recordId, fieldName }` for a submission. `{ recordId, prevVersion, newVersion }` for an approval. Names, emails, and proposed values stay in their proper tables. If a name needs to be erased for privacy, the audit trail doesn't have to be rewritten to comply.

---

## Running it locally

If you've already tried the live demo and want to poke at the code, this section gets you a working copy in about five minutes. If you only want to see the API work, the [live demo](#-live-demo) is faster.

### You'll need

- **Node.js 20+** (24 LTS recommended; 22 also works)
- **MySQL 8.0.16+** (CHECK constraints must actually enforce — older versions silently ignore them, which breaks a core invariant)
- **Git**

### Setup

```bash
git clone https://github.com/naeemsarker02/citizen-information-management-system.git cims-backend
cd cims-backend
npm install
```

Copy the environment template and fill it in:

```bash
cp .env.example .env
```

> On Windows PowerShell: `Copy-Item .env.example .env`

Open `.env` and set two things:

- `DB_PASSWORD` — your local MySQL password (leave empty if your root user has no password)
- `JWT_SECRET` — a random string of at least 32 characters

To generate a secret quickly:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then create the database and apply the schema:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cims_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
npm run db:schema
```

> **Windows note:** if `mysql` isn't on your PATH, either add the MySQL `bin` directory to PATH or edit the `db:schema` script in `package.json` to use the full path to `mysql.exe`.

Seed the demo data:

```bash
npm run db:seed
```

Start the server:

```bash
npm run dev
```

You should see:

```
✅ MySQL connected
🚀 CIMS API running on http://localhost:5000
📘 Health:      http://localhost:5000/api/health
🔐 Auth login:  POST http://localhost:5000/api/auth/login
```

Open **http://localhost:5000/api-docs** for the interactive API.

---

## Demo accounts

All fictional, all local-only. Do not reuse these anywhere real. Same accounts work on both the live and local deployments.

| Role | Email | Password |
|---|---|---|
| Citizen | `citizen@example.com` | `Demo@12345` |
| Birth Registration Officer | `officer.birth@example.com` | `Demo@12345` |
| NID Officer | `officer.nid@example.com` | `Demo@12345` |

Two seeded records, both owned by the same citizen:

| Reference | Type | Current name | Department |
|---|---|---|---|
| `BR-1001` | BIRTH_REGISTRATION | **`Demo Citzen`** *(typo — this is the point)* | Birth Registration |
| `NID-1001` | NID | `Demo Citizen` | NID |

The typo in `BR-1001` is intentional. Without it, there's nothing to correct.

---

## API

Base path: `/api`

| # | Method | Endpoint | Who | Purpose |
|---|---|---|---|---|
| 1 | GET | `/health` | public | Health check |
| 2 | POST | `/auth/login` | public | Login → JWT |
| 3 | GET | `/auth/me` | auth | Current user (fresh DB state) |
| 4 | GET | `/citizen/records` | CITIZEN | List own records |
| 5 | GET | `/citizen/records/:recordRef` | CITIZEN | One owned record |
| 6 | POST | `/citizen/records/:recordRef/correction-requests` | CITIZEN | Submit correction |
| 7 | GET | `/citizen/correction-requests` | CITIZEN | List own requests |
| 8 | GET | `/citizen/correction-requests/:id` | CITIZEN | Own request detail |
| 9 | GET | `/officer/correction-requests?status=...` | OFFICER | Department-scoped list |
| 10 | GET | `/officer/correction-requests/:id` | OFFICER | Department-scoped detail |
| 11 | PATCH | `/officer/correction-requests/:id/decision` | OFFICER | Approve or reject |

Every response uses the same envelope:

```json
{ "success": true, "message": "...", "data": { ... } }

{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

Error codes are stable strings — `INVALID_CREDENTIALS`, `NOT_RECORD_OWNER`, `DUPLICATE_PENDING_REQUEST`, `RECORD_STATE_CONFLICT`, and so on. A client can branch on the code without parsing messages.

---

## Try it in Swagger

**Live:** [https://citizen-information-management-system.onrender.com/api-docs](https://citizen-information-management-system.onrender.com/api-docs)
**Local:** `http://localhost:5000/api-docs` (after `npm run dev`)

Both work identically. Then:

1. `POST /auth/login` — use the citizen account — copy `data.token`
2. Click **Authorize** at the top, paste the token, click Authorize
3. `GET /citizen/records` — you should see `BR-1001` and `NID-1001`
4. `POST /citizen/records/BR-1001/correction-requests` with:
   ```json
   {
     "changes": [{ "fieldName": "full_name", "proposedValue": "Demo Citizen" }],
     "reason": "Name spelling correction"
   }
   ```
   You'll get a `201` with `status: "PENDING"` and `oldValue: "Demo Citzen"` — that old value came from the DB, not from your request.

5. Log in as the Birth Registration officer, re-Authorize
6. `GET /officer/correction-requests?status=PENDING` — you'll see the request
7. `PATCH /officer/correction-requests/{id}/decision` with `{ "decision": "APPROVED" }`
8. Log back in as citizen, re-Authorize, `GET /citizen/records` — `BR-1001` now reads `"Demo Citizen"` and `record_version` is `2`

That full loop — citizen submits, officer decides, citizen verifies — is the core feature the prototype exists to demonstrate.

**Rejection works the same way, except:**
- `reason` is required
- The record is **not** modified
- The rejection reason is stored on the request and visible to the citizen on their next fetch

> **On the live deployment:** the Aiven database is shared, so if someone has already run the workflow above, `BR-1001` may already show `"Demo Citizen"` at version `2`. Running a new correction against it still works — the flow just starts from whatever state is currently in the DB.

---

## Tests

```bash
npm test
```

Three suites, twenty tests, isolated fixtures:

- `auth.test.js` — login happy path, wrong password, bad email format, missing token, `/me` behavior
- `citizen-records.test.js` — own records list, record detail by reference, wrong role, invalid format, unknown reference
- `correction-workflow.test.js` — full lifecycle including duplicate prevention, no-op detection, approve with version bump, reject with reason, double-decision rejection, and a check that audit metadata contains no PII

Tests create their own fixtures (`test-citizen@example.com` with record `BR-9001`) and clean up after themselves in FK order. The demo data is never touched. You can run the suite as many times as you like without affecting the walkthrough.

---

## Reset modes

Three ways to get the demo back to a known state. Each has a different purpose.

### `npm run db:seed` — safe, idempotent

Inserts anything missing. Doesn't overwrite `full_name` or `record_version` on existing records. Doesn't touch `correction_requests` or `audit_logs`. Safe to run during development whenever you want.

### `npm run db:seed -- --reset` — restore demo values, keep history

Resets `BR-1001.full_name = "Demo Citzen"` and both records' `record_version = 1`. Keeps request and audit history. Aborts if any `PENDING` requests exist — you need to finalize those first through the normal workflow. This is the mode to use if you want to re-run the demo without losing the audit trail.

### `database/reset-hard.sql` — clean slate for video

Wipes `correction_requests` and `audit_logs` entirely. Resets records to baseline. Resets auto-increment counters so the next submission starts at `id = 1`. Only run this immediately before recording the walkthrough, when you want Swagger UI to look pristine. Not for development.

```bash
mysql -u root -p cims_db < database/reset-hard.sql
```

---

## A few things that are worth knowing

**Why `sub` in the JWT and nothing else.** A JWT is signed but immutable. If it contains `role: "CITIZEN"`, and an admin demotes that user five minutes later, the token still says CITIZEN until it expires. So the token contains only `{ sub: <userId> }`, and the authenticate middleware loads the user, role, department, and active state from MySQL on every protected request. That's one extra query per request. In return, deactivation is immediate and role changes take effect on the next call. At prototype scale, this is the right trade-off.

**Why the composite FK exists.** Separate single-column FKs to `citizen_records`, `users`, and `departments` wouldn't stop a request from pairing record `1` with a citizen who doesn't own it. The composite FK refuses the row at the database level, so even a bug in the service can't create a structurally invalid request.

**Why approve and reject share lock order.** Every decision starts by locking the `citizen_records` row, then the `correction_requests` row. Approve does the same. Reject does the same. Even though reject never writes to `citizen_records`, it still takes the lock so both flows acquire locks in identical order. Inconsistency here is how deadlocks happen.

**Why rejection skips the version check.** A rejected request doesn't modify the record. Blocking it on version mismatch would leave the application stuck forever if the record changed for unrelated reasons — a worse outcome for the citizen. Approve is where version matters; reject just finalizes the application.

---

## Known limitations

The honest list:

1. **Prototype-grade deployment** — Render free tier (cold starts) + Aiven free tier (shared service, limited storage). Real deployment would use managed infrastructure with monitoring, backups, and a private VPC.
2. **Fictional accounts and records** — see the demo table above; none of it maps to real people
3. **Only `full_name` is correctable** — adding fields is a deliberate future step, not an oversight
4. **No registration flow** — accounts are seeded, not created
5. **Single-officer decision** — no escalation or multi-level review
6. **Per-request DB lookup in auth** — the trade-off described above; production would add a short-TTL cache
7. **No document upload or evidence attachment** — the workflow accepts a text reason, not files
8. **Not connected to any real government system** — no integration, no authorization claimed, no production security audit

## If this grew up

Not planned for Phase 02, but the natural next steps if the concept were taken further:

- Additional record types (passport, education certificates)
- Multi-field correction requests (reintroducing a separate `correction_request_changes` table)
- Supporting-document upload with access-controlled storage
- Explicit cross-department access grants with purpose, scope, and expiry — the current default is "deny", which is correct for the demo but would need a real model in production
- Multi-level approval and escalation
- Notification layer via outbox pattern
- Pagination, structured logging, metrics
- Read replicas and connection tuning guided by actual query plans

The rule I've tried to follow: don't add infrastructure to look enterprise-grade. Add it when the workload justifies it.

---

## Repo layout

```
cims-backend/
├── Context.md                   ← product + architecture source of truth
├── Plan.md                      ← implementation runbook
├── Development-Guide.md         ← daily workflow notes
├── README.md                    ← this file
├── package.json
├── .env.example
├── src/
│   ├── app.js                   ← Express app (exports, doesn't listen)
│   ├── server.js                ← startup + graceful shutdown
│   ├── config/
│   │   ├── env.js               ← Zod-validated env config
│   │   └── database.js          ← mysql2 pool (with optional SSL for hosted DB)
│   ├── middlewares/
│   │   ├── authenticate.js      ← JWT verify + fresh user load
│   │   ├── authorize.js         ← role gate
│   │   ├── validate.js          ← Zod runner (stores in req.validated)
│   │   ├── not-found.js
│   │   └── error-handler.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── asyncHandler.js
│   │   ├── jwt.js
│   │   ├── password.js
│   │   └── withTransaction.js
│   ├── constants/
│   │   ├── allowed-fields.js
│   │   └── record-ref.js
│   ├── modules/
│   │   ├── auth/                ← login + /me
│   │   ├── records/             ← citizen record retrieval
│   │   ├── correction-requests/ ← create / list / detail / decision
│   │   └── audit/               ← transaction-aware audit insert
│   └── docs/
│       └── swagger.js           ← OpenAPI 3.0 spec
├── database/
│   ├── migrations/001_initial_schema.sql
│   ├── seeds/seed.js
│   └── reset-hard.sql
└── tests/
    ├── auth.test.js
    ├── citizen-records.test.js
    └── correction-workflow.test.js
```

---

## About this project

This is my submission for **Credosis Phase 02 — Backend Engineer Intern**. Everything you see was built over four days, planned in `Context.md` and executed against `Plan.md`. AI tools (ChatGPT, DeepSeek, GitHub Copilot) helped with planning, code review, and debugging — every architectural decision, transaction rule, and test was reviewed and understood before shipping, and I can explain any part of it in a follow-up call.

The video walkthrough is 3–5 minutes and covers the problem, the workflow, the technical decisions, and one thing I'd change if I started over. The repository you're looking at is the code behind that walkthrough.

If you're reviewing this: thanks for reading. If something's unclear or looks wrong, the code is here to check. That's the point.

---

**Credosis disclaimer:** This repository is a recruitment-evaluation prototype. It is not an official government system, is not connected to any real government database or API, and contains no real personal data. Approved corrections modify only the deployed Aiven MySQL instance or a local copy on the developer's machine. Any real deployment would require official authorization, approved interfaces, legal and privacy review, and production security controls.