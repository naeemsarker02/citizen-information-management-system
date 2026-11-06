
const ApiError = require('../utils/ApiError');

function authorize(...allowedRoles) {
    const roles = allowedRoles.flat();

    if (roles.length === 0) {
        throw new TypeError(
            'At least one allowed role must be provided.'
        );
    }

    return function roleAuthorization(req, res, next) {
        if (!req.user) {
            return next(
                new ApiError(
                    401,
                    'UNAUTHENTICATED',
                    'Authentication is required.'
                )
            );
        }

        if (!roles.includes(req.user.role)) {
            return next(
                new ApiError(
                    403,
                    'FORBIDDEN',
                    'You do not have permission to access this resource.'
                )
            );
        }

        return next();
    };
}

module.exports = authorize;
