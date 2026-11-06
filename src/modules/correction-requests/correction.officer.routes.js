const express = require('express');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const {
  requestIdParamSchema,
  officerListQuerySchema,
  decisionSchema,
} = require('./correction.validation');
const controller = require('./correction.officer.controller');

const router = express.Router();

router.get(
  '/correction-requests',
  authenticate,
  authorize('OFFICER'),
  validate(officerListQuerySchema, 'query'),
  controller.list
);

router.get(
  '/correction-requests/:id',
  authenticate,
  authorize('OFFICER'),
  validate(requestIdParamSchema, 'params'),
  controller.getOne
);

router.patch(
  '/correction-requests/:id/decision',
  authenticate,
  authorize('OFFICER'),
  validate(requestIdParamSchema, 'params'),
  validate(decisionSchema, 'body'),
  controller.decide
);

module.exports = router;