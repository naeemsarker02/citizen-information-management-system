const express = require('express');
const validate = require('../../middlewares/validate');
const authenticate = require('../../middlewares/authenticate');
const { loginSchema } = require('./auth.validation');
const controller = require('./auth.controller');

const router = express.Router();

router.post('/login', validate(loginSchema, 'body'), controller.login);
router.get('/me', authenticate, controller.me);

module.exports = router;