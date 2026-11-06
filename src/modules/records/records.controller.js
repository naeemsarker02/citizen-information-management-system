const asyncHandler = require('../../utils/asyncHandler');
const recordsService = require('./records.service');

const list = asyncHandler(async (req, res) => {
  const records = await recordsService.getMyRecords(req.user);
  res.status(200).json({
    success: true,
    data: { records },
  });
});

const getByRef = asyncHandler(async (req, res) => {
  const record = await recordsService.getRecordByReference(
    req.user,
    req.validated.params.recordRef
  );
  res.status(200).json({
    success: true,
    data: { record },
  });
});

module.exports = { list, getByRef };