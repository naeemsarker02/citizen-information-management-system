-- CIMS — HARD RESET (for a clean demo state)
--
-- WARNING: Destructive. Use before recording the walkthrough video,
-- NOT during active development.
--
-- Effect:
--   • Deletes ALL correction_requests and audit_logs history
--   • Resets BR-1001 / NID-1001 to initial demo values + version 1
--   • Resets auto-increment counters (next request starts at id = 1)
--   • Leaves users and departments untouched

-- Safety: refuses to run if PENDING requests exist
-- Run this first manually if you want to check:
--   SELECT id FROM correction_requests WHERE status = 'PENDING';

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE correction_requests;
SET FOREIGN_KEY_CHECKS = 1;

UPDATE citizen_records
SET full_name = 'Demo Citzen', record_version = 1
WHERE record_reference = 'BR-1001';

UPDATE citizen_records
SET full_name = 'Demo Citizen', record_version = 1
WHERE record_reference = 'NID-1001';

SELECT 'Hard reset complete' AS status;
SELECT record_reference, full_name, record_version FROM citizen_records ORDER BY id;
SELECT COUNT(*) AS request_count FROM correction_requests;
SELECT COUNT(*) AS audit_count FROM audit_logs;