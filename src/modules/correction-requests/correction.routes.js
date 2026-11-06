const express = require('express');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { recordRefParamSchema } = require('../../constants/record-ref');
const {
  createCorrectionSchema,
  requestIdParamSchema,
} = require('./correction.validation');
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

router.get(
  '/correction-requests',
  authenticate,
  authorize('CITIZEN'),
  citizenController.list
);

router.get(
  '/correction-requests/:id',
  authenticate,
  authorize('CITIZEN'),
  validate(requestIdParamSchema, 'params'),
  citizenController.getOne
);

module.exports = router;