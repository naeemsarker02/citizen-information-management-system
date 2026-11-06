const { z } = require('zod');
const { ALLOWED_CORRECTION_FIELDS } = require('../../constants/allowed-fields');

/**
 * Body schema for creating a correction request.
 *
 * ⚠️ `.strict()` is MANDATORY on every object — including nested `changes` items.
 * Zod default behavior silently STRIPS unknown keys. With `.strict()`, any
 * client-supplied `oldValue`, `citizenUserId`, `departmentId`, `status`,
 * `expectedRecordVersion` → 400 VALIDATION_ERROR (not silently accepted).
 */
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

module.exports = { createCorrectionSchema };