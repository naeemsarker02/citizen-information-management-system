// CIMS Phase 02 — Seed Script
//
// Modes:
//   npm run db:seed              → default: insert missing rows, preserve workflow state
//   npm run db:seed -- --reset   → full reset: wipe request/audit history, restore records
//                                   to baseline, then seed realistic historical requests

const { pool } = require('../../src/config/database');
const { hashPassword } = require('../../src/utils/password');

const RESET_MODE = process.argv.includes('--reset');

const DEPARTMENTS = [
    { id: 1, code: 'NID', name: 'NID Department' },
    { id: 2, code: 'BIRTH_REGISTRATION', name: 'Birth Registration Department' },
];

const USERS = [
    // ── Citizens ─────────────────────────────────────────────────────
    // Rakib: main demo user; BR has a typo to correct
    { id: 1, name: 'Md. Rakib Hossain', email: 'citizen@example.com', role: 'CITIZEN', department_id: null, password: 'Demo@12345' },
    // Fatima: has a PENDING historical correction on BR-1002 (ready for officer approval)
    { id: 4, name: 'Fatima Akter', email: 'fatima@example.com', role: 'CITIZEN', department_id: null, password: 'Demo@12345' },
    // Tanvir: BR-1003 already corrected (version 2), NID has a rejected attempt in history
    { id: 5, name: 'Mohammad Tanvir Ahmed', email: 'tanvir@example.com', role: 'CITIZEN', department_id: null, password: 'Demo@12345' },
    // Sadia: clean records, no corrections needed
    { id: 6, name: 'Sadia Islam', email: 'sadia@example.com', role: 'CITIZEN', department_id: null, password: 'Demo@12345' },

    // ── Officers (2 per department) ──────────────────────────────────
    { id: 2, name: 'Birth Officer', email: 'officer.birth@example.com', role: 'OFFICER', department_id: 2, password: 'Demo@12345' },
    { id: 3, name: 'NID Officer', email: 'officer.nid@example.com', role: 'OFFICER', department_id: 1, password: 'Demo@12345' },
    { id: 7, name: 'Abdur Rahman', email: 'officer.rahman@example.com', role: 'OFFICER', department_id: 1, password: 'Demo@12345' },
    { id: 8, name: 'Rafiq Uddin', email: 'officer.rafiq@example.com', role: 'OFFICER', department_id: 2, password: 'Demo@12345' },
];

const RECORDS = [
    // Rakib — primary demo scenario: fresh typo on BR to correct
    { id: 1, citizen_user_id: 1, department_id: 2, record_type: 'BIRTH_REGISTRATION', record_reference: 'BR-1001', full_name: 'Md. Rakib Hasan', date_of_birth: '1990-01-01', address: 'Dhaka, Bangladesh', record_version: 1 },
    { id: 2, citizen_user_id: 1, department_id: 1, record_type: 'NID', record_reference: 'NID-1001', full_name: 'Md. Rakib Hossain', date_of_birth: '1990-01-01', address: 'Dhaka, Bangladesh', record_version: 1 },

    // Fatima — BR-1002 has a typo with a PENDING correction seeded against it
    { id: 3, citizen_user_id: 4, department_id: 2, record_type: 'BIRTH_REGISTRATION', record_reference: 'BR-1002', full_name: 'Fatema Akhter', date_of_birth: '1995-06-15', address: 'Chattogram, Bangladesh', record_version: 1 },
    { id: 4, citizen_user_id: 4, department_id: 1, record_type: 'NID', record_reference: 'NID-1002', full_name: 'Fatima Akter', date_of_birth: '1995-06-15', address: 'Chattogram, Bangladesh', record_version: 1 },

    // Tanvir — BR-1003 already corrected (version 2, historical approval); NID-1003 has a rejected history
    { id: 5, citizen_user_id: 5, department_id: 2, record_type: 'BIRTH_REGISTRATION', record_reference: 'BR-1003', full_name: 'Mohammad Tanvir Ahmed', date_of_birth: '1988-11-20', address: 'Sylhet, Bangladesh', record_version: 2 },
    { id: 6, citizen_user_id: 5, department_id: 1, record_type: 'NID', record_reference: 'NID-1003', full_name: 'Mohammad Tanvir Ahmed', date_of_birth: '1988-11-20', address: 'Sylhet, Bangladesh', record_version: 1 },

    // Sadia — clean records, no workflow history
    { id: 7, citizen_user_id: 6, department_id: 1, record_type: 'NID', record_reference: 'NID-1004', full_name: 'Sadia Islam', date_of_birth: '1998-03-05', address: 'Khulna, Bangladesh', record_version: 1 },
    { id: 8, citizen_user_id: 6, department_id: 2, record_type: 'BIRTH_REGISTRATION', record_reference: 'BR-1004', full_name: 'Sadia Islam', date_of_birth: '1998-03-05', address: 'Khulna, Bangladesh', record_version: 1 },
];

async function seedCore(executor, { resetRecords }) {
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

    // Default mode: preserve full_name + record_version so approval workflow state is untouched
    // Reset mode:   restore full_name + record_version to seeded baseline
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

// Seeds historical correction_requests + their audit log entries.
// Run only in reset mode so the demo DB looks "lived-in" without overriding real
// workflow history produced by the reviewer.
async function seedHistoricalRequests(conn) {
    // 1. Fatima — PENDING correction on BR-1002 (ready for officer to approve)
    const [fatimaReq] = await conn.query(
        `INSERT INTO correction_requests
           (citizen_user_id, citizen_record_id, department_id, field_name,
            old_value, proposed_value, reason, expected_record_version, status)
         VALUES (?, ?, ?, 'full_name', ?, ?, ?, ?, 'PENDING')`,
        [4, 3, 2, 'Fatema Akhter', 'Fatima Akter',
         'Surname spelling correction — align with NID', 1]
    );
    await conn.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
         VALUES (?, 'REQUEST_SUBMITTED', 'correction_request', ?, ?)`,
        [4, fatimaReq.insertId,
         JSON.stringify({ recordId: 3, fieldName: 'full_name' })]
    );

    // 2. Tanvir — APPROVED correction on BR-1003 (historical proof of workflow)
    const [tanvirApproved] = await conn.query(
        `INSERT INTO correction_requests
           (citizen_user_id, citizen_record_id, department_id, field_name,
            old_value, proposed_value, reason, expected_record_version, status,
            reviewed_by, reviewed_at)
         VALUES (?, ?, ?, 'full_name', ?, ?, ?, ?, 'APPROVED', ?, NOW() - INTERVAL 2 DAY)`,
        [5, 5, 2, 'Md. Tanvir Ahmed', 'Mohammad Tanvir Ahmed',
         'Full name correction — add middle name', 1, 2]
    );
    await conn.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
         VALUES (?, 'REQUEST_SUBMITTED', 'correction_request', ?, ?)`,
        [5, tanvirApproved.insertId,
         JSON.stringify({ recordId: 5, fieldName: 'full_name' })]
    );
    await conn.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
         VALUES (?, 'REQUEST_APPROVED', 'correction_request', ?, ?)`,
        [2, tanvirApproved.insertId,
         JSON.stringify({ recordId: 5, prevVersion: 1, newVersion: 2 })]
    );

    // 3. Tanvir — REJECTED correction on NID-1003 (historical proof of rejection flow)
    const [tanvirRejected] = await conn.query(
        `INSERT INTO correction_requests
           (citizen_user_id, citizen_record_id, department_id, field_name,
            old_value, proposed_value, reason, expected_record_version, status,
            reviewed_by, reviewed_at, rejection_reason)
         VALUES (?, ?, ?, 'full_name', ?, ?, ?, ?, 'REJECTED', ?, NOW() - INTERVAL 1 DAY, ?)`,
        [5, 6, 1, 'Mohammad Tanvir Ahmed', 'Muhammad Tanvir',
         'Attempt to shorten name', 1, 3,
         'Proposed value does not match any source document.']
    );
    await conn.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
         VALUES (?, 'REQUEST_SUBMITTED', 'correction_request', ?, ?)`,
        [5, tanvirRejected.insertId,
         JSON.stringify({ recordId: 6, fieldName: 'full_name' })]
    );
    await conn.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
         VALUES (?, 'REQUEST_REJECTED', 'correction_request', ?, ?)`,
        [3, tanvirRejected.insertId,
         JSON.stringify({ recordId: 6 })]
    );
}

async function runDefault() {
    await seedCore(pool, { resetRecords: false });
    console.log('Seed complete (default mode — workflow state preserved)');
    console.log('   Records and users inserted/updated. Requests and audit logs untouched.');
}

async function runReset() {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Full reset: wipe prior request history so the demo DB always starts
        // from a known clean slate. Historical requests are re-seeded below.
        await conn.query('DELETE FROM audit_logs WHERE entity_type = ?', ['correction_request']);
        await conn.query('DELETE FROM correction_requests');

        await seedCore(conn, { resetRecords: true });
        await seedHistoricalRequests(conn);

        await conn.commit();
        console.log('Reset complete — demo state restored');
        console.log('   Users:     8 (4 citizens, 4 officers)');
        console.log('   Records:   8 across 4 citizens');
        console.log('   Requests:  3 seeded (1 PENDING, 1 APPROVED, 1 REJECTED)');
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
            console.log('Running in RESET mode');
            await runReset();
        } else {
            console.log('Running in DEFAULT mode');
            await runDefault();
        }
    } catch (err) {
        console.error('Seed failed:', err.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
})();