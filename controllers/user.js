const User = require('../models/User');
const fileHelper = require('../util/file');
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

  const { firstname, lastname, email, password, streetAddress, state, bio, tags } = req.body;

  try {
    //See if the user exists

    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ errors: [{ msg: 'Email address has already been used' }] });
    }

    user = new User({
      firstname,
      lastname,
      email,
      password,
      streetAddress,
      state,
      bio,
      posts: [],
      resumes: [],
      tags,
      status: 'Active',
    });

    //Encrypt password

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(password, salt);

    await user.save();

    //send email after registration
    const msg = {
      to: email,
      from: 'test@hiremeo.com',
      subject: 'Registration complete',
      html: '<h1>You have successfully registered on Hire-Me-O!</h1>',
    };
    sgMail.send(msg).catch((err) => console.log(err));

    //Return JWT
    const payload = {
      user: {
        id: user._id,
      },
    };

    jwt.sign(payload, config.get('jwtSecret'), (err, token) => {
      if (err) throw err;
      res.json({ token, message: 'User registered successfully' });
    });

    // res.send('User registered');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.editUserSettings = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let userId = req.user.id;

  const { firstname, lastname, bio, streetAddress, state, email } = req.body;

  try {
    //See if the user exists
    let user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ errors: [{ message: 'User does not exist' }] });
    }

    if (user.status === 'Disabled')
      return res.status(400).json({
        message: 'User account is disabled, cannot update settings. Please enable account first.',
      });

    user.firstname = firstname;
    user.lastname = lastname;
    user.email = email;
    user.bio = bio;
    user.streetAddress = streetAddress;
    user.state = state;

    await user.save();

    res.json({
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        bio: user.bio,
        streetAddress: user.streetAddress,
        state: user.state,
      },
      message: 'User profile edited successfully',
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.editUserSkills = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let userId = req.user.id;

  const { yearsOfExperience, skills } = req.body;

  try {
    //See if the user exists
    let user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ errors: [{ message: 'User does not exist' }] });
    }

    if (user.status === 'Disabled')
      return res.status(400).json({
        message: 'User account is disabled, cannot update settings. Please enable account first.',
      });

    user.yearsOfExperience = yearsOfExperience;
    user.skills = skills;

    await user.save();

    res.json({
      user: {
        yearsOfExperience,
        skills,
      },
      message: 'User skills and experience edited successfully',
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

  let userId = req.user.id;

  let image = req.files.profilePictureFile[0];

  //See if the file was passed
  if (!image)
    return res.status(400).json({
      message: 'Image was not passed.',
    });

  let imageURL = image.path;

  try {
    //See if the user exists
    let user = await User.findById(userId);

    if (!user) {
      fileHelper.deleteFile(imageURL);
      return res.status(400).json({ errors: [{ message: 'User does not exist' }] });
    }

    if (user.status === 'Disabled') {
      fileHelper.deleteFile(imageURL);
      return res.status(400).json({
        message: 'User account is disabled, cannot update settings. Please enable account first.',
      });
    }

    let oldImage;

    if (user.profilePicture) oldImage = user.profilePicture;

    user.profilePicture = imageURL;

    await user.save();

    if (oldImage) fileHelper.deleteFile(oldImage);

    res.json({
      user: { profilePicture: user.profilePicture },
      message: 'User profile picture updated successfully',
    });
  } catch (err) {
    if (image) fileHelper.deleteFile(imageURL);

    console.error(err.meessage);
    res.status(500).send('Server Error');
  }
};

exports.uploadResume = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let userId = req.user.id;

  let resume = req.files.resumeFile[0];

  //See if the file was passed
  if (!resume)
    return res.status(400).json({
      message: 'Resume was not passed.',
    });

  let resumeURL = resume.path;

  try {
    //See if the user exists
    let user = await User.findById(userId);

    if (!user) {
      fileHelper.deleteFile(resumeURL);
      return res.status(400).json({ errors: [{ message: 'User does not exist' }] });
    }

    if (user.status === 'Disabled') {
      fileHelper.deleteFile(resumeURL);
      return res.status(400).json({
        message: 'User account is disabled, cannot update settings. Please enable account first.',
      });
    }

    let oldResume;

    if (user.resume) oldResume = user.resume.url;

    user.resume = { name: resume.originalname, url: resumeURL };

    await user.save();

    if (oldResume) fileHelper.deleteFile(oldResume);

    res.json({
      user: { resume: user.resume },
      message: 'User resume updated successfully',
    });
  } catch (err) {
    if (resume) fileHelper.deleteFile(resumeURL);

    console.error(err);
    res.status(500).send('Server Error');
  }
};

exports.getSubscribedCompanies = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let userId = req.user.id;

  try {
    let user = await User.findById(userId).populate({ path: 'subscribed', select: '-password' });

    if (!user) {
      return res.status(400).json({ errors: [{ message: 'User does not exist' }] });
    }

    res.json({
      companies: user.subscribed,
    });
  } catch (error) {
    console.error(err.meessage);
    res.status(500).send('Server Error');
  }
};
