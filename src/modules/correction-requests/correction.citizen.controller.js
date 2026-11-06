const asyncHandler = require('../../utils/asyncHandler');
const correctionService = require('./correction.service');

const create = asyncHandler(async (req, res) => {
  const request = await correctionService.createRequest(
    req.user,
    req.validated.params.recordRef,
    req.validated.body
  );

  res.status(201).json({
    success: true,
    message: 'Correction request submitted successfully.',
    data: { request },
  });
});

module.exports = { create };