const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/user');
const auth = require('../middleware/is-auth');

// @route POST api/user
// @desc Register user
// @access Public

router.post(
  '/signup',
  [
    check('firstname', 'Firstname is required').not().isEmpty(),
    check('lastname', 'Lastname is required').not().isEmpty(),
    check('email', 'Please include a valid email address').isEmail(),
    check('password', 'Please enter a password with 5 or more characters').isLength({ min: 5 }),
    check('tags', 'At least one tag is required').not().isEmpty(),
    check('state', 'State is required').not().isEmpty(),
  ],
  userController.signunp,
);

router.post(
  '/edit-settings',
  auth,
  [
    check('firstname', 'Firstname is required').not().isEmpty(),
    check('lastname', 'Lastname is required').not().isEmpty(),
    check('email', 'Please include a valid email address').isEmail(),
    check('password', 'Please enter a password with 5 or more characters').isLength({ min: 5 }),
    check('tags', 'At least one tag is required').not().isEmpty(),
    check('state', 'State is required').not().isEmpty(),
  ],
  userController.editUserSettings,
);

module.exports = router;
