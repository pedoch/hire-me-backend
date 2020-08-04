const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const postController = require('../controllers/post');
const auth = require('../middleware/is-auth');

// @route GET api/posts
router.get('/get-post/:postId', postController.getPost);

router.get('/get-posts', auth, postController.getCompanyPosts);

router.get(
  '/get-post-with-status',
  auth,
  [check('status', 'Status not specified').exists()],
  postController.getPostsWithStatus
);

//route POST api/posts
router.post(
  '/create-post',
  auth,
  [
    check('title', 'Title not specified').exists(),
    check('description', 'Description not specified').exists(),
    check('requirements', 'Requirements not specified').exists(),
    check('streetAddress', 'Street Address not specified').exists(),
    check('state', 'State not specified').exists(),
    check('tags', 'Tags not specified').exists(),
  ],
  postController.createPost
);

router.post(
  '/change-post-status',
  auth,
  [
    check('status', 'Status not specified').exists(),
    check('postId', 'Post not specified').exists(),
  ],
  postController.changePostStatus
);

router.post(
  '/respond-to-post',
  auth,
  [check('postId', 'Post not specified').exists()],
  postController.respondToPost
);

module.exports = router;
