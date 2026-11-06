const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signToken({ sub }) {
    return jwt.sign(
        { sub: String(sub) },
        env.jwt.secret,
        {
            expiresIn: env.jwt.expiresIn,
        }
    );
}

function verifyToken(token) {
    return jwt.verify(token, env.jwt.secret);
}

module.exports = {
    signToken,
    verifyToken,
};