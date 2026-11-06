/**
 * CIMS API — OpenAPI 3.0 specification.
 *
 * Central spec file (no inline JSDoc on routes) so the contract for all
 * 11 endpoints lives in one place. Easier to review and audit against
 * Context.md §9 than scattered annotations.
 */

const swaggerJsdoc = require('swagger-jsdoc');

const spec = {
  openapi: '3.0.0',
  info: {
    title: 'CIMS API',
    version: '1.0.0',
    description:
      'Citizen Information Management System — Credosis Phase 02 Backend Prototype.\n\n' +
      '⚠️ Fictional demo data only. Not connected to any real government database.\n\n' +
      '**Test flow:**\n' +
      '1. `POST /api/auth/login` with citizen → copy `data.token`\n' +
      '2. Click **Authorize** → paste token\n' +
      '3. Try `GET /api/citizen/records`\n' +
      '4. Login as officer → re-Authorize → `PATCH /api/officer/correction-requests/{id}/decision`',
  },
  servers: [{ url: 'http://localhost:5000', description: 'Local development' }],

  tags: [
    { name: 'Health', description: 'Server status' },
    { name: 'Auth', description: 'Login and current user' },
    { name: 'Citizen — Records', description: 'Own identity records (CITIZEN)' },
    { name: 'Citizen — Requests', description: 'Own correction requests (CITIZEN)' },
    { name: 'Officer', description: 'Department-scoped review + decision (OFFICER)' },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the token from `POST /api/auth/login`. Format: `Bearer <token>` (Swagger adds the `Bearer ` prefix).',
      },
    },

    schemas: {
      // ── Shared ────────────────────────────────────────────
      ErrorEnvelope: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid input.' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    path: { type: 'string', example: 'email' },
                    message: { type: 'string', example: 'Invalid email address' },
                  },
                },
              },
              stack: { type: 'string', description: 'Dev only — never returned in production' },
            },
          },
        },
      },

      // ── Auth ──────────────────────────────────────────────
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        additionalProperties: false,
        properties: {
          email: { type: 'string', format: 'email', example: 'citizen@example.com' },
          password: { type: 'string', minLength: 1, example: 'Demo@12345' },
        },
      },

      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Demo Citizen' },
          email: { type: 'string', format: 'email', example: 'citizen@example.com' },
          role: { type: 'string', enum: ['CITIZEN', 'OFFICER'], example: 'CITIZEN' },
          departmentId: { type: 'integer', nullable: true, example: null },
        },
      },

      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Login successful' },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              user: { $ref: '#/components/schemas/User' },
            },
          },
        },
      },

      // ── Records ───────────────────────────────────────────
      CitizenRecord: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          recordType: { type: 'string', enum: ['NID', 'BIRTH_REGISTRATION'], example: 'BIRTH_REGISTRATION' },
          recordReference: { type: 'string', example: 'BR-1001' },
          fullName: { type: 'string', example: 'Demo Citzen' },
          dateOfBirth: { type: 'string', format: 'date', example: '1990-01-01' },
          address: { type: 'string', example: 'Dhaka, Bangladesh' },
          departmentId: { type: 'integer', example: 2 },
          recordVersion: { type: 'integer', example: 1 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      // ── Correction requests ───────────────────────────────
      CreateCorrectionRequest: {
        type: 'object',
        required: ['changes', 'reason'],
        additionalProperties: false,
        properties: {
          changes: {
            type: 'array',
            minItems: 1,
            maxItems: 1,
            description: 'Exactly one change in this prototype.',
            items: {
              type: 'object',
              required: ['fieldName', 'proposedValue'],
              additionalProperties: false,
              properties: {
                fieldName: { type: 'string', enum: ['full_name'], example: 'full_name' },
                proposedValue: { type: 'string', minLength: 1, maxLength: 100, example: 'Demo Citizen' },
              },
            },
          },
          reason: { type: 'string', minLength: 5, maxLength: 500, example: 'Name spelling correction' },
        },
      },

      CorrectionRequestCitizenView: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          recordId: { type: 'integer', example: 1 },
          departmentId: { type: 'integer', example: 2 },
          fieldName: { type: 'string', example: 'full_name' },
          oldValue: { type: 'string', example: 'Demo Citzen' },
          proposedValue: { type: 'string', example: 'Demo Citizen' },
          reason: { type: 'string', example: 'Name spelling correction' },
          expectedRecordVersion: { type: 'integer', example: 1 },
          status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'], example: 'PENDING' },
          reviewedBy: { type: 'integer', nullable: true, example: null },
          reviewedAt: { type: 'string', format: 'date-time', nullable: true, example: null },
          rejectionReason: { type: 'string', nullable: true, example: null },
          submittedAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      CorrectionRequestOfficerView: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          citizen: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Demo Citizen' },
              email: { type: 'string', example: 'citizen@example.com' },
            },
          },
          record: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              reference: { type: 'string', example: 'BR-1001' },
              type: { type: 'string', example: 'BIRTH_REGISTRATION' },
              currentFullName: { type: 'string', example: 'Demo Citzen' },
              currentVersion: { type: 'integer', example: 1 },
            },
          },
          departmentId: { type: 'integer', example: 2 },
          fieldName: { type: 'string', example: 'full_name' },
          oldValue: { type: 'string', example: 'Demo Citzen' },
          proposedValue: { type: 'string', example: 'Demo Citizen' },
          reason: { type: 'string' },
          expectedRecordVersion: { type: 'integer' },
          status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
          review: {
            type: 'object',
            nullable: true,
            properties: {
              reviewerId: { type: 'integer' },
              reviewerName: { type: 'string' },
              reviewedAt: { type: 'string', format: 'date-time' },
              rejectionReason: { type: 'string', nullable: true },
            },
          },
          submittedAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      DecisionRequest: {
        type: 'object',
        required: ['decision'],
        additionalProperties: false,
        properties: {
          decision: { type: 'string', enum: ['APPROVED', 'REJECTED'], example: 'APPROVED' },
          reason: {
            type: 'string',
            minLength: 5,
            maxLength: 500,
            description: 'Required for REJECTED. Must be omitted for APPROVED.',
            example: 'Supporting information is insufficient.',
          },
        },
      },

      DecisionResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Correction request approved.' },
          data: {
            type: 'object',
            properties: {
              request: { $ref: '#/components/schemas/CorrectionRequestOfficerView' },
            },
          },
        },
      },
    },
  },

  // ════════════════════════════════════════════════════════════
  // PATHS — 11 endpoints
  // ════════════════════════════════════════════════════════════
  paths: {
    // ── 1. Health ───────────────────────────────────────────
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'API health check',
        security: [],
        responses: {
          200: {
            description: 'Server is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'CIMS API is running' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── 2. Login ────────────────────────────────────────────
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive a JWT',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
              examples: {
                citizen: { value: { email: 'citizen@example.com', password: 'Demo@12345' } },
                birthOfficer: { value: { email: 'officer.birth@example.com', password: 'Demo@12345' } },
                nidOfficer: { value: { email: 'officer.nid@example.com', password: 'Demo@12345' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } },
            },
          },
          400: {
            description: 'Validation failed',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
          },
          401: {
            description: 'Invalid credentials',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
          },
        },
      },
    },

    // ── 3. Me ───────────────────────────────────────────────
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current authenticated user (fresh DB state)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: { user: { $ref: '#/components/schemas/User' } },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Missing/invalid token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
          },
          403: {
            description: 'Officer department inactive',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
          },
        },
      },
    },

    // ── 4. List own records ─────────────────────────────────
    '/api/citizen/records': {
      get: {
        tags: ['Citizen — Records'],
        summary: 'List own identity records',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Own records',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        records: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/CitizenRecord' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          403: { description: 'Wrong role', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
        },
      },
    },

    // ── 5. Get record by reference ──────────────────────────
    '/api/citizen/records/{recordRef}': {
      get: {
        tags: ['Citizen — Records'],
        summary: 'Get one owned record by reference (BR-1001 / NID-1001)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'recordRef',
            in: 'path',
            required: true,
            schema: { type: 'string', pattern: '^(NID|BR)-\\d+$' },
            example: 'BR-1001',
          },
        ],
        responses: {
          200: {
            description: 'Record detail',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: { record: { $ref: '#/components/schemas/CitizenRecord' } },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid reference format', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          403: { description: 'NOT_RECORD_OWNER', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          404: { description: 'RECORD_NOT_FOUND', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
        },
      },
    },

    // ── 6. Submit correction request ────────────────────────
    '/api/citizen/records/{recordRef}/correction-requests': {
      post: {
        tags: ['Citizen — Requests'],
        summary: 'Submit a correction request (PENDING)',
        description:
          'Old value and expected record version are derived from the locked record — never from the client.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'recordRef',
            in: 'path',
            required: true,
            schema: { type: 'string', pattern: '^(NID|BR)-\\d+$' },
            example: 'BR-1001',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCorrectionRequest' },
              example: {
                changes: [{ fieldName: 'full_name', proposedValue: 'Demo Citizen' }],
                reason: 'Name spelling correction',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Request submitted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: { request: { $ref: '#/components/schemas/CorrectionRequestCitizenView' } },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'VALIDATION_ERROR / NO_CHANGE_REQUESTED / UNSUPPORTED_FIELD', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          403: { description: 'NOT_RECORD_OWNER', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          404: { description: 'RECORD_NOT_FOUND', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          409: { description: 'DUPLICATE_PENDING_REQUEST', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
        },
      },
    },

    // ── 7. List own correction requests ─────────────────────
    '/api/citizen/correction-requests': {
      get: {
        tags: ['Citizen — Requests'],
        summary: 'List own correction requests',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Own requests',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        requests: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/CorrectionRequestCitizenView' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
        },
      },
    },

    // ── 8. Get own request by id ────────────────────────────
    '/api/citizen/correction-requests/{id}': {
      get: {
        tags: ['Citizen — Requests'],
        summary: 'Get own correction request detail',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 }, example: 1 },
        ],
        responses: {
          200: {
            description: 'Request detail',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: { request: { $ref: '#/components/schemas/CorrectionRequestCitizenView' } },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid id format', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          403: { description: 'NOT_REQUEST_OWNER', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          404: { description: 'REQUEST_NOT_FOUND', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
        },
      },
    },

    // ── 9. Officer list ─────────────────────────────────────
    '/api/officer/correction-requests': {
      get: {
        tags: ['Officer'],
        summary: 'List correction requests for officer\'s department',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
            example: 'PENDING',
          },
        ],
        responses: {
          200: {
            description: 'Department-scoped requests',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        requests: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/CorrectionRequestOfficerView' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid status filter', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          403: { description: 'FORBIDDEN / DEPARTMENT_INACTIVE', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
        },
      },
    },

    // ── 10. Officer detail ──────────────────────────────────
    '/api/officer/correction-requests/{id}': {
      get: {
        tags: ['Officer'],
        summary: 'Get one request detail (department-enforced)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 }, example: 1 },
        ],
        responses: {
          200: {
            description: 'Request detail',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: { request: { $ref: '#/components/schemas/CorrectionRequestOfficerView' } },
                    },
                  },
                },
              },
            },
          },
          403: { description: 'WRONG_DEPARTMENT', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          404: { description: 'REQUEST_NOT_FOUND', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
        },
      },
    },

    // ── 11. Officer decision ────────────────────────────────
    '/api/officer/correction-requests/{id}/decision': {
      patch: {
        tags: ['Officer'],
        summary: 'Approve or reject a PENDING correction request',
        description:
          'Transactional. Approval updates the record and increments `record_version`. ' +
          'Rejection leaves the record unchanged. Audit log is written in the same transaction. ' +
          'Lock order: record → request (deadlock prevention).',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 }, example: 1 },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DecisionRequest' },
              examples: {
                approve: { value: { decision: 'APPROVED' } },
                reject: {
                  value: {
                    decision: 'REJECTED',
                    reason: 'Supporting information is insufficient.',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Decision applied',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DecisionResponse' } } },
          },
          400: { description: 'VALIDATION_ERROR / REJECTION_REASON_REQUIRED / UNSUPPORTED_FIELD', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          403: { description: 'WRONG_DEPARTMENT', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          404: { description: 'REQUEST_NOT_FOUND / RECORD_NOT_FOUND', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          409: { description: 'REQUEST_ALREADY_PROCESSED / RECORD_STATE_CONFLICT', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
        },
      },
    },
  },
};

module.exports = swaggerJsdoc({ definition: spec, apis: [] });