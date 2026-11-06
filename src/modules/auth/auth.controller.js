const asyncHandler = require('../../utils/asyncHandler');
const authService = require('./auth.service');

const login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login(req.validated.body);
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { token, user },
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user);
  res.status(200).json({ success: true, data: { user } });
});

module.exports = { login, me };