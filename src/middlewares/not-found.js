
const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
    next(
        new ApiError(
            404,
            'ROUTE_NOT_FOUND',
            'The requested API route was not found.'
        )
    );
}

module.exports = notFound;
