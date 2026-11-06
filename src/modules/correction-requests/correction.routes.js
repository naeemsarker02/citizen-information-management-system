const express = require('express');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { recordRefParamSchema } = require('../../constants/record-ref');
const { createCorrectionSchema } = require('./correction.validation');
const citizenController = require('./correction.citizen.controller');

const router = express.Router();

router.post(
  '/records/:recordRef/correction-requests',
  authenticate,
  authorize('CITIZEN'),
  validate(recordRefParamSchema, 'params'),
  validate(createCorrectionSchema, 'body'),
  citizenController.create
);

module.exports = router;