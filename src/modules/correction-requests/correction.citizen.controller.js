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

const list = asyncHandler(async (req, res) => {
  const requests = await correctionService.listMyRequests(req.user);
  res.status(200).json({
    success: true,
    data: { requests },
  });
});

const getOne = asyncHandler(async (req, res) => {
  const request = await correctionService.getMyRequestById(
    req.user,
    req.validated.params.id
  );
  res.status(200).json({
    success: true,
    data: { request },
  });
});

module.exports = { create, list, getOne };