const express = require('express');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { recordRefParamSchema } = require('../../constants/record-ref');
const controller = require('./records.controller');

const router = express.Router();

router.get(
  '/records',
  authenticate,
  authorize('CITIZEN'),
  controller.list
);

router.get(
  '/records/:recordRef',
  authenticate,
  authorize('CITIZEN'),
  validate(recordRefParamSchema, 'params'),
  controller.getByRef
);

module.exports = router;