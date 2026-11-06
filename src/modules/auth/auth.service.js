const ApiError = require('../../utils/ApiError');
const { comparePassword } = require('../../utils/password');
const { signToken } = require('../../utils/jwt');
const authRepo = require('./auth.repository');

function safeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    departmentId: user.department_id,
  };
}

async function login({ email, password }) {
  const user = await authRepo.findUserByEmail(email);

  // Generic message to prevent account enumeration
  if (!user || !user.is_active) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const ok = await comparePassword(password, user.password_hash);
  if (!ok) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const token = signToken({ sub: user.id });
  return { token, user: safeUser(user) };
}

async function me(reqUser) {
  return {
    id: reqUser.id,
    name: reqUser.name,
    email: reqUser.email,
    role: reqUser.role,
    departmentId: reqUser.departmentId,
  };
}

module.exports = { login, me };