
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/jwt');
const { findAuthUserById } = require('../modules/auth/auth.repository');

const authenticate = asyncHandler(async (req, res, next) => {
    // 1. Read the Authorization header.
    const authorization = req.get('authorization');

    if (!authorization) {
        throw new ApiError(
            401,
            'UNAUTHENTICATED',
            'Authentication is required.'
        );
    }

    // 2. Extract the Bearer token.
    const match = authorization.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
        throw new ApiError(
            401,
            'UNAUTHENTICATED',
            'Invalid authentication token.'
        );
    }

    // 3. Verify JWT.
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

    // 4. Validate JWT subject.
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

    // 5. Load the current user through the repository.
    const user = await findAuthUserById(userId);

    // 6. Reject missing or inactive users.
    if (!user || Number(user.is_active) !== 1) {
        throw new ApiError(
            401,
            'UNAUTHENTICATED',
            'User is not authenticated or is inactive.'
        );
    }

    // 7. Reject officers with missing or inactive departments.
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

    // 8. Attach fresh, safe user information to the request.
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
