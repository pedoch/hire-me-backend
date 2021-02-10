const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const postController = require('../controllers/post');
const auth = require('../middleware/is-auth');

// @route GET api/posts
router.get('/get-post/:postId', postController.getPost);

router.get('/get-posts', auth, postController.getPosts);

router.get('/get-filtered-posts', postController.getFilteredPostsAndCompanies);

router.get('/get-top-posts', postController.getTopPosts);

router.get('/get-top-posts-for-you', auth, postController.getTopPostsForYou);

router.get(
  '/get-post-with-status',
  auth,
  [check('status', 'Status not specified').exists()],
  postController.getPostsWithStatus,
);

//route POST api/posts
router.post(
  '/create-post',
  auth,
  [
    check('title', 'Title not specified').trim().not().isEmpty(),
    check('description', 'Description not specified').trim().not().isEmpty(),
    check('requirements', 'Requirements not specified').not().isEmpty(),
    check('skills', 'Required skills not specified').not().isEmpty(),
    check('employmentType', 'Employment Type not specified').not().isEmpty(),
    check('tags', 'Tags not specified').not().isEmpty(),
  ],
  postController.createPost,
);

router.post(
  '/change-post-status',
  auth,
  [
    check('status', 'Status not specified').exists(),
    check('postId', 'Post not specified').exists(),
  ],
  postController.changePostStatus,
);

router.post(
  '/respond-to-post',
  auth,
  [check('postId', 'Post not specified').exists()],
  postController.respondToPost,
);

router.get('/get-responses/:postId', auth, postController.getResponses);

module.exports = router;
