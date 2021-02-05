const express = require('express');

const User = require('../models/User');

const authController = require('../controllers/auth');

const auth = require('../middleware/is-auth');

const { check } = require('express-validator');

const router = express.Router();

// @route GET api/auth
router.get('/', auth, authController.getById);

// @route POST api/auth
router.post(
  '/login',
  [
    check('email', 'Enter a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  authController.login,
);

router.post(
  '/companylogin',
  [
    check('email', 'Enter a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  authController.companyLogin,
);

router.post(
  '/update-user-password',
  [
    check('oldPassword', 'Enter a valid email').exists(),
    check('newPassword', 'Password is required').exists(),
  ],
  auth,
  authController.updateUserPassword,
);

module.exports = router;
