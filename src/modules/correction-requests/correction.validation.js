const { z } = require('zod');
const { ALLOWED_CORRECTION_FIELDS } = require('../../constants/allowed-fields');

const createCorrectionSchema = z
  .object({
    changes: z
      .array(
        z
          .object({
            fieldName: z.enum(ALLOWED_CORRECTION_FIELDS),
            proposedValue: z.string().trim().min(1).max(100),
          })
          .strict()
      )
      .length(1, 'Exactly one change is allowed in this prototype'),
    reason: z.string().trim().min(5).max(500),
  })
  .strict();

const requestIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();

module.exports = { createCorrectionSchema, requestIdParamSchema };