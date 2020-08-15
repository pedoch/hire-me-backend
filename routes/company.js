const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const companyController = require("../controllers/company");

// @route POST api/company
router.post(
  "/signup",
  [
    check("name", "Company name is required").trim().not().isEmpty(),
    check("email", "Please include a valid email address").isEmail(),
    check("password", "Please enter a password with 5 or more characters").isLength({ min: 5 }),
  ],
  companyController.signup
);

module.exports = router;
