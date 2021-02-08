const Company = require('../models/Company');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, description, password, tags, streetAddress, state } = req.body;

  try {
    //See if the company exists

    let company = await Company.findOne({ email });

    if (company) {
      return res.status(400).json({ errors: [{ msg: 'Email address has already been used' }] });
    }

    company = new Company({
      name,
      email,
      password,
      description,
      tags,
      state,
      streetAddress,
      posts: [],
      status: 'Active',
    });

    //Encrypt password

    const salt = await bcrypt.genSalt(10);

    company.password = await bcrypt.hash(password, salt);

    await company.save();

    //send email after registration
    const msg = {
      to: email,
      from: 'no-reply@hiremeo.com',
      subject: 'Registration complete',
      html:
        '<div><h1>You have successfully registered your company on Hire-Me-O!</h1><p>Click the link bellow to activiate your account</p></div>',
    };
    sgMail.send(msg).catch((err) => console.log(err));

    //Return JWT
    const payload = {
      company: {
        id: company.id,
      },
    };

    jwt.sign(payload, config.get('jwtSecret'), (err, token) => {
      if (err) throw err;

      // res.send('Company registered');
      res.json({ token, message: 'Company registered successfully' });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.editCompanySettings = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let companyId = req.company.id;

  const { name, email, description, streetAddress, state } = req.body;

  try {
    //See if the company exists

    let company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({ errors: [{ msg: 'Company not found' }] });
    }

    if (company.status === 'Disabled') {
      return res.status(400).json({
        errors: [
          {
            msg: 'Update failed, company account is disabled. Please enable account first',
          },
        ],
      });
    }

    company.name = name;
    company.email = email;
    company.description = description;
    company.streetAddress = streetAddress;
    company.state = state;

    await company.save();

    res.json({
      company: { name, email, description, streetAddress, state },
      message: 'Company profile updated successfully',
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.uploadProfilePicture = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let companyId = req.company.id;

  const { profilePicture } = req.body;

  try {
    //See if the user exists
    let company = await Company.findById(companyId);

    if (!company) {
      return res.status(400).json({ errors: [{ message: 'Company does not exist' }] });
    }

    if (company.status === 'Disabled')
      return res.status(400).json({
        message:
          'Company account is disabled, cannot update settings. Please enable account first.',
      });

    company.profilePicture = profilePicture;

    await company.save();

    res.json({
      company: { profilePicture: company.profilePicture },
      message: 'Company profile picture updated successfully',
    });
  } catch (err) {
    console.error(err.meessage);
    res.status(500).send('Server Error');
  }
};

exports.getPosts = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let companyId = req.company.id;

  if (!companyId) {
    return res.status(400).json({ message: 'Company does not exist' });
  }

  try {
    let company = await Company.findById(companyId)
      .populate('posts')
      .populate('posts.responses')
      .populate('posts.tags')
      .exec();

    if (!company) return res.status(400).json({ message: 'Company not found' });

    return res.status(200).json({ posts: company.posts });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
