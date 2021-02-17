const User = require('../models/User');
const Company = require('../models/Company');
const Post = require('../models/Post');
const Response = require('../models/Response');
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
    let post = await Post.findById(postId).populate('companyId').exec();

    res.status(200).json({ post: post });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getAllPosts = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let posts = await Post.find().populate('companyId').populate('tags').exec();

    res.status(200).json({ posts });
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
    let posts = await Post.find({ status: 'Active' })
      .sort({ numberOfResponses: -1 })
      .populate('companyId')
      .exec();

    res.status(200).json({ posts });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getTopPostsForYou = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.user.id;

  try {
    let user = await User.findById(userId);

    if (!user) res.status(400).json({ messgae: 'User not found' });
    let posts = await Post.find({ status: 'Active', tags: { $in: user.tags } })
      .sort({ numberOfResponses: -1 })
      .populate('companyId')
      .exec();

    res.status(200).json({ posts });
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
      let comp = await Company.findById(company.id)
        .populate({
          path: 'posts',
          populate: {
            path: 'responses',
            populate: {
              path: 'userId',
              select: '_id firstname lastname email profilePicture resume skills',
            },
          },
        })
        .exec();

      if (!comp) return res.status(400).json({ message: 'Company not found' });

      return res.status(200).json({ posts: comp.posts });
    } else if (user) {
      let usr = await User.findById(user.id)
        .populate({
          path: 'posts',
          populate: {
            path: 'companyId',
            select: '_id name email profilePicture',
          },
        })
        .populate({
          path: 'posts',
          populate: {
            path: 'responses',
            match: {
              'responses.userId': user._id,
            },
          },
        })
        .exec();

      if (!usr) return res.status(400).json({ message: 'User not found' });

      return res.status(200).json({ posts: usr.posts });
    }

    return res.status(401).json({ message: 'Account does not exist.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

exports.getSavedPosts = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { user } = req;

  try {
    if (user) {
      let usr = await User.findById(user.id)
        .populate({
          path: 'savedPosts',
          populate: {
            path: 'companyId',
            select: '_id name email profilePicture',
          },
        })
        .exec();

      if (!usr) return res.status(400).json({ message: 'User not found' });

      return res.status(200).json({ posts: usr.savedPosts });
    }

    return res.status(401).json({ message: 'User does not exist.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

exports.getFilteredPostsAndCompanies = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, tags, state } = req.query;

  try {
    let filter = {};
    let companyFilter = {};

    if (name) {
      filter = {
        ...filter,
        title: { $regex: new RegExp(name), $options: 'i' },
      };
      companyFilter = {
        ...companyFilter,
        name: { $regex: new RegExp(name), $options: 'i' },
      };
    }
    if (tags) {
      let tagList = tags.split(',');
      filter = { ...filter, tags: { $in: tagList } };
      companyFilter = { ...companyFilter, tags: { $in: tagList } };
    }
    if (state) {
      filter = { ...filter, state: state };
      companyFilter = { ...companyFilter, state: state };
    }

    const posts = await Post.find({ ...filter })
      .sort({ $natural: -1 })
      .populate('companyId', '-password')
      .populate('tags')
      .exec();

    const companies = await Company.find({ ...companyFilter })
      .select('-password')
      .sort({ $natural: -1 })
      .populate('tags')
      .exec();

    return res.status(200).json({
      post: posts,
      companies: companies,
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
      subject: 'Job Posted Successfully',
      html: `<h1>You just posted "<a target="_blanc"  rel="noopener" href="https://hire-me-o.netlify.app/job/${post._id}" >${post.title}</a>" successfully</h1>`,
    };
    sgMail.send(msg).catch((err) => console.log(err));

    res.status(201).json({ posts: company.posts, message: 'Post successful', post });
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

    const { postId, resume, skills } = req.body;

    try {
      const user = await User.findById(userId);

      if (!user) return res.status(400).json({ message: 'User not found' });

      const post = await Post.findById(postId);

      if (!post) return res.status(400).json({ message: 'Post not found' });

      if (user.posts.includes(postId))
        return res.status(400).json({ message: 'User has already applied to post' });

      const response = new Response({ userId, resume, skills });

      post.responses.push(response._id);
      if (post.numberOfResponses) post.numberOfResponses += 1;
      else post.numberOfResponses = 1;

      user.posts.push(postId);

      await response.save();
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

exports.getResponses = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let companyId = req.company.id;

  if (!companyId) {
    return res.status(400).json({ message: 'Company does not exist' });
  }

  const { postId } = req.params;

  try {
    let company = await Company.findById(companyId);

    if (!company) return res.status(401).json({ message: 'Company not found' });

    if (!company.posts.includes(postId))
      return res.status(400).json({ message: 'You are not authorized to view these responses.' });

    const post = await Post.findById(postId)
      .populate({
        path: 'responses',
        populate: { path: 'userId', select: '_id firstname lastname email' },
      })
      .exec();

    if (!post) return res.status(400).json({ message: 'Post not found' });

    const { responses } = post;

    return res.status(200).json({ responses, message: 'Responses pulled successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).send('Server Error');
  }
};

exports.savePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (req.user) {
    const userId = req.user.id;

    const { postId } = req.body;

    try {
      const user = await User.findById(userId);

      if (!user) return res.status(400).json({ message: 'User not found.' });

      const post = await Post.findById(postId);

      if (!post) return res.status(400).json({ message: 'Post not found.' });

      if (user.savedPosts.includes(post._id))
        return res.status(400).json({ message: 'Post already saved.' });

      user.savedPosts.push(post._id);

      await user.save();

      return res.status(200).json({ message: 'Post saved successfully.' });
    } catch (err) {
      console.log(err);
      res.status(500).send('Server Error');
    }
  }

  return res.status(400).json({ message: 'User not authenticated.' });
};
