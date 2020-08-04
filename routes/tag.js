const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const tagController = require('../controllers/tag');

// @route GET api/tags
router.get(
	'/get-tag',
	[check('tagId', 'tag ID is required').not().isEmpty()],
	tagController.getTag,
);

router.get('/get-tags', tagController.getTags);

// @route POST api/tags
router.post(
	'/create-tag',
	[check('name', 'tag name is required').not().isEmpty()],
	tagController.createTag,
);

module.exports = router;
