-- ─────────────────────────────────────────────────────────────
-- CIMS Phase 02 — Initial Schema
-- 5 tables: departments, users, citizen_records,
--           correction_requests, audit_logs
-- Requires: MySQL 8.0.16+ (for enforced CHECK constraints)
-- ─────────────────────────────────────────────────────────────

-- Safety: this script does not create the database.
-- The database `cims_db` must already exist (created via mysql CLI).
-- This script only creates tables + constraints + indexes.

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS correction_requests;
DROP TABLE IF EXISTS citizen_records;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;
SET FOREIGN_KEY_CHECKS = 1;

-- ─── 1. departments ──────────────────────────────────────────
CREATE TABLE departments (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  code        VARCHAR(50)  NOT NULL UNIQUE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 2. users ────────────────────────────────────────────────
CREATE TABLE users (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('CITIZEN','OFFICER') NOT NULL,
  department_id  INT UNSIGNED NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_department
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  CONSTRAINT chk_users_role_department CHECK (
    (role = 'OFFICER' AND department_id IS NOT NULL)
    OR (role = 'CITIZEN' AND department_id IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_department ON users(department_id);

-- ─── 3. citizen_records ──────────────────────────────────────
CREATE TABLE citizen_records (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  citizen_user_id  INT UNSIGNED NOT NULL,
  department_id    INT UNSIGNED NOT NULL,
  record_type      ENUM('NID','BIRTH_REGISTRATION') NOT NULL,
  record_reference VARCHAR(50) NOT NULL UNIQUE,
  full_name        VARCHAR(100) NOT NULL,
  date_of_birth    DATE NOT NULL,
  address          VARCHAR(255) NOT NULL,
  record_version   INT UNSIGNED NOT NULL DEFAULT 1,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_records_citizen
    FOREIGN KEY (citizen_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_records_department
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  CONSTRAINT uq_record_owner_dept
    UNIQUE KEY (id, citizen_user_id, department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_records_citizen ON citizen_records(citizen_user_id);
CREATE INDEX idx_records_department ON citizen_records(department_id);

-- ─── 4. correction_requests ──────────────────────────────────
CREATE TABLE correction_requests (
  id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  citizen_user_id          INT UNSIGNED NOT NULL,
  citizen_record_id        INT UNSIGNED NOT NULL,
  department_id            INT UNSIGNED NOT NULL,
  field_name               VARCHAR(50)  NOT NULL,
  old_value                VARCHAR(100) NOT NULL,
  proposed_value           VARCHAR(100) NOT NULL,
  reason                   VARCHAR(500) NOT NULL,
  expected_record_version  INT UNSIGNED NOT NULL,
  status                   ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  reviewed_by              INT UNSIGNED NULL,
  reviewed_at              TIMESTAMP NULL,
  rejection_reason         VARCHAR(500) NULL,
  submitted_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_req_reviewer
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_req_record_dept_citizen
    FOREIGN KEY (citizen_record_id, citizen_user_id, department_id)
    REFERENCES citizen_records (id, citizen_user_id, department_id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_req_record_field_status
  ON correction_requests(citizen_record_id, field_name, status);
CREATE INDEX idx_req_dept_status
  ON correction_requests(department_id, status);
CREATE INDEX idx_req_citizen
  ON correction_requests(citizen_user_id, submitted_at);

-- ─── 5. audit_logs ───────────────────────────────────────────
CREATE TABLE audit_logs (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_user_id  INT UNSIGNED NOT NULL,
  action         VARCHAR(50) NOT NULL,
  entity_type    VARCHAR(50) NOT NULL,
  entity_id      INT UNSIGNED NOT NULL,
  metadata       JSON NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_user_id, created_at);