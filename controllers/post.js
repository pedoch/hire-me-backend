const User = require('../models/User');
const Company = require('../models/Company');
const Post = require('../models/Post');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.getPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { postId } = req.params;

  if (!postId) return res.status(400).json({ message: 'Post ID not found.' });

  try {
    let post = await (await Post.findById(postId))
      .populate('response')
      .populate('state')
      .populate('companyId')
      .populate('tags')
      .execPopulate();

    res.status(200).json({ post: post });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getCompanyPosts = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { company, user } = req;

  try {
    if (company) {
      let comp = await (await Company.findById(company.id))
        .populate('posts')
        .populate('posts.response')
        .populate('posts.state')
        .populate('posts.companyId')
        .populate('posts.tags')
        .execPopulate();

      if (!comp) return res.status(400).json({ message: 'Company not found' });

      return res.status(200).json({ posts: comp.posts });
    }

    let usr = await (await User.findById(user.id)).populate('posts').execPopulate();

    if (!user) return res.status(400).json({ message: 'User not found' });

    return res.status(200).json({ post: usr.posts });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getPosts = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { user } = req;

  const { page } = req.params;

  try {
    let fetcheduser = await User.findById(user.id);

    if (!fetcheduser) return res.status(400).json({ message: 'User not found' });

    const skip = page ? page : 0;

    const posts = await Post.find()
      .sort({ $natural: -1 })
      .skip(skip)
      .limit(200)
      .populate('tags')
      .execPopulate();

    const filteredPosts = posts.filter((post) => {
      let found = false;
      for (let i = 0; i < post.tags.length; i++) {
        if (fetcheduser.tags.find((tag) => tag === post.tags[i]._id)) {
          found = true;
          break;
        }
      }

      if (found) return post;
    });

    return res.status(200).json({ post: filteredPosts, currentPage: page ? page + 200 : 200 });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getPostsWithStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { company, user } = req;
  const { status } = req.body;

  try {
    if (company) {
      let comp = await (await Company.findById(company.id))
        .populate('posts')
        .populate('posts.response')
        .populate('posts.state')
        .populate('posts.companyId')
        .populate('posts.tags')
        .execPopulate();

      if (!comp) return res.status(400).json({ message: 'Company not found' });

      const postArray = await comp.posts.filter((post) => {
        if (post.status === status) return post;
      });

      return res.status(200).json({ posts: postArray });
    }

    let usr = await (await User.findById(user.id))
      .populate('posts')
      .populate('posts.response')
      .populate('posts.state')
      .populate('posts.companyId')
      .populate('posts.tags')
      .execPopulate();

    if (!user) return res.status(400).json({ message: 'User not found' });

    const postArray = usr.posts.filter((post) => {
      if (post.status === status) return post;
    });

    return res.status(200).json({ post: postArray });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getCompany = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const companyId = req.params.companyId;

  if (!companyId) {
    return res.status(400).json({ message: 'Company does not exist' });
  }

  try {
    let company = await (await Company.findById(companyId))
      .populate('posts')
      .populate('posts.response')
      .populate('posts.state')
      .populate('posts.companyId')
      .populate('posts.tags')
      .populate('state')
      .execPopulate();

    if (!company) return res.status(400).json({ message: 'Company not found' });

    return res.status(200).json({ company: company });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, requirements, state, streetAddress, tags } = req.body;

  const companyId = req.company.id;

  try {
    let company = await Company.findById(companyId);

    //check if compnay exists
    if (!company) {
      return res.status(400).json({ errors: [{ msg: 'Company does not exist' }] });
    }

    let post = new Post({
      title: title,
      description: description,
      requirements: requirements,
      streetAddress: streetAddress,
      state: state,
      companyId: company._id,
      tags: tags,
      responses: [],
      status: 'Active',
    });

    company.posts.push(post._id);

    //save post
    await post.save();

    //save company
    await company.save();

    //send email after posting
    const msg = {
      to: company.email,
      from: 'test@hiremeo.com',
      subject: 'Registration complete',
      html: `<h1>You just posted "<a target="_blanc" href="hiremeo.com/${company.name}/${post._id}" >${post.title}</a>" successfully</h1>`,
    };
    sgMail.send(msg).catch((err) => console.log(err));

    res.status(201).json({ message: 'Post successful', post });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.changePostStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const companyId = req.company.id;

  const { status, postId } = req.body;

  try {
    let post = await Post.findOne({ _id: postId, companyId });

    //check if post exists
    if (!post) return res.status(400).json({ errors: [{ message: 'Post does not exist' }] });

    post.status = status;

    //save post
    await post.save();

    res.status(201).json({ message: 'Post status changed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.respondToPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (req.user) {
    const userId = req.user.id;

    const { postId } = req.body;

    try {
      const user = await User.findById(userId);

      if (!user) return res.status(400).json({ message: 'User not found' });

      const post = await Post.findById(postId);

      if (!post) return res.status(400).json({ message: 'Post not found' });

      post.responses.push(userId);

      user.posts.push(postId);

      await post.save();
      await user.save();

      return res.status(200).json({ message: 'Response submitted successfully' });
    } catch (err) {
      console.log(err);
      res.status(500).send('Server Error');
    }
  }

  return res.status(400).json({ message: 'No user not found' });
};
