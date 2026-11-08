const ApiError = require('../../utils/ApiError');
const recordsRepo = require('./records.repository');

// Whitelist of fields returned to client — no internal metadata leak
function sanitize(record) {
  return {
    id: record.id,
    recordType: record.record_type,
    recordReference: record.record_reference,
    fullName: record.full_name,
    dateOfBirth: record.date_of_birth,
    address: record.address,
    departmentId: record.department_id,
    recordVersion: record.record_version,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

async function getMyRecords(user) {
  const rows = await recordsRepo.findByCitizenId(user.id);
  return rows.map(sanitize);
}

async function getRecordByReference(user, recordRef) {
  const record = await recordsRepo.findByReference(recordRef);

  if (!record) {
    throw new ApiError(404, 'RECORD_NOT_FOUND', 'Record not found.');
  }

  if (record.citizen_user_id !== user.id) {
    throw new ApiError(403, 'NOT_RECORD_OWNER', 'This record does not belong to you.');
  }

  return sanitize(record);
}

module.exports = { getMyRecords, getRecordByReference };