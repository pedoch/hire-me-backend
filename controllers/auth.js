const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { validationResult } = require('express-validator');

const Company = require('../models/Company');
const User = require('../models/User');

exports.getById = async (req, res, next) => {
  if (req.user) {
    try {
      const user = await User.findById(req.user.id).select('-password');
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  } else {
    try {
      const company = await Company.findById(req.company.id).select('-password');
      res.json(company);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
};

exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    //See if user exits
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ errors: [{ msg: 'Email does not exist' }] });
    }

    //matching user details
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
    }

    //Return JWT
    const payload = {
      user: {
        id: user._id,
      },
    };

    jwt.sign(payload, config.get('jwtSecret'), (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: {
          _id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          bio: user.bio,
          resume: user.resume,
          posts: user.posts,
          savedPosts: user.savedPosts,
          streetAddress: user.streetAddress,
          profilePicture: user.profilePicture,
          yearsOfExperience: user.yearsOfExperience,
          subscribed: user.subscribed,
          skills: user.skills,
          state: user.state,
          status: user.status,
          tags: user.tags,
        },
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.companyLogin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    //See if user exits
    let company = await Company.findOne({ email });

    if (!company) {
      return res.status(400).json({ errors: [{ msg: 'Company does not exist' }] });
    }

    //matching user details
    const isMatch = await bcrypt.compare(password, company.password);

    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
    }

    //Return JWT
    const payload = {
      company: {
        id: company._id,
      },
    };

    jwt.sign(payload, config.get('jwtSecret'), (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: {
          _id: company._id,
          name: company.name,
          email: company.email,
          description: company.description,
          posts: company.posts,
          streetAddress: company.streetAddress,
          profilePicture: company.profilePicture,
          subscribers: company.subscribers,
          state: company.state,
          status: company.status,
          tags: company.tags,
        },
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateUserPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let userId = req.user.id;

  const { oldPassword, newPassword } = req.body;

  try {
    //See if user exits
    let user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ errors: [{ msg: 'User does not exist' }] });
    }

    //matching user details
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: 'Old password is incorrect' }] });
    }

    //Encrypt password

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({
      message: 'User password updated successfully',
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
// 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
