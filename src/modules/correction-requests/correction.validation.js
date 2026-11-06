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

// ── M3.1: Officer list query filter ──────────────────────────
const officerListQuerySchema = z
  .object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  })
  .strict();

// ── M3.3: Officer decision body ──────────────────────────────
// Enforces:
//   - decision is APPROVED or REJECTED
//   - REJECTED requires a trimmed reason of 5–500 chars
//   - APPROVED must NOT include a reason (contract violation rejected)
//   - unknown keys rejected (.strict())
const decisionSchema = z
  .object({
    decision: z.enum(['APPROVED', 'REJECTED']),
    reason: z.string().trim().min(5).max(500).optional(),
  })
  .strict()
  .refine(
    (data) => data.decision !== 'REJECTED' || typeof data.reason === 'string',
    {
      message: 'Rejection reason is required when decision is REJECTED',
      path: ['reason'],
    }
  )
  .refine(
    (data) => data.decision !== 'APPROVED' || data.reason === undefined,
    {
      message: 'Reason is not accepted when decision is APPROVED',
      path: ['reason'],
    }
  );

module.exports = {
  createCorrectionSchema,
  requestIdParamSchema,
  officerListQuerySchema,
  decisionSchema,
};