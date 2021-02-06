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
    let post = await Post.findById(postId)
      .sort({})
      .populate('response')
      .populate('companyId')
      .execPopulate();

    res.status(200).json({ post: post });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getTopPosts = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let post = await Post.find({ status: 'Active' })
      .sort({ numberOfResponses: -1 })
      .populate('companyId')
      .execPopulate();

    res.status(200).json({ post: post });
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

  const { company, user } = req;

  try {
    if (company) {
      let comp = await (await Company.findById(company.id))
        .populate('posts')
        .populate('posts.response')
        .execPopulate();

      if (!comp) return res.status(400).json({ message: 'Company not found' });

      return res.status(200).json({ posts: comp.posts });
    }

    let usr = await User.findById(user.id)
      .populate('posts')
      .populate('posts.companyId')
      .execPopulate();

    if (!user) return res.status(400).json({ message: 'User not found' });

    return res.status(200).json({ post: usr.posts });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getFilteredPostsAndCompanies = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { user } = req;

  const { name, tags, state, postCurrentPage, companyCurrentPage } = req.body;

  try {
    let fetcheduser = await User.findById(user.id);

    if (!fetcheduser) return res.status(400).json({ message: 'User not found' });

    let filter = {};
    let companyFilter = {};

    if (name) {
      filter = { ...filter, name: { $regex: name, $options: 'i' } };
      companyFilter = { ...companyFilter, name: { $regex: name, $options: 'i' } };
    }
    if (tags) {
      filter = { ...filter, tags: { $in: tags } };
      companyFilter = { ...companyFilter, tags: { $in: tags } };
    }
    if (state) filter = { ...filter, state: state };

    const postskip = postCurrentPage ? postCurrentPage * 200 : 0;
    const companyskip = companyCurrentPage ? companyCurrentPage * 200 : 0;

    const posts = await Post.find({ ...filter })
      .sort({ $natural: -1 })
      .skip(postskip)
      .limit(200)
      .populate('companyId')
      .execPopulate();

    const companies = await Company.find({ ...companyFilter })
      .sort({ $natural: -1 })
      .skip(companyskip)
      .limit(200)
      .populate('companyId')
      .execPopulate();

    return res.status(200).json({
      post: posts,
      companies: companies,
      postCurrentPage: page ? page + 1 : 1,
      companyCurrentPage: page ? page + 1 : 1,
      postLast: post.length < 1 ? true : false,
      companyLast: companies.length < 1 ? true : false,
    });
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
    let comp = await (await Company.findById(company.id))
      .populate('posts')
      .populate('posts.response')
      .populate('posts.companyId')
      .execPopulate();

    if (!comp) return res.status(400).json({ message: 'Company not found' });

    const postArray = await comp.posts.filter((post) => {
      if (post.status === status) return post;
    });

    return res.status(200).json({ posts: postArray });
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

  const {
    title,
    description,
    employmentType,
    requirements,
    skills,
    state,
    streetAddress,
    tags,
    salary,
  } = req.body;

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
      employmentType: employmentType,
      requirements: requirements,
      salary: salary,
      numberOfResponses: 0,
      streetAddress: streetAddress,
      state: state,
      skills: skills,
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
      html: `<h1>You just posted "<a target="_blanc" href="https://hire-me-o.netlify.app/${company.name}/dashboard/posts/${post._id}" >${post.title}</a>" successfully</h1>`,
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
      if (post.numberOfResponses) post.numberOfResponses += 1;
      else post.numberOfResponses = 1;

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
