
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/jwt');
const { findAuthUserById } = require('../modules/auth/auth.repository');

const authenticate = asyncHandler(async (req, res, next) => {
    const authorization = req.get('authorization');

    if (!authorization) {
        throw new ApiError(
            401,
            'UNAUTHENTICATED',
            'Authentication is required.'
        );
    }

    const match = authorization.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
        throw new ApiError(
            401,
            'UNAUTHENTICATED',
            'Invalid authentication token.'
        );
    }

    let payload;

    try {
        payload = verifyToken(match[1]);
    } catch (error) {
        throw new ApiError(
            401,
            'UNAUTHENTICATED',
            'Invalid or expired authentication token.'
        );
    }

    const subject = payload.sub;

    if (
        typeof subject !== 'string' ||
        !/^[1-9]\d*$/.test(subject) ||
        !Number.isSafeInteger(Number(subject)) ||
        Number(subject) > 4294967295
    ) {
        throw new ApiError(
            401,
            'UNAUTHENTICATED',
            'Invalid authentication token.'
        );
    }

    const userId = Number(subject);

    const user = await findAuthUserById(userId);

    if (!user || Number(user.is_active) !== 1) {
        throw new ApiError(
            401,
            'UNAUTHENTICATED',
            'User is not authenticated or is inactive.'
        );
    }

    if (
        user.role === 'OFFICER' &&
        (
            user.department_id === null ||
            Number(user.department_is_active) !== 1
        )
    ) {
        throw new ApiError(
            403,
            'DEPARTMENT_INACTIVE',
            'The assigned department is inactive or unavailable.'
        );
    }

    req.user = {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId:
            user.department_id === null
                ? null
                : Number(user.department_id),
    };

    return next();
});

module.exports = authenticate;
