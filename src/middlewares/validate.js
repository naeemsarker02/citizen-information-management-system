
const ApiError = require('../utils/ApiError');

const VALID_SOURCES = ['body', 'params', 'query'];

function validate(schema, source = 'body') {
    if (!VALID_SOURCES.includes(source)) {
        throw new TypeError(
            `Invalid validation source: ${source}`
        );
    }

    if (!schema || typeof schema.safeParse !== 'function') {
        throw new TypeError(
            'A valid Zod schema must be provided.'
        );
    }

    return function validationMiddleware(req, res, next) {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
            const details = result.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));

            return next(
                new ApiError(
                    400,
                    'VALIDATION_ERROR',
                    'Invalid input.',
                    details
                )
            );
        }

        // Do not assign to req.query in Express 5.
        req.validated = req.validated || {};
        req.validated[source] = result.data;

        return next();
    };
}

module.exports = validate;
