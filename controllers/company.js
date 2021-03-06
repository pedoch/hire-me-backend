const Company = require('../models/Company');
const Post = require('../models/Post');
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
      subscribers: 0,
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

exports.getAllCompanies = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let companies = await Company.find()
      .populate({
        path: 'posts',
        populate: {
          path: 'tags',
        },
      })
      .populate('tags')
      .exec();

    res.status(200).json({ companies });
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
    let company = await Company.findById(companyId);

    if (!company) return res.status(400).json({ message: 'Company not found' });

    let posts = await Post.find({ companyId: companyId, status: { $ne: 'Deleted' } })
      .populate({ path: 'tags' })
      .exec();

    return res.status(200).json({ posts: posts });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.subcribeToCompany = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (req.user) {
    const userId = req.user.id;

    const { companyId } = req.body;

    try {
      if (!userId) return res.status(400).json({ message: 'User ID not specified.' });

      const user = await User.findById(userId);

      if (!user) return res.status(400).json({ message: 'User not found.' });

      const company = await Company.findById(companyId);

      if (!company) return res.status(400).json({ message: 'Company not found.' });

      if (user.subscribed.includes(company._id))
        return res.status(400).json({ message: 'Company already subscribed.' });

      user.subscribed.push(company._id);

      if (company.subscribers) company.subscribers += 1;
      else company.subscribers = 1;

      await user.save();
      await company.save();

      return res.status(200).json({ message: 'Post saved successfully.' });
    } catch (err) {
      console.log(err);
      res.status(500).send('Server Error');
    }
  }

  return res.status(400).json({ message: 'User not authenticated.' });
};

exports.unsubcribeToCompany = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (req.user) {
    const userId = req.user.id;

    const { companyId } = req.body;

    try {
      if (!userId) return res.status(400).json({ message: 'User ID not specified.' });

      const user = await User.findById(userId);

      if (!user) return res.status(400).json({ message: 'User not found.' });

      const company = await Company.findById(companyId);

      if (!company) return res.status(400).json({ message: 'Company not found.' });

      if (!user.subscribed.includes(company._id))
        return res.status(400).json({ message: 'Company not subscribed to.' });

      user.subscribed = user.subscribed.filter((sub) => {
        if (sub.toString() != company._id.toString()) return sub;
      });

      if (company.subscribers && company.subscribers > 0) company.subscribers -= 1;
      else company.subscribers = 0;

      await user.save();
      await company.save();

      return res.status(200).json({ message: 'Post saved successfully.' });
    } catch (err) {
      console.log(err);
      res.status(500).send('Server Error');
    }
  }

  return res.status(400).json({ message: 'User not authenticated.' });
};
