const Company = require("../models/Company");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const config = require("config");
const bcrypt = require("bcryptjs");
const sgMail = require("@sendgrid/mail");
require("dotenv").config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, tags } = req.body;

  try {
    //See if the company exists

    let company = await Company.findOne({ email });

    if (company) {
      return res.status(400).json({ errors: [{ msg: "Email address has already been used" }] });
    }

    company = new Company({
      name,
      email,
      password,
      tags,
      posts: [],
      status: "Active",
    });

    //Encrypt password

    const salt = await bcrypt.genSalt(10);

    company.password = await bcrypt.hash(password, salt);

    await company.save();

    //send email after registration
    const msg = {
      to: email,
      from: "no-reply@hiremeo.com",
      subject: "Registration complete",
      html:
        "<div><h1>You have successfully registered your company on Hire-Me-O!</h1><p>Click the link bellow to activiate your account</p></div>",
    };
    sgMail.send(msg).catch((err) => console.log(err));

    //Return JWT
    const payload = {
      company: {
        id: company.id,
      },
    };

    jwt.sign(payload, config.get("jwtSecret"), (err, token) => {
      if (err) throw err;

      // res.send('Company registered');
      res.json({ token, message: "Company registered successfully" });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.editCompanySettings = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let companyId = req.company.id;

  const { name, description, profilePicture, tags } = req.body;

  try {
    //See if the company exists

    let company = await Company.findById({ companyId });

    if (!company) {
      return res.status(404).json({ errors: [{ msg: "Company not found" }] });
    }

    if (company.status === "Disabled") {
      return res.status(400).json({
        errors: [
          {
            msg: "Update failed, company account is disabled. Please enable account first",
          },
        ],
      });
    }

    company.name = name;
    company.description = description;
    company.profilePicture = profilePicture;
    company.tags = tags;

    await company.save();

    res.json({ message: "Company updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
