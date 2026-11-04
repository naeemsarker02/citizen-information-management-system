# CIMS — Project Context

> **Source of Truth for the Citizen Information Management System (CIMS) — Credosis Phase 02**  
> Read this file before making architectural, database, API, or scope decisions.  
> `Context.md` explains **why and what** we are building. `Plan.md` explains **how and in what order** to build it.

**Project:** Citizen Information Management System (CIMS)  
**Track:** Backend Engineer Intern  
**Evaluation:** Credosis Phase 02 — From Idea to Demo  
**Status:** Locked implementation baseline  
**Last updated:** 4 November 2026  
**Submission deadline:** Sunday, 8 November 2026, 11:59 PM Bangladesh time (UTC+6)

---

## 1. Project Story — Why We Are Building CIMS

### 1.1 Background

A citizen may have identity-related information stored in different records and institutions, for example:

- National Identity Card (NID)
- Birth Registration Certificate
- Passport
- Educational certificates
- Other identity-related records

The same person's name, date of birth, parents' names, or address may be recorded differently across documents. When a discrepancy occurs, the citizen may need to follow separate correction processes with different authorities, submit evidence repeatedly, and track each application separately.

Example of a fictional discrepancy:

| Record | Recorded name |
|---|---|
| Birth Registration | Demo Citzen |
| NID | Demo Citizen |
| Passport | Demo Citizen |

This can create avoidable administrative effort and uncertainty for citizens. The project explores a more organized way to represent linked records and manage correction requests.

### 1.2 Proposed Solution

**Citizen Information Management System (CIMS)** is a proposed centralized, secure, role-based platform for viewing a citizen's linked identity-related records and managing requests to correct inaccurate information.

Conceptual workflow:

```text
One Citizen Profile
        ↓
Multiple Linked Identity Records
        ↓
Citizen Submits a Correction Request
        ↓
Authorized Department Officer Reviews It
        ↓
Approve / Reject
        ↓
Citizen Tracks the Final Status
```

In this prototype, “linked records” means multiple fictional records are associated with the same local demo citizen account through `citizen_user_id`. It does not mean the records are synchronized with one another or linked to government systems. The platform is intended as a coordination and request-management layer. It does not assume that all government authorities share a database or expose public APIs.

### 1.3 Important Reality and Scope Disclaimer

CIMS is an **independent prototype for recruitment evaluation**, not an official government system.

- No government partnership or authorization is claimed.
- No real government database/API will be accessed.
- No real NID, birth registration, passport, or educational record will be verified.
- All users and records in the demo are fictional.
- An approved correction updates only the prototype's local MySQL record.
- Real-world integration would require authorization, official interfaces, legal/privacy review, and security controls.

Do not describe the prototype as an operational national citizen database or imply that it changes official records.

---

## 2. Credosis Phase 02 — Exact Requirement

Credosis explicitly says a **full MVP is not required**. The submission needs:

1. At least **one core feature** that represents the main idea.
2. **Two or three supporting features** that make the concept understandable.
3. A working demonstration.

For the **Backend Engineer Intern** track, the evaluation focus is:

- API functionality
- Code structure
- Data handling
- Input validation
- Error handling
- API demonstration using **Swagger UI or Scalar**

A 3–5 minute walkthrough video is required. English is preferred; Bangladeshi candidates may use Bangla if more comfortable. GitHub repository, API documentation/live demo link if available, and video must be accessible.

**Deadline:** Sunday, 8 November 2026, 11:59 PM (UTC+6). Verify all links and submit before the deadline; do not leave video recording or submission until the final minutes.

**Submission integrity:** Use AI tools to learn, plan, implement, and debug the prototype, but explain the project and your own contribution in your own words. Do not submit AI-generated personal answers or read a generated script as though it were your own experience. Demonstrate only features that actually work.

---

## 3. What We Are Building in Phase 02

### 3.1 Core Feature — Correction Request Management and Review

A citizen submits a correction request against one of their sample identity records. An authorized department officer retrieves and reviews the request, then approves or rejects it.

- On approval: update the corresponding record in the local prototype database, increment its version, finalize the request, and write an audit event.
- On rejection: finalize the request with a reason; do **not** change the original record; write an audit event.

This end-to-end lifecycle is the primary demonstration.

### 3.2 Supporting Features

1. **Authentication and role-based authorization:** pre-seeded `CITIZEN` and `OFFICER` accounts, JWT authentication, role checks, fresh user/department state loaded from MySQL.
2. **Sample identity record retrieval:** fictional NID and Birth Registration records, with server-side ownership verification.
3. **Request tracking:** a citizen can list and inspect their own requests and see `PENDING`, `APPROVED`, or `REJECTED` status, timestamps, and rejection reason where applicable.

### 3.3 Strongly Recommended Quality Features

- Basic append-only audit logging for request submission, approval, and rejection.
- Interactive Swagger UI at `/api-docs`.
- Core automated tests using Jest and Supertest.
- Clear README and reproducible local setup.

### 3.4 Optional Only If Time Remains

- Deployment of the backend and API docs.
- A minimal React frontend only if Swagger UI is insufficient for demonstrating the workflow.

**Default decision: no frontend. Swagger UI is the demo interface.**

---

## 4. Explicitly Out of Scope — Do Not Build

| Feature | Decision / Reason |
|---|---|
| Full citizen registration and identity verification | Use pre-seeded fictional demo accounts |
| Admin dashboard and full admin management | Not required for Phase 02 |
| Real government API or database integration | No authorization/integration access |
| Real NID, birth registration, passport verification | Fictional data only |
| Passport and educational record modules | Beyond the prototype scope |
| Biometric verification or AI document verification | Not required; too large for the deadline |
| Document upload/storage | Extra infrastructure and security scope |
| SMS, OTP, email notifications | Not required |
| Multi-level approval or escalation | One department officer decision is enough |
| Analytics/reporting dashboard | Not required |
| Mobile app | Backend track |
| Microservices, Redis, Kafka, Kubernetes | Overengineering for this prototype |
| Production-grade CI/CD or national-scale infrastructure | Not required |
| Full React frontend | Skip unless all backend deliverables are complete and time remains |

**Guiding principle:** Build one small, reliable backend workflow — not the entire future platform.

---

## 5. Locked Technology Stack

Use this stack unless a genuine compatibility blocker is demonstrated. Do not change dependencies or architecture merely because an AI suggests a different stack.

| Layer | Decision | Notes |
|---|---|---|
| Runtime | Node.js 24 LTS (recommended) | Node.js 22 LTS is an acceptable fallback; use the same major locally and in deployment if deployed |
| Framework | Express.js 5.x | CommonJS; only fall back to Express 4 if a verified blocker exists |
| Language | JavaScript | CommonJS (`require` / `module.exports`), not ESM |
| Database | MySQL 8.0.16+ | InnoDB; `CHECK` constraint enforcement required |
| DB driver | `mysql2/promise` | Connection pool and parameterized SQL |
| Password hashing | `bcryptjs` | Avoid native compilation friction on Windows |
| Authentication | `jsonwebtoken` | JWT payload contains only `sub` |
| Validation | Zod | Validate body, params, and query values |
| API documentation | `swagger-jsdoc` + `swagger-ui-express` | `/api-docs` |
| Testing | Jest + Supertest | Core happy and negative paths |
| Dev server | Nodemon | Development only |
| Frontend | None by default | Swagger UI is sufficient |

Use `INT UNSIGNED` primary/foreign keys for this small prototype. This avoids JavaScript precision issues associated with very large `BIGINT` IDs. If the schema is ever changed to BIGINT, revisit mysql2 big-number handling.

---

## 6. Architecture — Locked

### 6.1 Pattern

**Modular Monolith + Layered Architecture**

```text
Swagger UI / Postman / HTTP Client
              ↓
        Express Router
              ↓
       Middleware Chain
 authenticate → authorize → validate
              ↓
          Controller
       HTTP request/response only
              ↓
           Service
 Business rules, ownership, transactions
              ↓
         Repository
    Parameterized SQL queries
              ↓
          MySQL 8
```

### 6.2 Non-Negotiable Layer Rules

| Layer | Must do | Must not do |
|---|---|---|
| Route | Define URL, method, middleware chain, controller | Contain business logic or SQL |
| Middleware | Authentication, role checks, request validation, error forwarding | Perform unrelated business workflows |
| Controller | Read `req`, call service, return HTTP status/response | Write SQL or own business rules |
| Service | Enforce ownership, department rules, state transitions, transactions | Depend on Express `req`/`res` or choose HTTP response formatting |
| Repository | Execute parameterized SQL and return data | Decide business policy or HTTP status |
| Config | Load/validate environment and initialize DB pool | Hardcode secrets |

A small project does not need abstraction for its own sake. Keep each layer simple and introduce helpers only where they reduce duplication or improve testability.

### 6.3 Canonical Folder Structure

```text
cims-backend/
├── Context.md
├── Plan.md
├── README.md
├── package.json
├── package-lock.json
├── .env                 # local only; never commit
├── .env.example
├── .gitignore
├── src/
│   ├── config/
│   │   ├── env.js
│   │   └── database.js
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.repository.js
│   │   │   └── auth.validation.js
│   │   ├── records/
│   │   │   ├── records.routes.js
│   │   │   ├── records.controller.js
│   │   │   ├── records.service.js
│   │   │   └── records.repository.js
│   │   ├── correction-requests/
│   │   │   ├── correction.routes.js
│   │   │   ├── correction.citizen.controller.js
│   │   │   ├── correction.officer.controller.js
│   │   │   ├── correction.service.js
│   │   │   ├── correction.repository.js
│   │   │   └── correction.validation.js
│   │   └── audit/
│   │       ├── audit.service.js
│   │       └── audit.repository.js
│   ├── middlewares/
│   │   ├── authenticate.js
│   │   ├── authorize.js
│   │   ├── validate.js
│   │   ├── not-found.js
│   │   └── error-handler.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── asyncHandler.js
│   │   ├── jwt.js
│   │   ├── password.js
│   │   └── withTransaction.js
│   ├── constants/
│   │   └── allowed-fields.js
│   ├── docs/
│   │   └── swagger.js
│   ├── app.js
│   └── server.js
├── database/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seeds/
│       └── seed.js
└── tests/
    ├── auth.test.js
    ├── citizen-records.test.js
    └── correction-requests.test.js
```

Do not create every optional file in advance if it is not needed until a later milestone. Follow the canonical structure as modules are implemented.

---

## 7. User Roles and Permissions

Only two roles exist in Phase 02:

### `CITIZEN`

- Login using a pre-seeded account.
- View only records owned by the authenticated user.
- Submit a correction request for an owned record.
- View only their own correction requests and details.
- Cannot directly edit a citizen record.
- Cannot access officer endpoints or approve/reject requests.

### `OFFICER`

- Login using a pre-seeded account assigned to one department.
- View requests belonging only to that department.
- View details for requests belonging only to that department.
- Approve or reject a pending request in that department.
- Must provide a reason when rejecting.
- Cannot directly edit records outside the decision workflow.

No Admin role is included in Phase 02. Do not add one.

---

## 8. Database Design — Locked Five-Table Schema

### 8.1 Tables

1. `departments`
2. `users`
3. `citizen_records`
4. `correction_requests`
5. `audit_logs`

Correction fields are stored inline in `correction_requests`. The prototype supports exactly one field: `full_name`. A separate changes table is intentionally excluded to keep the Phase 02 schema small.

### 8.2 Table Specifications

#### `departments`

| Column | Type | Rules |
|---|---|---|
| `id` | INT UNSIGNED | PK, auto increment |
| `name` | VARCHAR(100) | NOT NULL |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL |
| `is_active` | BOOLEAN | NOT NULL, default TRUE |
| `created_at` | TIMESTAMP | default current timestamp |

Departments are deactivated using `is_active = FALSE`; do not hard-delete a department referenced by users or records.

#### `users`

| Column | Type | Rules |
|---|---|---|
| `id` | INT UNSIGNED | PK, auto increment |
| `name` | VARCHAR(100) | NOT NULL |
| `email` | VARCHAR(150) | UNIQUE, NOT NULL |
| `password_hash` | VARCHAR(255) | NOT NULL |
| `role` | ENUM('CITIZEN','OFFICER') | NOT NULL |
| `department_id` | INT UNSIGNED NULL | FK to departments, ON DELETE RESTRICT |
| `is_active` | BOOLEAN | NOT NULL, default TRUE |
| `created_at`, `updated_at` | TIMESTAMP | automatic timestamps |

CHECK constraint:

```sql
(role = 'OFFICER' AND department_id IS NOT NULL)
OR (role = 'CITIZEN' AND department_id IS NULL)
```

Users are deactivated, not hard-deleted. An officer's department must be active for protected operations.

#### `citizen_records`

| Column | Type | Rules |
|---|---|---|
| `id` | INT UNSIGNED | PK, auto increment |
| `citizen_user_id` | INT UNSIGNED | FK to users, ON DELETE RESTRICT |
| `department_id` | INT UNSIGNED | FK to departments, ON DELETE RESTRICT |
| `record_type` | ENUM('NID','BIRTH_REGISTRATION') | NOT NULL |
| `record_reference` | VARCHAR(50) | UNIQUE, NOT NULL; e.g. `BR-1001` |
| `full_name` | VARCHAR(100) | NOT NULL |
| `date_of_birth` | DATE | NOT NULL |
| `address` | VARCHAR(255) | NOT NULL |
| `record_version` | INT UNSIGNED | NOT NULL, default 1 |
| `created_at`, `updated_at` | TIMESTAMP | automatic timestamps |

Required keys/indexes:

```sql
UNIQUE KEY uq_record_owner_dept (id, citizen_user_id, department_id)
INDEX idx_records_citizen (citizen_user_id)
```

The composite unique key enables the composite foreign key from `correction_requests`.

#### `correction_requests`

| Column | Type | Rules |
|---|---|---|
| `id` | INT UNSIGNED | PK, auto increment |
| `citizen_user_id` | INT UNSIGNED | NOT NULL |
| `citizen_record_id` | INT UNSIGNED | NOT NULL |
| `department_id` | INT UNSIGNED | NOT NULL |
| `field_name` | VARCHAR(50) | NOT NULL; currently only `full_name` |
| `old_value` | VARCHAR(100) | NOT NULL; retrieved from DB, never client-supplied |
| `proposed_value` | VARCHAR(100) | NOT NULL |
| `reason` | VARCHAR(500) | NOT NULL; API max 500 chars |
| `expected_record_version` | INT UNSIGNED | NOT NULL; version snapshot at submission |
| `status` | ENUM('PENDING','APPROVED','REJECTED') | NOT NULL, default PENDING |
| `reviewed_by` | INT UNSIGNED NULL | FK to users, ON DELETE RESTRICT |
| `reviewed_at` | TIMESTAMP NULL | set when finalized |
| `rejection_reason` | VARCHAR(500) NULL | required for rejection |
| `submitted_at`, `updated_at` | TIMESTAMP | automatic timestamps |

Required composite FK:

```sql
CONSTRAINT fk_req_record_dept_citizen
FOREIGN KEY (citizen_record_id, citizen_user_id, department_id)
REFERENCES citizen_records (id, citizen_user_id, department_id)
ON DELETE RESTRICT
```

Required indexes:

```sql
INDEX idx_req_record_field_status (citizen_record_id, field_name, status)
INDEX idx_req_dept_status (department_id, status)
INDEX idx_req_citizen (citizen_user_id, submitted_at)
```

This composite FK ensures at database level that a request's record, citizen, and department combination matches the corresponding citizen record.

#### `audit_logs`

| Column | Type | Rules |
|---|---|---|
| `id` | INT UNSIGNED | PK, auto increment |
| `actor_user_id` | INT UNSIGNED | FK to users, ON DELETE RESTRICT |
| `action` | VARCHAR(50) | NOT NULL |
| `entity_type` | VARCHAR(50) | NOT NULL |
| `entity_id` | INT UNSIGNED | NOT NULL |
| `metadata` | JSON NULL | pointers only; no PII duplication |
| `created_at` | TIMESTAMP | default current timestamp |

Indexes:

```sql
INDEX idx_audit_entity (entity_type, entity_id)
INDEX idx_audit_actor (actor_user_id, created_at)
```

### 8.3 Database Invariants

1. `citizen_records.record_version` must increment whenever a record is updated.
2. `correction_requests.old_value` must be read from the database, never accepted from the client.
3. Only `full_name` is allowed in this prototype.
4. A request's citizen and department must match its linked record; enforce through the composite FK and service validation.
5. A citizen can access only their own records/requests.
6. An officer can access only their assigned department's requests.
7. A correction request can transition only from `PENDING` to `APPROVED` or `REJECTED`.
8. Audit log entries are append-only at application level; there are no UPDATE/DELETE endpoints.
9. Audit log inserts happen in the same transaction as the action they describe.
10. Audit metadata contains pointers/versions only, not names, emails, passwords, tokens, or proposed personal values.
11. Users and departments are deactivated, not hard-deleted.
12. Use InnoDB and MySQL 8.0.16+ (for enforced CHECK constraints).

---

## 9. API Contract — Locked 11 Endpoints

Base path: `/api`

| # | Method | Endpoint | Access | Purpose |
|---:|---|---|---|---|
| 1 | GET | `/api/health` | Public | API health |
| 2 | POST | `/api/auth/login` | Public | Login and receive JWT |
| 3 | GET | `/api/auth/me` | Authenticated | Current user from fresh DB state |
| 4 | GET | `/api/citizen/records` | CITIZEN | List own records |
| 5 | GET | `/api/citizen/records/:recordRef` | CITIZEN | Get one owned record |
| 6 | POST | `/api/citizen/records/:recordRef/correction-requests` | CITIZEN | Submit correction request |
| 7 | GET | `/api/citizen/correction-requests` | CITIZEN | List own requests |
| 8 | GET | `/api/citizen/correction-requests/:id` | CITIZEN | Get own request detail |
| 9 | GET | `/api/officer/correction-requests` | OFFICER | List assigned department requests; optional status filter |
| 10 | GET | `/api/officer/correction-requests/:id` | OFFICER | Get assigned department request detail |
| 11 | PATCH | `/api/officer/correction-requests/:id/decision` | OFFICER | Approve or reject |

`recordRef` is a human-readable internal demo reference such as `BR-1001` or `NID-1001`; it is not a real government identifier.

### 9.1 Create Request Example

```json
{
  "changes": [
    {
      "fieldName": "full_name",
      "proposedValue": "Demo Citizen"
    }
  ],
  "reason": "Name spelling correction"
}
```

The API accepts exactly one change in this prototype. The old value and expected record version are generated by the backend from the locked database record.

### 9.2 Officer Decision Examples

Approve:

```json
{ "decision": "APPROVED" }
```

Reject:

```json
{
  "decision": "REJECTED",
  "reason": "Supporting information is insufficient."
}
```

### 9.3 Response Envelope

Success:

```json
{
  "success": true,
  "message": "Correction request submitted successfully.",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input.",
    "details": []
  }
}
```

Do not expose stack traces in production responses. Development-only stack output must be disabled in production.

---

## 10. Authentication and Authorization Design

### 10.1 Login

- Validate email and password with Zod.
- Find user by email using a parameterized query.
- Reject missing/inactive users or bad passwords with a generic `401 INVALID_CREDENTIALS` response to avoid account enumeration.
- Compare password with bcryptjs.
- Sign JWT with payload `{ sub: String(user.id) }` only.
- Return token and safe user fields (id, name, email, role, departmentId).

Do not put role, department, email, name, password, or other PII in the JWT payload.

### 10.2 Protected Request Middleware

1. Extract `Authorization: Bearer <token>`.
2. Verify JWT signature and expiration.
3. Validate `sub` is a positive integer string and read the user ID.
4. Load current user from MySQL, LEFT JOINing department state.
5. If user missing/inactive: `401 UNAUTHENTICATED`.
6. If role is OFFICER and assigned department is inactive/missing: `403 DEPARTMENT_INACTIVE`.
7. Attach fresh user information to `req.user`.
8. Apply role middleware (`CITIZEN` or `OFFICER`).

This introduces one DB lookup for each protected request. It is an acceptable security trade-off for this prototype; no Redis/cache is required.

### 10.3 Resource-Level Authorization

Role checks alone are not enough:

- Citizen record service must verify `record.citizen_user_id === req.user.id`.
- Citizen request service must verify `request.citizen_user_id === req.user.id`.
- Officer service must verify `request.department_id === req.user.departmentId`.

Use generic response messages where appropriate to avoid leaking another citizen's data.

---

## 11. Transaction and Concurrency Design

### 11.1 Universal Lock Order

For every transaction touching a citizen record and correction request, lock in this order:

```text
1. (When needed) non-locking read to discover the record ID from request ID
2. Lock citizen_records row (FOR UPDATE)
3. Lock correction_requests row (FOR UPDATE), if it already exists
4. Validate state and permissions
5. Perform writes
6. Insert audit log using the SAME connection
7. COMMIT
```

Do not reverse the record → request lock order in another workflow.

### 11.2 Create Correction Request

Inside `withTransaction`:

1. `SELECT ... FROM citizen_records WHERE record_reference = ? FOR UPDATE`.
2. If missing: `404 RECORD_NOT_FOUND`.
3. Verify record belongs to `req.user.id`; otherwise `403 NOT_RECORD_OWNER`.
4. Validate field allowlist (`full_name` only).
5. Trim/validate proposed value and reject a no-op value with `400 NO_CHANGE_REQUESTED`.
6. Check for an existing PENDING request for the same record and field; if found return `409 DUPLICATE_PENDING_REQUEST`.
7. Insert request with `old_value` from the locked record and `expected_record_version` from that record.
8. Insert `REQUEST_SUBMITTED` audit log using the same transaction connection.
9. Commit and return request data.

The record row lock serializes concurrent create attempts for the same record, so duplicate checks are not only a standalone SELECT-then-INSERT race.

### 11.3 Approve Request

Inside `withTransaction`:

1. Read the request's `citizen_record_id` without locking to discover the record ID. There is no request deletion/update endpoint that changes this relationship.
2. Lock the corresponding `citizen_records` row using `FOR UPDATE`.
3. Lock the `correction_requests` row using `FOR UPDATE`.
4. Verify request exists and status is `PENDING`; otherwise `404` or `409 REQUEST_ALREADY_PROCESSED`.
5. Verify officer department matches request department; otherwise `403 WRONG_DEPARTMENT`.
6. Compare `expected_record_version` with current `record_version`; mismatch means `409 RECORD_STATE_CONFLICT`.
7. Verify `field_name` is in the allowlist and `record.full_name === request.old_value`; mismatch means `409 RECORD_STATE_CONFLICT`.
8. Update `citizen_records.full_name` using a hardcoded allowed column name and a parameterized value; increment `record_version` by one.
9. Update request status to APPROVED, reviewer ID, and review timestamp.
10. Insert audit log with pointer/version metadata only.
11. Commit.

No dynamic SQL column name may come from user input. `full_name` is hardcoded only after allowlist validation.

### 11.4 Reject Request

Use the same record → request lock order and checks for existence, pending state, and department ownership. Require a rejection reason. Update only correction request status/reason/reviewer/timestamp and insert audit log. Do not update the citizen record.

### 11.5 Transaction Helper Rules

`withTransaction(work)` must:

- Acquire a connection from the pool.
- Begin a transaction.
- Pass the connection to `work(conn)`; all transaction SQL must use this connection.
- Commit before returning the result.
- Roll back on failure.
- Log rollback failure separately while preserving the original error.
- Always release the connection in `finally`.
- Retry only MySQL deadlock error `ER_LOCK_DEADLOCK`, at most once.
- Ensure the callback contains only repeatable database work; no external HTTP calls, emails, or non-transactional side effects.

A consistent lock order reduces deadlocks but cannot guarantee that deadlocks never occur. The single retry is defensive, not a replacement for correct locking.

---

## 12. Validation Rules and Error Catalog

### 12.1 Zod Validation

Login:

- `email`: required valid email.
- `password`: required non-empty string.

Record reference:

- Format: `/^(NID|BR)-\d+$/`.

Create correction:

- `changes`: array containing exactly one item.
- `fieldName`: exactly `full_name`.
- `proposedValue`: trimmed string, 1–100 characters.
- `reason`: trimmed string, 5–500 characters.
- Do not accept `oldValue`, `citizenUserId`, `departmentId`, `status`, or `expectedRecordVersion` from the client.

Officer decision:

- `decision`: `APPROVED` or `REJECTED`.
- When decision is REJECTED, reason is required (5–500 characters).
- When decision is APPROVED, rejection reason is not accepted/used.

Officer list query:

- Optional status must be one of `PENDING`, `APPROVED`, `REJECTED`.
- Every Zod object request schema must use `.strict()` (including login, correction creation, and officer decision schemas) so unknown client-supplied keys return `400 VALIDATION_ERROR` rather than being silently stripped.

### 12.2 Error Catalog

| HTTP | Code | Trigger |
|---:|---|---|
| 400 | `VALIDATION_ERROR` | Zod validation failed |
| 400 | `UNSUPPORTED_FIELD` | Field not in allowlist |
| 400 | `NO_CHANGE_REQUESTED` | Proposed value equals current value after normalization |
| 400 | `INVALID_DECISION` | Decision is not APPROVED/REJECTED |
| 400 | `REJECTION_REASON_REQUIRED` | Rejection reason missing/invalid |
| 401 | `UNAUTHENTICATED` | Missing, invalid, expired token; missing/inactive user |
| 401 | `INVALID_CREDENTIALS` | Wrong email/password or inactive login account |
| 403 | `FORBIDDEN` | Role mismatch |
| 403 | `NOT_RECORD_OWNER` | Citizen accesses another user's record |
| 403 | `NOT_REQUEST_OWNER` | Citizen accesses another user's request |
| 403 | `WRONG_DEPARTMENT` | Officer accesses another department's request |
| 403 | `DEPARTMENT_INACTIVE` | Officer's assigned department is inactive |
| 404 | `ROUTE_NOT_FOUND` | Unknown API route |
| 404 | `RECORD_NOT_FOUND` | Record reference not found |
| 404 | `REQUEST_NOT_FOUND` | Request ID not found |
| 409 | `DUPLICATE_PENDING_REQUEST` | Same record/field already has PENDING request |
| 409 | `REQUEST_ALREADY_PROCESSED` | Request is not PENDING |
| 409 | `RECORD_STATE_CONFLICT` | Version or old value changed after submission |
| 500 | `INTERNAL_ERROR` | Unexpected server/database error |

Use a consistent `{ success, error }` envelope. Internal SQL errors and stack traces must be logged server-side, not exposed in production responses.

---

## 13. Fictional Demo Data

### 13.1 Accounts

| Role | Email | Password (local demo only) |
|---|---|---|
| Citizen | `citizen@example.com` | `Demo@12345` |
| Birth Registration Officer | `officer.birth@example.com` | `Demo@12345` |
| NID Officer | `officer.nid@example.com` | `Demo@12345` |

Passwords must be stored as bcrypt hashes. These credentials are for local demo only; never use them for a real deployment.

### 13.2 Departments

| Code | Name |
|---|---|
| `NID` | NID Department |
| `BIRTH_REGISTRATION` | Birth Registration Department |

### 13.3 Records

| Reference | Type | Owner | Current name | Department |
|---|---|---|---|---|
| `BR-1001` | BIRTH_REGISTRATION | Demo Citizen | Demo Citzen | BIRTH_REGISTRATION |
| `NID-1001` | NID | Demo Citizen | Demo Citizen | NID |

All information is fictional. Do not enter actual NID numbers or private records.

### 13.4 Seed Script Requirements

- Generate password hashes at runtime using bcryptjs.
- Use stable demo emails and record references.
- Never `TRUNCATE` the database.
- Never delete or alter `correction_requests` or `audit_logs` history.
- Ensure foreign-key rows are created in dependency order.
- Close the pool in both success and failure paths and print a clear status message.

### 13.5 Seed Script Modes

The seed script supports two modes:

**Default (idempotent, preserves workflow state):**

```powershell
npm run db:seed
```

- Inserts missing demo rows.
- For existing citizen records, updates only `date_of_birth`, `address`, and `department_id`; it does **not** overwrite `full_name` or `record_version`.
- Preserves corrections made through the approval workflow.
- Safe to run repeatedly without changing request or audit history.

**Reset mode (for a fresh walkthrough):**

```powershell
npm run db:seed -- --reset
```

- Resets `BR-1001.full_name` to `'Demo Citzen'` and `NID-1001.full_name` to `'Demo Citizen'`.
- Resets both records' `record_version` to `1`.
- Does **not** delete or alter `correction_requests` or `audit_logs` history.
- Before applying reset, the script must check for any `PENDING` correction requests. If any exist, abort with a clear message and leave all data unchanged; resolve those requests through the normal workflow first. This avoids leaving a pending request that blocks the next demo submission.
- Use before recording the walkthrough video or when re-demonstrating the workflow.

Both modes must close the pool on success and failure and print a clear status message. Reset mode is a demo-state reset, not a historical database reset; old finalized requests and audit events remain visible.

---

## 14. Security and Privacy Rules

- Use parameterized SQL (`?` placeholders) for all values.
- Never concatenate user input into SQL.
- SQL column names cannot be user-controlled; use the explicit `full_name` allowlist/hardcoded update.
- Passwords are bcrypt-hashed.
- JWT contains only `sub`.
- User and department active state is checked from the database on protected requests.
- Enforce roles, ownership, and department boundaries in backend services.
- Use `helmet`; configure CORS narrowly (local development may allow the local Swagger/client origin).
- Limit JSON body size (e.g. 100 KB).
- Never log passwords, JWTs, or unnecessary personal information.
- Audit metadata contains pointers/version numbers only.
- `.env` and all secrets must be excluded from Git.
- Use fictional data only.

---

## 15. Definition of Done

The prototype is ready for submission when:

1. Fresh setup starts the API and connects to MySQL.
2. Database schema applies successfully and creates exactly five tables.
3. Default seed mode can run repeatedly without duplicate rows or resetting workflow state; explicit reset mode restores demo values without deleting request/audit history.
4. Citizen and both officer accounts can log in.
5. JWT protects authenticated endpoints; invalid/missing token returns 401.
6. An inactive user is blocked; an officer in an inactive department is blocked.
7. Citizen sees only their own records.
8. Citizen submits a valid correction request and receives PENDING.
9. Duplicate pending request returns 409.
10. No-op correction returns 400.
11. Unauthorized record/request access is blocked.
12. Officer sees only their department's requests.
13. Approval updates the record, increments version, finalizes request, and creates audit event atomically.
14. Rejection saves reason, leaves record unchanged, and creates audit event atomically.
15. Double approval/rejection returns 409.
16. Version/old-value mismatch returns 409 without partial update.
17. All 11 endpoints appear in Swagger UI and can be exercised.
18. Core automated tests pass.
19. README supports a fresh clone/setup.
20. A 3–5 minute walkthrough demonstrates the actual working lifecycle.
21. No secrets or real citizen data are committed.

---

## 16. Instructions for AI Assistants and Contributors

This document is the project's source of truth. `Plan.md` is the execution order.

### 16.1 General Rules

- Read `Context.md` and the relevant part of `Plan.md` before changing code.
- Implement only the current task/milestone.
- Do not invent new tables, columns, endpoints, roles, or features.
- Do not redesign the architecture unless an actual blocker is demonstrated.
- If a contradiction or real technical problem is discovered, explain it and propose the smallest correction before changing the source of truth.
- Do not assume a file, function, table, or endpoint exists; inspect the repository first.
- Preserve working behavior when adding a feature.
- Produce code that matches the project's CommonJS convention.
- Use parameterized SQL and the established layer boundaries.
- In Express 5, do not assign to `req.query`; it is a getter. Store validated request data in `req.validated` (for example `req.validated.query`) and have controllers/services consume that value.
- Apply `.strict()` to every Zod object schema, including nested objects and route/query parameter schemas.
- Use `ApiError` for expected application errors.
- Do not hide errors with broad catch blocks; forward them to the global handler.
- Explain the code and how to verify it. The developer must understand and be able to explain every submitted feature.

### 16.2 DeepSeek Chat — Planning and Review

Use DeepSeek Chat for:

- Breaking down one task from `Plan.md`.
- Explaining a design or SQL query.
- Reviewing a focused code diff.
- Diagnosing an error using the exact command and output.
- Checking whether implementation matches `Context.md`.

Do not ask it to generate the entire project in one response. Ask for one task/file group at a time. Tell it not to change frozen requirements without proposing the change first.

### 16.3 GitHub Copilot — In-Editor Implementation

Use Copilot for:

- Completing the currently open file.
- Implementing a small, clearly described function.
- Generating boilerplate that follows the existing code style.
- Writing focused tests after the behavior is implemented.

Before asking Copilot to edit, provide the relevant requirement from `Context.md` and the task from `Plan.md`. Inspect every diff. Do not accept large refactors or new dependencies without review.

### 16.4 ChatGPT — Architecture and Milestone Checkpoint Reviewer

Use ChatGPT for:

- Reviewing milestone outcomes.
- Reviewing SQL schema and query correctness.
- Reviewing `git diff` or selected source files.
- Checking security, transaction, and authorization logic.
- Reviewing test results and errors.
- Updating `Context.md` or `Plan.md` if a justified correction is needed.

ChatGPT cannot automatically see the VS Code workspace or monitor development in the background. To review progress, provide the relevant files/code, `git diff`, terminal output, and test results in the conversation.

### 16.5 Checkpoint Protocol

At the end of each milestone:

1. Run every verification command in `Plan.md` for that milestone.
2. Save the terminal output.
3. Review `git status` and `git diff`.
4. Commit only verified work.
5. Share the milestone checklist, relevant diff/files, and command output with ChatGPT for review.
6. Fix all blocking findings before starting the next milestone.

Do not claim a milestone is complete solely because code was generated.

### 16.6 Resetting the Demo for Recording

Before recording the walkthrough video, restore the demo to its initial state:

1. **Preferred — preserve request/audit history:**
   ```powershell
   npm run db:seed -- --reset
   ```
   This restores `BR-1001.full_name = 'Demo Citzen'`, `NID-1001.full_name = 'Demo Citizen'`, and both `record_version` values to `1`. It does not delete or alter request/audit history. The script must stop without changes if any request is still `PENDING`; resolve pending requests first.

2. **Full local database reset — destructive:** only if you intentionally want a completely fresh database and do not need its existing request/audit history:
   ```powershell
   mysql -u root -p -e "DROP DATABASE IF EXISTS cims_db; CREATE DATABASE cims_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   cmd /c "mysql -u root -p cims_db < database\migrations\001_initial_schema.sql"
   npm run db:seed
   ```
   This permanently removes all tables and data in the local `cims_db` database. Confirm the database name and environment before running it.

Option 1 is sufficient for the walkthrough video. Option 2 is only for a from-scratch local demo.

---

## 17. Known Limitations

1. This is a recruitment prototype, not an official government system.
2. All records and accounts are fictional.
3. No government integration or actual verification exists.
4. Approval updates only the local prototype database.
5. Accounts are pre-seeded; no registration flow exists.
6. Only `full_name` correction is supported.
7. One officer decision is used; there is no multi-level workflow.
8. The API middleware performs a fresh DB lookup for protected requests; this favors current permissions over avoiding a small extra query.
9. Frontend and deployment are optional and excluded from the default scope.
10. Security controls are appropriate for a demo prototype, not a substitute for a production security/privacy audit.

---

**End of Context.md — Source of Truth**
