const { z } = require('zod');

const RECORD_REF_PATTERN = /^(NID|BR)-\d+$/;
const RECORD_REF_REGEX_MESSAGE = 'Invalid record reference format';

/**
 * Shared param schema for routes with `:recordRef`.
 * Used by:
 *   - records.routes.js
 *   - correction.routes.js (M2.4)
 */
const recordRefParamSchema = z
  .object({
    recordRef: z.string().regex(RECORD_REF_PATTERN, RECORD_REF_REGEX_MESSAGE),
  })
  .strict();

module.exports = {
  RECORD_REF_PATTERN,
  RECORD_REF_REGEX_MESSAGE,
  recordRefParamSchema,
};