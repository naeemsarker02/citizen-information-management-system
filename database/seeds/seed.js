// ─────────────────────────────────────────────────────────────
// CIMS Phase 02 — Seed Script
// Modes:
//   npm run db:seed              → default (preserve workflow state)
//   npm run db:seed -- --reset   → reset BR-1001/NID-1001 to initial
// ─────────────────────────────────────────────────────────────

const { pool } = require('../../src/config/database');
const { hashPassword } = require('../../src/utils/password');

const RESET_MODE = process.argv.includes('--reset');

const DEPARTMENTS = [
    { id: 1, code: 'NID', name: 'NID Department' },
    { id: 2, code: 'BIRTH_REGISTRATION', name: 'Birth Registration Department' },
];

const USERS = [
    {
        id: 1, name: 'Demo Citizen', email: 'citizen@example.com',
        role: 'CITIZEN', department_id: null, password: 'Demo@12345',
    },
    {
        id: 2, name: 'Birth Officer', email: 'officer.birth@example.com',
        role: 'OFFICER', department_id: 2, password: 'Demo@12345',
    },
    {
        id: 3, name: 'NID Officer', email: 'officer.nid@example.com',
        role: 'OFFICER', department_id: 1, password: 'Demo@12345',
    },
];

// ⚠️ BR-1001 has the INTENTIONAL typo "Demo Citzen" — this is the demo's core scenario
const RECORDS = [
    {
        id: 1, citizen_user_id: 1, department_id: 2,
        record_type: 'BIRTH_REGISTRATION', record_reference: 'BR-1001',
        full_name: 'Demo Citzen',           // typo on purpose
        date_of_birth: '1990-01-01', address: 'Dhaka, Bangladesh',
        record_version: 1,
    },
    {
        id: 2, citizen_user_id: 1, department_id: 1,
        record_type: 'NID', record_reference: 'NID-1001',
        full_name: 'Demo Citizen',
        date_of_birth: '1990-01-01', address: 'Dhaka, Bangladesh',
        record_version: 1,
    },
];

async function seedCore(executor, { resetRecords }) {
    // ── 1. Departments ─────────────────────────────────────
    for (const d of DEPARTMENTS) {
        await executor.query(
            `INSERT INTO departments (id, code, name, is_active)
       VALUES (?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE
         code = VALUES(code),
         name = VALUES(name),
         is_active = VALUES(is_active)`,
            [d.id, d.code, d.name]
        );
    }

    // ── 2. Users (bcrypt hash generated at runtime) ─────────
    for (const u of USERS) {
        const hash = await hashPassword(u.password);
        await executor.query(
            `INSERT INTO users (id, name, email, password_hash, role, department_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         password_hash = VALUES(password_hash),
         role = VALUES(role),
         department_id = VALUES(department_id),
         is_active = VALUES(is_active)`,
            [u.id, u.name, u.email, hash, u.role, u.department_id]
        );
    }

    // ── 3. Citizen records ──────────────────────────────────
    // Default mode: preserve full_name + record_version (workflow state)
    // Reset mode:   restore full_name + record_version to initial values
    const onDuplicate = resetRecords
        ? `full_name = VALUES(full_name),
       date_of_birth = VALUES(date_of_birth),
       address = VALUES(address),
       department_id = VALUES(department_id),
       record_version = VALUES(record_version)`
        : `date_of_birth = VALUES(date_of_birth),
       address = VALUES(address),
       department_id = VALUES(department_id)`;

    for (const r of RECORDS) {
        await executor.query(
            `INSERT INTO citizen_records
         (id, citizen_user_id, department_id, record_type, record_reference,
          full_name, date_of_birth, address, record_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE ${onDuplicate}`,
            [r.id, r.citizen_user_id, r.department_id, r.record_type, r.record_reference,
            r.full_name, r.date_of_birth, r.address, r.record_version]
        );
    }
}

async function runDefault() {
    await seedCore(pool, { resetRecords: false });
    console.log('✅ Seed complete (default mode — workflow state preserved)');
}

async function runReset() {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Guard: refuse to reset if any PENDING request exists
        const [pending] = await conn.query(
            `SELECT id FROM correction_requests WHERE status = 'PENDING' LIMIT 1`
        );
        if (pending.length > 0) {
            await conn.rollback();
            console.error('❌ Reset aborted: PENDING correction requests exist.');
            console.error('   Resolve them through the officer workflow first.');
            throw new Error('RESET_BLOCKED_BY_PENDING_REQUESTS');
        }

        await seedCore(conn, { resetRecords: true });
        await conn.commit();
        console.log('✅ Reset complete — full_name and record_version restored');
        console.log('   Existing correction_requests and audit_logs preserved.');
    } catch (err) {
        try { await conn.rollback(); } catch { /* ignore */ }
        throw err;
    } finally {
        conn.release();
    }
}

(async () => {
    try {
        if (RESET_MODE) {
            console.log('🔄 Running in RESET mode');
            await runReset();
        } else {
            console.log('🌱 Running in DEFAULT mode');
            await runDefault();
        }
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
})();