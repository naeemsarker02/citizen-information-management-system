const express = require('express');
const { z } = require('zod');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const controller = require('./records.controller');

const router = express.Router();

const recordRefParamSchema = z
  .object({
    recordRef: z.string().regex(/^(NID|BR)-\d+$/, 'Invalid record reference format'),
  })
  .strict();

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