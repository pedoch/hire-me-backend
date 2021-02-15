const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const companyController = require('../controllers/company');
const auth = require('../middleware/is-auth');

// @route POST api/company
router.post(
  '/signup',
  [
    check('name', 'Company name is required').trim().not().isEmpty(),
    check('email', 'Please include a valid email address').isEmail(),
    check('password', 'Please enter a password with 5 or more characters').isLength({ min: 5 }),
    check('state', 'State is required').not().isEmpty(),
    check('streetAddress', 'Street Address is required').not().isEmpty(),
  ],
  companyController.signup,
);

router.get('/get-all-companies', companyController.getAllCompanies);

router.post(
  '/edit-profile',
  auth,
  [
    check('name', 'Company name is required').not().isEmpty(),
    check('email', 'Please include a valid email address').isEmail(),
    check('state', 'State is required').not().isEmpty(),
    check('streetAddress', 'Street Address is required').not().isEmpty(),
  ],
  companyController.editCompanySettings,
);

router.post(
  '/subscribe-to-companies',
  auth,
  [check('companyId', 'Company ID is not specified.').not().isEmpty()],
  companyController.subcribeToCompany,
);

router.post(
  '/unsubscribe-to-companies',
  auth,
  [check('companyId', 'Company ID is not specified.').not().isEmpty()],
  companyController.unsubcribeToCompany,
);

router.get('/get-posts', auth, companyController.getPosts);

router.post('/update-profile-picture', auth, companyController.uploadProfilePicture);

module.exports = router;
