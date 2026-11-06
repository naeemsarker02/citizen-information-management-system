const asyncHandler = require('../../utils/asyncHandler');
const correctionService = require('./correction.service');

const list = asyncHandler(async (req, res) => {
  const requests = await correctionService.listForOfficer(
    req.user,
    req.validated.query
  );
  res.status(200).json({
    success: true,
    data: { requests },
  });
});

const getOne = asyncHandler(async (req, res) => {
  const request = await correctionService.getRequestForOfficer(
    req.user,
    req.validated.params.id
  );
  res.status(200).json({
    success: true,
    data: { request },
  });
});

module.exports = { list, getOne };