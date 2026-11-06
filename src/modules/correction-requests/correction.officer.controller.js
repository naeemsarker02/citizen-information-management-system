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

const decide = asyncHandler(async (req, res) => {
  const request = await correctionService.decideRequest(
    req.user,
    req.validated.params.id,
    req.validated.body
  );

  const message =
    request.status === 'APPROVED'
      ? 'Correction request approved.'
      : 'Correction request rejected.';

  res.status(200).json({
    success: true,
    message,
    data: { request },
  });
});

module.exports = { list, getOne, decide };